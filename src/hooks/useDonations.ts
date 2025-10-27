import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Donation, DonationWithUser } from '../types/credit-system';

interface UseDonationsOptions {
  userId?: string;
  limit?: number;
  autoFetch?: boolean;
  includeUser?: boolean; // Whether to include user profile data
}

export const useDonations = (options: UseDonationsOptions = {}) => {
  const { userId, limit = 50, autoFetch = true, includeUser = false } = options;
  const [donations, setDonations] = useState<DonationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deduplication refs
  const loadingRef = useRef(false);
  const lastFetchParamsRef = useRef<string>('');

  const fetchDonations = async () => {
    const fetchParams = JSON.stringify({ userId, limit, includeUser });

    // Skip if already loading with same params
    if (loadingRef.current && lastFetchParamsRef.current === fetchParams) {
      return;
    }

    loadingRef.current = true;
    lastFetchParamsRef.current = fetchParams;

    try {
      setLoading(true);
      setError(null);

      // Build select statement - include user profile if requested
      const selectStatement = includeUser
        ? '*, user:profiles!user_id(id, full_name, email)'
        : '*';

      let query = supabase
        .from('donations')
        .select(selectStatement)
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
  }, [userId, limit, autoFetch, includeUser]);

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
