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
