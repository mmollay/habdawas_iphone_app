import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CommunityStats } from '../types/credit-system';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalCache } from '../contexts/GlobalCacheContext';

export const useCommunityStats = () => {
  const { user } = useAuth();
  const { getCached } = useGlobalCache();
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deduplication refs
  const loadingRef = useRef(false);
  const lastFetchParamsRef = useRef<string>('');

  const fetchStats = async () => {
    const fetchParams = JSON.stringify({ userId: user?.id });

    // Skip if already loading with same params
    if (loadingRef.current && lastFetchParamsRef.current === fetchParams) {
      return;
    }

    loadingRef.current = true;
    lastFetchParamsRef.current = fetchParams;

    try {
      setLoading(true);
      setError(null);

      // Get community pot balance (cached)
      const potData = await getCached(
        'settings:community_pot_balance',
        async () => {
          const { data, error } = await supabase
            .from('credit_system_settings')
            .select('setting_value')
            .eq('setting_key', 'community_pot_balance')
            .maybeSingle();

          if (error) throw error;
          return data;
        },
        30000 // 30s cache
      );

      const communityPotBalance = potData ? (parseInt(potData.setting_value as string) || 0) : 0;

      // Get user's profile with credit info (cached)
      let userDonationAmount = 0;
      let userListingsDonated = 0;

      if (user) {
        const profileData = await getCached(
          `profile:${user.id}:donations`,
          async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select('total_donated, community_listings_donated')
              .eq('id', user.id)
              .single();

            if (error) throw error;
            return data;
          },
          60000 // 60s cache for donations
        );

        userDonationAmount = parseFloat(profileData.total_donated as string) || 0;
        userListingsDonated = parseInt(profileData.community_listings_donated as string) || 0;
      }

      // Get total donations stats (cached)
      const donationsData = await getCached(
        'donations:community_pot',
        async () => {
          const { data, error } = await supabase
            .from('donations')
            .select('amount, user_id')
            .eq('donation_type', 'community_pot')
            .eq('status', 'completed');

          if (error) throw error;
          return data;
        },
        60000 // 60s cache
      );

      const totalDonations = donationsData?.length || 0;
      const totalDonationAmount = donationsData?.reduce((sum, d) => sum + parseFloat(d.amount as string), 0) || 0;
      const uniqueDonors = new Set(donationsData?.map(d => d.user_id)).size;

      // Calculate total listings financed (from transactions) (cached)
      const transactionsData = await getCached(
        'community_pot_transactions:donations',
        async () => {
          const { data, error } = await supabase
            .from('community_pot_transactions')
            .select('amount')
            .eq('transaction_type', 'donation');

          if (error) throw error;
          return data;
        },
        60000 // 60s cache
      );

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
      loadingRef.current = false;
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
