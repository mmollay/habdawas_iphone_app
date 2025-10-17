import { Box, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Item } from '../../lib/supabase';
import { ItemCard } from './ItemCard';
import { useSellerProfiles } from '../../hooks/useSellerProfiles';
import { useAuth } from '../../contexts/AuthContext';

interface ItemGridProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  onItemUpdated?: () => void;
  allItems?: Item[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export const ItemGrid = ({ items, onItemClick, onItemUpdated, allItems, onLoadMore, hasMore, loadingMore }: ItemGridProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userIds = [...new Set(items.map(item => item.user_id))];
  const { profiles } = useSellerProfiles(userIds);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loadingMore]);

  const handleItemClick = (item: Item) => {
    if (onItemClick) {
      onItemClick(item);
    } else if (allItems) {
      sessionStorage.setItem('returnSearch', location.search);
      navigate(`/item/${item.id}`, { state: { allItems } });
    } else {
      navigate(`/item/${item.id}`);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => handleItemClick(item)}
            shippingEnabled={profiles[item.user_id]?.shipping_enabled}
            pickupEnabled={profiles[item.user_id]?.pickup_enabled}
            isOwnItem={user?.id === item.user_id}
            onItemUpdated={onItemUpdated}
          />
        ))}
      </Box>
      {hasMore && (
        <Box ref={observerTarget} sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          {loadingMore && <CircularProgress />}
        </Box>
      )}
    </>
  );
};
