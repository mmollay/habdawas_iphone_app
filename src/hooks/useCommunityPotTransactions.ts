import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CommunityPotTransaction } from '../types/credit-system';

interface UseTransactionsOptions {
  limit?: number;
  transactionType?: 'donation' | 'usage' | 'adjustment';
  autoFetch?: boolean;
}

export const useCommunityPotTransactions = (options: UseTransactionsOptions = {}) => {
  const { limit = 100, transactionType, autoFetch = true } = options;
  const [transactions, setTransactions] = useState<CommunityPotTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('community_pot_transactions')
        .select(`
          *,
          user:profiles!user_id(
            id,
            full_name,
            email
          ),
          item:items!item_id(
            id,
            title
          )
        `)
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
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchTransactions();
    }
  }, [limit, transactionType, autoFetch]);

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
