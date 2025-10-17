import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Fab,
  Box,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Drawer,
  Paper,
  TextField,
  Chip,
  Slider,
  useMediaQuery,
  useTheme as useMuiTheme,
  InputAdornment,
  Button,
  Tab,
  Tabs,
  Badge,
} from '@mui/material';
import { Camera, Grid3x3, List, Filter, Search, X, Globe, User, ArrowUp, Heart, ArrowUpDown, XCircle, Image, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HandPreferenceProvider, useHandPreference } from './contexts/HandPreferenceContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { LoginDialog } from './components/Auth/LoginDialog';
import { OnboardingWizard } from './components/Onboarding/OnboardingWizard';
import { ImageUpload } from './components/Upload/ImageUpload';
import { ItemGrid } from './components/Items/ItemGrid';
import { ItemList } from './components/Items/ItemList';
import { ItemGallery } from './components/Items/ItemGallery';
import { ItemCompactList } from './components/Items/ItemCompactList';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { SearchAutocomplete } from './components/Common/SearchAutocomplete';
import { supabase, Item } from './lib/supabase';
import { useSellerProfiles } from './hooks/useSellerProfiles';

const ItemDetailPage = lazy(() => import('./components/Items/ItemDetailPage').then(m => ({ default: m.ItemDetailPage })));
const ItemEditPage = lazy(() => import('./components/Items/ItemEditPage').then(m => ({ default: m.ItemEditPage })));
const ItemCreatePage = lazy(() => import('./components/Items/ItemCreatePage').then(m => ({ default: m.ItemCreatePage })));
const ItemPreviewPage = lazy(() => import('./components/Items/ItemPreviewPage').then(m => ({ default: m.ItemPreviewPage })));
const MessagesPage = lazy(() => import('./components/Messages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const SettingsPage = lazy(() => import('./components/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AGBPage = lazy(() => import('./components/Legal/AGBPage').then(m => ({ default: m.AGBPage })));
const ImpressumPage = lazy(() => import('./components/Legal/ImpressumPage').then(m => ({ default: m.ImpressumPage })));
const DatenschutzPage = lazy(() => import('./components/Legal/DatenschutzPage').then(m => ({ default: m.DatenschutzPage })));
const AboutPage = lazy(() => import('./components/Legal/AboutPage').then(m => ({ default: m.AboutPage })));
const HelpPage = lazy(() => import('./components/Legal/HelpPage').then(m => ({ default: m.HelpPage })));
const NewsPage = lazy(() => import('./components/Legal/NewsPage'));
const CreditPurchasePage = lazy(() => import('./components/Tokens/CreditPurchasePage').then(m => ({ default: m.CreditPurchasePage })));
const TokenSuccessPage = lazy(() => import('./components/Tokens/TokenSuccessPage').then(m => ({ default: m.TokenSuccessPage })));
const AdminPage = lazy(() => import('./components/Admin/AdminPage'));
const ResetPasswordPage = lazy(() => import('./components/Auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const OAuthCallbackPage = lazy(() => import('./components/Auth/OAuthCallbackPage').then(m => ({ default: m.OAuthCallbackPage })));

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#fafafa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

const MainContent = () => {
  const { user, signOut } = useAuth();
  const { handPreference } = useHandPreference();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [loginOpen, setLoginOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache
  const ITEMS_PER_PAGE = 24;
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'gallery' | 'compact'>(() => {
    const saved = localStorage.getItem('viewMode');
    return (saved === 'grid' || saved === 'list' || saved === 'gallery' || saved === 'compact') ? saved : 'grid';
  });
  const [currentPage, setCurrentPage] = useState<'items' | 'messages' | 'settings'>('items');
  const [filterOpen, setFilterOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<string>('manual');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showMyItems, setShowMyItems] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [urlParamsLoaded, setUrlParamsLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const saved = localStorage.getItem('statusFilter');
    return saved ? JSON.parse(saved) : ['draft', 'published', 'paused', 'sold', 'expired'];
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [allItemsCount, setAllItemsCount] = useState(0);
  const [myItemsCount, setMyItemsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [pageVisibleTime, setPageVisibleTime] = useState<number>(Date.now());
  const RELOAD_THRESHOLD = 30000; // 30 seconds
  const [filterChangeTime, setFilterChangeTime] = useState<number>(Date.now());
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [statusFilterExpanded, setStatusFilterExpanded] = useState(() => {
    const saved = localStorage.getItem('statusFilterExpanded');
    return saved ? JSON.parse(saved) : true;
  });

  const userIds = [...new Set(filteredItems.map(item => item.user_id))];
  const { profiles } = useSellerProfiles(userIds);

  const handleViewModeChange = async (newMode: 'grid' | 'list' | 'gallery' | 'compact') => {
    setViewMode(newMode);
    localStorage.setItem('viewMode', newMode);

    if (user) {
      await supabase
        .from('profiles')
        .update({ view_mode_preference: newMode })
        .eq('id', user.id);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    const newFilter = statusFilter.includes(status)
      ? statusFilter.filter(s => s !== status)
      : [...statusFilter, status];
    setStatusFilter(newFilter);
    localStorage.setItem('statusFilter', JSON.stringify(newFilter));
  };

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('view_mode_preference, onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.view_mode_preference && ['grid', 'list', 'gallery', 'compact'].includes(data.view_mode_preference)) {
          setViewMode(data.view_mode_preference as 'grid' | 'list' | 'gallery' | 'compact');
          localStorage.setItem('viewMode', data.view_mode_preference);
        }

        if (data && !data.onboarding_completed) {
          setOnboardingOpen(true);
        }
      }
    };

    loadUserPreferences();
  }, [user]);

  useEffect(() => {
    const loadCounts = async () => {
      if (!user) {
        setAllItemsCount(0);
        setMyItemsCount(0);
        setFavoritesCount(0);
        setStatusCounts({});
        return;
      }

      const [allCountRes, myCountRes, favCountRes, ...statusResults] = await Promise.all([
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        ...['draft', 'published', 'paused', 'sold', 'expired', 'archived'].map((status) =>
          supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', status)
            .then(res => ({ status, count: res.count || 0 }))
        )
      ]);

      setAllItemsCount(allCountRes.count || 0);
      setMyItemsCount(myCountRes.count || 0);
      setFavoritesCount(favCountRes.count || 0);

      const counts: Record<string, number> = {};
      statusResults.forEach((result) => {
        counts[result.status] = result.count;
      });
      setStatusCounts(counts);
    };

    loadCounts();
  }, [user]);

  const loadItems = async (loadMore = false, forceRefresh = false) => {
    // Check cache for initial load
    // Only use cache if we actually have items and a valid lastLoadTime
    if (!loadMore && !forceRefresh && lastLoadTime > 0 && items.length > 0) {
      const now = Date.now();
      const cacheAge = now - lastLoadTime;

      if (cacheAge < CACHE_DURATION) {
        setLoading(false);
        return;
      }
    }

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    }

    const startTime = performance.now();

    try {
      const currentPage = loadMore ? page + 1 : 0;
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('items')
        .select('*');

      if (activeSearchQuery.trim()) {
        const searchTerm = activeSearchQuery.trim();
        const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 0);

        if (searchType === 'title') {
          query = query.ilike('title', `%${searchTerm}%`);
        } else if (searchType === 'category') {
          query = query.eq('category', searchTerm);
        } else if (searchType === 'brand') {
          query = query.eq('brand', searchTerm);
        } else {
          const useAndOperator = searchWords.length >= 3;
          const operator = useAndOperator ? ' & ' : ' | ';
          const tsQueryString = searchWords.map(word => word.replace(/[^\w\säöüÄÖÜß]/g, '')).filter(w => w).join(operator);

          const { data: searchData, error: searchError } = await supabase.rpc('search_items', {
            search_query: tsQueryString
          });

          if (searchError) {
            console.error('Search error:', searchError);
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
          } else {
            const itemIds = searchData?.map((item: any) => item.id) || [];
            if (itemIds.length === 0) {
              setItems([]);
              setFilteredItems([]);
              setHasMore(false);
              setLoading(false);
              setLoadingMore(false);
              return;
            }
            query = query.in('id', itemIds);
          }
        }
      }

      if (selectedCategories.length > 0) {
        query = query.in('category', selectedCategories);
      }

      query = query
        .gte('price', priceRange[0])
        .lte('price', priceRange[1]);

      if (showFavorites && user) {
        const { data: favData, error: favError } = await supabase
          .from('favorites')
          .select('item_id')
          .eq('user_id', user.id);

        if (favError) throw favError;

        const favoriteItemIds = favData?.map(f => f.item_id) || [];

        if (favoriteItemIds.length === 0) {
          setItems([]);
          setFilteredItems([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        query = query
          .in('id', favoriteItemIds)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(from, to);

        const { data, error } = await query;

        if (error) throw error;

        const favoriteItems = data || [];

        if (loadMore) {
          setItems(prev => [...prev, ...favoriteItems]);
          setFilteredItems(prev => [...prev, ...favoriteItems]);
        } else {
          setItems(favoriteItems);
          setFilteredItems(favoriteItems);
        }

        setHasMore(favoriteItems.length === ITEMS_PER_PAGE);
        setPage(currentPage);
        setLoading(false);
        setLoadingMore(false);
        return;
      } else if (showMyItems && user) {
        query = query.eq('user_id', user.id);
        if (statusFilter.length > 0) {
          query = query.in('status', statusFilter);
        }
      } else {
        query = query.eq('status', 'published');
      }

      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
      }

      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      const newItems = data || [];

      if (loadMore) {
        setItems(prev => [...prev, ...newItems]);
        setFilteredItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
        setFilteredItems(newItems);
      }

      setHasMore((data || []).length === ITEMS_PER_PAGE);
      setPage(currentPage);

      if (!loadMore) {
        const endTime = performance.now();
        setLoadTime(Math.round(endTime - startTime));
        setLastLoadTime(Date.now()); // Update cache timestamp
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreItems = () => {
    if (!loadingMore && hasMore) {
      loadItems(true);
    }
  };

  // Initial load on mount
  useEffect(() => {
    if (urlParamsLoaded && !initialLoadComplete) {
      setInitialLoadComplete(true);
      loadItems(false, false);
    }
  }, [urlParamsLoaded]);

  // Load when filters change
  useEffect(() => {
    if (!urlParamsLoaded || !initialLoadComplete) return;

    // Mark that filters have changed
    setFilterChangeTime(Date.now());

    const timer = setTimeout(() => {
      // Only load if page is visible
      if (document.hidden) return;

      // Always force refresh when filters change
      loadItems(false, true);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeSearchQuery, selectedCategories, priceRange, sortBy, statusFilter, showMyItems, showFavorites, user]);

  const allCategories = [...new Set(items.map(item => item.category).filter(Boolean))] as string[];

  const updateURL = (params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(location.search);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });

    const newSearch = newSearchParams.toString();
    navigate(newSearch ? `/?${newSearch}` : '/', { replace: true });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);
    updateURL({ categories: newCategories.length > 0 ? newCategories.join(',') : null });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 10000]);
    setSearchQuery('');
    setActiveSearchQuery('');
    updateURL({
      categories: null,
      minPrice: null,
      maxPrice: null,
      search: null,
      sort: null
    });
  };

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition && location.pathname === '/' && !loading && filteredItems.length > 0) {
      const scrollPos = parseInt(savedScrollPosition);
      let attempts = 0;
      const maxAttempts = 10;

      const attemptScroll = () => {
        window.scrollTo(0, scrollPos);
        attempts++;

        if (attempts < maxAttempts && Math.abs(window.scrollY - scrollPos) > 50) {
          setTimeout(attemptScroll, 100);
        } else if (attempts >= maxAttempts) {
          sessionStorage.removeItem('scrollPosition');
        }
      };

      const initialDelay = setTimeout(() => {
        attemptScroll();
      }, 100);

      return () => {
        clearTimeout(initialDelay);
        if (attempts >= maxAttempts) {
          sessionStorage.removeItem('scrollPosition');
        }
      };
    }
  }, [location.pathname, loading, filteredItems.length]);

  useEffect(() => {
    const saveScrollPosition = () => {
      if (location.pathname === '/') {
        sessionStorage.setItem('scrollPosition', window.scrollY.toString());
      }
    };

    window.addEventListener('scroll', saveScrollPosition);
    return () => window.removeEventListener('scroll', saveScrollPosition);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/') {
      document.title = 'Bazar - Dein Online-Flohmarkt';
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleViewModeChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newMode = customEvent.detail as 'grid' | 'list' | 'gallery';
      setViewMode(newMode);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible
        setPageVisibleTime(Date.now());

        // Only reload if enough time has passed since last load AND no recent filter changes
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTime;
        const timeSinceFilterChange = now - filterChangeTime;

        // Don't reload if:
        // 1. Haven't loaded items yet (lastLoadTime === 0)
        // 2. Not enough time has passed since last load (< 30 seconds)
        // 3. Filters were recently changed (< 2 seconds) - means the useEffect will handle it
        if (items.length > 0 &&
            lastLoadTime > 0 &&
            timeSinceLastLoad >= RELOAD_THRESHOLD &&
            timeSinceFilterChange >= 2000 &&
            urlParamsLoaded) {
          loadItems(false, true);
        }
      }
    };

    window.addEventListener('viewModeChanged', handleViewModeChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('viewModeChanged', handleViewModeChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [items.length, lastLoadTime, filterChangeTime, urlParamsLoaded, RELOAD_THRESHOLD]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  useEffect(() => {
    if (location.pathname === '/messages') {
      setCurrentPage('messages');
    } else if (location.pathname === '/settings') {
      setCurrentPage('settings');
    } else if (location.pathname === '/') {
      setCurrentPage('items');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/') {
      const params = new URLSearchParams(location.search);
      const search = params.get('search') || '';
      const sort = (params.get('sort') as any) || 'newest';
      const minPrice = parseInt(params.get('minPrice') || '0');
      const maxPrice = parseInt(params.get('maxPrice') || '10000');
      const categories = params.get('categories') ? params.get('categories')!.split(',') : [];
      const view = params.get('view');

      const newShowMyItems = view === 'myitems';
      const newShowFavorites = view === 'favorites';

      setSearchQuery(search);
      setActiveSearchQuery(search);
      setSortBy(sort);
      setPriceRange([minPrice, maxPrice]);
      setSelectedCategories(categories);
      setShowMyItems(newShowMyItems);
      setShowFavorites(newShowFavorites);

      if (!urlParamsLoaded) {
        setUrlParamsLoaded(true);
      }
    }
  }, [location.search, location.pathname]);

  if (location.pathname.startsWith('/item/')) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flex: 1 }}>
      <Header
        onNavigate={(page) => {
          if (page === 'items') {
            navigate('/');
          } else if (page === 'messages') {
            navigate('/messages');
          } else if (page === 'settings') {
            navigate('/settings');
          }
        }}
        onLoginClick={() => setLoginOpen(true)}
        onUploadClick={() => navigate('/create')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(query, type) => {
          setSearchQuery(query);
          setActiveSearchQuery(query);
          setSearchType(type || 'manual');
          updateURL({ search: query || null });
          if (currentPage !== 'items') {
            navigate('/');
          }
        }}
        showSearch={true}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentPage === 'messages' ? (
        user ? (
          <Box sx={{
            height: isMobile ? 'calc(100vh - 64px)' : 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <MessagesPage />
          </Box>
        ) : (
          <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Anmeldung erforderlich
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Bitte melde dich an, um deine Nachrichten zu sehen.
            </Typography>
            <Button variant="contained" size="large" onClick={() => setLoginOpen(true)}>
              Jetzt anmelden
            </Button>
          </Container>
        )
      ) : currentPage === 'settings' ? (
        user ? <SettingsPage /> : (
          <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Anmeldung erforderlich
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Bitte melde dich an, um deine Einstellungen zu verwalten.
            </Typography>
            <Button variant="contained" size="large" onClick={() => setLoginOpen(true)}>
              Jetzt anmelden
            </Button>
          </Container>
        )
      ) : (
        <>
          {isMobile && (
            <Paper elevation={1} sx={{ borderRadius: 0, py: 2, px: 2, bgcolor: 'white' }}>
              <SearchAutocomplete
                fullWidth
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={(query, type) => {
                  setSearchQuery(query);
                  setActiveSearchQuery(query);
                  setSearchType(type || 'manual');
                  updateURL({ search: query || null });
                }}
              />
            </Paper>
          )}

          {user && (
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
                <Tabs
                  value={showFavorites ? 2 : showMyItems ? 1 : 0}
                  onChange={(_, value) => {
                    setLoading(true);
                    setItems([]);
                    setFilteredItems([]);
                    setShowMyItems(value === 1);
                    setShowFavorites(value === 2);
                    updateURL({
                      view: value === 1 ? 'myitems' : value === 2 ? 'favorites' : null
                    });
                  }}
                  variant={isMobile ? 'scrollable' : 'standard'}
                  scrollButtons={isMobile ? 'auto' : false}
                  allowScrollButtonsMobile
                  sx={{
                    minHeight: isMobile ? 52 : 60,
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                    },
                    '& .MuiTab-root': {
                      minHeight: isMobile ? 52 : 60,
                      textTransform: 'none',
                      fontSize: isMobile ? '0.875rem' : '0.9375rem',
                      fontWeight: 600,
                      minWidth: isMobile ? 'auto' : 120,
                      px: isMobile ? 2 : 3,
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
                    icon={isMobile ? undefined : <Globe size={20} />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isMobile ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Globe size={18} />
                            <span>Alle</span>
                          </Box>
                        ) : (
                          <span>Alle Inserate</span>
                        )}
                        {!isMobile && allItemsCount > 0 && (
                          <Box
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              borderRadius: 3,
                              px: 1,
                              py: 0.25,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              minWidth: 22,
                              height: 22,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {allItemsCount > 999 ? '999+' : allItemsCount}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <Tab
                    icon={isMobile ? undefined : <User size={20} />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isMobile ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <User size={18} />
                            <span>Meine</span>
                          </Box>
                        ) : (
                          <span>Meine Inserate</span>
                        )}
                        {myItemsCount > 0 && (
                          <Box
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              borderRadius: 3,
                              px: 1,
                              py: 0.25,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              minWidth: 22,
                              height: 22,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {myItemsCount > 999 ? '999+' : myItemsCount}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <Tab
                    icon={isMobile ? undefined : <Heart size={20} />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isMobile ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Heart size={18} />
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
                              borderRadius: 3,
                              px: 1,
                              py: 0.25,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              minWidth: 22,
                              height: 22,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {favoritesCount > 999 ? '999+' : favoritesCount}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </Tabs>
              </Container>
            </Paper>
          )}

          <Container maxWidth="xl" sx={{ py: 3, maxWidth: '1400px !important' }}>

            {items.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  py: 0,
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                  <IconButton
                    onClick={() => setFilterOpen(true)}
                    sx={{
                      borderRadius: 5,
                      border: '1.5px solid',
                      borderColor: 'rgba(0, 0, 0, 0.12)',
                      color: 'text.primary',
                      bgcolor: 'background.paper',
                      p: isMobile ? 1 : 1.25,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        border: '1.5px solid',
                      }
                    }}
                  >
                    <Filter size={isMobile ? 18 : 20} />
                  </IconButton>

                  <IconButton
                    onClick={() => {
                      const sortOrder = ['newest', 'oldest', 'price_asc', 'price_desc'];
                      const currentIndex = sortOrder.indexOf(sortBy);
                      const nextIndex = (currentIndex + 1) % sortOrder.length;
                      const newSort = sortOrder[nextIndex] as any;
                      setSortBy(newSort);
                      updateURL({ sort: newSort });
                    }}
                    sx={{
                      borderRadius: 5,
                      border: '1.5px solid',
                      borderColor: 'rgba(0, 0, 0, 0.12)',
                      color: 'text.primary',
                      bgcolor: 'background.paper',
                      p: isMobile ? 1 : 1.25,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        border: '1.5px solid',
                      }
                    }}
                  >
                    <ArrowUpDown size={isMobile ? 18 : 20} />
                  </IconButton>

                  {!isMobile && (
                    <FormControl
                      size="small"
                      sx={{
                        minWidth: 180,
                        '& .MuiInputLabel-root': {
                          fontWeight: 500,
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 5,
                          bgcolor: 'background.paper',
                          fontWeight: 500,
                          fontSize: '0.9375rem',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '1.5px',
                            borderColor: 'rgba(0, 0, 0, 0.12)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: '1.5px',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '2px',
                          }
                        }
                      }}
                    >
                      <InputLabel>Sortieren</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sortieren"
                        onChange={(e) => {
                          const newSort = e.target.value as any;
                          setSortBy(newSort);
                          updateURL({ sort: newSort });
                        }}
                      >
                        <MenuItem value="newest">Neueste zuerst</MenuItem>
                        <MenuItem value="oldest">Älteste zuerst</MenuItem>
                        <MenuItem value="price_asc">Preis aufsteigend</MenuItem>
                        <MenuItem value="price_desc">Preis absteigend</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000) && (
                    <Chip
                      label={`${
                        (selectedCategories.length || 0) +
                        (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0)
                      } Filter aktiv`}
                      size={isMobile ? 'small' : 'medium'}
                      onDelete={clearFilters}
                      color="primary"
                      sx={{
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        height: isMobile ? 28 : 32,
                        '& .MuiChip-label': {
                          px: 1.5,
                        },
                        '& .MuiChip-deleteIcon': {
                          fontSize: 18,
                          color: 'inherit',
                          opacity: 0.8,
                          '&:hover': {
                            opacity: 1,
                          }
                        }
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.9375rem',
                      color: 'text.secondary',
                    }}
                  >
                    {filteredItems.length} Artikel
                  </Typography>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, newMode) => newMode && handleViewModeChange(newMode)}
                    size="small"
                    sx={{
                      border: '1.5px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: 5,
                      bgcolor: 'background.paper',
                      '& .MuiToggleButton-root': {
                        border: 0,
                        px: isMobile ? 1.5 : 2.5,
                        py: isMobile ? 0.75 : 1,
                        color: 'text.secondary',
                        fontWeight: 500,
                        minWidth: isMobile ? 36 : 'auto',
                        '&:not(:last-of-type)': {
                          borderRight: '1.5px solid rgba(0, 0, 0, 0.12)',
                        },
                        '&:first-of-type': {
                          borderTopLeftRadius: 18,
                          borderBottomLeftRadius: 18,
                        },
                        '&:last-of-type': {
                          borderTopRightRadius: 18,
                          borderBottomRightRadius: 18,
                        },
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          }
                        },
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                        }
                      }
                    }}
                  >
                    <ToggleButton value="grid" aria-label="Gitteransicht">
                      <Grid3x3 size={isMobile ? 16 : 18} />
                    </ToggleButton>
                    {!isMobile && (
                      <ToggleButton value="list" aria-label="Listenansicht">
                        <List size={18} />
                      </ToggleButton>
                    )}
                    <ToggleButton value="gallery" aria-label="Galerieansicht">
                      <Image size={isMobile ? 16 : 18} />
                    </ToggleButton>
                    {isMobile && (
                      <ToggleButton value="compact" aria-label="Kompaktansicht">
                        <List size={16} />
                      </ToggleButton>
                    )}
                  </ToggleButtonGroup>

                  <IconButton
                    onClick={() => loadItems(false, true)}
                    size="small"
                    sx={{
                      ml: 1,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    title="Aktualisieren"
                  >
                    <RefreshCw size={isMobile ? 16 : 18} />
                  </IconButton>
                </Box>
              </Box>
            )}

            {showMyItems && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    mb: statusFilterExpanded ? 1.5 : 0,
                  }}
                  onClick={() => {
                    const newValue = !statusFilterExpanded;
                    setStatusFilterExpanded(newValue);
                    localStorage.setItem('statusFilterExpanded', JSON.stringify(newValue));
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    Status filtern
                  </Typography>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    {statusFilterExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </IconButton>
                </Box>
                {statusFilterExpanded && (
                  <>
                    <Box sx={{
                      display: 'flex',
                      flexWrap: isMobile ? 'nowrap' : 'wrap',
                      gap: 1,
                      overflowX: isMobile ? 'auto' : 'visible',
                      pb: isMobile ? 0.5 : 0,
                      '&::-webkit-scrollbar': {
                        height: 6,
                      },
                      '&::-webkit-scrollbar-track': {
                        bgcolor: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        bgcolor: 'rgba(0,0,0,0.2)',
                        borderRadius: 3,
                      },
                    }}>
                      {['draft', 'published', 'paused', 'sold', 'expired', 'archived'].map(status => {
                        const labels: Record<string, string> = {
                          draft: 'Entwurf',
                          published: 'Live',
                          paused: 'Pausiert',
                          sold: 'Verkauft',
                          archived: 'Archiviert',
                          expired: 'Abgelaufen'
                        };
                        const count = statusCounts[status] || 0;
                        const isSelected = statusFilter.includes(status);
                        return (
                          <Chip
                            key={status}
                            label={`${labels[status]} ${count}`}
                            onClick={() => handleStatusFilterChange(status)}
                            color={isSelected ? 'primary' : 'default'}
                            variant={isSelected ? 'filled' : 'outlined'}
                            sx={{
                              fontWeight: isSelected ? 600 : 400,
                              flexShrink: 0,
                            }}
                          />
                        );
                      })}
                    </Box>
                    {statusFilter.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Wähle mindestens einen Status aus
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {searchQuery ? 'Keine Artikel gefunden' : 'Noch keine Artikel vorhanden'}
            </Typography>
            {searchQuery ? (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Versuche es mit anderen Suchbegriffen
              </Typography>
            ) : user ? (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Sei der Erste und füge einen Artikel hinzu!
              </Typography>
            ) : null}
          </Box>
        ) : viewMode === 'grid' ? (
          <ItemGrid
            items={filteredItems}
            onItemUpdated={loadItems}
            allItems={filteredItems}
            onLoadMore={loadMoreItems}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        ) : viewMode === 'compact' ? (
          <ItemCompactList
            items={filteredItems}
            onItemUpdated={loadItems}
            allItems={filteredItems}
            onLoadMore={loadMoreItems}
            hasMore={hasMore}
            loadingMore={loadingMore}
            isOwnItem={showMyItems}
          />
        ) : viewMode === 'gallery' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(5, 1fr)',
                xl: 'repeat(6, 1fr)',
              },
              gap: { xs: 1, sm: 1.5, md: 2 },
              pb: 4,
            }}
          >
            {filteredItems.map((item) => {
              const isOwn = showMyItems && item.user_id === user?.id;

              return (
                <Box key={item.id}>
                  <ItemGallery
                    item={item}
                    isOwnItem={isOwn}
                    onItemUpdated={loadItems}
                    onClick={() => {
                      sessionStorage.setItem('returnSearch', location.search);
                      navigate(`/item/${item.id}`, { state: { allItems: filteredItems } });
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        ) : (
          <ItemList
            items={filteredItems}
            sellerProfiles={profiles}
            allItems={filteredItems}
            onLoadMore={loadMoreItems}
            hasMore={hasMore}
            loadingMore={loadingMore}
            isOwnItem={showMyItems}
            onItemUpdated={loadItems}
          />
        )}

        {loadTime !== null && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 16,
              left: 16,
              fontSize: '0.75rem',
              color: 'text.disabled',
              opacity: 0.6,
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {(loadTime / 1000).toFixed(2)}s
          </Box>
        )}
          </Container>

          <Drawer
            anchor="right"
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            variant="temporary"
            ModalProps={{
              keepMounted: true,
            }}
            PaperProps={{
              sx: { width: isMobile ? '100%' : 360 }
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Filter
                </Typography>
                <IconButton onClick={() => setFilterOpen(false)} size="small">
                  <X size={20} />
                </IconButton>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  Preisspanne
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(_, newValue) => setPriceRange(newValue as number[])}
                  onChangeCommitted={(_, newValue) => {
                    const range = newValue as number[];
                    updateURL({
                      minPrice: range[0] > 0 ? range[0].toString() : null,
                      maxPrice: range[1] < 10000 ? range[1].toString() : null
                    });
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={10000}
                  step={50}
                  valueLabelFormat={(value) => `${value} €`}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {priceRange[0]} €
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {priceRange[1]} €
                  </Typography>
                </Box>
              </Box>

              {showMyItems && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                    Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {['draft', 'published', 'paused', 'sold', 'archived', 'expired'].map(status => {
                      const labels: Record<string, string> = {
                        draft: 'Entwurf',
                        published: 'Live',
                        paused: 'Pausiert',
                        sold: 'Verkauft',
                        archived: 'Archiviert',
                        expired: 'Abgelaufen'
                      };
                      const count = statusCounts[status] || 0;
                      const isSelected = statusFilter.includes(status);
                      return (
                        <Chip
                          key={status}
                          label={`${labels[status]} ${count}`}
                          onClick={() => handleStatusFilterChange(status)}
                          color={isSelected ? 'primary' : 'default'}
                          variant={isSelected ? 'filled' : 'outlined'}
                          sx={{
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {allCategories.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                    Kategorien
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {allCategories.map(category => (
                      <Chip
                        key={category}
                        label={category}
                        onClick={() => handleCategoryToggle(category)}
                        color={selectedCategories.includes(category) ? 'primary' : 'default'}
                        variant={selectedCategories.includes(category) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearFilters}
                >
                  Zurücksetzen
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setFilterOpen(false)}
                >
                  Anwenden
                </Button>
              </Box>
            </Box>
          </Drawer>
        </>
      )}
      </Box>

      {!(currentPage === 'messages' && isMobile) && <Footer />}

      {user && currentPage !== 'messages' && currentPage !== 'settings' && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 64,
            height: 64,
          }}
          onClick={() => navigate('/create')}
        >
          <Camera size={28} />
        </Fab>
      )}

      {currentPage === 'items' && showScrollTop && (
        <IconButton
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: user && currentPage !== 'messages' && currentPage !== 'settings' ? 100 : 24,
            ...(handPreference === 'left' ? { left: 24 } : { right: 24 }),
            bgcolor: 'rgba(158, 158, 158, 0.85)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            boxShadow: 3,
            width: 56,
            height: 56,
            '&:hover': {
              bgcolor: 'rgba(117, 117, 117, 0.95)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          <ArrowUp size={28} />
        </IconButton>
      )}

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      <OnboardingWizard
        open={onboardingOpen}
        onComplete={() => {
          setOnboardingOpen(false);
        }}
      />
    </Box>
  );
};

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isMainContent = ['/', '/messages', '/settings'].includes(location.pathname);
  const noLayoutPages = ['/tokens', '/tokens/buy', '/tokens/success', '/admin'].some(path => location.pathname.startsWith(path));

  if (isMainContent || noLayoutPages) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flex: 1 }}>
      <Header
        onNavigate={(page) => {
          if (page === 'items') navigate('/');
          else navigate(`/${page}`);
        }}
        onLoginClick={() => setLoginOpen(true)}
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(query) => {
          if (query.trim()) {
            navigate(`/?search=${encodeURIComponent(query.trim())}`);
          } else {
            navigate('/');
          }
        }}
      />
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
      <Footer />
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Box>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AuthProvider>
            <FavoritesProvider>
              <HandPreferenceProvider>
                <BrowserRouter>
                <Suspense fallback={
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <CircularProgress />
                  </Box>
                }>
                  <LayoutWrapper>
                    <Routes>
                      <Route path="/" element={<MainContent />} />
                      <Route path="/messages" element={<MainContent />} />
                      <Route path="/settings" element={<MainContent />} />
                      <Route path="/create" element={<ItemCreatePage />} />
                      <Route path="/create/preview" element={<ItemPreviewPage />} />
                      <Route path="/item/:id" element={<ItemDetailPage />} />
                      <Route path="/item/:id/edit" element={<ItemEditPage />} />
                      <Route path="/agb" element={<AGBPage />} />
                      <Route path="/impressum" element={<ImpressumPage />} />
                      <Route path="/datenschutz" element={<DatenschutzPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/help" element={<HelpPage />} />
                      <Route path="/news" element={<NewsPage />} />
                      <Route path="/tokens" element={<CreditPurchasePage />} />
                      <Route path="/tokens/buy" element={<CreditPurchasePage />} />
                      <Route path="/tokens/success" element={<TokenSuccessPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
                      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                      <Route path="*" element={<MainContent />} />
                    </Routes>
                  </LayoutWrapper>
                </Suspense>
                </BrowserRouter>
              </HandPreferenceProvider>
            </FavoritesProvider>
          </AuthProvider>
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
