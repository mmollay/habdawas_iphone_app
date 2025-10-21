import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface TokenConversionSettings {
  geminiTokensPerCredit: number;
  manualListingCost: number;
  minCreditsForAI: number;
}

interface CreditEstimate {
  geminiTokens: number;
  estimatedCredits: number;
  isFree: boolean;
}

export const useTokenBasedCredits = () => {
  const [settings, setSettings] = useState<TokenConversionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('token_conversion_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsMap: TokenConversionSettings = {
        geminiTokensPerCredit: 250,
        manualListingCost: 0,
        minCreditsForAI: 1,
      };

      data?.forEach(item => {
        const value = parseInt(item.setting_value);
        if (item.setting_key === 'gemini_tokens_per_credit') {
          settingsMap.geminiTokensPerCredit = value;
        } else if (item.setting_key === 'manual_listing_cost') {
          settingsMap.manualListingCost = value;
        } else if (item.setting_key === 'min_credits_for_ai') {
          settingsMap.minCreditsForAI = value;
        }
      });

      setSettings(settingsMap);
    } catch (err) {
      console.error('Error fetching token conversion settings:', err);
      // Use defaults if fetch fails
      setSettings({
        geminiTokensPerCredit: 250,
        manualListingCost: 0,
        minCreditsForAI: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCreditsFromTokens = useCallback((geminiTokens: number): CreditEstimate => {
    if (!settings) {
      return { geminiTokens: 0, estimatedCredits: 0, isFree: true };
    }

    // Manual listing (no AI tokens)
    if (geminiTokens === 0) {
      return {
        geminiTokens: 0,
        estimatedCredits: settings.manualListingCost,
        isFree: settings.manualListingCost === 0,
      };
    }

    // AI listing - calculate based on tokens
    const calculatedCredits = Math.ceil(geminiTokens / settings.geminiTokensPerCredit);
    const finalCredits = Math.max(calculatedCredits, settings.minCreditsForAI);

    return {
      geminiTokens,
      estimatedCredits: finalCredits,
      isFree: false,
    };
  }, [settings]);

  const deductCreditsForAI = useCallback(async (
    userId: string,
    itemId: string,
    geminiInputTokens: number,
    geminiOutputTokens: number,
    description: string
  ): Promise<{ success: boolean; newBalance: number; creditsUsed: number; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('deduct_credits_for_ai', {
        p_user_id: userId,
        p_item_id: itemId,
        p_gemini_input_tokens: geminiInputTokens,
        p_gemini_output_tokens: geminiOutputTokens,
        p_description: description,
      });

      if (error) throw error;

      const result = data?.[0] || data;
      if (!result) {
        throw new Error('No result from deduct_credits_for_ai function');
      }

      return {
        success: result.success,
        newBalance: result.new_balance,
        creditsUsed: result.credits_used,
        error: result.error_message || undefined,
      };
    } catch (err) {
      console.error('Error deducting credits:', err);
      return {
        success: false,
        newBalance: 0,
        creditsUsed: 0,
        error: err instanceof Error ? err.message : 'Failed to deduct credits',
      };
    }
  }, []);

  return {
    settings,
    loading,
    calculateCreditsFromTokens,
    deductCreditsForAI,
    refetch: fetchSettings,
  };
};
