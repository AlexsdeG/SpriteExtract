import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export const useKeyboard = () => {
  const removeSelected = useStore((state) => state.removeSelected);
  const selectAll = useStore((state) => state.selectAll);
  const rects = useStore((state) => state.rects);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedCount = rects.filter(r => r.selected).length;
        if (selectedCount > 0) {
          removeSelected();
          toast.success(`Deleted ${selectedCount} sprite(s)`);
        }
      }

      // Ctrl + A (Select All)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (rects.length > 0) {
          selectAll();
          toast.info("Selected all sprites");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeSelected, selectAll, rects]);
};