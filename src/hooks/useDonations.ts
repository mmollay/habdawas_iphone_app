import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Donation } from '../types/credit-system';

interface UseDonationsOptions {
  userId?: string;
  limit?: number;
  autoFetch?: boolean;
}

export const useDonations = (options: UseDonationsOptions = {}) => {
  const { userId, limit = 50, autoFetch = true } = options;
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('donations')
        .select(`
          *,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDonations(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load donations';
      setError(errorMessage);
      console.error('Error fetching donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchDonations();
    }
  }, [userId, limit, autoFetch]);

  const getTotalDonations = () => {
    return donations.reduce((sum, d) => sum + Number(d.amount), 0);
  };

  const getTotalCredits = () => {
    return donations.reduce((sum, d) => sum + d.credits_granted, 0);
  };

  return {
    donations,
    loading,
    error,
    refresh: fetchDonations,
    totalDonations: getTotalDonations(),
    totalCredits: getTotalCredits(),
  };
};
