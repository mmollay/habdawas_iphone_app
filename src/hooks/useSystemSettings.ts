import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { SystemSettings, UpdateSystemSettingDTO } from '../types/credit-system';
import { useGlobalCache } from '../contexts/GlobalCacheContext';

export const useSystemSettings = () => {
  const { getCached, invalidatePattern } = useGlobalCache();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deduplication refs
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);

  const fetchSettings = async () => {
    // Skip if already loading or already loaded
    if (loadingRef.current || loadedRef.current) {
      return;
    }

    loadingRef.current = true;

    try {
      setLoading(true);

      // Use global cache for system settings
      const data = await getCached(
        'settings:system_all',
        async () => {
          const { data, error } = await supabase
            .from('credit_system_settings')
            .select('*')
            .in('setting_key', [
              'daily_free_listings',
              'cost_per_listing',
              'community_pot_balance',
              'power_user_credit_price',
              'min_donation_amount',
              'power_user_min_purchase',
              'low_pot_warning_threshold',
              'donation_inserate_price',
              'ai_model',
              'avg_tokens_per_listing',
              'token_cost_per_million'
            ]);

          if (error) throw error;
          return data;
        },
        60000 // 60s cache for settings
      );

      if (data) {
        // Convert array to object
        const settingsObj: SystemSettings = {
          dailyFreeListings: parseFloat(data.find(s => s.setting_key === 'daily_free_listings')?.setting_value || '5'),
          costPerListing: parseFloat(data.find(s => s.setting_key === 'cost_per_listing')?.setting_value || '0.20'),
          communityPotBalance: parseInt(data.find(s => s.setting_key === 'community_pot_balance')?.setting_value || '0'),
          powerUserCreditPrice: parseFloat(data.find(s => s.setting_key === 'power_user_credit_price')?.setting_value || '0.20'),
          minDonationAmount: parseFloat(data.find(s => s.setting_key === 'min_donation_amount')?.setting_value || '5.00'),
          powerUserMinPurchase: parseFloat(data.find(s => s.setting_key === 'power_user_min_purchase')?.setting_value || '10.00'),
          lowPotWarningThreshold: parseInt(data.find(s => s.setting_key === 'low_pot_warning_threshold')?.setting_value || '100'),
          donationInseratePrice: parseFloat(data.find(s => s.setting_key === 'donation_inserate_price')?.setting_value || '0.20'),
          aiModel: data.find(s => s.setting_key === 'ai_model')?.setting_value || 'gemini-2.0-flash-exp',
          avgTokensPerListing: parseFloat(data.find(s => s.setting_key === 'avg_tokens_per_listing')?.setting_value || '10000'),
          tokenCostPerMillion: parseFloat(data.find(s => s.setting_key === 'token_cost_per_million')?.setting_value || '0.03'),
        };
        setSettings(settingsObj);
        loadedRef.current = true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      console.error('Error loading system settings:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (dto: UpdateSystemSettingDTO) => {
    try {
      const { error } = await supabase
        .from('credit_system_settings')
        .update({
          setting_value: dto.setting_value.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', dto.setting_key);

      if (error) throw error;

      // Invalidate all settings caches
      invalidatePattern('settings:');
      loadedRef.current = false;

      // Refresh settings
      await fetchSettings();
    } catch (err) {
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSetting,
    refresh: fetchSettings,
  };
};
