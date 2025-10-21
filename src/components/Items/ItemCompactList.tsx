import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Heart, MapPin, MoreVertical, Eye, Package, Truck } from 'lucide-react';
import { Item } from '../../lib/supabase';
import { getRelativeTimeString } from '../../utils/dateUtils';
import { getThumbnailUrl } from '../../utils/imageUtils';
import { getConditionLabel } from '../../utils/translations';
import { LazyImage } from '../Common/LazyImage';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { ItemMenu } from './ItemMenu';

interface ItemCompactListProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  allItems?: Item[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  isOwnItem?: boolean;
  onItemUpdated?: () => void;
}

export const ItemCompactList = ({ items, onItemClick, allItems, onLoadMore, hasMore, loadingMore, isOwnItem = false, onItemUpdated }: ItemCompactListProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const menuOpen = Boolean(anchorEl);

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

  const handleFavoriteClick = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    await toggleFavorite(itemId);
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>, itemId: string) => {
    e.stopPropagation();
    setSelectedItemId(itemId);
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#4caf50';
      case 'draft': return '#9e9e9e';
      case 'paused': return '#ff9800';
      case 'sold': return '#2196f3';
      case 'archived': return '#757575';
      case 'expired': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Entwurf',
      published: 'Live',
      paused: 'Pausiert',
      sold: 'Verkauft',
      archived: 'Archiviert',
      expired: 'Abgelaufen'
    };
    return labels[status] || status;
  };

  const handleCardClick = (item: Item) => {
    if (onItemClick) {
      onItemClick(item);
    } else if (allItems) {
      sessionStorage.setItem('returnSearch', location.search);
      navigate(`/item/${item.id}${window.location.search}`, { state: { allItems } });
    } else {
      navigate(`/item/${item.id}${window.location.search}`);
    }
  };

  const selectedItem = items.find(i => i.id === selectedItemId);

  return (
    <>
      <Box>
        {items.map((item, index) => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              gap: 2,
              py: 2,
              px: 1,
              cursor: 'pointer',
              borderBottom: index < items.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              transition: 'background-color 0.2s',
              '&:active': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
            onClick={() => handleCardClick(item)}
          >
            <Box sx={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              <LazyImage
                src={getThumbnailUrl(item.image_url)}
                alt={item.title}
                width={120}
                height={120}
                objectFit="cover"
                borderRadius="8px"
                sx={{
                  opacity: isOwnItem && (item.status === 'paused' || item.status === 'expired' || item.status === 'sold' || item.status === 'archived') ? 0.6 : 1,
                  filter: isOwnItem && item.status === 'sold' ? 'grayscale(80%)' : 'none',
                }}
              />

              {isOwnItem && (
                <Chip
                  label={getStatusLabel(item.status)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    bgcolor: getStatusColor(item.status),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              )}

              {item.condition && (
                <Chip
                  label={getConditionLabel(item.condition)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 6,
                    left: 6,
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              )}

              {item.status === 'sold' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-15deg)',
                    bgcolor: 'rgba(33, 150, 243, 0.95)',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  VERKAUFT
                </Box>
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    flex: 1,
                  }}
                >
                  {item.title}
                </Typography>

                {isOwnItem ? (
                  <IconButton
                    size="small"
                    sx={{
                      p: 0.5,
                      mt: -0.5,
                      flexShrink: 0,
                    }}
                    onClick={(e) => handleMenuClick(e, item.id)}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                ) : (
                  <IconButton
                    size="small"
                    sx={{
                      p: 0.5,
                      mt: -0.5,
                      color: isFavorite(item.id) ? 'error.main' : 'text.secondary',
                      flexShrink: 0,
                    }}
                    onClick={(e) => handleFavoriteClick(e, item.id)}
                  >
                    <Heart size={18} fill={isFavorite(item.id) ? 'currentColor' : 'none'} />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  variant="h6"
                  color="primary"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  {item.is_free ? 'Gratis' : item.price_on_request ? 'Auf Anfrage' : `${item.price.toFixed(2)} €`}
                </Typography>
                {item.price_negotiable && !item.is_free && !item.price_on_request && (
                  <Chip
                    label="VB"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: 'warning.main',
                      color: 'white',
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minHeight: 20 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                  {(item.postal_code || item.location) && (
                    <>
                      <MapPin size={14} color="#666" style={{ flexShrink: 0 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.postal_code && item.location
                          ? `${item.postal_code} ${item.location}`
                          : item.postal_code || item.location}
                      </Typography>
                    </>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {getRelativeTimeString(item.created_at)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', overflow: 'hidden' }}>
                {item.category && (
                  <Chip
                    label={item.category}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      '& .MuiChip-label': { px: 0.75 }
                    }}
                  />
                )}
                {item.brand && (
                  <Chip
                    label={item.brand}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      '& .MuiChip-label': { px: 0.75 }
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {isOwnItem && item.view_count !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: 'grey.100', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
                      <Eye size={12} color="#666" />
                      <Typography variant="caption" color="text.secondary" fontWeight={500} fontSize="0.7rem">
                        {item.view_count}
                      </Typography>
                    </Box>
                  )}
                  {(item.shipping_enabled || item.pickup_enabled) && (
                    <>
                      {item.pickup_enabled && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: '#e8f5e9', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
                          <Package size={12} color="#2e7d32" />
                        </Box>
                      )}
                      {item.shipping_enabled && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: '#e3f2fd', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
                          <Truck size={12} color="#1976d2" />
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {hasMore && (
        <Box ref={observerTarget} sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          {loadingMore && <CircularProgress />}
        </Box>
      )}

      {isOwnItem && selectedItem && (
        <ItemMenu
          item={selectedItem}
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          onEdit={() => handleCardClick(selectedItem)}
          onItemUpdated={onItemUpdated}
        />
      )}
    </>
  );
};
