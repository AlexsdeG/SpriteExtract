// Simple encryption wrapper for localStorage
// Note: Client-side encryption key is visible in source, but this prevents plain-text reading from DevTools.

const ENCRYPTION_KEY = 'sprite-extract-secure-storage';

const encrypt = (text: string): string => {
  const textToChars = (text: string) => text.split('').map((c) => c.charCodeAt(0));
  const byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
  const applySaltToChar = (code: number) => textToChars(ENCRYPTION_KEY).reduce((a, b) => a ^ b, code);

  return text
    .split('')
    .map(textToChars)
    .map(applySaltToChar)
    .map(byteHex)
    .join('');
};

const decrypt = (encoded: string): string => {
  const textToChars = (text: string) => text.split('').map((c) => c.charCodeAt(0));
  const applySaltToChar = (code: number) => textToChars(ENCRYPTION_KEY).reduce((a, b) => a ^ b, code);
  
  return (encoded
    .match(/.{1,2}/g) || [])
    .map((hex) => parseInt(hex, 16))
    .map(applySaltToChar)
    .map((charCode) => String.fromCharCode(charCode))
    .join('');
};

export const secureStorage = {
  getItem: (name: string): string | null => {
    const value = localStorage.getItem(name);
    if (!value) return null;
    try {
      return decrypt(value);
    } catch (e) {
      console.warn('Failed to decrypt storage, clearing it.', e);
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      const encrypted = encrypt(value);
      localStorage.setItem(name, encrypted);
    } catch (e) {
      console.error('Failed to encrypt storage', e);
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};
