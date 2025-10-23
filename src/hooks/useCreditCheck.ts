import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalCache } from '../contexts/GlobalCacheContext';
import { CreditCheckResult } from '../types/credit-system';

export const useCreditCheck = () => {
  const { user } = useAuth();
  const { getCached } = useGlobalCache();
  const [loading, setLoading] = useState(false);

  const checkCredit = useCallback(async (): Promise<CreditCheckResult> => {
    if (!user) {
      return {
        canCreate: false,
        source: null,
        reason: 'not_authenticated',
        message: 'Bitte melde dich an, um Inserate zu erstellen.',
      };
    }

    try {
      setLoading(true);

      // Get system settings (cached)
      const settingsData = await getCached(
        'settings:credit_check',
        async () => {
          const { data, error } = await supabase
            .from('credit_system_settings')
            .select('setting_key, setting_value')
            .in('setting_key', ['daily_free_listings', 'community_pot_balance']);

          if (error) throw error;
          return data;
        },
        30000 // 30s cache for settings
      );

      const dailyLimit = parseInt(
        settingsData?.find(s => s.setting_key === 'daily_free_listings')?.setting_value as string || '5'
      );
      const communityPotBalance = parseInt(
        settingsData?.find(s => s.setting_key === 'community_pot_balance')?.setting_value as string || '0'
      );

      // Get user profile (cached)
      const profileData = await getCached(
        `profile:${user.id}:credits`,
        async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('daily_listings_used, last_listing_date, personal_credits')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          return data;
        },
        10000 // 10s cache for profile
      );

      const dailyUsed = parseInt(profileData.daily_listings_used as string) || 0;
      const lastListingDate = profileData.last_listing_date as string;
      const personalCredits = parseInt(profileData.personal_credits as string) || 0;

      // Check if daily reset needed
      const today = new Date().toISOString().split('T')[0];
      const needsReset = lastListingDate !== today;
      const effectiveDailyUsed = needsReset ? 0 : dailyUsed;

      // Check 1: Can use free listing from community pot?
      if (effectiveDailyUsed < dailyLimit && communityPotBalance > 0) {
        return {
          canCreate: true,
          source: 'community_pot',
          message: `Du kannst noch ${dailyLimit - effectiveDailyUsed} kostenlose Inserate heute erstellen.`,
          remainingDailyListings: dailyLimit - effectiveDailyUsed,
          communityPotBalance,
          personalCredits, // Always include personalCredits for display
        };
      }

      // Check 2: Daily limit reached but community pot empty?
      if (effectiveDailyUsed < dailyLimit && communityPotBalance === 0) {
        // User hasn't used all daily listings but pot is empty
        if (personalCredits > 0) {
          return {
            canCreate: true,
            source: 'personal_credits',
            message: `Community-Topf ist leer. Du verwendest deine persönlichen Credits (${personalCredits} verfügbar).`,
            remainingDailyListings: dailyLimit - effectiveDailyUsed, // Show remaining even if pot empty
            personalCredits,
            communityPotBalance: 0,
          };
        }
        return {
          canCreate: false,
          source: null,
          reason: 'community_pot_empty',
          message: 'Der Community-Topf ist leer. Bitte spende oder kaufe persönliche Credits.',
          remainingDailyListings: dailyLimit - effectiveDailyUsed,
          personalCredits: 0,
          communityPotBalance: 0,
        };
      }

      // Check 3: Daily limit reached, check personal credits
      if (effectiveDailyUsed >= dailyLimit) {
        if (personalCredits > 0) {
          return {
            canCreate: true,
            source: 'personal_credits',
            message: `Tageslimit erreicht. Du verwendest deine persönlichen Credits (${personalCredits} verfügbar).`,
            remainingDailyListings: 0,
            personalCredits,
            communityPotBalance,
          };
        }
        return {
          canCreate: false,
          source: null,
          reason: 'no_credits',
          message: 'Tageslimit erreicht und keine persönlichen Credits verfügbar. Bitte spende oder kaufe Credits.',
          remainingDailyListings: 0,
          personalCredits: 0,
          communityPotBalance,
        };
      }

      // Fallback
      return {
        canCreate: false,
        source: null,
        reason: 'unknown',
        message: 'Fehler beim Überprüfen der Credits.',
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      return {
        canCreate: false,
        source: null,
        reason: 'error',
        message: 'Fehler beim Überprüfen der Credits.',
      };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const consumeCredit = useCallback(async (source: 'community_pot' | 'personal_credits', itemId?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      if (source === 'community_pot') {
        // First, get current values
        const { data: profileData } = await supabase
          .from('profiles')
          .select('daily_listings_used, last_listing_date')
          .eq('id', user.id)
          .single();

        const today = new Date().toISOString().split('T')[0];
        const needsReset = profileData?.last_listing_date !== today;
        const currentUsed = needsReset ? 0 : (parseInt(profileData?.daily_listings_used as string) || 0);

        // Update user's daily counter
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            daily_listings_used: currentUsed + 1,
            last_listing_date: today,
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // Decrement community pot (via existing function)
        const { error: potError } = await supabase.rpc('update_community_pot_balance', { delta: -1 });
        if (potError) throw potError;

        // Log transaction
        const { data: balanceData } = await supabase.rpc('get_community_pot_balance');

        await supabase.from('community_pot_transactions').insert({
          transaction_type: 'usage',
          user_id: user.id,
          amount: -1,
          balance_after: balanceData || 0,
          description: 'Inserat erstellt (kostenlos)',
          item_id: itemId || null,
        });

      } else if (source === 'personal_credits') {
        // Get current personal credits
        const { data: profileData } = await supabase
          .from('profiles')
          .select('personal_credits')
          .eq('id', user.id)
          .single();

        const currentCredits = parseInt(profileData?.personal_credits as string) || 0;

        if (currentCredits <= 0) {
          throw new Error('Keine persönlichen Credits verfügbar');
        }

        // Decrement personal credits
        const { error } = await supabase
          .from('profiles')
          .update({
            personal_credits: currentCredits - 1,
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error consuming credit:', error);
      return false;
    }
  }, [user, getCached]);

  return {
    checkCredit,
    consumeCredit,
    loading,
  };
};
