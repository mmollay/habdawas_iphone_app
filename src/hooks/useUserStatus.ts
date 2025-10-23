import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalCache } from '../contexts/GlobalCacheContext';
import { supabase } from '../lib/supabase';

export interface UserBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  achieved: boolean;
  priority: number; // Higher = more important
}

export interface UserStatus {
  level: string;
  badges: UserBadge[];
  topBadge: UserBadge | null;
  statusColor: string;
}

export const useUserStatus = () => {
  const { user, profile } = useAuth();
  const { getCached } = useGlobalCache();
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    calculateStatus();
  }, [user, profile]);

  const calculateStatus = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch data for status calculation using GlobalCache
      const [itemsResult, transactionsCount, donationsResult] = await Promise.all([
        // Count published items (cached)
        getCached(
          `items:count:${user.id}:published`,
          async () => {
            const result = await supabase
              .from('items')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('status', 'published');
            return result;
          },
          60000 // 60s cache
        ),

        // Check for credit purchases (cached)
        getCached(
          `credit_transactions:count:${user.id}:purchase`,
          async () => {
            const result = await supabase
              .from('credit_transactions')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('transaction_type', 'purchase');
            return result.count || 0;
          },
          60000 // 60s cache
        ),

        // Check for community donations (cached)
        getCached(
          `credit_transactions:${user.id}:purchases`,
          async () => {
            const result = await supabase
              .from('credit_transactions')
              .select('id, metadata')
              .eq('user_id', user.id)
              .eq('transaction_type', 'purchase');
            return result;
          },
          60000 // 60s cache
        ),
      ]);

      const itemCount = itemsResult.count || 0;
      const hasPurchased = transactionsCount > 0;

      // Check if user has donated to community
      const hasDonatedToCommunity = (donationsResult.data || []).some(
        (t: any) => t.metadata?.package_type === 'community'
      );

      // Check account age (3 months = trusted)
      const accountAge = profile?.created_at
        ? Date.now() - new Date(profile.created_at).getTime()
        : 0;
      const isAccountOld = accountAge > 90 * 24 * 60 * 60 * 1000; // 90 days

      // Calculate badges
      const badges: UserBadge[] = [
        {
          id: 'verified',
          name: 'Verifiziert',
          icon: 'CheckCircle',
          color: '#4caf50',
          description: 'Email-Adresse bestätigt',
          achieved: profile?.email_confirmed || false,
          priority: 1,
        },
        {
          id: 'seller',
          name: 'Aktiver Verkäufer',
          icon: 'Store',
          color: '#2196f3',
          description: 'Mindestens 3 Inserate erstellt',
          achieved: itemCount >= 3,
          priority: 3,
        },
        {
          id: 'premium',
          name: 'Premium',
          icon: 'Crown',
          color: '#ff9800',
          description: 'Credits gekauft',
          achieved: hasPurchased,
          priority: 4,
        },
        {
          id: 'hero',
          name: 'Community Hero',
          icon: 'Award',
          color: '#e91e63',
          description: 'An Community-Topf gespendet',
          achieved: hasDonatedToCommunity,
          priority: 6,
        },
        {
          id: 'trusted',
          name: 'Trusted',
          icon: 'Shield',
          color: '#9c27b0',
          description: 'Langjähriges Mitglied mit guter Aktivität',
          achieved: isAccountOld && itemCount >= 5,
          priority: 5,
        },
        {
          id: 'newcomer',
          name: 'Neu',
          icon: 'Sparkles',
          color: '#607d8b',
          description: 'Willkommen bei Bazar!',
          achieved: !hasPurchased && itemCount < 3 && !hasDonatedToCommunity,
          priority: 0,
        },
      ];

      // Sort by priority and get achieved badges
      const achievedBadges = badges
        .filter(b => b.achieved)
        .sort((a, b) => b.priority - a.priority);

      // Get top badge (highest priority achieved badge)
      const topBadge = achievedBadges[0] || badges.find(b => b.id === 'newcomer') || null;

      // Determine level based on badges
      let level = 'Neu';
      let statusColor = '#607d8b';

      if (achievedBadges.length >= 5) {
        level = 'Elite';
        statusColor = '#9c27b0';
      } else if (achievedBadges.find(b => b.id === 'hero')) {
        level = 'Community Hero';
        statusColor = '#e91e63';
      } else if (achievedBadges.find(b => b.id === 'trusted')) {
        level = 'Trusted';
        statusColor = '#9c27b0';
      } else if (achievedBadges.find(b => b.id === 'premium')) {
        level = 'Premium';
        statusColor = '#ff9800';
      } else if (achievedBadges.find(b => b.id === 'seller')) {
        level = 'Aktiver Verkäufer';
        statusColor = '#2196f3';
      } else if (achievedBadges.find(b => b.id === 'verified')) {
        level = 'Verifiziert';
        statusColor = '#4caf50';
      }

      setStatus({
        level,
        badges,
        topBadge,
        statusColor,
      });
    } catch (error) {
      console.error('Error calculating user status:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    refetch: calculateStatus,
  };
};
