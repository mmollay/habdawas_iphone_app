import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  Typography,
  Button,
  Slider,
  IconButton,
  Badge,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Chip,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  X,
  SlidersHorizontal,
  Check,
  Hammer,
  Scissors,
  TreePine,
  Disc,
  Sparkles,
  ShoppingBag,
  Feather,
  Wine,
  Package,
  Mountain,
  FileText,
  Hexagon,
  Leaf,
  CircleDot,
  Crown,
  Clock,
  Square,
  Star,
  Zap,
  Home,
  Tag
} from 'lucide-react';
import { getConditionLabel } from '../../utils/translations';
import { supabase } from '../../lib/supabase';

export interface SelectedFilters {
  [key: string]: (string | number)[] | number | [number, number];
  priceRange?: [number, number];
  radius?: number;
}

interface AdvancedFilterSidebarProps {
  open: boolean;
  onClose: () => void;
  onFilterChange: (filters: SelectedFilters) => void;
  selectedFilters: SelectedFilters;
  totalItems?: number;
  categoryId?: string; // Für kategorie-spezifische Filter
}

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterCounts {
  brands: FilterOption[];
  colors: FilterOption[];
  conditions: FilterOption[];
  materials: FilterOption[];
  styles: FilterOption[];
  vehicleFuelTypes: FilterOption[];
  vehicleColors: FilterOption[];
}

// Statische Filter-Definitionen mit Icons
const CONDITIONS = [
  { value: 'new', label: 'Neu', icon: '✨' },
  { value: 'like_new', label: 'Wie neu', icon: '🌟' },
  { value: 'very_good', label: 'Sehr gut', icon: '💫' },
  { value: 'good', label: 'Gut', icon: '👍' },
  { value: 'acceptable', label: 'Akzeptabel', icon: '👌' },
];

const FUEL_TYPES = [
  { value: 'benzin', label: 'Benzin' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'elektro', label: 'Elektro' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'gas', label: 'Gas (LPG/CNG)' },
];

export const AdvancedFilterSidebar = ({
  open,
  onClose,
  onFilterChange,
  selectedFilters,
  totalItems = 0,
  categoryId,
}: AdvancedFilterSidebarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [localFilters, setLocalFilters] = useState<SelectedFilters>(selectedFilters);
  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    brands: [],
    colors: [],
    conditions: [],
    materials: [],
    styles: [],
    vehicleFuelTypes: [],
    vehicleColors: [],
  });
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [isVehicleCategory, setIsVehicleCategory] = useState(false);
  const [filteredItemCount, setFilteredItemCount] = useState<number>(totalItems);
  const [countDebounceTimeout, setCountDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Sync local filters with external filters
  useEffect(() => {
    setLocalFilters(selectedFilters);
  }, [selectedFilters]);

  // Check if category is vehicle-related
  useEffect(() => {
    const checkVehicleCategory = async () => {
      if (!categoryId) {
        setIsVehicleCategory(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('slug, parent_id, level')
          .eq('id', categoryId)
          .single();

        if (error) throw error;

        // Check if slug contains vehicle-related terms or is under Fahrzeuge category
        const vehicleTerms = ['auto', 'fahrzeug', 'motorrad', 'roller', 'fahrrad'];
        const isVehicle = vehicleTerms.some(term =>
          data?.slug?.toLowerCase().includes(term)
        );

        setIsVehicleCategory(isVehicle);
      } catch (err) {
        console.error('Error checking category:', err);
        setIsVehicleCategory(false);
      }
    };

    checkVehicleCategory();
  }, [categoryId]);

  // Calculate filtered item count based on local filters with debouncing
  useEffect(() => {
    const countFilteredItems = async () => {
      if (!open) return;

      try {
        let query = supabase
          .from('items')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published');

        // Apply category filter
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        // Apply price range
        if (localFilters.priceRange) {
          query = query
            .gte('price', localFilters.priceRange[0])
            .lte('price', localFilters.priceRange[1]);
        }

        // Apply brand filter
        if (localFilters.brand && (localFilters.brand as string[]).length > 0) {
          query = query.in('brand', localFilters.brand as string[]);
        }

        // Apply condition filter
        if (localFilters.condition && (localFilters.condition as string[]).length > 0) {
          query = query.in('condition', localFilters.condition as string[]);
        }

        // Apply material filter
        if (localFilters.material && (localFilters.material as string[]).length > 0) {
          query = query.in('material', localFilters.material as string[]);
        }

        // Apply style filter
        if (localFilters.style && (localFilters.style as string[]).length > 0) {
          query = query.in('style', localFilters.style as string[]);
        }

        // Apply colors filter (array contains)
        if (localFilters.colors && (localFilters.colors as string[]).length > 0) {
          query = query.overlaps('colors', localFilters.colors as string[]);
        }

        // Apply vehicle-specific filters
        if (localFilters.vehicle_fuel_type && (localFilters.vehicle_fuel_type as string[]).length > 0) {
          query = query.in('vehicle_fuel_type', localFilters.vehicle_fuel_type as string[]);
        }

        if (localFilters.vehicle_color && (localFilters.vehicle_color as string[]).length > 0) {
          query = query.in('vehicle_color', localFilters.vehicle_color as string[]);
        }

        const { count } = await query;
        setFilteredItemCount(count || 0);
      } catch (err) {
        console.error('Error counting filtered items:', err);
        setFilteredItemCount(totalItems);
      }
    };

    // Debounce the count calculation
    if (countDebounceTimeout) {
      clearTimeout(countDebounceTimeout);
    }

    const timeout = setTimeout(() => {
      countFilteredItems();
    }, 300);

    setCountDebounceTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [open, localFilters, categoryId, totalItems]);

  // Load filter counts from database (excluding price range for stability)
  useEffect(() => {
    const loadFilterCounts = async () => {
      if (!open) return;

      setLoadingCounts(true);
      try {
        // Build query based on category only (not price, to prevent reload on price changes)
        let query = supabase
          .from('items')
          .select('brand, colors, condition, material, style, vehicle_fuel_type, vehicle_color')
          .eq('status', 'published');

        // Apply category filter if present
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        // Note: We intentionally don't filter by price here to show all available options
        // The filtered count at the bottom will reflect the price range

        const { data, error } = await query;
        if (error) throw error;

        // Count occurrences
        const brandCounts: Record<string, number> = {};
        const colorCounts: Record<string, number> = {};
        const conditionCounts: Record<string, number> = {};
        const materialCounts: Record<string, number> = {};
        const styleCounts: Record<string, number> = {};
        const fuelTypeCounts: Record<string, number> = {};
        const vehicleColorCounts: Record<string, number> = {};

        data?.forEach(item => {
          // Brands
          if (item.brand) {
            brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
          }

          // Colors (array)
          if (Array.isArray(item.colors)) {
            item.colors.forEach(color => {
              if (color) {
                colorCounts[color] = (colorCounts[color] || 0) + 1;
              }
            });
          }

          // Condition
          if (item.condition) {
            conditionCounts[item.condition] = (conditionCounts[item.condition] || 0) + 1;
          }

          // Material
          if (item.material) {
            materialCounts[item.material] = (materialCounts[item.material] || 0) + 1;
          }

          // Style
          if (item.style) {
            styleCounts[item.style] = (styleCounts[item.style] || 0) + 1;
          }

          // Vehicle-specific
          if (item.vehicle_fuel_type) {
            fuelTypeCounts[item.vehicle_fuel_type] = (fuelTypeCounts[item.vehicle_fuel_type] || 0) + 1;
          }
          if (item.vehicle_color) {
            vehicleColorCounts[item.vehicle_color] = (vehicleColorCounts[item.vehicle_color] || 0) + 1;
          }
        });

        // Convert to FilterOption arrays and sort by count
        const toOptions = (counts: Record<string, number>): FilterOption[] =>
          Object.entries(counts)
            .map(([value, count]) => ({ value, label: value, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Top 20

        setFilterCounts({
          brands: toOptions(brandCounts),
          colors: toOptions(colorCounts),
          conditions: CONDITIONS.map(c => ({
            ...c,
            count: conditionCounts[c.value] || 0
          })),
          materials: toOptions(materialCounts),
          styles: toOptions(styleCounts),
          vehicleFuelTypes: FUEL_TYPES.map(f => ({
            ...f,
            count: fuelTypeCounts[f.value] || 0
          })).filter(f => f.count > 0),
          vehicleColors: toOptions(vehicleColorCounts),
        });
      } catch (err) {
        console.error('Error loading filter counts:', err);
      } finally {
        setLoadingCounts(false);
      }
    };

    // Load immediately without debouncing since this doesn't change with price
    loadFilterCounts();
  }, [open, categoryId]);

  const handleToggleFilter = (filterKey: string, value: string | number) => {
    setLocalFilters(prev => {
      const current = prev[filterKey] || [];
      const isSelected = current.includes(value);

      const updated = isSelected
        ? current.filter(v => v !== value)
        : [...current, value];

      const newFilters = { ...prev, [filterKey]: updated };

      if (updated.length === 0) {
        delete newFilters[filterKey];
      }

      // LIVE FILTERING: Apply immediately
      onFilterChange(newFilters);

      return newFilters;
    });
  };

  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    const range = newValue as [number, number];
    setLocalFilters(prev => {
      const newFilters = { ...prev, priceRange: range };

      // LIVE FILTERING: Apply immediately with debouncing
      if (countDebounceTimeout) {
        clearTimeout(countDebounceTimeout);
      }

      const timeout = setTimeout(() => {
        onFilterChange(newFilters);
      }, 500); // Debounce price changes

      setCountDebounceTimeout(timeout);

      return newFilters;
    });
  };

  const handleResetFilters = () => {
    const resetFilters: SelectedFilters = {};
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(localFilters).forEach(([key, values]) => {
      if (key === 'priceRange') {
        const [min, max] = values as [number, number];
        if (min > 0 || max < 10000) count++;
      } else if (Array.isArray(values) && values.length > 0) {
        count += values.length;
      }
    });
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'left'}
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          ...(isMobile ? {
            // Mobile: Bottom sheet
            width: '100%',
            maxHeight: '85vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: 2, // Safe area for iOS
          } : {
            // Desktop: Left drawer
            width: { xs: '90%', sm: 420 },
            maxWidth: 480,
            height: '100%',
          }),
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Mobile Drag Handle */}
        {isMobile && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 1,
              cursor: 'grab',
            }}
            onClick={onClose}
          >
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                bgcolor: 'divider',
              }}
            />
          </Box>
        )}

        {/* Header */}
        <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <SlidersHorizontal size={16} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Filter
            </Typography>
            {activeCount > 0 && (
              <Badge badgeContent={activeCount} color="primary" sx={{ ml: 0.75, '& .MuiBadge-badge': { fontSize: '0.625rem', height: 14, minWidth: 14 } }} />
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ p: 0.25 }}>
            <X size={16} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
          {loadingCounts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              {/* Price Section */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Preis
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    € {localFilters.priceRange?.[1] || 10000}
                  </Typography>
                </Box>
                <Box sx={{ px: 1.5 }}>
                  <Slider
                    value={localFilters.priceRange || [0, 10000]}
                    onChange={handlePriceChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={10000}
                    valueLabelFormat={(value) => `€${value}`}
                    sx={{
                      width: 'calc(100% - 0px)',
                      '& .MuiSlider-track': {
                        background: 'linear-gradient(90deg, #4ade80 0%, #fbbf24 50%, #fb923c 100%)',
                        border: 'none',
                      },
                      '& .MuiSlider-rail': {
                        bgcolor: 'grey.300',
                      },
                      '& .MuiSlider-thumb': {
                        bgcolor: 'white',
                        border: '2px solid',
                        borderColor: '#4ade80',
                        boxShadow: 2,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    €{localFilters.priceRange?.[0] || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    €{localFilters.priceRange?.[1] || 10000}
                  </Typography>
                </Box>
              </Box>

              {/* Condition Section */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: 0.5 }}>
                  Zustand
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {CONDITIONS.map((condition) => {
                    const matchingOption = filterCounts.conditions.find(o => o.value === condition.value);
                    const isSelected = (localFilters.condition || []).includes(condition.value);

                    return (
                      <Chip
                        key={condition.value}
                        icon={<Box component="span" sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{condition.icon}</Box>}
                        label={condition.label}
                        onClick={() => handleToggleFilter('condition', condition.value)}
                        deleteIcon={isSelected ? <Check size={14} /> : undefined}
                        onDelete={isSelected ? () => handleToggleFilter('condition', condition.value) : undefined}
                        size="small"
                        sx={{
                          bgcolor: isSelected ? 'success.main' : 'grey.200',
                          color: isSelected ? 'white' : 'text.primary',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: '26px',
                          '& .MuiChip-label': {
                            px: 1,
                          },
                          '& .MuiChip-deleteIcon': {
                            color: 'white',
                          },
                          '&:hover': {
                            bgcolor: isSelected ? 'success.dark' : 'grey.300',
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>

              {/* Brand Section with Search */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: 0.5 }}>
                  Marke
                </Typography>
                <Autocomplete
                  value={filterCounts.brands.find(b => b.value === (localFilters.brand && localFilters.brand[0])) || null}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setLocalFilters(prev => ({ ...prev, brand: [newValue.value] }));
                      onFilterChange({ ...localFilters, brand: [newValue.value] });
                    } else {
                      const newFilters = { ...localFilters };
                      delete newFilters.brand;
                      setLocalFilters(newFilters);
                      onFilterChange(newFilters);
                    }
                  }}
                  options={filterCounts.brands}
                  getOptionLabel={(option) => `${option.label} (${option.count})`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Marke suchen..."
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.8125rem',
                        },
                      }}
                    />
                  )}
                  size="small"
                  sx={{
                    '& .MuiAutocomplete-input': {
                      fontSize: '0.8125rem',
                    },
                  }}
                />
              </Box>

              {/* Material Section */}
              {filterCounts.materials.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: 0.5 }}>
                    Material
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {filterCounts.materials.slice(0, 8).map((material) => {
                      const isSelected = (localFilters.material || []).includes(material.value);

                      // Comprehensive Material Icon Mapping with Lucide Icons
                      const getMaterialIcon = (val: string) => {
                        const valLower = val.toLowerCase();

                        // Holz / Wood
                        if (valLower.includes('holz') || valLower.includes('wood')) return TreePine;

                        // Metall / Metal
                        if (valLower.includes('metall') || valLower.includes('metal') ||
                            valLower.includes('stahl') || valLower.includes('aluminium') ||
                            valLower.includes('eisen') || valLower.includes('bronze')) return Hammer;

                        // Kunststoff / Plastic
                        if (valLower.includes('kunststoff') || valLower.includes('plastic') ||
                            valLower.includes('plastik')) return ShoppingBag;

                        // Stoff / Textil / Fabric
                        if (valLower.includes('stoff') || valLower.includes('textil') ||
                            valLower.includes('fabric') || valLower.includes('baumwolle') ||
                            valLower.includes('wolle')) return Scissors;

                        // Leder / Leather
                        if (valLower.includes('leder') || valLower.includes('leather')) return Feather;

                        // Glas / Glass
                        if (valLower.includes('glas') || valLower.includes('glass')) return Wine;

                        // Keramik / Ceramic
                        if (valLower.includes('keramik') || valLower.includes('ceramic') ||
                            valLower.includes('porzellan')) return Wine;

                        // Stein / Stone
                        if (valLower.includes('stein') || valLower.includes('stone') ||
                            valLower.includes('marmor') || valLower.includes('granit')) return Mountain;

                        // Papier / Paper / Karton
                        if (valLower.includes('papier') || valLower.includes('paper') ||
                            valLower.includes('karton') || valLower.includes('pappe')) return FileText;

                        // Carbon / Carbonfaser
                        if (valLower.includes('carbon') || valLower.includes('kohlefaser')) return Hexagon;

                        // Naturfasern / Natural Fibers
                        if (valLower.includes('naturfaser') || valLower.includes('jute') ||
                            valLower.includes('sisal') || valLower.includes('bambus')) return Leaf;

                        // Gummi / Rubber
                        if (valLower.includes('gummi') || valLower.includes('rubber') ||
                            valLower.includes('silikon')) return CircleDot;

                        // Sonstige / Diverse / Mixed
                        if (valLower.includes('gemischt') || valLower.includes('mix') ||
                            valLower.includes('diverse') || valLower.includes('sonstige')) return Package;

                        // Default fallback
                        return Package;
                      };

                      const IconComponent = getMaterialIcon(material.value);

                      return (
                        <Chip
                          key={material.value}
                          icon={<IconComponent size={14} />}
                          label={`${material.label} (${material.count})`}
                          onClick={() => handleToggleFilter('material', material.value)}
                          deleteIcon={isSelected ? <Check size={14} /> : undefined}
                          onDelete={isSelected ? () => handleToggleFilter('material', material.value) : undefined}
                          size="small"
                          sx={{
                            bgcolor: isSelected ? 'success.main' : 'grey.200',
                            color: isSelected ? 'white' : 'text.primary',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: '26px',
                            '& .MuiChip-label': {
                              px: 1,
                            },
                            '& .MuiChip-icon': {
                              color: isSelected ? 'white' : 'text.secondary',
                            },
                            '& .MuiChip-deleteIcon': {
                              color: 'white',
                            },
                            '&:hover': {
                              bgcolor: isSelected ? 'success.dark' : 'grey.300',
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Style Section */}
              {filterCounts.styles.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: 0.5 }}>
                    Stil
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {filterCounts.styles.slice(0, 8).map((style) => {
                      const isSelected = (localFilters.style || []).includes(style.value);

                      // Simple Style Icon Mapping
                      const getStyleIcon = (val: string) => {
                        const valLower = val.toLowerCase();

                        if (valLower.includes('modern')) return Sparkles;
                        if (valLower.includes('klassisch') || valLower.includes('classic')) return Crown;
                        if (valLower.includes('vintage') || valLower.includes('retro')) return Clock;
                        if (valLower.includes('minimalist')) return Square;
                        if (valLower.includes('industrial')) return Hammer;
                        if (valLower.includes('skandinavisch') || valLower.includes('scandinavian')) return Home;
                        if (valLower.includes('rustikal') || valLower.includes('rustic')) return TreePine;
                        if (valLower.includes('elegant')) return Star;
                        if (valLower.includes('sportlich') || valLower.includes('sport')) return Zap;

                        return Tag; // Default
                      };

                      const IconComponent = getStyleIcon(style.value);

                      return (
                        <Chip
                          key={style.value}
                          icon={<IconComponent size={14} />}
                          label={`${style.label} (${style.count})`}
                          onClick={() => handleToggleFilter('style', style.value)}
                          deleteIcon={isSelected ? <Check size={14} /> : undefined}
                          onDelete={isSelected ? () => handleToggleFilter('style', style.value) : undefined}
                          size="small"
                          sx={{
                            bgcolor: isSelected ? 'success.main' : 'grey.200',
                            color: isSelected ? 'white' : 'text.primary',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: '26px',
                            '& .MuiChip-label': {
                              px: 1,
                            },
                            '& .MuiChip-icon': {
                              color: isSelected ? 'white' : 'text.secondary',
                            },
                            '& .MuiChip-deleteIcon': {
                              color: 'white',
                            },
                            '&:hover': {
                              bgcolor: isSelected ? 'success.dark' : 'grey.300',
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Color Section with Visual Color Chips */}
              {filterCounts.colors.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: 0.5 }}>
                    Farbe
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {filterCounts.colors.slice(0, 12).map((color) => {
                      const isSelected = (localFilters.colors || []).includes(color.value);

                      // Professional Color Mapping with HEX values
                      const getColorHex = (val: string) => {
                        const valLower = val.toLowerCase();

                        // Rottöne / Red shades
                        if (valLower.includes('rot') || valLower.includes('red')) return '#ef4444';
                        if (valLower.includes('rosa') || valLower.includes('pink')) return '#ec4899';
                        if (valLower.includes('bordeaux') || valLower.includes('burgund')) return '#991b1b';

                        // Orangetöne / Orange shades
                        if (valLower.includes('orange')) return '#f97316';
                        if (valLower.includes('lachs') || valLower.includes('salmon')) return '#fb923c';

                        // Gelbtöne / Yellow shades
                        if (valLower.includes('gelb') || valLower.includes('yellow')) return '#eab308';
                        if (valLower.includes('gold') || valLower.includes('golden')) return '#ca8a04';
                        if (valLower.includes('beige') || valLower.includes('creme') || valLower.includes('cream')) return '#d4b896';

                        // Grüntöne / Green shades
                        if (valLower.includes('grün') || valLower.includes('green')) return '#22c55e';
                        if (valLower.includes('oliv') || valLower.includes('olive')) return '#84cc16';
                        if (valLower.includes('mint')) return '#10b981';
                        if (valLower.includes('türkis') || valLower.includes('turquoise') || valLower.includes('cyan')) return '#06b6d4';

                        // Blautöne / Blue shades
                        if (valLower.includes('blau') || valLower.includes('blue')) return '#3b82f6';
                        if (valLower.includes('hellblau') || valLower.includes('light blue') || valLower.includes('himmelblau')) return '#60a5fa';
                        if (valLower.includes('navy') || valLower.includes('dunkelblau') || valLower.includes('dark blue')) return '#1e3a8a';

                        // Violett-/Lilatöne / Purple shades
                        if (valLower.includes('lila') || valLower.includes('violett') || valLower.includes('purple')) return '#a855f7';
                        if (valLower.includes('flieder') || valLower.includes('lavender')) return '#c084fc';
                        if (valLower.includes('magenta')) return '#d946ef';

                        // Brauntöne / Brown shades
                        if (valLower.includes('braun') || valLower.includes('brown')) return '#92400e';
                        if (valLower.includes('tan') || valLower.includes('khaki')) return '#b45309';

                        // Neutral / Grautöne / Grayscale
                        if (valLower.includes('schwarz') || valLower.includes('black')) return '#1f2937';
                        if (valLower.includes('weiss') || valLower.includes('weiß') || valLower.includes('white')) return '#f9fafb';
                        if (valLower.includes('grau') || valLower.includes('gray') || valLower.includes('grey')) return '#6b7280';
                        if (valLower.includes('silber') || valLower.includes('silver')) return '#d1d5db';

                        // Mehrfarbig / Multicolor
                        if (valLower.includes('bunt') || valLower.includes('multi') || valLower.includes('gemischt')) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

                        // Default fallback
                        return '#9ca3af';
                      };

                      const colorHex = getColorHex(color.value);
                      const isMulticolor = colorHex.includes('gradient');

                      return (
                        <Chip
                          key={color.value}
                          icon={
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: colorHex,
                                border: '2px solid',
                                borderColor: isSelected ? 'white' : color.value.toLowerCase().includes('weiß') || color.value.toLowerCase().includes('weiss') ? '#e5e7eb' : 'transparent',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              }}
                            />
                          }
                          label={`${color.label} (${color.count})`}
                          onClick={() => handleToggleFilter('colors', color.value)}
                          deleteIcon={isSelected ? <Check size={14} /> : undefined}
                          onDelete={isSelected ? () => handleToggleFilter('colors', color.value) : undefined}
                          size="small"
                          sx={{
                            bgcolor: isSelected ? 'success.main' : 'grey.200',
                            color: isSelected ? 'white' : 'text.primary',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: '26px',
                            '& .MuiChip-label': {
                              px: 1,
                            },
                            '& .MuiChip-deleteIcon': {
                              color: 'white',
                            },
                            '&:hover': {
                              bgcolor: isSelected ? 'success.dark' : 'grey.300',
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Distance/Radius Section */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Umkreis
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'primary.main' }}>
                    {localFilters.radius || 50} km
                  </Typography>
                </Box>
                <Box sx={{ px: 1.5 }}>
                  <Slider
                    value={localFilters.radius || 50}
                    onChange={(event: Event, newValue: number | number[]) => {
                      const radius = newValue as number;
                      setLocalFilters(prev => ({ ...prev, radius }));
                      // Apply with debouncing
                      if (countDebounceTimeout) {
                        clearTimeout(countDebounceTimeout);
                      }
                      const timeout = setTimeout(() => {
                        onFilterChange({ ...localFilters, radius });
                      }, 500);
                      setCountDebounceTimeout(timeout);
                    }}
                    valueLabelDisplay="off"
                    min={5}
                    max={500}
                    step={5}
                    valueLabelFormat={(value) => `${value} km`}
                    sx={{
                      width: 'calc(100% - 0px)',
                      '& .MuiSlider-track': {
                        bgcolor: 'primary.main',
                      },
                      '& .MuiSlider-rail': {
                        bgcolor: 'grey.300',
                      },
                      '& .MuiSlider-thumb': {
                        bgcolor: 'white',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: 2,
                      },
                    }}
                  />
                </Box>
              </Box>
            </>
          )}
        </Box>

        {/* Footer with Buttons */}
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="medium"
              onClick={handleResetFilters}
              sx={{
                flex: '0 0 auto',
                px: 2,
                py: 1,
                fontSize: '0.8125rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'text.secondary',
                  bgcolor: 'action.hover',
                },
              }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              size="medium"
              onClick={onClose}
              disabled={filteredItemCount === 0}
              sx={{
                flex: 1,
                bgcolor: filteredItemCount === 0 ? 'action.disabledBackground' : 'primary.main',
                color: filteredItemCount === 0 ? 'action.disabled' : 'white',
                py: 1,
                fontSize: '0.8125rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: filteredItemCount === 0 ? 'action.disabledBackground' : 'primary.dark',
                },
              }}
            >
              {filteredItemCount === 0
                ? 'Keine Ergebnisse'
                : filteredItemCount !== undefined && filteredItemCount !== totalItems
                ? `Anzeigen (${filteredItemCount})`
                : 'Anzeigen'}
            </Button>
          </Box>
          {filteredItemCount === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.75, fontSize: '0.7rem' }}>
              Filter zurücksetzen
            </Typography>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export const SelectedFilters = ({
  filters,
  onRemoveFilter,
  onClearAll,
}: {
  filters: SelectedFilters;
  onRemoveFilter: (key: string, value?: string | number) => void;
  onClearAll: () => void;
}) => {
  const filterChips: Array<{ key: string; label: string; value?: string | number }> = [];

  // Price range
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    if (min > 0 || max < 10000) {
      filterChips.push({
        key: 'priceRange',
        label: `€${min} - €${max}`,
      });
    }
  }

  // All other filters
  Object.entries(filters).forEach(([key, values]) => {
    if (key !== 'priceRange' && Array.isArray(values)) {
      values.forEach(val => {
        const label = key === 'condition' ? getConditionLabel(String(val)) : String(val);
        filterChips.push({
          key,
          label,
          value: val,
        });
      });
    }
  });

  if (filterChips.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
      {filterChips.map((chip, idx) => (
        <Box
          key={`${chip.key}-${chip.value || idx}`}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            bgcolor: 'primary.50',
            borderRadius: 2,
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'primary.main',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'primary.100',
            },
          }}
          onClick={() => onRemoveFilter(chip.key, chip.value)}
        >
          {chip.label}
          <X size={14} />
        </Box>
      ))}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.5,
          bgcolor: 'grey.100',
          borderRadius: 2,
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'text.secondary',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'grey.200',
          },
        }}
        onClick={onClearAll}
      >
        Alle löschen
      </Box>
    </Box>
  );
};
