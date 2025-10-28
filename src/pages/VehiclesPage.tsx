import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, CircularProgress, ToggleButtonGroup, ToggleButton, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Car, Grid3x3, List as ListIcon, Image, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { MainNavigation } from '../components/Common/MainNavigation';
import { ItemGrid } from '../components/Items/ItemGrid';
import { ItemList } from '../components/Items/ItemList';
import { ItemGallery } from '../components/Items/ItemGallery';
import { supabase, Item } from '../lib/supabase';
import { SPECIAL_CATEGORIES } from '../types/special-categories';
import { useCategories } from '../hooks/useCategories';

export const VehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { categories } = useCategories();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'gallery'>('grid');

  const vehicleCategory = SPECIAL_CATEGORIES.find(cat => cat.type === 'vehicle');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      if (!vehicleCategory) {
        console.error('Vehicle category not found');
        setLoading(false);
        return;
      }

      // Use the RPC function to get items from this category and all subcategories
      const { data: itemIds, error: rpcError } = await supabase
        .rpc('search_items_with_attributes', {
          p_category_id: vehicleCategory.id,
          p_filters: []
        });

      if (rpcError) {
        console.error('Error loading vehicles:', rpcError);
        setLoading(false);
        return;
      }

      if (!itemIds || itemIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch the actual items
      const { data: vehicleItems, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .in('id', itemIds.map((row: any) => row.item_id))
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      setItems(vehicleItems || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'grid' | 'list' | 'gallery' | null) => {
    if (newMode) {
      setViewMode(newMode);
      localStorage.setItem('viewMode', newMode);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        onNavigate={(page) => {
          if (page === 'messages') navigate('/messages');
          else if (page === 'settings') navigate('/settings');
          else if (page === 'upload') navigate('/upload');
          else navigate('/');
        }}
        onLoginClick={() => {}}
        onUploadClick={() => navigate('/upload')}
        showSearch={false}
      />

      <MainNavigation
        selectedTab={0}
        onTabChange={() => {}}
        selectedCategories={[]}
        onCategoryChange={() => {}}
        allItemsCount={items.length}
        myItemsCount={0}
        favoritesCount={0}
        creditInfo={null}
      />

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        {/* Page Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Car size={32} color={theme.palette.primary.main} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Fahrzeuge
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Lädt...' : `${items.length} ${items.length === 1 ? 'Fahrzeug' : 'Fahrzeuge'}`}
            </Typography>
          </Box>
        </Box>

        {/* Toolbar */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {items.length} {items.length === 1 ? 'Artikel' : 'Artikel'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* View Mode Selector */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  border: '1.5px solid',
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                  borderRadius: 5,
                  width: isMobile ? 36 : 40,
                  height: isMobile ? 36 : 40,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderColor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="grid" aria-label="Gitteransicht">
                <Grid3x3 size={isMobile ? 18 : 20} />
              </ToggleButton>
              <ToggleButton value="list" aria-label="Listenansicht">
                <ListIcon size={isMobile ? 18 : 20} />
              </ToggleButton>
              <ToggleButton value="gallery" aria-label="Galerieansicht">
                <Image size={isMobile ? 18 : 20} />
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Reload Button */}
            <IconButton
              onClick={loadVehicles}
              sx={{
                borderRadius: 5,
                border: '1.5px solid',
                borderColor: 'rgba(0, 0, 0, 0.12)',
                color: 'text.primary',
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <RefreshCw size={isMobile ? 18 : 20} />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Car size={64} color={theme.palette.text.disabled} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              Noch keine Fahrzeuge verfügbar
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Schau später noch einmal vorbei!
            </Typography>
          </Box>
        ) : (
          <>
            {viewMode === 'grid' && (
              <ItemGrid
                items={items}
                allItems={items}
              />
            )}
            {viewMode === 'list' && (
              <ItemList
                items={items}
                allItems={items}
              />
            )}
            {viewMode === 'gallery' && (
              <ItemGallery
                items={items}
                allItems={items}
              />
            )}
          </>
        )}
      </Container>

      <Footer />
    </Box>
  );
};
