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
  Badge,
} from '@mui/material';
import { ChevronDown, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { getConditionLabel } from '../../utils/translations';

export interface SelectedFilters {
  [key: string]: (string | number)[];
  priceRange?: [number, number];
}

interface AdvancedFilterSidebarProps {
  open: boolean;
  onClose: () => void;
  onFilterChange: (filters: SelectedFilters) => void;
  selectedFilters: SelectedFilters;
  totalItems?: number;
}

// Statische Filter-Definitionen
const CONDITIONS = [
  { value: 'new', label: 'Neu' },
  { value: 'like_new', label: 'Wie neu' },
  { value: 'very_good', label: 'Sehr gut' },
  { value: 'good', label: 'Gut' },
  { value: 'acceptable', label: 'Akzeptabel' },
];

export const AdvancedFilterSidebar = ({
  open,
  onClose,
  onFilterChange,
  selectedFilters,
  totalItems = 0,
}: AdvancedFilterSidebarProps) => {
  const [localFilters, setLocalFilters] = useState<SelectedFilters>(selectedFilters);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set(['price', 'condition']));

  // Sync local filters with external filters when they change
  useEffect(() => {
    setLocalFilters(selectedFilters);
  }, [selectedFilters]);

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
        if (min > 0 || max < 10000) {
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
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <SlidersHorizontal size={18} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              Filter
            </Typography>
            {activeCount > 0 && (
              <Badge badgeContent={activeCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.625rem', height: 16, minWidth: 16 } }} />
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ p: 0.5 }}>
            <X size={18} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 0.75 }}>
          {/* Total Items */}
          <Box sx={{ mb: 0.75, p: 1, bgcolor: 'primary.50', borderRadius: 0.5 }}>
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              {totalItems} {totalItems === 1 ? 'Artikel' : 'Artikel'}
            </Typography>
          </Box>

          {/* Price Range */}
          <Accordion
            expanded={expandedAccordions.has('price')}
            onChange={() => toggleAccordion('price')}
            sx={{ mb: 0.5, boxShadow: 'none', '&:before': { display: 'none' } }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown size={16} />}
              sx={{
                minHeight: 40,
                '& .MuiAccordionSummary-content': { my: 0.75 }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                💰 Preis
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1 }}>
              <Box sx={{ px: 0.5 }}>
                <Slider
                  value={localFilters.priceRange || [0, 10000]}
                  onChange={handlePriceChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={10000}
                  valueLabelFormat={(value) => `€${value}`}
                  size="small"
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                    €{localFilters.priceRange?.[0] || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                    €{localFilters.priceRange?.[1] || 10000}
                  </Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Condition */}
          <Accordion
            expanded={expandedAccordions.has('condition')}
            onChange={() => toggleAccordion('condition')}
            sx={{ mb: 0.5, boxShadow: 'none', '&:before': { display: 'none' } }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown size={16} />}
              sx={{
                minHeight: 40,
                '& .MuiAccordionSummary-content': { my: 0.75 }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  ✨ Zustand
                </Typography>
                {localFilters.condition && localFilters.condition.length > 0 && (
                  <Badge
                    badgeContent={localFilters.condition.length}
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.625rem', height: 16, minWidth: 16 } }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, pt: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, px: 0.5 }}>
                {CONDITIONS.map((condition) => {
                  const isChecked = (localFilters.condition || []).includes(condition.value);

                  return (
                    <FormControlLabel
                      key={condition.value}
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={() => handleToggleFilter('condition', condition.value)}
                          size="small"
                          sx={{ p: 0.5 }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                          {condition.label}
                        </Typography>
                      }
                      sx={{
                        m: 0,
                        py: 0.25,
                        px: 0.75,
                        borderRadius: 0.5,
                        '&:hover': { bgcolor: 'action.hover' },
                        ...(isChecked && { bgcolor: 'primary.50' }),
                      }}
                    />
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Footer Actions */}
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 0.75 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<RotateCcw size={14} />}
            onClick={handleResetFilters}
            disabled={activeCount === 0}
            size="small"
            sx={{ fontSize: '0.8125rem', py: 0.75 }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleApplyFilters}
            size="small"
            sx={{ fontSize: '0.8125rem', py: 0.75 }}
          >
            Anzeigen ({totalItems})
          </Button>
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

  // Condition
  if (filters.condition) {
    filters.condition.forEach(val => {
      filterChips.push({
        key: 'condition',
        label: getConditionLabel(String(val)),
        value: val,
      });
    });
  }

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
