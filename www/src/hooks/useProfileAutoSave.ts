import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseProfileAutoSaveProps {
  userId: string;
  data: any;
  enabled: boolean;
  debounceMs?: number;
}

export const useProfileAutoSave = ({
  userId,
  data,
  enabled,
  debounceMs = 1000,
}: UseProfileAutoSaveProps) => {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!enabled || !userId) {
      console.log('⏸️ AutoSave disabled:', { enabled, userId });
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousDataRef.current = JSON.stringify(data);
      console.log('🎬 AutoSave initialized');
      return;
    }

    const currentData = JSON.stringify(data);
    if (currentData === previousDataRef.current) {
      return;
    }

    console.log('📝 Data changed, scheduling save...');
    previousDataRef.current = currentData;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setStatus('idle');

    saveTimeoutRef.current = setTimeout(async () => {
      console.log('💾 Saving to database...', data);
      setStatus('saving');
      try {
        const { error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', userId);

        if (error) throw error;

        console.log('✅ Saved successfully!');
        setStatus('saved');
        setLastSaved(new Date());

        if (hideStatusTimeoutRef.current) {
          clearTimeout(hideStatusTimeoutRef.current);
        }
        hideStatusTimeoutRef.current = setTimeout(() => {
          setStatus('idle');
        }, 3000);
      } catch (err) {
        console.error('❌ Auto-save error:', err);
        setStatus('error');
        if (hideStatusTimeoutRef.current) {
          clearTimeout(hideStatusTimeoutRef.current);
        }
        hideStatusTimeoutRef.current = setTimeout(() => {
          setStatus('idle');
        }, 5000);
      }
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (hideStatusTimeoutRef.current) {
        clearTimeout(hideStatusTimeoutRef.current);
      }
    };
  }, [userId, data, enabled, debounceMs]);

  return { status, lastSaved };
};
