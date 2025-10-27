import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { supabase } from '../../lib/supabase';
import { CategoryWithChildren } from '../../types/categories';
import { getCategoryIconBySlug } from '../../utils/categoryIcons';

interface CategoryTreeProps {
  searchQuery?: string;
  showUsageCount?: boolean;
  expandAll?: boolean;
  showOnlyWithItems?: boolean;
  onCategoryClick?: (categorySlug: string) => void;
  onExport?: () => void;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  searchQuery = '',
  showUsageCount = true,
  expandAll = false,
  showOnlyWithItems = false,
  onCategoryClick,
}) => {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('categoryTreeExpanded');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });

  // Save to localStorage whenever expandedCategories changes
  useEffect(() => {
    localStorage.setItem('categoryTreeExpanded', JSON.stringify(Array.from(expandedCategories)));
  }, [expandedCategories]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const [lastExpandAllState, setLastExpandAllState] = useState<boolean | null>(null);

  useEffect(() => {
    // Only trigger expand/collapse when expandAll actually changes
    if (expandAll !== lastExpandAllState && categories.length > 0) {
      if (expandAll) {
        const allIds = new Set<string>();
        const collectIds = (cats: CategoryWithChildren[]) => {
          cats.forEach(cat => {
            allIds.add(cat.id);
            if (cat.children) {
              collectIds(cat.children);
            }
          });
        };
        collectIds(categories);
        setExpandedCategories(allIds);
      } else if (lastExpandAllState !== null) {
        // Only clear when explicitly collapsing (not on initial load)
        setExpandedCategories(new Set());
      }
      setLastExpandAllState(expandAll);
    }
  }, [expandAll, categories, lastExpandAllState]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all categories
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      if (data) {
        const tree = buildCategoryTree(data);
        setCategories(tree);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const buildCategoryTree = (flatCategories: any[]): CategoryWithChildren[] => {
    const categoryMap = new Map<string, CategoryWithChildren>();

    // First pass: Create map of all categories
    flatCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const rootCategories: CategoryWithChildren[] = [];

    // Second pass: Build tree structure
    flatCategories.forEach(cat => {
      const category = categoryMap.get(cat.id);
      if (!category) return;

      if (cat.parent_id === null) {
        rootCategories.push(category);
      } else {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      }
    });

    // Third pass: Calculate total usage count (including descendants)
    const calculateTotalUsageCount = (category: CategoryWithChildren): number => {
      let total = category.usage_count || 0;

      if (category.children && category.children.length > 0) {
        category.children.forEach(child => {
          total += calculateTotalUsageCount(child);
        });
      }

      category.total_usage_count = total;
      return total;
    };

    rootCategories.forEach(cat => calculateTotalUsageCount(cat));

    return rootCategories;
  };

  const getCategoryName = (category: CategoryWithChildren, lang: string = 'de'): string => {
    return category.translations?.[lang]?.name || category.slug;
  };

  const getCategoryDescription = (category: CategoryWithChildren, lang: string = 'de'): string | undefined => {
    return category.translations?.[lang]?.description;
  };

  const matchesSearch = (category: CategoryWithChildren): boolean => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const name = getCategoryName(category).toLowerCase();
    const description = getCategoryDescription(category)?.toLowerCase() || '';
    const slug = category.slug.toLowerCase();

    return name.includes(query) || description.includes(query) || slug.includes(query);
  };

  const hasMatchingDescendant = (category: CategoryWithChildren): boolean => {
    if (matchesSearch(category)) return true;

    if (category.children) {
      return category.children.some(child => hasMatchingDescendant(child));
    }

    return false;
  };

  const hasItemsInTree = (category: CategoryWithChildren): boolean => {
    // Use pre-calculated total_usage_count if available
    return (category.total_usage_count ?? 0) > 0;
  };

  const shouldShowCategory = (category: CategoryWithChildren): boolean => {
    // First check if it matches search
    if (!hasMatchingDescendant(category)) return false;

    // If filter is active, check if category or descendants have items
    if (showOnlyWithItems) {
      return hasItemsInTree(category);
    }

    return true;
  };

  const handleToggle = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategory = (category: CategoryWithChildren, depth: number = 0): React.ReactNode => {
    if (!shouldShowCategory(category)) return null;

    const name = getCategoryName(category);
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    const getLevelColor = (level: number): string => {
      switch (level) {
        case 1: return '#1976d2'; // Blue
        case 2: return '#388e3c'; // Green
        case 3: return '#f57c00'; // Orange
        case 4: return '#d32f2f'; // Red
        default: return '#757575'; // Gray
      }
    };

    return (
      <Box key={category.id}>
        <Accordion
          expanded={isExpanded}
          onChange={hasChildren ? () => handleToggle(category.id) : undefined}
          elevation={0}
          sx={{
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none !important',
            '&:before': { display: 'none' },
            '&.Mui-expanded': {
              margin: 0,
            },
          }}
          disableGutters
        >
          <AccordionSummary
            expandIcon={hasChildren ? <ExpandMoreIcon sx={{ fontSize: 20 }} /> : null}
            sx={{
              pl: 1.5 + depth * 2,
              pr: 1,
              py: 0.5,
              minHeight: 36,
              '&.Mui-expanded': {
                minHeight: 36,
              },
              borderLeft: depth > 0 ? `2px solid ${getLevelColor(category.level)}` : 'none',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              },
              transition: 'background-color 0.2s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: '100%' }}>
              <Box sx={{
                color: getLevelColor(category.level),
                display: 'flex',
                alignItems: 'center',
                minWidth: 18,
                justifyContent: 'center'
              }}>
                {getCategoryIconBySlug(category.slug, 16)}
              </Box>

              <Typography
                variant={depth === 0 ? 'subtitle1' : 'body2'}
                sx={{
                  fontWeight: depth === 0 ? 600 : 500,
                  flexGrow: 1,
                  fontSize: depth === 0 ? '0.875rem' : '0.8125rem',
                  lineHeight: 1.4,
                }}
              >
                {name}
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                {showUsageCount && (category.total_usage_count ?? 0) > 0 && (
                  <Chip
                    label={`${category.total_usage_count}`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      color: 'primary.main',
                      fontSize: '0.65rem',
                      height: 20,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: 'rgba(25, 118, 210, 0.2)',
                      '& .MuiChip-label': {
                        px: 0.75,
                      },
                    }}
                  />
                )}

                {/* Icon-Button zum Navigieren */}
                {onCategoryClick && (category.total_usage_count ?? 0) > 0 && (
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      onCategoryClick(category.slug);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      color: 'primary.main',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <ArrowForwardIcon sx={{ fontSize: 14 }} />
                  </Box>
                )}
              </Box>
            </Box>
          </AccordionSummary>

          {hasChildren && (
            <AccordionDetails sx={{ p: 0 }}>
              <Box>
                {category.children!.map(child => renderCategory(child, depth + 1))}
              </Box>
            </AccordionDetails>
          )}
        </Accordion>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Fehler beim Laden der Kategorien: {error}
      </Alert>
    );
  }

  if (categories.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Keine Kategorien gefunden.
      </Alert>
    );
  }

  return (
    <Box>
      {categories.map(category => renderCategory(category, 0))}
    </Box>
  );
};

export default CategoryTree;
