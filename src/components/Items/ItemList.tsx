import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Button,
  Checkbox,
} from '@mui/material';
import { Heart, MapPin, Package, Truck, MoreVertical } from 'lucide-react';
import { Item, supabase } from '../../lib/supabase';
import { getRelativeTimeString } from '../../utils/dateUtils';
import { getThumbnailUrl } from '../../utils/imageUtils';
import { getConditionLabel } from '../../utils/translations';
import { LazyImage } from '../Common/LazyImage';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { ItemMenu } from './ItemMenu';

interface ItemListProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  sellerProfiles?: Record<string, { shipping_enabled: boolean; pickup_enabled: boolean }>;
  allItems?: Item[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  isOwnItem?: boolean;
  onItemUpdated?: (itemId?: string) => void;
  isSelectionMode?: boolean;
  selectedItemIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export const ItemList = ({ items, onItemClick, sellerProfiles, allItems, onLoadMore, hasMore, loadingMore, isOwnItem = false, onItemUpdated, isSelectionMode = false, selectedItemIds = new Set(), onToggleSelect }: ItemListProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const menuOpen = Boolean(anchorEl);

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
    // In selection mode, toggle selection instead of navigating
    if (isSelectionMode && isOwnItem && onToggleSelect) {
      onToggleSelect(item.id);
      return;
    }

    if (onItemClick) {
      onItemClick(item);
    } else if (allItems) {
      sessionStorage.setItem('returnSearch', location.search);
      navigate(`/item/${item.id}${window.location.search}`, { state: { allItems } });
    } else {
      navigate(`/item/${item.id}${window.location.search}`);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(itemId);
    }
  };

  const selectedItem = items.find(i => i.id === selectedItemId);

  return (
    <>
      <Stack spacing={{ xs: 1, sm: 2 }}>
        {items.map((item) => (
        <Card
          key={item.id}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateX(8px)',
              boxShadow: 4,
            },
          }}
          onClick={() => handleCardClick(item)}
        >
          <Box sx={{ display: 'flex', height: { xs: 130, sm: 180, md: 200 } }}>
            <Box sx={{ position: 'relative', width: { xs: 110, sm: 180, md: 240 }, flexShrink: 0, height: { xs: 130, sm: 180, md: 200 } }}>
              <LazyImage
                src={getThumbnailUrl(item.image_url)}
                alt={item.title}
                width={240}
                height={200}
                objectFit="cover"
                borderRadius={{ xs: "6px 0 0 6px", md: "8px 0 0 8px" }}
                sx={{
                  opacity: isOwnItem && (item.status === 'paused' || item.status === 'expired' || item.status === 'sold' || item.status === 'archived') ? 0.5 : 1,
                  filter: isOwnItem && item.status === 'sold' ? 'grayscale(80%)' : 'none',
                }}
              />

              {/* Checkbox for selection mode */}
              {isSelectionMode && isOwnItem && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: { xs: 4, sm: 6, md: 8 },
                    left: { xs: 4, sm: 6, md: 8 },
                    zIndex: 10,
                  }}
                  onClick={(e) => handleCheckboxClick(e, item.id)}
                >
                  <Checkbox
                    checked={selectedItemIds.has(item.id)}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 1)',
                      },
                      padding: '4px',
                    }}
                  />
                </Box>
              )}

              {isOwnItem && !isSelectionMode ? (
                <>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: { xs: 4, sm: 6, md: 8 },
                      right: { xs: 4, sm: 6, md: 8 },
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 1)',
                        transform: 'scale(1.1)',
                      },
                      width: { xs: 28, sm: 32, md: 36 },
                      height: { xs: 28, sm: 32, md: 36 },
                      transition: 'all 0.2s',
                    }}
                    onClick={(e) => handleMenuClick(e, item.id)}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                  <Chip
                    label={getStatusLabel(item.status)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: { xs: 4, sm: 6, md: 8 },
                      left: { xs: 4, sm: 6, md: 8 },
                      bgcolor: getStatusColor(item.status),
                      color: 'white',
                      fontWeight: 600,
                      height: { xs: 20, sm: 22, md: 24 },
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } },
                    }}
                  />
                  {item.status === 'sold' && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-15deg)',
                        bgcolor: 'rgba(33, 150, 243, 0.95)',
                        color: 'white',
                        px: 3,
                        py: 1,
                        borderRadius: 1,
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      VERKAUFT
                    </Box>
                  )}
                </>
              ) : !isOwnItem ? (
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: { xs: 4, sm: 6, md: 8 },
                    right: { xs: 4, sm: 6, md: 8 },
                    bgcolor: isFavorite(item.id) ? 'rgba(255, 82, 82, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                    color: isFavorite(item.id) ? 'white' : 'inherit',
                    '&:hover': {
                      bgcolor: isFavorite(item.id) ? 'rgba(255, 82, 82, 1)' : 'rgba(255, 255, 255, 1)',
                      transform: 'scale(1.1)',
                    },
                    width: { xs: 28, sm: 32, md: 36 },
                    height: { xs: 28, sm: 32, md: 36 },
                    transition: 'all 0.2s',
                  }}
                  onClick={(e) => handleFavoriteClick(e, item.id)}
                >
                  <Heart size={18} fill={isFavorite(item.id) ? 'white' : 'none'} />
                </IconButton>
              ) : null}

              {isOwnItem && isSelectionMode && (
                <Chip
                  label={getStatusLabel(item.status)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: { xs: 44, sm: 48, md: 52 },
                    left: { xs: 4, sm: 6, md: 8 },
                    bgcolor: getStatusColor(item.status),
                    color: 'white',
                    fontWeight: 600,
                    height: { xs: 20, sm: 22, md: 24 },
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } },
                  }}
                />
              )}
              {item.condition && (
                <Chip
                  label={getConditionLabel(item.condition)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: { xs: 4, sm: 6, md: 8 },
                    left: { xs: 4, sm: 6, md: 8 },
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 600,
                    height: { xs: 20, sm: 22, md: 24 },
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } },
                  }}
                />
              )}
            </Box>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: { xs: 1, sm: 2, md: 2.5 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: { xs: 0.5, sm: 1, md: 1.5 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }, lineHeight: 1.3 }}>
                  {item.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 1, sm: 1.5, md: 2 }, flexShrink: 0 }}>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } }}
                  >
                    {item.is_free ? 'Zu verschenken' : `${item.price.toFixed(2)} €`}
                  </Typography>
                  {item.price_negotiable && !item.is_free && (
                    <Chip
                      label="VB"
                      size="small"
                      sx={{ ml: 1, height: 24, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'warning.main', color: 'white' }}
                    />
                  )}
                </Box>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: { xs: 'none', sm: '-webkit-box' },
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  mb: { xs: 0, sm: 1, md: 2 },
                  lineHeight: 1.4,
                  flex: '0 0 auto',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                }}
              >
                {item.description}
              </Typography>

              <Box sx={{ mt: { xs: 0.5, sm: 'auto' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 0.5, sm: 0.75, md: 1 }, minHeight: { xs: 20, sm: 22 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, flex: 1, minWidth: 0 }}>
                    {(item.postal_code || item.location) && (
                      <>
                        <MapPin size={14} color="#666" style={{ flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.postal_code && item.location
                            ? `${item.postal_code} ${item.location}`
                            : item.postal_code || item.location}
                        </Typography>
                      </>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, whiteSpace: 'nowrap', ml: 1 }}>
                    {getRelativeTimeString(item.created_at)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 0.4, sm: 0.5 }, flexWrap: 'nowrap', overflow: 'hidden' }}>
                  {item.category && (
                    <Chip
                      label={item.category}
                      size="small"
                      sx={{
                        height: { xs: 18, sm: 24 },
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } }
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
                        height: { xs: 18, sm: 24 },
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } }
                      }}
                    />
                  )}
                  {sellerProfiles?.[item.user_id] && (sellerProfiles[item.user_id].shipping_enabled || sellerProfiles[item.user_id].pickup_enabled) && (
                    <>
                      {sellerProfiles[item.user_id].pickup_enabled && (
                        <Chip
                          icon={<Package size={12} />}
                          label="Abholung"
                          size="small"
                          sx={{
                            bgcolor: '#e8f5e9',
                            color: '#2e7d32',
                            height: { xs: 18, sm: 24 },
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            '& .MuiChip-icon': { color: '#2e7d32', marginLeft: '4px' },
                            '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } },
                            display: { xs: 'none', sm: 'inline-flex' }
                          }}
                        />
                      )}
                      {sellerProfiles[item.user_id].shipping_enabled && (
                        <Chip
                          icon={<Truck size={12} />}
                          label="Versand"
                          size="small"
                          sx={{
                            bgcolor: '#e3f2fd',
                            color: '#1976d2',
                            height: { xs: 18, sm: 24 },
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            '& .MuiChip-icon': { color: '#1976d2', marginLeft: '4px' },
                            '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } },
                            display: { xs: 'none', sm: 'inline-flex' }
                          }}
                        />
                      )}
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Box>
        </Card>
        ))}
      </Stack>

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
