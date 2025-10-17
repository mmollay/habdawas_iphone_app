import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SystemSettings, UpdateSystemSettingDTO } from '../types/credit-system';

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
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
          'low_pot_warning_threshold'
        ]);

      if (error) throw error;

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
        };
        setSettings(settingsObj);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      console.error('Error loading system settings:', err);
    } finally {
      setLoading(false);
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
