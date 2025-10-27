import React from 'react';
import {
  Box,
  Tab,
  Tabs,
  Button,
  Select,
  MenuItem,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Globe, User, Heart, Coins, Car, Home, Sofa, Apple, Dumbbell, Shirt, Baby, PawPrint, Briefcase, Store, Sprout, Factory, Cloud, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCategories } from '../../hooks/useCategories';
import { useCommunityStats } from '../../hooks/useCommunityStats';
import { getCategoryName } from '../../utils/categories';

interface NavigationTabsProps {
  selectedTab?: number;
  onTabChange?: (tab: number) => void;
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  showCategoryDropdown?: boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  selectedTab = 0,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  showCategoryDropdown = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { categories, categoryTree } = useCategories();
  const { totalBalance } = useCommunityStats();

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return <Globe size={16} />;

    const slug = category.slug;
    const iconMap: Record<string, JSX.Element> = {
      'fahrzeuge': <Car size={16} />,
      'immobilien': <Home size={16} />,
      'haushalt-moebel': <Sofa size={16} />,
      'elektronik': <Apple size={16} />,
      'freizeit-sport': <Dumbbell size={16} />,
      'mode-lifestyle': <Shirt size={16} />,
      'kinder-familie': <Baby size={16} />,
      'tiere': <PawPrint size={16} />,
      'arbeit': <Briefcase size={16} />,
      'marktplatz': <Store size={16} />,
      'landwirtschaft': <Sprout size={16} />,
      'industrie': <Factory size={16} />,
      'digitale-produkte': <Cloud size={16} />,
    };
    return iconMap[slug] || <Globe size={16} />;
  };

  const getCategoryCount = (categoryId: string): number => {
    // This would need to be implemented based on your data structure
    return 0;
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (onTabChange) {
      onTabChange(newValue);
    }

    // Navigate based on tab
    if (newValue === 0) navigate('/');
    else if (newValue === 1) navigate('/?tab=my');
    else if (newValue === 2) navigate('/?tab=favorites');
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 2,
      alignItems: isMobile ? 'stretch' : 'center',
      justifyContent: 'space-between',
      mb: 3
    }}>
      {/* Tabs & Category Dropdown */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ minHeight: 40 }}
        >
          <Tab
            icon={showCategoryDropdown && selectedCategory ? getCategoryIcon(selectedCategory) : <Globe size={16} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {isMobile && showCategoryDropdown ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {selectedCategory ? getCategoryIcon(selectedCategory) : <Globe size={16} />}
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
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        '& .MuiSelect-select': {
                          py: 0.5,
                          pr: 3,
                          pl: 0,
                        },
                        '& fieldset': { border: 'none' },
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
                  </Box>
                ) : (
                  showCategoryDropdown && selectedCategory ? getCategoryName(categories.find(c => c.id === selectedCategory)!, 'de') : 'Alle'
                )}
              </Box>
            }
            sx={{ minHeight: 40, textTransform: 'none' }}
          />
          <Tab
            icon={<User size={16} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Meine
                {user && <Badge badgeContent={15} color="primary" sx={{ ml: 0.5 }} />}
              </Box>
            }
            sx={{ minHeight: 40, textTransform: 'none' }}
          />
          <Tab
            icon={<Heart size={16} />}
            iconPosition="start"
            label="Favoriten"
            sx={{ minHeight: 40, textTransform: 'none' }}
          />
        </Tabs>
      </Box>

      {/* Community Stats Buttons */}
      {user && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="text"
            startIcon={<Coins size={16} />}
            onClick={() => navigate('/settings?tab=credits')}
            sx={{
              textTransform: 'none',
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            {user.credits || 0} Guthaben
          </Button>
          <Button
            variant="text"
            startIcon={<Coins size={16} style={{ color: 'green' }} />}
            onClick={() => navigate('/settings?tab=community')}
            sx={{
              textTransform: 'none',
              color: 'success.main',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            {totalBalance || 0} Community
          </Button>
        </Box>
      )}
    </Box>
  );
};
