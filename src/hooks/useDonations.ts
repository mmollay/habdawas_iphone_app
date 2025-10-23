import { useState, useEffect, useRef } from 'react';
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

  // Deduplication refs
  const loadingRef = useRef(false);
  const lastFetchParamsRef = useRef<string>('');

  const fetchDonations = async () => {
    const fetchParams = JSON.stringify({ userId, limit });

    // Skip if already loading with same params
    if (loadingRef.current && lastFetchParamsRef.current === fetchParams) {
      return;
    }

    loadingRef.current = true;
    lastFetchParamsRef.current = fetchParams;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('donations')
        .select('*')
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
      loadingRef.current = false;
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
