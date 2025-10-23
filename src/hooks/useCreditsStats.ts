import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalCache } from '../contexts/GlobalCacheContext';

interface CreditsStats {
  personalCredits: number;
  communityPotBalance: number;
  loading: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook to fetch and auto-refresh credits stats
 * Refreshes every 2 minutes
 */
export const useCreditsStats = () => {
  const { user } = useAuth();
  const { getCached } = useGlobalCache();
  const [stats, setStats] = useState<CreditsStats>({
    personalCredits: 0,
    communityPotBalance: 0,
    loading: true,
    lastUpdated: null,
  });

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
      setStats((prev) => ({ ...prev, loading: true }));

      // Fetch personal credits (cached)
      let personalCredits = 0;
      if (user) {
        const profile = await getCached(
          `profile:${user.id}:credits`,
          async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select('personal_credits')
              .eq('id', user.id)
              .single();

            if (error) throw error;
            return data;
          },
          30000 // 30s cache
        );

        personalCredits = profile.personal_credits || 0;
      }

      // Fetch community pot balance (cached)
      const setting = await getCached(
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

      const communityPotBalance = setting ? parseInt(setting.setting_value || '0') : 0;

      setStats({
        personalCredits,
        communityPotBalance,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error('Error fetching credits stats:', err);
      setStats((prev) => ({ ...prev, loading: false }));
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 2 minutes (120000ms)
    const interval = setInterval(fetchStats, 120000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return { ...stats, refetch: fetchStats };
};
