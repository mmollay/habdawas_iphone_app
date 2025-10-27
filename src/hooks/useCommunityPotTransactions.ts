import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CommunityPotTransaction, CommunityPotTransactionWithRelations } from '../types/credit-system';

interface UseTransactionsOptions {
  limit?: number;
  transactionType?: 'donation' | 'usage' | 'adjustment';
  autoFetch?: boolean;
  includeUser?: boolean; // Whether to include user profile data
  includeItem?: boolean; // Whether to include item data
}

export const useCommunityPotTransactions = (options: UseTransactionsOptions = {}) => {
  const { limit = 100, transactionType, autoFetch = true, includeUser = false, includeItem = false } = options;
  const [transactions, setTransactions] = useState<CommunityPotTransactionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deduplication refs
  const loadingRef = useRef(false);
  const lastFetchParamsRef = useRef<string>('');

  const fetchTransactions = async () => {
    const fetchParams = JSON.stringify({ limit, transactionType, includeUser, includeItem });

    // Skip if already loading with same params
    if (loadingRef.current && lastFetchParamsRef.current === fetchParams) {
      return;
    }

    loadingRef.current = true;
    lastFetchParamsRef.current = fetchParams;

    try {
      setLoading(true);
      setError(null);

      // Build select statement - include relations if requested
      let selectParts = ['*'];
      if (includeUser) {
        selectParts.push('user:profiles!user_id(id, full_name, email)');
      }
      if (includeItem) {
        selectParts.push('item:items!item_id(id, title)');
      }
      const selectStatement = selectParts.join(', ');

      let query = supabase
        .from('community_pot_transactions')
        .select(selectStatement)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (transactionType) {
        query = query.eq('transaction_type', transactionType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTransactions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions';
      setError(errorMessage);
      console.error('Error fetching community pot transactions:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchTransactions();
    }
  }, [limit, transactionType, autoFetch, includeUser, includeItem]);

  const getTotalDonations = () => {
    return transactions
      .filter(t => t.transaction_type === 'donation')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalUsage = () => {
    return Math.abs(
      transactions
        .filter(t => t.transaction_type === 'usage')
        .reduce((sum, t) => sum + t.amount, 0)
    );
  };

  return {
    transactions,
    loading,
    error,
    refresh: fetchTransactions,
    totalDonations: getTotalDonations(),
    totalUsage: getTotalUsage(),
  };
};
