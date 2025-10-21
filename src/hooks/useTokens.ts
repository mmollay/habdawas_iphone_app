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
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!user) {
      setBalance(0);
      setTotalEarned(0);
      setTotalSpent(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch current balance from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('personal_credits')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setBalance(profileData?.personal_credits ?? 0);

      // Calculate total earned and spent from credit_transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('amount, transaction_type')
        .eq('user_id', user.id);

      if (transactionsError) throw transactionsError;

      const earned = transactions
        ?.filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0) ?? 0;

      const spent = Math.abs(
        transactions
          ?.filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0) ?? 0
      );

      setTotalEarned(earned);
      setTotalSpent(spent);
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
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      console.error('Error fetching credit transactions:', err);
      return [];
    }
  };

  return {
    balance,
    totalEarned,
    totalSpent,
    loading,
    error,
    refetch: fetchBalance,
    fetchTransactions
  };
};
