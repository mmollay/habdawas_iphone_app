import React, { useState, useMemo } from 'react';
import { Box, IconButton, Tabs, Tab, Chip, useMediaQuery, useTheme, Select, MenuItem } from '@mui/material';
import { FolderTree, Globe, User, Heart, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useCommunityStats } from '../../hooks/useCommunityStats';
import { getCategoryName } from '../../utils/categories';
import { getCategoryIconBySlug } from '../../utils/categoryIcons';
import { useFavoritesContext } from '../../contexts/FavoritesContext';

interface MainNavigationProps {
  // Tab selection
  selectedTab: number; // 0=Alle, 1=Meine, 2=Favoriten
  onTabChange: (newValue: number) => void;

  // Category selection
  selectedCategories: string[];
  onCategoryChange: (categoryId: string | null) => void;

  // Item counts
  allItemsCount: number;
  myItemsCount: number;
  favoritesCount: number;

  // Credit info
  creditInfo: {
    canCreate: boolean;
    source?: string;
    message: string;
    personalCredits?: number;
    communityPotBalance?: number;
  } | null;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({
  selectedTab,
  onTabChange,
  selectedCategories,
  onCategoryChange,
  allItemsCount,
  myItemsCount,
  favoritesCount: favoritesCountProp,
  creditInfo,
}) => {
  const navigate = useNavigate();
  const location = window.location;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { categories, categoryTree } = useCategories();
  const { stats: communityStats } = useCommunityStats();
  const { getFavoritesCount } = useFavoritesContext();

  // Check if we're on the categories page
  const isOnCategoriesPage = location.pathname === '/categories';


  // Use real-time count from context instead of prop
  const favoritesCount = getFavoritesCount();

  // Calculate total_usage_count for each category (including children)
  const categoriesWithCounts = React.useMemo(() => {
    const calculateTotalUsageCount = (category: any): number => {
      let total = category.usage_count || 0;
      if (category.children && category.children.length > 0) {
        category.children.forEach((child: any) => {
          total += calculateTotalUsageCount(child);
        });
      }
      return total;
    };

    // Build map with total counts
    const countMap = new Map<string, number>();
    categoryTree.forEach(cat => {
      const totalCount = calculateTotalUsageCount(cat);
      countMap.set(cat.id, totalCount);
      // Also count children recursively
      const addChildrenToMap = (c: any) => {
        if (c.children) {
          c.children.forEach((child: any) => {
            countMap.set(child.id, calculateTotalUsageCount(child));
            addChildrenToMap(child);
          });
        }
      };
      addChildrenToMap(cat);
    });

    return countMap;
  }, [categoryTree]);

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return <Globe size={16} />;
    return getCategoryIconBySlug(category.slug, 16);
  };

  const getCategoryCount = (categoryId: string): number => {
    return categoriesWithCounts.get(categoryId) || 0;
  };

  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id);
  };

  // Filter categories: only show those with items AND match search
  const displayCategories = useMemo(() => {
    const filterCategoriesWithItems = (cats: any[]): any[] => {
      return cats.filter(cat => {
        const count = getCategoryCount(cat.id);
        if (count === 0) return false;

        // Filter children
        if (cat.children && cat.children.length > 0) {
          cat.children = cat.children.filter((child: any) => {
            const childCount = getCategoryCount(child.id);
            return childCount > 0;
          });
        }

        return true;
      });
    };

    return filterCategoriesWithItems(categoryTree);
  }, [categoryTree, categoriesWithCounts]);

  // Get the actually selected category (for dropdown display)
  const actualSelectedCategory = React.useMemo(() => {
    if (selectedCategories.length === 1) {
      const selectedId = selectedCategories[0];

      // Recursive search through entire tree
      const findCategory = (cats: any[]): any => {
        for (const cat of cats) {
          if (cat.id === selectedId) return cat;
          if (cat.children) {
            const found = findCategory(cat.children);
            if (found) return found;
          }
        }
        return null;
      };

      return findCategory(categoryTree);
    }
    return null;
  }, [selectedCategories, categoryTree]);

  // Get subcategories when a category is selected (for chips/buttons)
  const selectedCategory = React.useMemo(() => {
    if (selectedCategories.length === 1) {
      const selectedId = selectedCategories[0];

      // First check if it's a top-level category
      const topLevel = categoryTree.find(cat => cat.id === selectedId);
      if (topLevel) return topLevel;

      // If not, find the parent category (for subcategories)
      for (const cat of categoryTree) {
        if (cat.children) {
          const findInChildren = (children: any[]): any => {
            for (const child of children) {
              if (child.id === selectedId) return cat; // Return parent
              if (child.children) {
                const found = findInChildren(child.children);
                if (found) return found;
              }
            }
            return null;
          };
          const found = findInChildren(cat.children);
          if (found) return found;
        }
      }
    }
    return null;
  }, [selectedCategories, categoryTree]);

  const subcategories = selectedCategory?.children || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
      {/* Main Navigation Row */}
      <Box sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 0 : 1.5,
        justifyContent: 'space-between',
        width: '100%',
        mx: 0,
        px: 0,
      }}>
        {/* Kategorien Button & Tabs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 0.5 }}>
        <Tabs
          value={isOnCategoriesPage ? false : selectedTab}
          onChange={(_, value) => {
            onTabChange(value);
          }}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            minHeight: isMobile ? 48 : 48,
            flex: 1,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTabs-flexContainer': {
              gap: 0,
              height: isMobile ? 48 : 48,
            },
            '& .MuiTab-root': {
              minHeight: isMobile ? 48 : 48,
              textTransform: 'none',
              fontSize: isMobile ? '0.8125rem' : '0.875rem',
              fontWeight: 600,
              minWidth: isMobile ? 'auto' : 90,
              px: isMobile ? 1 : 2,
              py: 1,
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'rgba(25, 118, 210, 0.04)',
              },
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700,
              }
            }
          }}
        >
          {/* Desktop: Alle Tab with Dropdown */}
          {!isMobile && (
            <Tab
              icon={<Globe size={16} />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Select
                    value={actualSelectedCategory ? actualSelectedCategory.id : 'all'}
                    onChange={(e) => {
                      e.stopPropagation();
                      const value = e.target.value;
                      onCategoryChange(value === 'all' ? null : value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    variant="standard"
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: '70vh',
                        },
                      },
                    }}
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'inherit',
                      '&:before': { display: 'none' },
                      '&:after': { display: 'none' },
                      '& .MuiSelect-select': {
                        padding: 0,
                        paddingRight: '20px !important',
                        display: 'flex',
                        alignItems: 'center',
                      },
                      '& .MuiSelect-icon': {
                        right: -2,
                      },
                    }}
                    renderValue={(value) => {
                      if (value !== 'all' && actualSelectedCategory) {
                        return getCategoryName(actualSelectedCategory, 'de');
                      }
                      return 'Alle';
                    }}
                  >
                    <MenuItem value="all">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Globe size={16} />
                        <span>Alle</span>
                      </Box>
                    </MenuItem>
                    {displayCategories.map(category => (
                      <MenuItem
                        key={category.id}
                        value={category.id}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2, alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getCategoryIcon(category.id)}
                            <span>
                              {getCategoryName(category, 'de')}
                            </span>
                          </Box>
                          <span style={{ opacity: 0.6, fontSize: '0.875rem' }}>
                            {getCategoryCount(category.id)}
                          </span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              }
            />
          )}
          {/* Category Tab - Both Desktop and Mobile */}
          <Tab
            icon={!isMobile ? <FolderTree size={16} /> : undefined}
            iconPosition="start"
            label={
              isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                  <FolderTree size={20} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Kategorien</span>
                </Box>
              ) : (
                <span style={{ fontWeight: 500 }}>Kategorien</span>
              )
            }
            onClick={(e) => {
              e.preventDefault();
              navigate('/categories');
            }}
            sx={{
              ...(isOnCategoriesPage && {
                color: 'primary.main',
                fontWeight: 700,
                borderBottom: '3px solid',
                borderColor: 'primary.main',
              })
            }}
          />
          {/* Mobile: Alle/Filter Tab with Dropdown */}
          {isMobile && (
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Select
                    value={selectedCategory ? selectedCategory.id : 'all'}
                    onChange={(e) => {
                      e.stopPropagation();
                      const value = e.target.value;
                      onCategoryChange(value === 'all' ? null : value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    variant="standard"
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: '70vh',
                        },
                      },
                    }}
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'inherit',
                      '&:before': { display: 'none' },
                      '&:after': { display: 'none' },
                      '& .MuiSelect-select': {
                        padding: 0,
                        paddingRight: '18px !important',
                        display: 'flex',
                        alignItems: 'center',
                      },
                      '& .MuiSelect-icon': {
                        right: -4,
                        fontSize: 18,
                      },
                    }}
                    renderValue={(value) => {
                      if (value === 'all') {
                        return (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                            <Globe size={20} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Alle</span>
                          </Box>
                        );
                      }
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                          {getCategoryIconBySlug(getCategoryById(value)?.slug || '', 20)}
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Gefiltert</span>
                        </Box>
                      );
                    }}
                  >
                    <MenuItem value="all">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Globe size={16} />
                        <span>Alle</span>
                      </Box>
                    </MenuItem>
                    {displayCategories.map(category => (
                      <MenuItem
                        key={category.id}
                        value={category.id}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2, alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getCategoryIcon(category.id)}
                            <span>
                              {getCategoryName(category, 'de')}
                            </span>
                          </Box>
                          <span style={{ opacity: 0.6, fontSize: '0.75rem', fontWeight: 600 }}>
                            {getCategoryCount(category.id)}
                          </span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              }
            />
          )}
          <Tab
            icon={isMobile ? undefined : <User size={16} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', position: 'relative' }}>
                {isMobile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <User size={20} />
                      {myItemsCount > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -6,
                            right: -14,
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: '10px',
                            px: 0.5,
                            minWidth: 18,
                            height: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            border: '2px solid white',
                          }}
                        >
                          {myItemsCount > 99 ? '99' : myItemsCount}
                        </Box>
                      )}
                    </Box>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Meine</span>
                  </Box>
                ) : (
                  <>
                    <span style={{ fontWeight: 500 }}>Meine</span>
                    {myItemsCount > 0 && (
                      <Box
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          borderRadius: 2.5,
                          px: 0.75,
                          py: 0.125,
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          minWidth: 20,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        {myItemsCount > 999 ? '999+' : myItemsCount}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            }
          />
          <Tab
            icon={isMobile ? undefined : <Heart size={16} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.25 : 0.75, justifyContent: 'center' }}>
                {isMobile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Heart size={20} />
                      {favoritesCount > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -6,
                            right: -14,
                            bgcolor: 'error.main',
                            color: 'white',
                            borderRadius: '10px',
                            px: 0.5,
                            minWidth: 18,
                            height: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            border: '2px solid white',
                          }}
                        >
                          {favoritesCount > 99 ? '99' : favoritesCount}
                        </Box>
                      )}
                    </Box>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Favoriten</span>
                  </Box>
                ) : (
                  <>
                    <span style={{ fontWeight: 500 }}>Favoriten</span>
                    {favoritesCount > 0 && (
                      <Box
                        sx={{
                          bgcolor: 'error.main',
                          color: 'white',
                          borderRadius: 2.5,
                          px: 0.75,
                          py: 0.125,
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          minWidth: 20,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        {favoritesCount > 999 ? '999+' : favoritesCount}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Community Stats - Hide on Mobile */}
      {creditInfo && !isMobile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {/* Personal Credits */}
          {creditInfo.personalCredits !== undefined && creditInfo.personalCredits > 0 && (
            <Chip
              icon={<Coins size={14} />}
              label={`${creditInfo.personalCredits} Guthaben`}
              size="small"
              onClick={() => navigate('/settings?section=tokens')}
              sx={{
                height: 24,
                bgcolor: 'rgba(102, 126, 234, 0.08)',
                color: '#667eea',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '& .MuiChip-icon': {
                  color: '#667eea',
                  fontSize: 14,
                },
                '&:hover': {
                  bgcolor: 'rgba(102, 126, 234, 0.16)',
                  transform: 'scale(1.02)',
                },
              }}
            />
          )}

          {/* Community Balance */}
          {communityStats && communityStats.totalBalance > 0 && (
            <Chip
              icon={<Heart size={14} fill="currentColor" />}
              label={`${communityStats.totalBalance} Community`}
              size="small"
              onClick={() => navigate('/tokens?tab=community')}
              sx={{
                height: 24,
                bgcolor: 'rgba(76, 175, 80, 0.08)',
                color: 'success.main',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '& .MuiChip-icon': {
                  color: 'success.main',
                  fontSize: 14,
                },
                '&:hover': {
                  bgcolor: 'rgba(76, 175, 80, 0.16)',
                  transform: 'scale(1.02)',
                },
              }}
            />
          )}

          {(!creditInfo.personalCredits || creditInfo.personalCredits === 0) && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.38)', marginLeft: '8px' }}>
              Kein Guthaben verfügbar
            </span>
          )}
        </Box>
      )}
      </Box>

      {/* Subcategories - Chips for Desktop, Dropdown for Mobile */}
      {subcategories.length > 0 && (
        <>
          {/* Desktop: Chips */}
          {!isMobile && (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                px: 2,
                py: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: 6,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 3,
                },
              }}
            >
              {subcategories.map((subcat: any) => {
                const count = getCategoryCount(subcat.id);
                return (
                  <Chip
                    key={subcat.id}
                    icon={getCategoryIcon(subcat.id)}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>{getCategoryName(subcat, 'de')}</span>
                        {count > 0 && (
                          <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>({count})</span>
                        )}
                      </Box>
                    }
                    onClick={() => onCategoryChange(subcat.id)}
                    sx={{
                      height: 32,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '& .MuiChip-icon': {
                        fontSize: 16,
                        marginLeft: 1,
                      },
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderColor: 'primary.main',
                        transform: 'translateY(-1px)',
                        boxShadow: 1,
                        '& .MuiChip-icon': {
                          color: 'white',
                        },
                      },
                    }}
                  />
                );
              })}
            </Box>
          )}

        </>
      )}
    </Box>
  );
};
