import { useNavigate } from 'react-router-dom';
import { memo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Checkbox,
} from '@mui/material';
import { Heart, MapPin, Package, Truck, MoreVertical, Eye } from 'lucide-react';
import { Item, supabase } from '../../lib/supabase';
import { getRelativeTimeString } from '../../utils/dateUtils';
import { getThumbnailUrl } from '../../utils/imageUtils';
import { getConditionLabel } from '../../utils/translations';
import { LazyImage } from '../Common/LazyImage';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { ItemMenu } from './ItemMenu';

interface ItemCardProps {
  item: Item;
  onClick?: (item: Item) => void;
  shippingEnabled?: boolean;
  pickupEnabled?: boolean;
  isOwnItem?: boolean;
  onItemUpdated?: (itemId?: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const ItemCardComponent = ({ item, onClick, shippingEnabled, pickupEnabled, isOwnItem = false, onItemUpdated, isSelectionMode = false, isSelected = false, onToggleSelect }: ItemCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const favorite = isFavorite(item.id);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const menuOpen = Boolean(anchorEl);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(item.id);
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
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

  const handleCardClick = () => {
    // In selection mode, toggle selection instead of navigating
    if (isSelectionMode && isOwnItem && onToggleSelect) {
      onToggleSelect(item.id);
      return;
    }

    if (onClick) {
      onClick(item);
    } else {
      navigate(`/item/${item.id}${window.location.search}`);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(item.id);
    }
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
      onClick={handleCardClick}
    >
      <Box sx={{ position: 'relative' }}>
        <LazyImage
          src={getThumbnailUrl(item.image_url)}
          alt={item.title}
          height={200}
          objectFit="cover"
          sx={{
            aspectRatio: '1 / 1',
            opacity: isOwnItem && (item.status === 'paused' || item.status === 'expired' || item.status === 'sold' || item.status === 'archived') ? 0.5 : 1,
            filter: isOwnItem && item.status === 'sold' ? 'grayscale(80%)' : 'none',
          }}
        />

        {/* Checkbox for selection mode */}
        {isSelectionMode && isOwnItem && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 10,
            }}
            onClick={handleCheckboxClick}
          >
            <Checkbox
              checked={isSelected}
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
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 1)',
                transform: 'scale(1.1)',
              },
              width: 32,
              height: 32,
              transition: 'all 0.2s',
            }}
            onClick={handleMenuClick}
          >
            <MoreVertical size={18} />
          </IconButton>
        ) : !isOwnItem ? (
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: favorite ? 'rgba(255, 82, 82, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              color: favorite ? 'white' : 'inherit',
              '&:hover': {
                bgcolor: favorite ? 'rgba(255, 82, 82, 1)' : 'rgba(255, 255, 255, 1)',
                transform: 'scale(1.1)',
              },
              width: 32,
              height: 32,
              transition: 'all 0.2s',
            }}
            onClick={handleFavoriteClick}
          >
            <Heart size={18} fill={favorite ? 'white' : 'none'} />
          </IconButton>
        ) : null}
        {isOwnItem && (
          <>
            <Chip
              label={getStatusLabel(item.status)}
              size="small"
              sx={{
                position: 'absolute',
                top: isSelectionMode ? 48 : 8,
                left: 8,
                bgcolor: getStatusColor(item.status),
                color: 'white',
                fontWeight: 600,
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
        )}
        {item.condition && (
          <Chip
            label={getConditionLabel(item.condition)}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
            }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1.5 }}>
        <Typography variant="body1" component="div" noWrap fontWeight={600} fontSize="0.95rem">
          {item.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.5 }}>
          <Typography variant="body2" color="primary.main" fontWeight="bold" fontSize="1rem">
            {item.is_free ? 'Gratis' : item.price_on_request ? 'Auf Anfrage' : `${item.price.toFixed(2)} €`}
          </Typography>
          {item.price_negotiable && !item.is_free && !item.price_on_request && (
            <Chip
              label="VB"
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'warning.main', color: 'white' }}
            />
          )}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.5em',
            mt: 0.5,
            mb: 1,
            fontSize: '0.8rem',
            lineHeight: 1.4,
          }}
        >
          {item.description}
        </Typography>
        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
              {(item.postal_code || item.location) && (
                <>
                  <MapPin size={14} color="#666" style={{ flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.postal_code && item.location
                      ? `${item.postal_code} ${item.location}`
                      : item.postal_code || item.location}
                  </Typography>
                </>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 1 }}>
              {getRelativeTimeString(item.created_at)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'nowrap' }}>
            {isOwnItem && item.view_count !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: 'grey.100', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
                <Eye size={12} color="#666" />
                <Typography variant="caption" color="text.secondary" fontWeight={500} fontSize="0.7rem">
                  {item.view_count}
                </Typography>
              </Box>
            )}
            {(shippingEnabled || pickupEnabled) && (
              <>
                {pickupEnabled && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: '#e8f5e9', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
                    <Package size={12} color="#2e7d32" />
                  </Box>
                )}
                {shippingEnabled && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: '#e3f2fd', px: 0.5, py: 0.25, borderRadius: 0.5 }}>
                    <Truck size={12} color="#1976d2" />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </CardContent>

      {isOwnItem && (
        <ItemMenu
          item={item}
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          onEdit={handleCardClick}
          onItemUpdated={onItemUpdated}
        />
      )}
    </Card>
  );
};

export const ItemCard = memo(ItemCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.image_url === nextProps.item.image_url &&
    prevProps.shippingEnabled === nextProps.shippingEnabled &&
    prevProps.pickupEnabled === nextProps.pickupEnabled &&
    prevProps.isOwnItem === nextProps.isOwnItem &&
    prevProps.isSelectionMode === nextProps.isSelectionMode &&
    prevProps.isSelected === nextProps.isSelected
  );
});
