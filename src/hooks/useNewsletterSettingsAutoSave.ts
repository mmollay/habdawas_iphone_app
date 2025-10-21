import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SettingUpdate {
  key: string;
  value: any;
}

interface UseNewsletterSettingsAutoSaveProps {
  enabled: boolean;
  debounceMs?: number;
}

export const useNewsletterSettingsAutoSave = ({
  enabled,
  debounceMs = 1000,
}: UseNewsletterSettingsAutoSaveProps) => {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdates = useRef<Map<string, any>>(new Map());

  const saveSetting = async (key: string, value: any) => {
    if (!enabled) return;

    // Add to pending updates
    pendingUpdates.current.set(key, value);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setStatus('idle');

    // Schedule save
    saveTimeoutRef.current = setTimeout(async () => {
      const updates = Array.from(pendingUpdates.current.entries());
      pendingUpdates.current.clear();

      if (updates.length === 0) return;

      console.log('💾 Saving newsletter settings...', updates);
      setStatus('saving');

      try {
        // Save all pending updates
        for (const [settingKey, settingValue] of updates) {
          const { error } = await supabase
            .from('newsletter_settings')
            .update({
              setting_value: settingValue,
              updated_at: new Date().toISOString(),
            })
            .eq('setting_key', settingKey);

          if (error) throw error;
        }

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
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (hideStatusTimeoutRef.current) {
        clearTimeout(hideStatusTimeoutRef.current);
      }
    };
  }, []);

  return { status, lastSaved, saveSetting };
};
