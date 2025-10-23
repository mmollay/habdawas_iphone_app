import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Slider,
  Checkbox,
  FormControlLabel,
  Button,
  Chip,
  TextField,
  CircularProgress,
  Divider,
} from '@mui/material';
import { ChevronDown, X, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCategoryIconBySlug } from '../../utils/categoryIcons';

interface CategoryAttribute {
  id: string;
  attribute_key: string;
  attribute_type: 'select' | 'multiselect' | 'range' | 'number' | 'text' | 'boolean' | 'date' | 'year';
  translations: {
    de?: { name: string; description?: string };
    en?: { name: string; description?: string };
    fr?: { name: string; description?: string };
  };
  unit?: string;
  min_value?: number;
  max_value?: number;
  step_value?: number;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
}

interface AttributeOption {
  id: string;
  option_key: string;
  translations: {
    de?: { name: string };
    en?: { name: string };
    fr?: { name: string };
  };
  icon?: string;
  color?: string;
  sort_order: number;
}

interface FilterValue {
  attributeId: string;
  attributeKey: string;
  value: string | number | string[] | [number, number] | null;
  type: string;
}

interface Category {
  id: string;
  translations: {
    de?: { name: string };
    en?: { name: string };
    fr?: { name: string };
  };
  level: number;
  parent_id: string | null;
  sort_order: number;
}

interface FilterSidebarProps {
  categoryId: string | null;
  language?: 'de' | 'en' | 'fr';
  onFilterChange: (filters: FilterValue[]) => void;
  onSubcategoryChange?: (subcategoryId: string | null) => void;
}

export const FilterSidebar = ({
  categoryId,
  language = 'de',
  onFilterChange,
  onSubcategoryChange
}: FilterSidebarProps) => {
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<Map<string, AttributeOption[]>>(new Map());
  const [filters, setFilters] = useState<Map<string, FilterValue>>(new Map());
  const [loading, setLoading] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [optionCounts, setOptionCounts] = useState<Map<string, Map<string, number>>>(new Map());

  // Load attributes when category changes
  useEffect(() => {
    if (categoryId) {
      loadCategoryAttributes();
      loadSubcategories();
    } else {
      setAttributes([]);
      setAttributeOptions(new Map());
      setFilters(new Map());
    }
  }, [categoryId]);

  const loadCategoryAttributes = async () => {
    if (!categoryId) return;

    setLoading(true);
    try {
      // Load attributes for this category
      const { data: attrs, error: attrsError } = await supabase
        .rpc('get_category_attributes', { p_category_id: categoryId });

      if (attrsError) throw attrsError;

      const filterableAttrs = (attrs || []).filter((attr: CategoryAttribute) => attr.is_filterable);
      setAttributes(filterableAttrs);

      // Load options for select/multiselect attributes
      const optionsMap = new Map<string, AttributeOption[]>();
      for (const attr of filterableAttrs) {
        if (attr.attribute_type === 'select' || attr.attribute_type === 'multiselect') {
          const { data: options, error: optionsError } = await supabase
            .rpc('get_attribute_options', { p_attribute_id: attr.id });

          if (!optionsError && options) {
            optionsMap.set(attr.id, options);
          }
        }
      }
      setAttributeOptions(optionsMap);

      // Load option counts after attributes are loaded
      await loadOptionCounts(filterableAttrs, optionsMap);
    } catch (error) {
      console.error('Error loading category attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async () => {
    if (!categoryId) {
      setSubcategories([]);
      setSelectedSubcategory(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, translations, level, parent_id, sort_order')
        .eq('parent_id', categoryId)
        .order('sort_order');

      if (error) throw error;

      setSubcategories(data || []);
      setSelectedSubcategory(null);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    }
  };

  const loadOptionCounts = async (attrs: CategoryAttribute[], optionsMap: Map<string, AttributeOption[]>) => {
    if (!categoryId) return;

    try {
      // Load counts for each attribute's options
      const counts = new Map<string, Map<string, number>>();

      for (const attr of attrs) {
        if (attr.attribute_type !== 'select' && attr.attribute_type !== 'multiselect') continue;

        const options = optionsMap.get(attr.id) || [];
        const optionCounts = new Map<string, number>();

        for (const option of options) {
          // Count items with this attribute value
          const { data, error } = await supabase
            .rpc('count_items_by_attribute', {
              p_category_id: categoryId,
              p_attribute_key: attr.attribute_key,
              p_value: option.option_key
            });

          if (error) {
            console.error(`Error counting ${attr.attribute_key}:${option.option_key}:`, error);
          } else if (data !== null) {
            optionCounts.set(option.option_key, data);
          }
        }

        counts.set(attr.id, optionCounts);
      }

      setOptionCounts(counts);
    } catch (error) {
      console.error('Error loading option counts:', error);
    }
  };

  const handleFilterChange = (attributeId: string, attributeKey: string, value: any, type: string) => {
    const newFilters = new Map(filters);

    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      newFilters.delete(attributeId);
    } else {
      newFilters.set(attributeId, { attributeId, attributeKey, value, type });
    }

    setFilters(newFilters);
    onFilterChange(Array.from(newFilters.values()));
  };

  const clearAllFilters = () => {
    setFilters(new Map());
    onFilterChange([]);
  };

  const getAttributeName = (attr: CategoryAttribute): string => {
    return attr.translations[language]?.name || attr.translations.de?.name || attr.attribute_key;
  };

  const getOptionName = (option: AttributeOption): string => {
    return option.translations[language]?.name || option.translations.de?.name || option.option_key;
  };

  const getCategoryName = (category: Category): string => {
    return category.translations[language]?.name || category.translations.de?.name || category.id;
  };

  const handleSubcategoryChange = (subcategoryId: string | null) => {
    setSelectedSubcategory(subcategoryId);
    if (onSubcategoryChange) {
      onSubcategoryChange(subcategoryId);
    }
  };

  // Get filtered options with counts (only show options with count > 0)
  const getFilteredOptions = (attributeId: string): AttributeOption[] => {
    const allOptions = attributeOptions.get(attributeId) || [];
    const counts = optionCounts.get(attributeId);

    if (!counts) {
      return allOptions;
    }

    return allOptions
      .map(option => ({
        ...option,
        count: counts.get(option.option_key) || 0
      }))
      .filter(option => (option as any).count > 0)
      .sort((a, b) => (b as any).count - (a as any).count); // Sort by count descending
  };

  // Check if attribute has any options with count > 0
  const hasAvailableOptions = (attributeId: string): boolean => {
    const options = getFilteredOptions(attributeId);
    return options.length > 0;
  };

  const renderFilter = (attr: CategoryAttribute) => {
    const options = getFilteredOptions(attr.id);
    const currentValue = filters.get(attr.id)?.value;

    switch (attr.attribute_type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <Select
              value={currentValue || ''}
              onChange={(e) => handleFilterChange(attr.id, attr.attribute_key, e.target.value, 'select')}
              displayEmpty
            >
              <MenuItem value="">
                <em>Alle</em>
              </MenuItem>
              {options.map((option) => (
                <MenuItem key={option.id} value={option.option_key}>
                  {option.color && (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: option.color,
                        border: '1px solid #ccc',
                        mr: 1,
                        display: 'inline-block',
                      }}
                    />
                  )}
                  {getOptionName(option)}
                  {(option as any).count > 0 && (
                    <Box component="span" sx={{ ml: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                      ({(option as any).count})
                    </Box>
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        const selectedValues = (currentValue as string[]) || [];
        return (
          <Box>
            {options.map((option) => (
              <FormControlLabel
                key={option.id}
                control={
                  <Checkbox
                    checked={selectedValues.includes(option.option_key)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option.option_key]
                        : selectedValues.filter((v) => v !== option.option_key);
                      handleFilterChange(attr.id, attr.attribute_key, newValues, 'multiselect');
                    }}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.color && (
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: option.color,
                          border: '1px solid #ccc',
                        }}
                      />
                    )}
                    <span>{getOptionName(option)}</span>
                    {(option as any).count > 0 && (
                      <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        ({(option as any).count})
                      </Box>
                    )}
                  </Box>
                }
              />
            ))}
          </Box>
        );

      case 'range':
        const rangeValue = (currentValue as [number, number]) || [
          attr.min_value || 0,
          attr.max_value || 100,
        ];
        return (
          <Box sx={{ px: 1 }}>
            <Slider
              value={rangeValue}
              onChange={(_, newValue) =>
                handleFilterChange(attr.id, attr.attribute_key, newValue as [number, number], 'range')
              }
              valueLabelDisplay="auto"
              min={attr.min_value || 0}
              max={attr.max_value || 100}
              step={attr.step_value || 1}
              marks={[
                { value: attr.min_value || 0, label: `${attr.min_value || 0} ${attr.unit || ''}` },
                { value: attr.max_value || 100, label: `${attr.max_value || 100} ${attr.unit || ''}` },
              ]}
            />
            <Typography variant="caption" color="text.secondary">
              {rangeValue[0]} - {rangeValue[1]} {attr.unit || ''}
            </Typography>
          </Box>
        );

      case 'year':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Von"
              type="number"
              size="small"
              value={(currentValue as [number, number])?.[0] || attr.min_value || 1950}
              onChange={(e) => {
                const from = parseInt(e.target.value) || attr.min_value || 1950;
                const to = (currentValue as [number, number])?.[1] || attr.max_value || new Date().getFullYear();
                handleFilterChange(attr.id, attr.attribute_key, [from, to], 'year');
              }}
              inputProps={{ min: attr.min_value || 1950, max: attr.max_value || new Date().getFullYear() }}
            />
            <TextField
              label="Bis"
              type="number"
              size="small"
              value={(currentValue as [number, number])?.[1] || attr.max_value || new Date().getFullYear()}
              onChange={(e) => {
                const from = (currentValue as [number, number])?.[0] || attr.min_value || 1950;
                const to = parseInt(e.target.value) || attr.max_value || new Date().getFullYear();
                handleFilterChange(attr.id, attr.attribute_key, [from, to], 'year');
              }}
              inputProps={{ min: attr.min_value || 1950, max: attr.max_value || new Date().getFullYear() }}
            />
          </Box>
        );

      case 'number':
        return (
          <TextField
            type="number"
            size="small"
            fullWidth
            value={currentValue || ''}
            onChange={(e) =>
              handleFilterChange(attr.id, attr.attribute_key, parseFloat(e.target.value) || null, 'number')
            }
            inputProps={{ min: attr.min_value, max: attr.max_value, step: attr.step_value || 1 }}
            placeholder={`${attr.min_value || ''} - ${attr.max_value || ''} ${attr.unit || ''}`}
          />
        );

      case 'text':
        return (
          <TextField
            type="text"
            size="small"
            fullWidth
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(attr.id, attr.attribute_key, e.target.value || null, 'text')}
            placeholder="Suchen..."
          />
        );

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!currentValue}
                onChange={(e) => handleFilterChange(attr.id, attr.attribute_key, e.target.checked, 'boolean')}
              />
            }
            label={getAttributeName(attr)}
          />
        );

      default:
        return null;
    }
  };

  if (!categoryId) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Wähle eine Kategorie, um Filter anzuzeigen
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Filter werden geladen...
        </Typography>
      </Box>
    );
  }

  if (attributes.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Keine Filter für diese Kategorie verfügbar
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 320 }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Filter size={20} />
          <Typography variant="h6">Filter</Typography>
        </Box>
        {filters.size > 0 && (
          <Button size="small" startIcon={<X size={16} />} onClick={clearAllFilters}>
            Zurücksetzen
          </Button>
        )}
      </Box>

      <Divider />

      {/* Subcategory Dropdown with Icons */}
      {subcategories.length > 0 && (
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
              Unterkategorie
            </FormLabel>
            <Select
              value={selectedSubcategory || ''}
              onChange={(e) => handleSubcategoryChange(e.target.value || null)}
              displayEmpty
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <em>Alle Unterkategorien</em>
                </Box>
              </MenuItem>
              {subcategories.map((subcat) => (
                <MenuItem key={subcat.id} value={subcat.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getCategoryIconBySlug(subcat.slug, 16)}
                    {getCategoryName(subcat)}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {subcategories.length > 0 && <Divider />}

      {/* Active Filters Summary */}
      {filters.size > 0 && (
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {Array.from(filters.values()).map((filter) => {
            const attr = attributes.find((a) => a.id === filter.attributeId);
            if (!attr) return null;

            let label = getAttributeName(attr);
            if (filter.type === 'select') {
              const option = attributeOptions.get(filter.attributeId)?.find((o) => o.option_key === filter.value);
              if (option) label += `: ${getOptionName(option)}`;
            } else if (filter.type === 'range' || filter.type === 'year') {
              const [min, max] = filter.value as [number, number];
              label += `: ${min}-${max}${attr.unit ? ' ' + attr.unit : ''}`;
            }

            return (
              <Chip
                key={filter.attributeId}
                label={label}
                size="small"
                onDelete={() => handleFilterChange(filter.attributeId, filter.attributeKey, null, filter.type)}
              />
            );
          })}
        </Box>
      )}

      {/* Filter Accordions */}
      <Box>
        {attributes
          .filter((attr) => hasAvailableOptions(attr.id))
          .map((attr) => (
            <Accordion
              key={attr.id}
              expanded={expandedAccordion === attr.id}
              onChange={(_, isExpanded) => setExpandedAccordion(isExpanded ? attr.id : false)}
              disableGutters
              elevation={0}
              sx={{ '&:before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                <Typography variant="subtitle2">{getAttributeName(attr)}</Typography>
                {filters.has(attr.id) && (
                  <Chip label="✓" size="small" sx={{ ml: 1, height: 20, minWidth: 20 }} />
                )}
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>{renderFilter(attr)}</AccordionDetails>
            </Accordion>
          ))}
      </Box>
    </Box>
  );
};
