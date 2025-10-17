import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TokenBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
}

interface TokenTransaction {
  id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage' | 'bonus' | 'refund';
  item_id: string | null;
  gemini_input_tokens: number | null;
  gemini_output_tokens: number | null;
  gemini_total_tokens: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const useTokens = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_tokens')
        .select('balance, total_earned, total_spent, updated_at')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setBalance(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching token balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch token balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user?.id]);

  const fetchTransactions = async (limit = 50): Promise<TokenTransaction[]> => {
    if (!user) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      console.error('Error fetching token transactions:', err);
      return [];
    }
  };

  return {
    balance: balance?.balance ?? 0,
    totalEarned: balance?.total_earned ?? 0,
    totalSpent: balance?.total_spent ?? 0,
    loading,
    error,
    refetch: fetchBalance,
    fetchTransactions
  };
};
