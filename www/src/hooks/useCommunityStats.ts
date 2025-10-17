import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CommunityStats } from '../types/credit-system';
import { useAuth } from '../contexts/AuthContext';

export const useCommunityStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get community pot balance
      const { data: potData, error: potError } = await supabase
        .from('credit_system_settings')
        .select('setting_value')
        .eq('setting_key', 'community_pot_balance')
        .maybeSingle();

      if (potError) throw potError;

      // If no entry exists yet, default to 0
      const communityPotBalance = potData ? (parseInt(potData.setting_value as string) || 0) : 0;

      // Get user's profile with credit info
      let userDonationAmount = 0;
      let userListingsDonated = 0;

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('total_donated, community_listings_donated')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        userDonationAmount = parseFloat(profileData.total_donated as string) || 0;
        userListingsDonated = parseInt(profileData.community_listings_donated as string) || 0;
      }

      // Get total donations stats
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select('amount, user_id')
        .eq('donation_type', 'community_pot')
        .eq('status', 'completed');

      if (donationsError) throw donationsError;

      const totalDonations = donationsData?.length || 0;
      const totalDonationAmount = donationsData?.reduce((sum, d) => sum + parseFloat(d.amount as string), 0) || 0;
      const uniqueDonors = new Set(donationsData?.map(d => d.user_id)).size;

      // Calculate total listings financed (from transactions)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('community_pot_transactions')
        .select('amount')
        .eq('transaction_type', 'donation');

      if (transactionsError) throw transactionsError;

      const totalListingsFinanced = transactionsData?.reduce((sum, t) => sum + (parseInt(t.amount as string) || 0), 0) || 0;

      setStats({
        totalBalance: communityPotBalance,
        totalDonations,
        totalDonationAmount,
        activeDonors: uniqueDonors,
        totalListingsFinanced,
        userDonationAmount,
        userListingsDonated,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load community stats');
      console.error('Error loading community stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 2 minutes (120000ms) to stay in sync with useCreditsStats
    const interval = setInterval(fetchStats, 120000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
};
