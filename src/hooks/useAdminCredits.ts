import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface GrantCreditsDTO {
  userId: string;
  amount: number;
  euroAmount: number; // Added: Euro amount for donation tracking
  pricePerUnit: number; // Added: Price per credit/listing at time of grant
  reason?: string;
}

export const useAdminCredits = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Grant personal credits to a user
   */
  const grantPersonalCredits = async ({ userId, amount, euroAmount, pricePerUnit }: GrantCreditsDTO) => {
    try {
      setLoading(true);
      setError(null);

      // Get current credits
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('personal_credits')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Update credits
      const newCredits = (profile.personal_credits || 0) + amount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          personal_credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Create donation record for tracking
      const { error: donationError } = await supabase
        .from('donations')
        .insert({
          user_id: userId,
          amount: euroAmount, // Real Euro amount
          price_per_unit: pricePerUnit, // Price per credit at time of grant
          donation_type: 'personal_credits',
          credits_granted: amount,
          status: 'completed',
          stripe_payment_id: `admin_grant_${Date.now()}`,
        });

      if (donationError) throw donationError;

      return { success: true, newCredits };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to grant credits';
      setError(errorMessage);
      console.error('Error granting personal credits:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add credits to community pot
   * Optional userId for donor tracking (Hall of Fame, Leaderboard, etc.)
   */
  const addToCommunityPot = async ({
    amount,
    euroAmount,
    pricePerUnit,
    reason,
    userId
  }: {
    amount: number;
    euroAmount: number;
    pricePerUnit: number;
    reason?: string;
    userId?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Get current pot balance
      const { data: setting, error: settingError } = await supabase
        .from('credit_system_settings')
        .select('setting_value')
        .eq('setting_key', 'community_pot_balance')
        .single();

      if (settingError) throw settingError;

      const currentBalance = parseInt(setting.setting_value || '0');
      const newBalance = currentBalance + amount;

      // Update pot balance
      const { error: updateError } = await supabase
        .from('credit_system_settings')
        .update({
          setting_value: newBalance.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'community_pot_balance');

      if (updateError) throw updateError;

      // Create donation record for tracking (if userId provided - for Hall of Fame)
      if (userId) {
        const { error: donationError } = await supabase
          .from('donations')
          .insert({
            user_id: userId,
            amount: euroAmount, // Real Euro amount
            price_per_unit: pricePerUnit, // Price per listing at time of grant
            donation_type: 'community_pot',
            credits_granted: amount,
            status: 'completed',
            stripe_payment_id: `admin_community_${Date.now()}`,
          });

        if (donationError) throw donationError;
      }

      // Create transaction log
      const { error: transactionError } = await supabase
        .from('community_pot_transactions')
        .insert({
          transaction_type: 'adjustment',
          user_id: userId || null, // Link to user for transparency
          amount: amount,
          balance_after: newBalance,
          description: reason || `Admin adjustment: +${amount} credits`,
        });

      if (transactionError) throw transactionError;

      return { success: true, newBalance };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to community pot';
      setError(errorMessage);
      console.error('Error adding to community pot:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    grantPersonalCredits,
    addToCommunityPot,
    loading,
    error,
  };
};
