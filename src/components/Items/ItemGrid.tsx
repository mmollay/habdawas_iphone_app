import { Box, CircularProgress, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
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

      {/* Load More Button */}
      {hasMore && !loadingMore && items.length > 0 && onLoadMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              fontSize: '0.9375rem',
            }}
          >
            Mehr laden
          </Button>
        </Box>
      )}

      {/* Loading Indicator */}
      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      )}
    </>
  );
};
