import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalCache } from '../contexts/GlobalCacheContext';

// Define profile slices for different use cases
type ProfileSlice =
  | 'credits'           // daily_listings_used, last_listing_date, personal_credits
  | 'preferences'       // view_mode_preference, onboarding_completed
  | 'hand_preference'   // hand_preference
  | 'donations'         // total_donated, community_listings_donated
  | 'shipping'          // shipping_enabled, pickup_enabled
  | 'full';             // all fields

interface ProfileData {
  id?: string;
  full_name?: string;
  email?: string;
  daily_listings_used?: number;
  last_listing_date?: string;
  personal_credits?: number;
  view_mode_preference?: string;
  onboarding_completed?: boolean;
  hand_preference?: 'left' | 'right';
  total_donated?: number;
  community_listings_donated?: number;
  shipping_enabled?: boolean;
  pickup_enabled?: boolean;
  [key: string]: any;
}

const SLICE_FIELDS: Record<ProfileSlice, string> = {
  credits: 'daily_listings_used,last_listing_date,personal_credits',
  preferences: 'view_mode_preference,onboarding_completed',
  hand_preference: 'hand_preference',
  donations: 'total_donated,community_listings_donated',
  shipping: 'shipping_enabled,pickup_enabled',
  full: '*',
};

// Warm all profile caches with a single query
export const warmProfileCache = async (userId: string, setCached: (key: string, data: any) => void) => {
  try {
    // Fetch full profile in ONE query
    const { data: fullProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!fullProfile) return;

    // Warm all slice caches with the full profile data

    // Warm 'full' cache
    setCached(`profile:${userId}:full`, fullProfile);

    // Warm 'credits' cache
    const { daily_listings_used, last_listing_date, personal_credits } = fullProfile;
    setCached(`profile:${userId}:credits`,
      { daily_listings_used, last_listing_date, personal_credits });

    // Warm 'preferences' cache
    const { view_mode_preference, onboarding_completed } = fullProfile;
    setCached(`profile:${userId}:preferences`,
      { view_mode_preference, onboarding_completed });

    // Warm 'hand_preference' cache
    const { hand_preference } = fullProfile;
    setCached(`profile:${userId}:hand_preference`,
      { hand_preference });

    // Warm 'donations' cache
    const { total_donated, community_listings_donated } = fullProfile;
    setCached(`profile:${userId}:donations`,
      { total_donated, community_listings_donated });

    // Warm 'shipping' cache
    const { shipping_enabled, pickup_enabled } = fullProfile;
    setCached(`profile:${userId}:shipping`,
      { shipping_enabled, pickup_enabled });

    console.log('✅ Profile cache warmed successfully');
  } catch (error) {
    console.error('Error warming profile cache:', error);
  }
};

export const useProfile = (slice: ProfileSlice = 'full', ttl: number = 60000) => {
  const { user } = useAuth();
  const { getCached } = useGlobalCache();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const cacheKey = `profile:${user.id}:${slice}`;
        const fields = SLICE_FIELDS[slice];

        const profileData = await getCached(
          cacheKey,
          async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select(fields)
              .eq('id', user.id)
              .maybeSingle();

            if (error) throw error;
            return data;
          },
          ttl
        );

        setData(profileData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
        setError(errorMessage);
        console.error(`Error loading profile (${slice}):`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, slice, ttl, getCached]);

  return {
    data,
    loading,
    error,
  };
};
