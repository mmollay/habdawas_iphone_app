import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Slider,
  IconButton,
  Divider,
  Chip,
  Badge,
  Skeleton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ChevronDown, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useFilterCounts } from '../../hooks/useFilterCounts';
import { useCategories } from '../../hooks/useCategories';
import { getCategoryName } from '../../utils/categories';
import { getConditionLabel } from '../../utils/translations';

interface FilterValue {
  value: string | number;
  count: number;
}

interface Filter {
  label: string;
  type?: string;
  values: FilterValue[];
}

interface AdvancedFilterSidebarProps {
  open: boolean;
  onClose: () => void;
  categoryId?: string;
  onFilterChange: (filters: SelectedFilters) => void;
  selectedFilters: SelectedFilters;
}

export interface SelectedFilters {
  [key: string]: (string | number)[];
  priceRange?: [number, number];
}

export const AdvancedFilterSidebar = ({
  open,
  onClose,
  categoryId,
  onFilterChange,
  selectedFilters,
}: AdvancedFilterSidebarProps) => {
  const [localFilters, setLocalFilters] = useState<SelectedFilters>(selectedFilters);
  const { data, loading, isRefreshing, error } = useFilterCounts(categoryId, open, localFilters);
  const { categories, getChildrenOf } = useCategories({ lang: 'de' });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set(['price', 'subcategories']));

  // Get item count for a subcategory from filter data
  const getSubcategoryCount = (subcatId: string): number => {
    // If data has subcategory_counts, use that
    if (data?.subcategory_counts && data.subcategory_counts[subcatId]) {
      return data.subcategory_counts[subcatId];
    }
    // Fallback: return 0 if no data
    return 0;
  };

  const handleToggleFilter = (filterKey: string, value: string | number) => {
    setLocalFilters(prev => {
      const current = prev[filterKey] || [];
      const isSelected = current.includes(value);

      const updated = isSelected
        ? current.filter(v => v !== value)
        : [...current, value];

      const newFilters = { ...prev, [filterKey]: updated };

      // Remove empty arrays
      if (updated.length === 0) {
        delete newFilters[filterKey];
      }

      return newFilters;
    });
  };

  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    const range = newValue as [number, number];
    setLocalFilters(prev => ({ ...prev, priceRange: range }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: SelectedFilters = {};
    // Don't set priceRange - let it be undefined to show all prices
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const toggleAccordion = (key: string) => {
    setExpandedAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(localFilters).forEach(([key, values]) => {
      if (key === 'priceRange') {
        const [min, max] = values as [number, number];
        if (data?.price_range && (min !== data.price_range.min || max !== data.price_range.max)) {
          count++;
        }
      } else if (Array.isArray(values) && values.length > 0) {
        count += values.length;
      }
    });
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '85%', sm: 360 },
          maxWidth: 400,
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SlidersHorizontal size={20} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filter
            </Typography>
            {activeCount > 0 && (
              <Badge badgeContent={activeCount} color="primary" />
            )}
            {isRefreshing && (
              <CircularProgress size={16} sx={{ ml: 0.5 }} />
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="rectangular" height={60} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && data && (
            <>
              {/* Total Items */}
              <Box sx={{ mb: 0.5, p: 0.75, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  {data.total_items} {data.total_items === 1 ? 'Artikel' : 'Artikel'} gefunden
                </Typography>
              </Box>

              {/* Price Range */}
              {data.price_range && (
                <Accordion
                  expanded={expandedAccordions.has('price')}
                  onChange={() => toggleAccordion('price')}
                  sx={{ mb: 0.25, boxShadow: 'none', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ minHeight: 36, py: 0, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                      💰 Preis
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, '&.MuiAccordionDetails-root': { p: 0 } }}>
                    <Box sx={{ px: 1.5, pt: 0.5, pb: 0.5 }}>
                      <Slider
                        value={localFilters.priceRange || priceRange}
                        onChange={handlePriceChange}
                        valueLabelDisplay="auto"
                        min={data.price_range.min}
                        max={data.price_range.max}
                        valueLabelFormat={(value) => `€${value}`}
                        sx={{ my: 0 }}
                        size="small"
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          €{localFilters.priceRange?.[0] || data.price_range.min}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          €{localFilters.priceRange?.[1] || data.price_range.max}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Subcategories */}
              {categoryId && (() => {
                const subcategories = getChildrenOf(categoryId);
                if (subcategories.length > 0) {
                  return (
                    <Accordion
                      expanded={expandedAccordions.has('subcategories')}
                      onChange={() => toggleAccordion('subcategories')}
                      sx={{ mb: 0.25, boxShadow: 'none', '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ minHeight: 36, py: 0, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            📁 Unterkategorie
                          </Typography>
                          {localFilters.subcategories && localFilters.subcategories.length > 0 && (
                            <Chip
                              label={localFilters.subcategories.length}
                              size="small"
                              color="primary"
                              sx={{ height: 18, fontSize: '0.65rem', minWidth: 18 }}
                            />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0, '&.MuiAccordionDetails-root': { p: 0 } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, px: 0.5 }}>
                          {subcategories.map((subcat) => {
                            const subcatId = subcat.id;
                            const subcatName = getCategoryName(subcat, 'de');
                            const count = getSubcategoryCount(subcatId);
                            const isChecked = (localFilters.subcategories || []).includes(subcatId);

                            return (
                              <FormControlLabel
                                key={subcatId}
                                control={
                                  <Checkbox
                                    checked={isChecked}
                                    onChange={() => handleToggleFilter('subcategories', subcatId)}
                                    size="small"
                                    sx={{ py: 0, px: 0.5 }}
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{subcatName}</Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ ml: 1, fontWeight: 500, fontSize: '0.7rem' }}
                                    >
                                      ({count})
                                    </Typography>
                                  </Box>
                                }
                                sx={{
                                  m: 0,
                                  py: 0,
                                  px: 0.5,
                                  borderRadius: 1,
                                  '&:hover': { bgcolor: 'action.hover' },
                                  ...(isChecked && { bgcolor: 'primary.50' }),
                                }}
                              />
                            );
                          })}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                }
                return null;
              })()}

              <Divider sx={{ my: 0.25 }} />

              {/* Dynamic Filters */}
              {Object.entries(data.filters).map(([key, filter]) => {
                const selectedValues = localFilters[key] || [];
                const hasSelections = selectedValues.length > 0;

                return (
                  <Accordion
                    key={key}
                    expanded={expandedAccordions.has(key)}
                    onChange={() => toggleAccordion(key)}
                    sx={{ mb: 0.25, boxShadow: 'none', '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ minHeight: 36, py: 0, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {filter.label}
                        </Typography>
                        {hasSelections && (
                          <Chip
                            label={selectedValues.length}
                            size="small"
                            color="primary"
                            sx={{ height: 18, fontSize: '0.65rem', minWidth: 18 }}
                          />
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, '&.MuiAccordionDetails-root': { p: 0 } }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, px: 0.5 }}>
                        {filter.values.map((val, idx) => {
                          const isChecked = selectedValues.includes(val.value);

                          return (
                            <FormControlLabel
                              key={idx}
                              control={
                                <Checkbox
                                  checked={isChecked}
                                  onChange={() => handleToggleFilter(key, val.value)}
                                  size="small"
                                  sx={{ py: 0, px: 0.5 }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                    {key === 'condition' ? getConditionLabel(String(val.value)) : val.value}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ ml: 1, fontWeight: 500, fontSize: '0.7rem' }}
                                  >
                                    ({val.count})
                                  </Typography>
                                </Box>
                              }
                              sx={{
                                m: 0,
                                py: 0,
                                px: 0.5,
                                borderRadius: 1,
                                '&:hover': { bgcolor: 'action.hover' },
                                ...(isChecked && { bgcolor: 'primary.50' }),
                              }}
                            />
                          );
                        })}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </>
          )}
        </Box>

        {/* Footer Actions */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<RotateCcw size={16} />}
            onClick={handleResetFilters}
            disabled={activeCount === 0}
          >
            Zurücksetzen
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleApplyFilters}
            disabled={loading}
          >
            Anzeigen ({data?.total_items || 0})
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
