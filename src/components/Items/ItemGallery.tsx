import { useNavigate } from 'react-router-dom';
import { memo, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Checkbox,
} from '@mui/material';
import { Heart, MoreVertical, Clock } from 'lucide-react';
import { Item } from '../../lib/supabase';
import { getThumbnailUrl } from '../../utils/imageUtils';
import { getConditionLabel } from '../../utils/translations';
import { getRelativeTimeString } from '../../utils/dateUtils';
import { LazyImage } from '../Common/LazyImage';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { ItemMenu } from './ItemMenu';

interface ItemGalleryProps {
  item: Item;
  onClick?: (item: Item) => void;
  isOwnItem?: boolean;
  onItemUpdated?: (itemId?: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const ItemGalleryComponent = ({ item, onClick, isOwnItem = false, onItemUpdated, isSelectionMode = false, isSelected = false, onToggleSelect }: ItemGalleryProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const favorite = isFavorite(item.id);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

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
    <Box
      sx={{
        cursor: 'pointer',
        position: 'relative',
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 4,
        },
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
        <LazyImage
          src={getThumbnailUrl(item.image_url)}
          alt={item.title}
          height={300}
          objectFit="cover"
          sx={{
            width: '100%',
            height: '100%',
            opacity: isOwnItem && (item.status === 'paused' || item.status === 'expired' || item.status === 'sold' || item.status === 'archived') ? 0.6 : 1,
            filter: isOwnItem && item.status === 'sold' ? 'grayscale(60%)' : 'none',
          }}
        />

        {/* Checkbox for selection mode */}
        {isSelectionMode && isOwnItem && (
          <Box
            sx={{
              position: 'absolute',
              top: 6,
              left: 6,
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

        {isOwnItem && !isSelectionMode && (
          <IconButton
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 1)',
                transform: 'scale(1.1)',
              },
              width: 28,
              height: 28,
              transition: 'all 0.2s',
            }}
            onClick={handleMenuClick}
          >
            <MoreVertical size={16} />
          </IconButton>
        )}
        {!isOwnItem && (
          <IconButton
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              bgcolor: favorite ? 'rgba(255, 82, 82, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              color: favorite ? 'white' : 'inherit',
              '&:hover': {
                bgcolor: favorite ? 'rgba(255, 82, 82, 1)' : 'rgba(255, 255, 255, 1)',
                transform: 'scale(1.1)',
              },
              width: 28,
              height: 28,
              transition: 'all 0.2s',
            }}
            onClick={handleFavoriteClick}
          >
            <Heart size={16} fill={favorite ? 'white' : 'none'} />
          </IconButton>
        )}

        {isOwnItem && (
          <>
            <Chip
              label={getStatusLabel(item.status)}
              size="small"
              sx={{
                position: 'absolute',
                top: isSelectionMode ? 46 : 6,
                left: 6,
                bgcolor: getStatusColor(item.status),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
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
                  px: 2,
                  py: 0.75,
                  borderRadius: 1,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  border: '2px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                VERKAUFT
              </Box>
            )}
          </>
        )}

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
            p: 1,
            transition: 'opacity 0.2s',
            opacity: isHovered ? 1 : 0.9,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'white',
              display: 'block',
              fontSize: '0.75rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 0.25,
            }}
          >
            {item.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {item.is_free ? 'Zu verschenken' : `${item.price.toFixed(2)} €`}
            </Typography>
            {item.price_negotiable && !item.is_free && (
              <Chip
                label="VB"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: 'warning.main',
                  color: 'white'
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Clock size={11} color="rgba(255, 255, 255, 0.9)" />
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.7rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {getRelativeTimeString(item.created_at)}
            </Typography>
          </Box>
        </Box>

        {item.condition && (
          <Chip
            label={getConditionLabel(item.condition)}
            size="small"
            sx={{
              position: 'absolute',
              top: isOwnItem ? (isSelectionMode ? 78 : 38) : 6,
              left: 6,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
            }}
          />
        )}
      </Box>

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
    </Box>
  );
};

export const ItemGallery = memo(ItemGalleryComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.image_url === nextProps.item.image_url &&
    prevProps.isOwnItem === nextProps.isOwnItem &&
    prevProps.isSelectionMode === nextProps.isSelectionMode &&
    prevProps.isSelected === nextProps.isSelected
  );
});
