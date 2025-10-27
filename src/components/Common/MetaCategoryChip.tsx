import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import {
  Leaf,
  Sprout,
  Recycle,
  ArrowUpCircle,
  Sparkles,
  Star,
  ThumbsUp,
  Package,
  AlertCircle,
  User,
  Briefcase,
  Store,
  Factory,
} from 'lucide-react';
import { MetaCategory, getMetaCategoryName, getMetaCategoryDescription } from '../../types/metaCategories';

interface MetaCategoryChipProps {
  metaCategory: MetaCategory;
  size?: 'small' | 'medium';
  onDelete?: () => void;
  onClick?: () => void;
  variant?: 'filled' | 'outlined';
  showIcon?: boolean;
}

/**
 * Get icon component for meta-category
 */
const getMetaCategoryIcon = (slug: string, size: number = 16): React.ReactNode => {
  const iconProps = { size, style: { flexShrink: 0 } };

  const iconMap: Record<string, React.ReactNode> = {
    // Sustainability
    'leaf': <Leaf {...iconProps} />,
    'sprout': <Sprout {...iconProps} />,
    'recycle': <Recycle {...iconProps} />,
    'arrow-up-circle': <ArrowUpCircle {...iconProps} />,

    // Condition
    'sparkles': <Sparkles {...iconProps} />,
    'star': <Star {...iconProps} />,
    'thumbs-up': <ThumbsUp {...iconProps} />,
    'package': <Package {...iconProps} />,
    'alert-circle': <AlertCircle {...iconProps} />,

    // Seller Type
    'user': <User {...iconProps} />,
    'briefcase': <Briefcase {...iconProps} />,
    'store': <Store {...iconProps} />,
    'factory': <Factory {...iconProps} />,
  };

  return iconMap[slug] || null;
};

/**
 * Meta-Category Chip Component
 * Displays a meta-category as a colored chip with icon
 */
const MetaCategoryChip: React.FC<MetaCategoryChipProps> = ({
  metaCategory,
  size = 'small',
  onDelete,
  onClick,
  variant = 'filled',
  showIcon = true,
}) => {
  const name = getMetaCategoryName(metaCategory, 'de');
  const description = getMetaCategoryDescription(metaCategory, 'de');
  const icon = showIcon && metaCategory.icon ? getMetaCategoryIcon(metaCategory.icon, size === 'small' ? 14 : 16) : undefined;

  const chip = (
    <Chip
      label={name}
      icon={icon ? <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span> : undefined}
      size={size}
      variant={variant}
      onDelete={onDelete}
      onClick={onClick}
      sx={{
        backgroundColor: variant === 'filled' ? metaCategory.color : 'transparent',
        color: variant === 'filled' ? '#ffffff' : metaCategory.color,
        borderColor: variant === 'outlined' ? metaCategory.color : undefined,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.8125rem',
        height: size === 'small' ? 24 : 32,
        '& .MuiChip-icon': {
          marginLeft: '8px',
          color: variant === 'filled' ? '#ffffff' : metaCategory.color,
        },
        '& .MuiChip-deleteIcon': {
          color: variant === 'filled' ? 'rgba(255, 255, 255, 0.7)' : metaCategory.color,
          '&:hover': {
            color: variant === 'filled' ? '#ffffff' : metaCategory.color,
          },
        },
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          backgroundColor: variant === 'filled' ? metaCategory.color : 'rgba(0, 0, 0, 0.04)',
          filter: variant === 'filled' ? 'brightness(0.9)' : undefined,
        } : {},
      }}
    />
  );

  // Wrap with tooltip if description exists
  if (description) {
    return (
      <Tooltip title={description} arrow placement="top">
        {chip}
      </Tooltip>
    );
  }

  return chip;
};

export default MetaCategoryChip;
