import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NewsletterLog {
  id: string;
  newsletter_id: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export function useNewsletterLogs(newsletterId?: string) {
  const [logs, setLogs] = useState<NewsletterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [newsletterId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('newsletter_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (newsletterId) {
        query = query.eq('newsletter_id', newsletterId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching newsletter logs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  };
}
