import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Newsletter {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduled_at?: string;
  sent_at?: string;
  recipient_count?: number;
  created_at: string;
  updated_at: string;
}

export function useNewsletters() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNewsletters(data || []);
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createNewsletter = async (newsletter: Partial<Newsletter>) => {
    try {
      const { data, error: createError } = await supabase
        .from('newsletters')
        .insert([newsletter])
        .select()
        .single();

      if (createError) throw createError;

      await fetchNewsletters();
      return data;
    } catch (err) {
      console.error('Error creating newsletter:', err);
      throw err;
    }
  };

  const updateNewsletter = async (id: string, updates: Partial<Newsletter>) => {
    try {
      const { error: updateError } = await supabase
        .from('newsletters')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchNewsletters();
    } catch (err) {
      console.error('Error updating newsletter:', err);
      throw err;
    }
  };

  const deleteNewsletter = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchNewsletters();
    } catch (err) {
      console.error('Error deleting newsletter:', err);
      throw err;
    }
  };

  return {
    newsletters,
    loading,
    error,
    refetch: fetchNewsletters,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
  };
}
