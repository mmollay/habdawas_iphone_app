import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface SellerShippingInfo {
  shipping_enabled: boolean;
  pickup_enabled: boolean;
}

const profileCache = new Map<string, SellerShippingInfo>();
const CACHE_DURATION = 5 * 60 * 1000;
const cacheTimestamps = new Map<string, number>();

export const useSellerProfiles = (userIds: string[]) => {
  const [profiles, setProfiles] = useState<Record<string, SellerShippingInfo>>({});
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(new Set<string>());

  useEffect(() => {
    if (userIds.length === 0) {
      setLoading(false);
      return;
    }

    loadProfiles();
  }, [userIds.join(',')]);

  const loadProfiles = async () => {
    try {
      const now = Date.now();
      const cachedProfiles: Record<string, SellerShippingInfo> = {};
      const idsToFetch: string[] = [];

      userIds.forEach(id => {
        const cacheTime = cacheTimestamps.get(id);
        if (profileCache.has(id) && cacheTime && (now - cacheTime) < CACHE_DURATION) {
          cachedProfiles[id] = profileCache.get(id)!;
        } else if (!loadedRef.current.has(id)) {
          idsToFetch.push(id);
          loadedRef.current.add(id);
        }
      });

      if (Object.keys(cachedProfiles).length > 0) {
        setProfiles(prev => ({ ...prev, ...cachedProfiles }));
      }

      if (idsToFetch.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, shipping_enabled, pickup_enabled')
        .in('id', idsToFetch);

      if (error) throw error;

      const profileMap: Record<string, SellerShippingInfo> = {};
      data?.forEach(profile => {
        const info = {
          shipping_enabled: profile.shipping_enabled ?? false,
          pickup_enabled: profile.pickup_enabled ?? true,
        };
        profileMap[profile.id] = info;
        profileCache.set(profile.id, info);
        cacheTimestamps.set(profile.id, now);
      });

      setProfiles(prev => ({ ...prev, ...profileMap }));
    } catch (err) {
      console.error('Error loading seller profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  return { profiles, loading };
};
