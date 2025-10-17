import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  const [stats, setStats] = useState<CreditsStats>({
    personalCredits: 0,
    communityPotBalance: 0,
    loading: true,
    lastUpdated: null,
  });

  const fetchStats = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true }));

      // Fetch personal credits
      let personalCredits = 0;
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('personal_credits')
          .eq('id', user.id)
          .single();

        if (!profileError && profile) {
          personalCredits = profile.personal_credits || 0;
        }
      }

      // Fetch community pot balance
      const { data: setting, error: settingError } = await supabase
        .from('credit_system_settings')
        .select('setting_value')
        .eq('setting_key', 'community_pot_balance')
        .maybeSingle();

      const communityPotBalance = (settingError || !setting) ? 0 : parseInt(setting.setting_value || '0');

      setStats({
        personalCredits,
        communityPotBalance,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error('Error fetching credits stats:', err);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 2 minutes (120000ms)
    const interval = setInterval(fetchStats, 120000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return stats;
};
