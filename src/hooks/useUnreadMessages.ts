import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useUnreadMessages = (refreshInterval: number = 30000) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const [buyerConvs, sellerConvs] = await Promise.all([
        supabase
          .from('conversations')
          .select(`
            id,
            messages!inner(id, sender_id, read)
          `)
          .eq('buyer_id', user.id),
        supabase
          .from('conversations')
          .select(`
            id,
            messages!inner(id, sender_id, read)
          `)
          .eq('seller_id', user.id),
      ]);

      if (buyerConvs.error) throw buyerConvs.error;
      if (sellerConvs.error) throw sellerConvs.error;

      const conversations = [
        ...(buyerConvs.data || []),
        ...(sellerConvs.data || []),
      ];

      let count = 0;
      conversations?.forEach((conversation) => {
        const messages = conversation.messages as any[];
        const unreadMessages = messages.filter(
          (msg) => msg.sender_id !== user.id && !msg.read
        );
        count += unreadMessages.length;
      });

      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [user?.id, refreshInterval]);

  return { unreadCount, loading, refresh: fetchUnreadCount };
};
