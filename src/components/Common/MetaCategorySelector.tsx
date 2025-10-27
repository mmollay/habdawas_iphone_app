import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormHelperText,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material';
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
import { MetaCategoryType, META_CATEGORY_TYPE_LABELS } from '../../types/metaCategories';
import { useMetaCategories } from '../../hooks/useMetaCategories';

interface MetaCategorySelectorProps {
  type: MetaCategoryType;
  value: string[];  // Selected meta-category IDs
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
}

/**
 * Get icon component for meta-category slug
 */
const getIcon = (slug: string, size: number = 18): React.ReactNode => {
  const iconProps = { size, style: { flexShrink: 0 } };

  const iconMap: Record<string, React.ReactNode> = {
    'leaf': <Leaf {...iconProps} />,
    'sprout': <Sprout {...iconProps} />,
    'recycle': <Recycle {...iconProps} />,
    'arrow-up-circle': <ArrowUpCircle {...iconProps} />,
    'sparkles': <Sparkles {...iconProps} />,
    'star': <Star {...iconProps} />,
    'thumbs-up': <ThumbsUp {...iconProps} />,
    'package': <Package {...iconProps} />,
    'alert-circle': <AlertCircle {...iconProps} />,
    'user': <User {...iconProps} />,
    'briefcase': <Briefcase {...iconProps} />,
    'store': <Store {...iconProps} />,
    'factory': <Factory {...iconProps} />,
  };

  return iconMap[slug] || null;
};

/**
 * Meta-Category Selector Component
 * Allows selection of meta-categories with toggle buttons
 */
const MetaCategorySelector: React.FC<MetaCategorySelectorProps> = ({
  type,
  value,
  onChange,
  multiple = false,
  disabled = false,
  label,
  helperText,
  orientation = 'horizontal',
  fullWidth = false,
}) => {
  const { getByType, loading } = useMetaCategories();
  const metaCategories = getByType(type);

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: string | string[] | null
  ) => {
    if (newValue === null) {
      onChange([]);
    } else if (Array.isArray(newValue)) {
      onChange(newValue);
    } else {
      onChange([newValue]);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Lädt...
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} disabled={disabled}>
      {label && (
        <FormLabel
          sx={{
            mb: 1.5,
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '0.9375rem',
          }}
        >
          {label || META_CATEGORY_TYPE_LABELS[type]}
        </FormLabel>
      )}

      <ToggleButtonGroup
        value={multiple ? value : value[0] || null}
        onChange={handleChange}
        exclusive={!multiple}
        aria-label={META_CATEGORY_TYPE_LABELS[type]}
        orientation={orientation}
        sx={{
          flexWrap: 'wrap',
          gap: 1,
          '& .MuiToggleButtonGroup-grouped': {
            margin: 0,
            border: '1px solid',
            borderColor: 'divider',
            '&:not(:first-of-type)': {
              borderLeft: '1px solid',
              borderLeftColor: 'divider',
            },
          },
        }}
      >
        {metaCategories.map((mc) => {
          const name = mc.translations?.de?.name || mc.slug;
          const description = mc.translations?.de?.description;
          const icon = mc.icon ? getIcon(mc.icon, 18) : null;

          const button = (
            <ToggleButton
              key={mc.id}
              value={mc.id}
              aria-label={name}
              sx={{
                px: 2,
                py: 1,
                borderRadius: '8px !important',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                gap: 1,
                '&.Mui-selected': {
                  backgroundColor: mc.color,
                  color: '#ffffff',
                  borderColor: mc.color,
                  '&:hover': {
                    backgroundColor: mc.color,
                    filter: 'brightness(0.9)',
                  },
                },
                '&:not(.Mui-selected)': {
                  color: mc.color,
                  borderColor: mc.color,
                  '&:hover': {
                    backgroundColor: `${mc.color}10`,
                    borderColor: mc.color,
                  },
                },
              }}
            >
              {icon && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {icon}
                </Box>
              )}
              {name}
            </ToggleButton>
          );

          // Wrap with tooltip if description exists
          if (description) {
            return (
              <Tooltip key={mc.id} title={description} arrow placement="top">
                {button}
              </Tooltip>
            );
          }

          return button;
        })}
      </ToggleButtonGroup>

      {helperText && (
        <FormHelperText sx={{ mt: 1 }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default MetaCategorySelector;
