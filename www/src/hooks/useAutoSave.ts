import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveProps {
  itemId: string;
  draftData: any;
  enabled: boolean;
  debounceMs?: number;
}

export const useAutoSave = ({
  itemId,
  draftData,
  enabled,
  debounceMs = 1000,
}: UseAutoSaveProps) => {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(draftData);

    if (currentData === previousDataRef.current) {
      return;
    }

    previousDataRef.current = currentData;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus('saving');

    timeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('items')
          .update({
            draft_data: draftData,
            has_draft: true,
            draft_updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (error) throw error;

        setStatus('saved');

        setTimeout(() => {
          setStatus('idle');
        }, 2000);
      } catch (err) {
        console.error('Auto-save error:', err);
        setStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [itemId, draftData, enabled, debounceMs]);

  return { status };
};
