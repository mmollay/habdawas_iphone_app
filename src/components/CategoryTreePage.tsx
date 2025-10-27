import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandAllIcon from '@mui/icons-material/UnfoldMore';
import CollapseAllIcon from '@mui/icons-material/UnfoldLess';
import DownloadIcon from '@mui/icons-material/Download';
import CategoryTree from './Common/CategoryTree';
import { MainNavigation } from './Common/MainNavigation';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCreditCheck } from '../hooks/useCreditCheck';
import { supabase } from '../lib/supabase';

const CategoryTreePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkCredit } = useCreditCheck();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchQuery, setSearchQuery] = useState('');
  const [showUsageCount, setShowUsageCount] = useState(true);
  const [expandAll, setExpandAll] = useState(false);
  const [showOnlyWithItems, setShowOnlyWithItems] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{
    canCreate: boolean;
    source?: string;
    message: string;
    personalCredits?: number;
    communityPotBalance?: number;
  } | null>(null);

  // Item counts for navigation
  const [allItemsCount, setAllItemsCount] = useState(0);
  const [myItemsCount, setMyItemsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Load credit info
  useEffect(() => {
    if (user) {
      checkCredit().then(setCreditInfo);
    } else {
      setCreditInfo(null);
    }
  }, [user, checkCredit]);

  // Load item counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        // All items count
        const { count: allCount } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true });

        if (allCount !== null) setAllItemsCount(allCount);

        if (user) {
          // My items count
          const { count: myCount } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (myCount !== null) setMyItemsCount(myCount);

          // Favorites count
          const { count: favCount } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (favCount !== null) setFavoritesCount(favCount);
        } else {
          setMyItemsCount(0);
          setFavoritesCount(0);
        }
      } catch (error) {
        console.error('Error loading counts:', error);
      }
    };

    loadCounts();
  }, [user]);

  const handleCategoryClick = (categorySlug: string) => {
    // Navigate to items page with category filter
    navigate(`/?categories=${categorySlug}`);
  };

  const handleExportTree = async () => {
    try {
      // Fetch all categories from database
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (!data) return;

      // Build tree structure
      const buildTree = (categories: any[]): string => {
        const categoryMap = new Map();
        categories.forEach(cat => {
          categoryMap.set(cat.id, { ...cat, children: [] });
        });

        const rootCategories: any[] = [];
        categories.forEach(cat => {
          const category = categoryMap.get(cat.id);
          if (cat.parent_id === null) {
            rootCategories.push(category);
          } else {
            const parent = categoryMap.get(cat.parent_id);
            if (parent) {
              parent.children.push(category);
            }
          }
        });

        // Generate tree text
        let treeText = 'HABDAWAS Kategorien-Struktur\\n';
        treeText += '='.repeat(50) + '\\n\\n';

        const renderCategory = (cat: any, depth: number = 0): string => {
          const indent = '  '.repeat(depth);
          const name = cat.translations?.de?.name || cat.slug;
          const levelColors = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
          let line = `${indent}${depth === 0 ? '■ ' : '└─ '}${name} [${levelColors[cat.level - 1]}]`;

          if (cat.usage_count > 0) {
            line += ` (${cat.usage_count} Inserate)`;
          }

          line += '\\n';

          if (cat.children && cat.children.length > 0) {
            cat.children.forEach((child: any) => {
              line += renderCategory(child, depth + 1);
            });
          }

          return line;
        };

        rootCategories.forEach(cat => {
          treeText += renderCategory(cat);
          treeText += '\\n';
        });

        treeText += '\\n' + '='.repeat(50) + '\\n';
        treeText += `Gesamt: ${categories.length} Kategorien\\n`;
        treeText += `Level 1: ${categories.filter(c => c.level === 1).length} Kategorien\\n`;
        treeText += `Level 2: ${categories.filter(c => c.level === 2).length} Kategorien\\n`;
        treeText += `Level 3: ${categories.filter(c => c.level === 3).length} Kategorien\\n`;
        treeText += `Level 4: ${categories.filter(c => c.level === 4).length} Kategorien\\n`;
        treeText += `\\nExportiert am: ${new Date().toLocaleString('de-DE')}\\n`;

        return treeText;
      };

      const treeText = buildTree(data);

      // Create download
      const blob = new Blob([treeText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kategorien-struktur-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting tree:', err);
      alert('Fehler beim Exportieren der Kategorien-Struktur');
    }
  };

  const handleTabChange = (newValue: number) => {
    if (newValue === 0) navigate('/');
    else if (newValue === 1) navigate('/?view=myitems');
    else if (newValue === 2) navigate('/?view=favorites');
  };

  const handleCategoryChange = (categoryId: string | null) => {
    if (categoryId) {
      navigate(`/?categories=${categoryId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      {/* Navigation - EXAKT wie auf Homepage */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          mb: 0
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: '1400px !important' }}>
          <MainNavigation
            selectedTab={0}
            onTabChange={handleTabChange}
            selectedCategories={[]}
            onCategoryChange={handleCategoryChange}
            allItemsCount={allItemsCount}
            myItemsCount={myItemsCount}
            favoritesCount={favoritesCount}
            creditInfo={creditInfo}
          />
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ py: isMobile ? 0 : 4, px: isMobile ? 0 : 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: isMobile ? 0 : 4,
          pb: isMobile ? 1.5 : 3,
          borderBottom: isMobile ? 'none' : '2px solid',
          borderColor: 'divider',
          background: isMobile ? 'none' : 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
          borderRadius: isMobile ? 0 : 2,
          p: isMobile ? 1.5 : 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 2, mb: isMobile ? 0 : 2 }}>
          <Box
            sx={{
              p: isMobile ? 0.75 : 1.5,
              borderRadius: isMobile ? 1.5 : 2,
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isMobile ? 'none' : '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            <AccountTreeIcon sx={{ fontSize: isMobile ? 22 : 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h4'} component="h1" sx={{ fontWeight: isMobile ? 600 : 700, mb: isMobile ? 0 : 0.5 }}>
              Kategorien
            </Typography>
            {!isMobile && (
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Übersicht über alle verfügbaren Kategorien
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {isMobile && <Divider />}

      {/* Controls */}
      <Box
        sx={{
          p: isMobile ? 1.5 : 3,
          mb: isMobile ? 0 : 3,
          borderRadius: isMobile ? 0 : 2,
          border: isMobile ? 'none' : '1px solid',
          borderColor: 'divider',
          bgcolor: isMobile ? 'transparent' : 'background.paper',
          boxShadow: isMobile ? 'none' : 2
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1.5 : 2.5 }}>
          {/* Search */}
          <TextField
            fullWidth
            placeholder="Kategorien durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          <Divider />

          {/* Options */}
          <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showUsageCount}
                    onChange={(e) => setShowUsageCount(e.target.checked)}
                    size={isMobile ? 'small' : 'medium'}
                  />
                }
                label="Anzahl anzeigen"
                componentsProps={{
                  typography: {
                    variant: isMobile ? 'body2' : 'body1',
                    sx: {
                      fontSize: isMobile ? '0.875rem' : undefined,
                      fontWeight: isMobile ? 400 : undefined,
                      color: isMobile ? 'text.secondary' : undefined
                    }
                  }
                }}
                sx={{ m: 0 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyWithItems}
                    onChange={(e) => setShowOnlyWithItems(e.target.checked)}
                    size={isMobile ? 'small' : 'medium'}
                  />
                }
                label="Nur mit Inseraten"
                componentsProps={{
                  typography: {
                    variant: isMobile ? 'body2' : 'body1',
                    sx: {
                      fontSize: isMobile ? '0.875rem' : undefined,
                      fontWeight: isMobile ? 400 : undefined,
                      color: isMobile ? 'text.secondary' : undefined
                    }
                  }
                }}
                sx={{ m: 0 }}
              />
            </Box>

            <Button
              variant={expandAll ? 'contained' : 'outlined'}
              startIcon={expandAll ? <CollapseAllIcon /> : <ExpandAllIcon />}
              onClick={() => setExpandAll(!expandAll)}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                minWidth: isMobile ? 'auto' : 180,
                fontWeight: 600,
                boxShadow: expandAll ? 2 : 0,
                fontSize: isMobile ? '0.75rem' : undefined,
                px: isMobile ? 1.5 : undefined,
                py: isMobile ? 0.5 : undefined
              }}
            >
              {isMobile ? (expandAll ? 'Einklappen' : 'Ausklappen') : (expandAll ? 'Alle einklappen' : 'Alle ausklappen')}
            </Button>
          </Box>
        </Box>
      </Box>

      {isMobile && <Divider />}

      {/* Category Tree */}
      <Box sx={{ mb: isMobile ? 0 : 4, p: isMobile ? 1.5 : 0 }}>
        <CategoryTree
          searchQuery={searchQuery}
          showUsageCount={showUsageCount}
          expandAll={expandAll}
          showOnlyWithItems={showOnlyWithItems}
          onCategoryClick={handleCategoryClick}
        />
      </Box>

      {isMobile && <Divider />}

      {/* Info Box */}
      <Box
        sx={{
          p: isMobile ? 1.5 : 3,
          background: isMobile ? 'transparent' : 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(255, 255, 255, 1) 100%)',
          borderRadius: isMobile ? 0 : 2,
          border: isMobile ? 'none' : '1px solid',
          borderColor: 'primary.light',
          boxShadow: isMobile ? 'none' : 2
        }}
      >
        <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: 'primary.main' }}>
          Kategorien-Legende
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#1976d2',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Level 1</Typography>
              <Typography variant="caption" color="text.secondary">Hauptkategorie</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#388e3c',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(56, 142, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Level 2</Typography>
              <Typography variant="caption" color="text.secondary">Unterkategorie</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#f57c00',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(245, 124, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Level 3</Typography>
              <Typography variant="caption" color="text.secondary">Detailkategorie</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#d32f2f',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Level 4</Typography>
              <Typography variant="caption" color="text.secondary">Spezifikation</Typography>
            </Box>
          </Box>
        </Box>

        {/* Diskreter Export-Button am Ende */}
        {!isMobile && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="text"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportTree}
              sx={{
                fontSize: '0.75rem',
                color: 'text.disabled',
                opacity: 0.4,
                textTransform: 'none',
                '&:hover': {
                  opacity: 0.8,
                  color: 'primary.main',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Struktur exportieren
            </Button>
          </Box>
        )}
      </Box>
      </Container>
    </>
  );
};

export default CategoryTreePage;
