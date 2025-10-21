import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NewsletterSettings {
  batchSize: number;
  batchDelayMs: number;
  testEmailAddresses: string[];
  fromName: string;
  fromEmail: string;
  enableTracking: boolean;
  maxRetries: number;
}

interface NewsletterSettingRow {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useNewsletterSettings = () => {
  const [settings, setSettings] = useState<NewsletterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_settings')
        .select('*')
        .in('setting_key', [
          'batch_size',
          'batch_delay_ms',
          'test_email_addresses',
          'from_name',
          'from_email',
          'enable_tracking',
          'max_retries'
        ]);

      if (error) throw error;

      if (data) {
        // Helper function to safely parse JSON or return value if already parsed
        const safeJsonParse = (value: any, defaultValue: any) => {
          if (!value || value === '') return defaultValue;
          // If it's already an object/array (JSONB from Supabase), return it directly
          if (typeof value === 'object') return value;
          // If it's a string, try to parse it
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return defaultValue;
            }
          }
          return defaultValue;
        };

        const settingsObj: NewsletterSettings = {
          batchSize: Number(data.find((s: NewsletterSettingRow) => s.setting_key === 'batch_size')?.setting_value || 100),
          batchDelayMs: Number(data.find((s: NewsletterSettingRow) => s.setting_key === 'batch_delay_ms')?.setting_value || 1000),
          testEmailAddresses: safeJsonParse(data.find((s: NewsletterSettingRow) => s.setting_key === 'test_email_addresses')?.setting_value, []),
          fromName: String(data.find((s: NewsletterSettingRow) => s.setting_key === 'from_name')?.setting_value || 'HabDaWas'),
          fromEmail: String(data.find((s: NewsletterSettingRow) => s.setting_key === 'from_email')?.setting_value || 'newsletter@habdawas.at'),
          enableTracking: Boolean(data.find((s: NewsletterSettingRow) => s.setting_key === 'enable_tracking')?.setting_value || true),
          maxRetries: Number(data.find((s: NewsletterSettingRow) => s.setting_key === 'max_retries')?.setting_value || 3),
        };
        setSettings(settingsObj);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      console.error('Error loading newsletter settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    try {
      // Convert value to appropriate JSON format
      let jsonValue = value;
      if (Array.isArray(value)) {
        jsonValue = value;
      } else if (typeof value === 'string') {
        jsonValue = value;
      } else {
        jsonValue = value;
      }

      const { error } = await supabase
        .from('newsletter_settings')
        .update({
          setting_value: jsonValue,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', key);

      if (error) throw error;

      // Refresh settings
      await fetchSettings();
    } catch (err) {
      throw err;
    }
  };

  const addTestEmail = async (email: string) => {
    if (!settings) return;
    const updated = [...settings.testEmailAddresses, email];
    await updateSetting('test_email_addresses', updated);
  };

  const removeTestEmail = async (email: string) => {
    if (!settings) return;
    const updated = settings.testEmailAddresses.filter(e => e !== email);
    await updateSetting('test_email_addresses', updated);
  };

  return {
    settings,
    loading,
    error,
    updateSetting,
    addTestEmail,
    removeTestEmail,
    refresh: fetchSettings,
  };
};
