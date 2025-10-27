import React from 'react';
import {
  Box,
  Tab,
  Tabs,
  IconButton,
  Chip,
  Select,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Globe, User, Heart, Coins, FolderTree } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useCommunityStats } from '../../hooks/useCommunityStats';
import { getCategoryName } from '../../utils/categories';
import { getCategoryIconBySlug } from '../../utils/categoryIcons';

interface NavigationTabsProps {
  selectedTab?: number;
  onTabChange?: (tab: number) => void;
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  showCategoryDropdown?: boolean;
  allItemsCount?: number;
  myItemsCount?: number;
  favoritesCount?: number;
  creditInfo?: {
    canCreate: boolean;
    source?: string;
    message: string;
    personalCredits?: number;
    communityPotBalance?: number;
  } | null;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  selectedTab = 0,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  showCategoryDropdown = true,
  allItemsCount = 0,
  myItemsCount = 0,
  favoritesCount = 0,
  creditInfo = null,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { categories, categoryTree } = useCategories();
  const { stats: communityStats } = useCommunityStats();

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return <Globe size={16} />;
    return getCategoryIconBySlug(category.slug, 16);
  };

  const getCategoryCount = (categoryId: string): number => {
    // This would need to be implemented based on your data structure
    return 0;
  };

  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (onTabChange) {
      onTabChange(newValue);
    }

    // Default navigation if no custom handler provided
    if (!onTabChange) {
      if (newValue === 0) navigate('/');
      else if (newValue === 1) navigate('/?tab=my');
      else if (newValue === 2) navigate('/?tab=favorites');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 0 : 3, justifyContent: 'space-between', width: '100%' }}>
      {/* Kategorien Button & Tabs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={() => navigate('/categories')}
          sx={{
            color: 'text.primary',
            border: '1.5px solid',
            borderColor: 'rgba(0, 0, 0, 0.12)',
            borderRadius: 2,
            width: 40,
            height: 40,
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'rgba(25, 118, 210, 0.08)',
            }
          }}
          title="Kategorien"
        >
          <FolderTree size={20} />
        </IconButton>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          allowScrollButtonsMobile
          sx={{
            minHeight: isMobile ? 44 : 52,
            flex: isMobile ? 'none' : 1,
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: '2px 2px 0 0',
            },
            '& .MuiTab-root': {
              minHeight: isMobile ? 44 : 52,
              textTransform: 'none',
              fontSize: isMobile ? '0.8125rem' : '0.875rem',
              fontWeight: 600,
              minWidth: isMobile ? 'auto' : 100,
              px: isMobile ? 1.5 : 2.5,
              py: isMobile ? 0.75 : 1,
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
          <Tab
            icon={isMobile ? undefined : (selectedCategory ? getCategoryIcon(selectedCategory) : <Globe size={16} />)}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {isMobile ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {selectedCategory ? getCategoryIcon(selectedCategory) : <Globe size={16} />}
                    {showCategoryDropdown ? (
                      <Select
                        value={selectedCategory || 'all'}
                        onChange={(e) => {
                          e.stopPropagation();
                          const value = e.target.value;
                          if (onCategoryChange) {
                            onCategoryChange(value === 'all' ? '' : value);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        variant="standard"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 'none',
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
                            paddingRight: '20px !important',
                            display: 'flex',
                            alignItems: 'center',
                          },
                          '& .MuiSelect-icon': {
                            right: -2,
                          },
                        }}
                        renderValue={(value) => {
                          if (value === 'all') return 'Alle';
                          const cat = categories.find(c => c.id === value);
                          return cat ? getCategoryName(cat, 'de') : value;
                        }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Globe size={16} />
                            <span>Alle</span>
                          </Box>
                        </MenuItem>
                        {categoryTree.map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2, alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getCategoryIcon(category.id)}
                                <span>{getCategoryName(category, 'de')}</span>
                              </Box>
                              <span style={{ opacity: 0.6 }}>{getCategoryCount(category.id)}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <span>Alle</span>
                    )}
                  </Box>
                ) : (
                  <>
                    {showCategoryDropdown ? (
                      <Select
                        value={selectedCategory || 'all'}
                        onChange={(e) => {
                          e.stopPropagation();
                          const value = e.target.value;
                          if (onCategoryChange) {
                            onCategoryChange(value === 'all' ? '' : value);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        variant="standard"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 'none',
                            },
                          },
                        }}
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
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
                          if (value === 'all') return 'Alle';
                          const cat = categories.find(c => c.id === value);
                          return cat ? getCategoryName(cat, 'de') : value;
                        }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Globe size={16} />
                            <span>Alle</span>
                          </Box>
                        </MenuItem>
                        {categoryTree.map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2, alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getCategoryIcon(category.id)}
                                <span>{getCategoryName(category, 'de')}</span>
                              </Box>
                              <span style={{ opacity: 0.6 }}>{getCategoryCount(category.id)}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <span>Alle</span>
                    )}
                    {!selectedCategory && selectedTab === 0 && allItemsCount > 0 && (
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
                        {allItemsCount > 999 ? '999+' : allItemsCount}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            }
          />
          <Tab
            icon={isMobile ? undefined : <User size={16} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {isMobile ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <User size={16} />
                    <span>Meine</span>
                  </Box>
                ) : (
                  <span>Meine</span>
                )}
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
              </Box>
            }
          />
          <Tab
            icon={isMobile ? undefined : <Heart size={16} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {isMobile ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Heart size={16} />
                    <span>Favoriten</span>
                  </Box>
                ) : (
                  <span>Favoriten</span>
                )}
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
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Community Stats - RECHTSBÜNDIG */}
      {creditInfo && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: isMobile ? 2 : 0,
            py: isMobile ? 1.25 : 0,
            borderTop: isMobile ? '1px solid' : 'none',
            borderColor: 'divider',
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
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
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', ml: 1 }}>
              Kein Guthaben verfügbar
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
