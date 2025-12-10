import { GoogleGenAI, Type } from "@google/genai";
import { SpriteRect } from "../types";
import { getSpriteBlob } from "./exportUtils";

const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
export const isAiAvailable = !!apiKey;

// Remove static initialization
// const ai = isAiAvailable ? new GoogleGenAI({ apiKey }) : null;

const MODEL_NAME = 'gemini-flash-lite-latest';

// Rate limiting: 10 requests per minute.
// That means 1 request every 6 seconds.
const RATE_LIMIT_DELAY = 6000;
let lastRequestTime = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const enforceRateLimit = async () => {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < RATE_LIMIT_DELAY) {
    await delay(RATE_LIMIT_DELAY - timeSinceLast);
  }
  lastRequestTime = Date.now();
};

const cleanAndParseJSON = (text: string | undefined): any => {
    if (!text) return null;
    try {
        // Remove markdown code blocks if present (e.g. ```json ... ```)
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        // Fallback: Try to find a JSON object in the text using regex
        const jsonMatch = text?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (innerE) {
                return null;
            }
        }
        // Fallback: Try to find a JSON array
        const arrayMatch = text?.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            try {
                return JSON.parse(arrayMatch[0]);
            } catch (innerE) {
                return null;
            }
        }
        return null;
    }
};

export const generateSpriteNames = async (
  imageUrl: string,
  rects: SpriteRect[],
  prompt?: string,
  apiKey?: string,
  previousNames: string[] = [],
  onProgress?: (current: number, total: number) => void
): Promise<Record<string, string>> => {
  // Determine API Key: Argument > Store (passed as arg) > Env Var
  const keyToUse = apiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!keyToUse) {
    console.error("No Gemini API Key found");
    return {};
  }

  const ai = new GoogleGenAI({ apiKey: keyToUse });

  const BATCH_SIZE = 10;
  const results: Record<string, string> = {};
  const total = rects.length;
  let processed = 0;
  
  // Keep track of all names generated in this session to pass as context
  const allGeneratedNames = [...previousNames];

  for (let i = 0; i < rects.length; i += BATCH_SIZE) {
    const batch = rects.slice(i, i + BATCH_SIZE);
    
    await enforceRateLimit();

    try {
      // Prepare images
      const imageParts = await Promise.all(batch.map(async (rect) => {
        const blob = await getSpriteBlob(imageUrl, rect);
        if (!blob) return null;
        
        // Convert blob to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
          reader.readAsDataURL(blob);
        });

        return {
          inlineData: {
            mimeType: "image/png",
            data: base64
          }
        };
      }));

      const validParts = imageParts.filter(p => p !== null);
      
      if (validParts.length === 0) continue;

      let contextPrompt = "";
      if (allGeneratedNames.length > 0) {
        // Take the last 20 names as context to keep prompt size manageable but relevant
        const recentNames = allGeneratedNames.slice(-20).join(", ");
        contextPrompt = `\nPreviously generated names (maintain consistency with this style): ${recentNames}.`;
      }

      const systemPrompt = `You are a game asset naming assistant. 
      I will provide ${validParts.length} sprite images. 
      Name them based on this description: "${prompt || 'Game sprites'}".${contextPrompt}
      Return a JSON array of strings, where each string is a name for the corresponding image in order.
      Use snake_case or camelCase as appropriate for game assets.
      Keep names concise but descriptive.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
            parts: [...validParts as any, { text: systemPrompt }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const names = cleanAndParseJSON(response.text);
      
      if (Array.isArray(names)) {
        batch.forEach((rect, index) => {
          if (names[index]) {
            results[rect.id] = names[index];
            allGeneratedNames.push(names[index]);
          }
        });
      }

      processed += batch.length;
      onProgress?.(processed, total);

    } catch (error) {
      console.error("Error generating names for batch:", error);
      // Continue to next batch even if this one fails
    }
  }

  return results;
};
