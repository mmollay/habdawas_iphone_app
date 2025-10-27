import { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
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
import { Camera, Grid3x3, List, Filter, Search, X, Globe, User, ArrowUp, Heart, ArrowUpDown, XCircle, Image, RefreshCw, ChevronDown, ChevronUp, ChevronRight, Calendar, Coins, Share2, Car, Home, Shirt, Apple, Sofa, Baby, Dumbbell, PawPrint, Briefcase, Store, Sprout, Factory, Cloud, CheckSquare, Square, Trash2, FolderTree } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HandPreferenceProvider, useHandPreference } from './contexts/HandPreferenceContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { GlobalCacheProvider, useGlobalCache } from './contexts/GlobalCacheContext';
import { LoginDialog } from './components/Auth/LoginDialog';
import { OnboardingWizard } from './components/Onboarding/OnboardingWizard';
import { ImageUpload } from './components/Upload/ImageUpload';
import { ItemGrid } from './components/Items/ItemGrid';
import { ItemList } from './components/Items/ItemList';
import { ItemGallery } from './components/Items/ItemGallery';
import { ItemCompactList } from './components/Items/ItemCompactList';
import { AdvancedFilterSidebar, SelectedFilters } from './components/Items/AdvancedFilterSidebar';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { SearchAutocomplete } from './components/Common/SearchAutocomplete';
import { ShareFilterDialog } from './components/Common/ShareFilterDialog';
import { MainNavigation } from './components/Common/MainNavigation';
import { supabase, Item } from './lib/supabase';
import { useSellerProfiles } from './hooks/useSellerProfiles';
import { useCreditCheck } from './hooks/useCreditCheck';
import { useSystemSettings } from './hooks/useSystemSettings';
import { useCommunityStats } from './hooks/useCommunityStats';
import { useProfile } from './hooks/useProfile';
import { useCategories } from './hooks/useCategories';
import { getCategoryName } from './utils/categories';

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
const FilterCountsTest = lazy(() => import('./components/Test/FilterCountsTest').then(m => ({ default: m.FilterCountsTest })));
const AdvancedFilterSidebarTest = lazy(() => import('./components/Test/AdvancedFilterSidebarTest').then(m => ({ default: m.AdvancedFilterSidebarTest })));
const CategoryTreePage = lazy(() => import('./components/CategoryTreePage'));

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
  const { data: profilePrefs } = useProfile('preferences', 30000);
  const { getCached } = useGlobalCache();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [loginOpen, setLoginOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [allItemsForCounting, setAllItemsForCounting] = useState<Item[]>([]); // For category counts only
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<string>('manual');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showMyItems, setShowMyItems] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [filterBySeller, setFilterBySeller] = useState<string | null>(null);
  const [urlParamsLoaded, setUrlParamsLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const saved = localStorage.getItem('statusFilter');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : ['draft', 'published', 'paused', 'sold', 'expired', 'archived'];
    } catch {
      return ['draft', 'published', 'paused', 'sold', 'expired', 'archived'];
    }
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
  const filterChangeSkipFirst = useRef(true); // Skip first filter-change effect after initial load
  const [statusFilterExpanded, setStatusFilterExpanded] = useState(() => {
    const saved = localStorage.getItem('statusFilterExpanded');
    return saved ? JSON.parse(saved) : true;
  });

  // Multi-select state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Attribute filters
  interface FilterValue {
    attributeId: string;
    attributeKey: string;
    value: string | number | string[] | [number, number] | null;
    type: string;
  }
  const [attributeFilters, setAttributeFilters] = useState<FilterValue[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});

  const userIds = useMemo(
    () => [...new Set(filteredItems.map(item => item.user_id))],
    [filteredItems]
  );
  const { profiles } = useSellerProfiles(userIds);

  // Category system hook
  const { categoryTree, categories, loading: categoriesLoading, getCategoryBySlug, getCategoryById } = useCategories({ lang: 'de' });

  // Credit and Community Pot hooks
  const { checkCredit } = useCreditCheck();
  const { settings } = useSystemSettings();
  const { stats: communityStats } = useCommunityStats();
  const [creditInfo, setCreditInfo] = useState<{
    canCreate: boolean;
    source?: string;
    message: string;
    personalCredits?: number;
    communityPotBalance?: number;
  } | null>(null);

  // Load credit info
  useEffect(() => {
    if (user) {
      checkCredit().then(setCreditInfo);
    } else {
      setCreditInfo(null);
    }
  }, [user, checkCredit]);

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

  // Multi-select handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedItemIds(new Set());
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItemIds(newSet);
  };

  const selectAllItems = () => {
    const allIds = new Set(filteredItems.map(item => item.id));
    setSelectedItemIds(allIds);
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.size === 0) return;

    const confirmDelete = window.confirm(
      `Möchtest du ${selectedItemIds.size} Inserat(e) wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
    );

    if (!confirmDelete) return;

    try {
      // Optimistically update UI immediately
      const deletedIds = Array.from(selectedItemIds);
      setFilteredItems(prev => prev.filter(item => !selectedItemIds.has(item.id)));
      setItems(prev => prev.filter(item => !selectedItemIds.has(item.id)));

      // Reset selection mode
      setSelectedItemIds(new Set());
      setIsSelectionMode(false);

      // Delete in background
      for (const itemId of deletedIds) {
        const item = items.find(i => i.id === itemId);
        if (!item) continue;

        // Delete images from storage
        if (item.image_url) {
          const imagePaths = [item.image_url, ...(item.additional_images || [])];
          for (const imagePath of imagePaths) {
            const fileName = imagePath.split('/').pop();
            if (fileName) {
              try {
                await supabase.storage.from('items').remove([fileName]);
              } catch (error) {
                console.error('Error deleting image:', error);
              }
            }
          }
        }

        // Delete item from database
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', itemId);

        if (error) {
          console.error('Error deleting item:', error);
        }
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      // Reload on error
      loadItems();
    }
  };

  // Optimistic single-item update
  const handleItemUpdate = (itemId?: string) => {
    if (itemId) {
      // Remove item from state immediately
      setFilteredItems(prev => prev.filter(item => item.id !== itemId));
      setItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      // Full reload if no itemId specified
      loadItems();
    }
  };

  useEffect(() => {
    // Load user preferences from cached profile data
    if (user && profilePrefs) {
      if (profilePrefs.view_mode_preference && ['grid', 'list', 'gallery', 'compact'].includes(profilePrefs.view_mode_preference)) {
        setViewMode(profilePrefs.view_mode_preference as 'grid' | 'list' | 'gallery' | 'compact');
        localStorage.setItem('viewMode', profilePrefs.view_mode_preference);
      }

      if (!profilePrefs.onboarding_completed) {
        setOnboardingOpen(true);
      }
    }
  }, [user, profilePrefs]);

  // Ref to track if counts are currently loading
  const countsLoadingRef = useRef(false);
  const countsLoadedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    const loadCounts = async () => {
      if (!user) {
        setAllItemsCount(0);
        setMyItemsCount(0);
        setFavoritesCount(0);
        setStatusCounts({});
        countsLoadedForUserRef.current = null;
        return;
      }

      // Skip if already loading or already loaded for this user
      if (countsLoadingRef.current || countsLoadedForUserRef.current === user.id) {
        return;
      }

      countsLoadingRef.current = true;

      try {
        // Use GlobalCache for all count queries
        const [allCountRes, myCountRes, favCountRes, ...statusResults] = await Promise.all([
          getCached('items:count:all:published', async () => {
            const res = await supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'published');
            return { count: res.count || 0, error: res.error };
          }, 60000),
          getCached(`items:count:${user.id}:all`, async () => {
            const res = await supabase.from('items').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
            return { count: res.count || 0, error: res.error };
          }, 60000),
          getCached(`favorites:count:${user.id}`, async () => {
            const res = await supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
            return { count: res.count || 0, error: res.error };
          }, 60000),
          ...['draft', 'published', 'paused', 'sold', 'expired', 'archived'].map((status) =>
            getCached(`items:count:${user.id}:${status}`, async () => {
              const res = await supabase
                .from('items')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', status);
              return { status, count: res.count || 0, error: res.error };
            }, 60000)
          )
        ]);

        // Only set counts if there were no errors
        if (!allCountRes.error) setAllItemsCount(allCountRes.count);
        if (!myCountRes.error) setMyItemsCount(myCountRes.count);
        if (!favCountRes.error) setFavoritesCount(favCountRes.count);

        const counts: Record<string, number> = {};
        statusResults.forEach((result) => {
          if (!result.error) {
            counts[result.status] = result.count;
          }
        });
        setStatusCounts(counts);
        countsLoadedForUserRef.current = user.id;
      } catch (error) {
        // Silently handle errors - counts will remain at previous values
        console.error('Error loading counts (non-critical):', error);
      } finally {
        countsLoadingRef.current = false;
      }
    };

    loadCounts();
  }, [user, getCached]);

  // Realtime listener for favorites count
  useEffect(() => {
    if (!user) return;

    // Initial count load
    const loadFavoritesCount = async () => {
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count !== null) {
        setFavoritesCount(count);
        console.log('✅ Initial favorites count loaded:', count);
      }
    };

    loadFavoritesCount();

    // Setup realtime listener
    const channel = supabase
      .channel('favorites-count-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and DELETE
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('🔔 Favorites change detected:', payload);
          // Reload favorites count
          const { count } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (count !== null) {
            setFavoritesCount(count);
            console.log('✅ Favorites count updated:', count);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Favorites realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
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
      const to = from + ITEMS_PER_PAGE; // Fetch one extra item to check if there are more

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

      // Separate general filters (direct item columns) from attribute filters (item_attributes table)
      const generalFilterKeys = ['brand', 'color', 'condition', 'material'];
      const generalFilters = attributeFilters.filter(f => generalFilterKeys.includes(f.attributeKey));
      const realAttributeFilters = attributeFilters.filter(f => !generalFilterKeys.includes(f.attributeKey));

      console.log('🔍 Filter Debug:', {
        attributeFilters,
        generalFilters,
        realAttributeFilters,
        selectedCategories
      });

      // Apply hierarchical category filtering and/or real attribute filters
      // Using search_items_with_attributes for ALL category filtering ensures
      // hierarchical support (e.g., selecting "Fahrzeuge" finds items in "Autos" subcategory)
      if (selectedCategories.length > 0 || realAttributeFilters.length > 0) {
        const categoryId = selectedCategories.length === 1 ? selectedCategories[0] : null;

        const { data: filteredItemIds, error: filterError } = await supabase
          .rpc('search_items_with_attributes', {
            p_category_id: categoryId,
            p_filters: realAttributeFilters  // Only send real attribute filters with UUIDs
          });

        if (filterError) {
          console.error('Category/Attribute filter error:', filterError);
        } else if (filteredItemIds && filteredItemIds.length > 0) {
          const itemIds = filteredItemIds.map((row: any) => row.item_id);
          query = query.in('id', itemIds);
        } else if (filteredItemIds && filteredItemIds.length === 0 && generalFilters.length === 0) {
          // No items match filters AND no general filters to apply
          // Only return empty if there are no general filters that might still match
          setItems([]);
          setFilteredItems([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
        // If filteredItemIds is empty but we have general filters, continue to apply general filters
        // This handles the case where category/attribute RPC returns nothing but general filters might match
      }

      // Apply general filters directly to query
      generalFilters.forEach(filter => {
        const key = filter.attributeKey;
        const value = filter.value;

        if (key === 'color') {
          // colors is an array field, use overlaps operator for array matching
          // overlaps checks if arrays have any elements in common
          query = query.overlaps('colors', [value]);
        } else if (key === 'brand' || key === 'condition' || key === 'material') {
          // Direct column filters
          query = query.eq(key, value);
        }
      });

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

        const fetchedFavorites = data || [];
        const hasMoreFavorites = fetchedFavorites.length > ITEMS_PER_PAGE;
        const favoriteItems = hasMoreFavorites ? fetchedFavorites.slice(0, ITEMS_PER_PAGE) : fetchedFavorites;

        if (loadMore) {
          setItems(prev => [...prev, ...favoriteItems]);
          setFilteredItems(prev => [...prev, ...favoriteItems]);
        } else {
          setItems(favoriteItems);
          setFilteredItems(favoriteItems);
        }

        setHasMore(hasMoreFavorites);
        setPage(currentPage);
        setLoading(false);
        setLoadingMore(false);
        return;
      } else if (showMyItems && user) {
        query = query.eq('user_id', user.id);
        // Apply status filter for user's own items
        if (Array.isArray(statusFilter) && statusFilter.length > 0) {
          query = query.in('status', statusFilter);
        }
      } else if (filterBySeller) {
        query = query
          .eq('user_id', filterBySeller)
          .eq('status', 'published');
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

      const fetchedItems = data || [];
      // Check if there are more items by checking if we got ITEMS_PER_PAGE + 1
      const hasMoreItems = fetchedItems.length > ITEMS_PER_PAGE;
      // Only take ITEMS_PER_PAGE items
      const newItems = hasMoreItems ? fetchedItems.slice(0, ITEMS_PER_PAGE) : fetchedItems;

      if (loadMore) {
        setItems(prev => [...prev, ...newItems]);
        setFilteredItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
        setFilteredItems(newItems);

        // Update allItemsForCounting only when no filters are active
        // This ensures category counts always show total items per category
        if (!activeSearchQuery && selectedCategories.length === 0 &&
            !showMyItems && !showFavorites && !filterBySeller &&
            attributeFilters.length === 0 && priceRange[0] === 0 && priceRange[1] === 10000) {
          setAllItemsForCounting(newItems);
        }
      }

      setHasMore(hasMoreItems);
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

    // Skip first execution after initial load to prevent double loading
    if (filterChangeSkipFirst.current) {
      filterChangeSkipFirst.current = false;
      return;
    }

    // Mark that filters have changed
    setFilterChangeTime(Date.now());

    const timer = setTimeout(() => {
      // Only load if page is visible
      if (document.hidden) return;

      // Always force refresh when filters change
      loadItems(false, true);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeSearchQuery, selectedCategories, priceRange, sortBy, statusFilter, showMyItems, showFavorites, filterBySeller, attributeFilters]); // Removed 'user' to prevent double loading

  // Get all subcategory IDs for a given category (recursive)
  const getSubcategoryIds = useCallback((categoryId: string): string[] => {
    const subcategories = categories.filter(c => c.parent_id === categoryId);
    const allIds = [categoryId];

    subcategories.forEach(sub => {
      allIds.push(...getSubcategoryIds(sub.id));
    });

    return allIds;
  }, [categories]);

  // Count items per category from ALL items (not filtered)
  // Includes items from subcategories
  const getCategoryCount = useCallback((categoryId: string) => {
    // Helper function to get all subcategory IDs recursively
    const getAllSubcategoryIds = (catId: string): string[] => {
      const subcategories = categories.filter(c => c.parent_id === catId);
      const allIds = [catId];
      subcategories.forEach(sub => {
        allIds.push(...getAllSubcategoryIds(sub.id));
      });
      return [...new Set(allIds)];
    };

    const subcategoryIds = getAllSubcategoryIds(categoryId);
    return allItemsForCounting.filter(item =>
      item.category_id && subcategoryIds.includes(item.category_id)
    ).length;
  }, [categories, allItemsForCounting]);

  // Get icon for category
  const getCategoryIcon = useCallback((categoryId: string) => {
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
  }, [categories]);

  // Handlers for AdvancedFilterSidebar
  const handleFilterClose = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const handleFilterChange = useCallback((filters: SelectedFilters) => {
    setSelectedFilters(filters);

    // Update priceRange if present
    if (filters.priceRange) {
      setPriceRange(filters.priceRange);
    }

    // Update URL with all filter parameters
    const urlParams: Record<string, string | null> = {};
    if (filters.priceRange) {
      urlParams.minPrice = filters.priceRange[0] > 0 ? filters.priceRange[0].toString() : null;
      urlParams.maxPrice = filters.priceRange[1] < 10000 ? filters.priceRange[1].toString() : null;
    }

    // Serialize other filters to URL
    const filtersToSerialize = { ...filters };
    delete filtersToSerialize.priceRange;
    if (Object.keys(filtersToSerialize).length > 0) {
      urlParams.filters = JSON.stringify(filtersToSerialize);
    } else {
      urlParams.filters = null;
    }

    updateURL(urlParams);

    // Convert SelectedFilters to old FilterValue[] format for attributeFilters
    const newAttributeFilters: FilterValue[] = [];
    Object.entries(filters).forEach(([key, values]) => {
      if (key !== 'priceRange' && Array.isArray(values)) {
        values.forEach((value) => {
          newAttributeFilters.push({
            attributeId: key,
            attributeKey: key,
            value: value,
            type: 'text'
          });
        });
      }
    });
    setAttributeFilters(newAttributeFilters);
  }, []);

  const filterCategoryId = useMemo(
    () => selectedCategories.length === 1 ? selectedCategories[0] : undefined,
    [selectedCategories]
  );

  const updateURL = (params: Record<string, string | null>, updateFilters: boolean = false) => {
    const newSearchParams = new URLSearchParams(location.search);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });

    // Update filters parameter if requested
    if (updateFilters && Object.keys(selectedFilters).length > 0) {
      const filtersToSerialize = { ...selectedFilters };
      delete filtersToSerialize.priceRange;
      if (Object.keys(filtersToSerialize).length > 0) {
        newSearchParams.set('filters', JSON.stringify(filtersToSerialize));
      } else {
        newSearchParams.delete('filters');
      }
    } else if (updateFilters) {
      newSearchParams.delete('filters');
    }

    const newSearch = newSearchParams.toString();
    navigate(newSearch ? `/?${newSearch}` : '/', { replace: true });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);

    // Convert UUIDs to slugs for URL
    const categorySlugs = newCategories
      .map(id => getCategoryById(id)?.slug || id)
      .filter(Boolean);

    updateURL({ categories: categorySlugs.length > 0 ? categorySlugs.join(',') : null });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 10000]);
    setSearchQuery('');
    setActiveSearchQuery('');
    setAttributeFilters([]);
    updateURL({
      categories: null,
      minPrice: null,
      maxPrice: null,
      search: null,
      sort: null
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (priceRange[0] > 0 || priceRange[1] < 10000) count += 1;
    if (activeSearchQuery) count += 1;
    if (sortBy !== 'newest') count += 1;
    if (attributeFilters.length > 0) count += attributeFilters.length;
    return count;
  };

  const generateShareableURL = () => {
    const baseURL = window.location.origin;
    const params = new URLSearchParams();

    if (activeSearchQuery) params.set('search', activeSearchQuery);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 10000) params.set('maxPrice', priceRange[1].toString());

    // Convert UUIDs to slugs for shareable URL
    if (selectedCategories.length > 0) {
      const categorySlugs = selectedCategories
        .map(id => getCategoryById(id)?.slug || id)
        .filter(Boolean);
      if (categorySlugs.length > 0) {
        params.set('categories', categorySlugs.join(','));
      }
    }

    // Serialize attribute filters to URL
    if (Object.keys(selectedFilters).length > 0) {
      const filtersToSerialize = { ...selectedFilters };
      // Remove priceRange as it's already in minPrice/maxPrice
      delete filtersToSerialize.priceRange;
      if (Object.keys(filtersToSerialize).length > 0) {
        params.set('filters', JSON.stringify(filtersToSerialize));
      }
    }

    if (showMyItems) params.set('view', 'myitems');
    if (showFavorites) params.set('view', 'favorites');
    if (filterBySeller) params.set('seller', filterBySeller);

    const queryString = params.toString();
    return queryString ? `${baseURL}/?${queryString}` : baseURL;
  };

  const getFilterDescription = () => {
    const parts: string[] = [];

    if (activeSearchQuery) parts.push(`Suche: "${activeSearchQuery}"`);
    if (selectedCategories.length > 0) {
      const categoryNames = selectedCategories
        .map(id => categories.find(c => c.id === id))
        .filter(Boolean)
        .map(cat => getCategoryName(cat!, 'de'))
        .join(', ');
      parts.push(`Kategorien: ${categoryNames}`);
    }
    if (priceRange[0] > 0 || priceRange[1] < 10000) {
      parts.push(`Preis: ${priceRange[0]}€ - ${priceRange[1]}€`);
    }
    if (sortBy !== 'newest') {
      const sortLabels = {
        oldest: 'Älteste zuerst',
        price_asc: 'Preis aufsteigend',
        price_desc: 'Preis absteigend',
        newest: 'Neueste zuerst'
      };
      parts.push(`Sortierung: ${sortLabels[sortBy]}`);
    }
    if (showMyItems) parts.push('Meine Artikel');
    if (showFavorites) parts.push('Favoriten');

    return parts.length > 0 ? parts.join(' | ') : 'Alle Artikel';
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

      // Get categories parameter (comma-separated slugs)
      const categoriesParam = params.get('categories') ? params.get('categories')!.split(',') : [];

      const view = params.get('view');
      const seller = params.get('seller');
      const filtersParam = params.get('filters');

      // Convert slugs to UUIDs (support both for backward compatibility)
      // IMPORTANT: If we have category slugs but categories aren't loaded yet, skip this update
      // The effect will re-run when categories are loaded
      if (categoriesParam.length > 0 && categoriesLoading) {
        console.log('⏳ Categories still loading, waiting...');
        return;
      }

      let hasUUIDs = false;
      const categoryIds = categoriesParam.map(item => {
        // Check if it's a UUID (contains dashes in UUID format)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item);

        if (isUUID) {
          hasUUIDs = true;
          // Already a UUID, use as-is
          return item;
        } else {
          // It's a slug, convert to UUID
          const category = getCategoryBySlug(item);
          return category?.id || null;
        }
      }).filter(Boolean) as string[];

      // If UUIDs were found in URL, automatically correct the URL to use slugs
      // But only if categories are loaded
      if (hasUUIDs && categoryIds.length > 0 && !categoriesLoading && categories.length > 0) {
        const categorySlugs = categoryIds
          .map(id => getCategoryById(id)?.slug)
          .filter(Boolean);

        // Only update if we found valid slugs
        if (categorySlugs.length > 0) {
          const newParams = new URLSearchParams(params);
          newParams.set('categories', categorySlugs.join(','));
          const newSearch = newParams.toString();
          navigate(`/?${newSearch}`, { replace: true });
        }
      }

      // Deserialize attribute filters from URL
      let deserializedFilters: SelectedFilters = {};
      if (filtersParam) {
        try {
          const parsed = JSON.parse(filtersParam);
          if (typeof parsed === 'object' && parsed !== null) {
            deserializedFilters = parsed;
          }
        } catch (e) {
          console.error('Error parsing filters from URL:', e);
        }
      }

      // Add priceRange if different from default
      if (minPrice !== 0 || maxPrice !== 10000) {
        deserializedFilters.priceRange = [minPrice, maxPrice];
      }

      const newShowMyItems = view === 'myitems';
      const newShowFavorites = view === 'favorites';

      setSearchQuery(search);
      setActiveSearchQuery(search);
      setSortBy(sort);
      setPriceRange([minPrice, maxPrice]);
      setSelectedCategories(categoryIds);
      setSelectedFilters(deserializedFilters);
      setShowMyItems(newShowMyItems);
      setShowFavorites(newShowFavorites);
      setFilterBySeller(seller);

      if (!urlParamsLoaded) {
        setUrlParamsLoaded(true);
      }
    }
  }, [location.search, location.pathname, getCategoryBySlug, getCategoryById, navigate, categoriesLoading, categories]);

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
          {user && (
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                borderRadius: '0 !important',
                mb: 0
              }}
            >
              <Container maxWidth="xl" sx={{ maxWidth: '1400px !important', px: isMobile ? 0 : undefined }}>
                <MainNavigation
                  selectedTab={showFavorites ? 2 : showMyItems ? 1 : 0}
                  onTabChange={(value) => {
                    setLoading(true);
                    setItems([]);
                    setFilteredItems([]);
                    setShowMyItems(value === 1);
                    setShowFavorites(value === 2);
                    updateURL({
                      view: value === 1 ? 'myitems' : value === 2 ? 'favorites' : null
                    });
                  }}
                  selectedCategories={selectedCategories}
                  onCategoryChange={(categoryId) => {
                    if (categoryId === null) {
                      setSelectedCategories([]);
                      updateURL({ categories: null });
                    } else {
                      setSelectedCategories([categoryId]);
                      const categorySlug = getCategoryById(categoryId)?.slug || categoryId;
                      updateURL({ categories: categorySlug });
                    }
                  }}
                  allItemsCount={filteredItems.length}
                  myItemsCount={myItemsCount}
                  favoritesCount={favoritesCount}
                  creditInfo={creditInfo}
                />
              </Container>
            </Paper>
          )}

          <Container maxWidth="xl" sx={{ py: 3, maxWidth: '1400px !important' }}>

            {/* Breadcrumb für gefilterte Kategorien */}
            {selectedCategories.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1.5,
                  px: isMobile ? 1.5 : 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  mb: 3,
                  overflow: 'auto',
                  border: '1px solid rgba(25, 118, 210, 0.12)',
                  '&::-webkit-scrollbar': {
                    height: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '4px',
                  },
                }}
              >
                <Home
                  size={isMobile ? 18 : 20}
                  color="currentColor"
                  style={{ color: 'rgba(0, 0, 0, 0.6)', flexShrink: 0 }}
                />
                {selectedCategories.map((categoryId) => {
                  const category = getCategoryById(categoryId);
                  if (!category) return null;

                  // Build breadcrumb path
                  const path: any[] = [];
                  let current = category;
                  while (current) {
                    path.unshift(current);
                    current = current.parent_id ? getCategoryById(current.parent_id) : null;
                  }

                  return (
                    <Box
                      key={categoryId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        flexShrink: 0
                      }}
                    >
                      {path.map((cat, index) => (
                        <Box
                          key={cat.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            flexShrink: 0
                          }}
                        >
                          <ChevronRight
                            size={isMobile ? 16 : 18}
                            color="currentColor"
                            style={{ color: 'rgba(0, 0, 0, 0.38)', margin: '0 2px' }}
                          />
                          <Typography
                            variant="body2"
                            onClick={() => {
                              // Navigate to this category level
                              navigate(`/?categories=${cat.slug}`);
                            }}
                            sx={{
                              color: index === path.length - 1 ? 'primary.main' : 'text.secondary',
                              fontWeight: index === path.length - 1 ? 700 : 500,
                              fontSize: isMobile ? '0.8125rem' : '0.875rem',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.01em',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                color: 'primary.main',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {cat.translations?.de?.name || cat.slug}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                })}
              </Box>
            )}

            {items.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  py: 0,
                  gap: isMobile ? 0.5 : 1,
                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                }}
                data-testid="toolbar"
              >
                <Box sx={{ display: 'flex', gap: isMobile ? 0.5 : 1, alignItems: 'center', flex: 1, flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
                  <IconButton
                    onClick={() => setFilterOpen(true)}
                    sx={{
                      borderRadius: 5,
                      border: '1.5px solid',
                      borderColor: 'rgba(0, 0, 0, 0.12)',
                      color: 'text.primary',
                      bgcolor: 'background.paper',
                      p: isMobile ? 0.5 : 1.25,
                      minWidth: isMobile ? 32 : 'auto',
                      height: isMobile ? 32 : 'auto',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        border: '1.5px solid',
                      }
                    }}
                  >
                    <Filter size={isMobile ? 16 : 20} />
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
                      p: isMobile ? 0.5 : 1.25,
                      minWidth: isMobile ? 32 : 'auto',
                      height: isMobile ? 32 : 'auto',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        border: '1.5px solid',
                      }
                    }}
                  >
                    <ArrowUpDown size={isMobile ? 16 : 20} />
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

                  {!isMobile && (selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000) && (
                    <Chip
                      label={`${
                        (selectedCategories.length || 0) +
                        (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0)
                      } Filter aktiv`}
                      size="medium"
                      onDelete={clearFilters}
                      color="primary"
                      sx={{
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        height: 32,
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
                  {!isMobile && (
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
                  )}
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, newMode) => newMode && handleViewModeChange(newMode)}
                    size="small"
                    sx={{
                      border: '1.5px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: isMobile ? 3 : 5,
                      bgcolor: 'background.paper',
                      '& .MuiToggleButton-root': {
                        border: 0,
                        px: isMobile ? 0.75 : 2.5,
                        py: isMobile ? 0.5 : 1,
                        color: 'text.secondary',
                        fontWeight: 500,
                        minWidth: isMobile ? 32 : 'auto',
                        height: isMobile ? 32 : 'auto',
                        '&:not(:last-of-type)': {
                          borderRight: '1.5px solid rgba(0, 0, 0, 0.12)',
                        },
                        '&:first-of-type': {
                          borderTopLeftRadius: isMobile ? 10 : 18,
                          borderBottomLeftRadius: isMobile ? 10 : 18,
                        },
                        '&:last-of-type': {
                          borderTopRightRadius: isMobile ? 10 : 18,
                          borderBottomRightRadius: isMobile ? 10 : 18,
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
                      <Grid3x3 size={isMobile ? 14 : 18} />
                    </ToggleButton>
                    {!isMobile && (
                      <ToggleButton value="list" aria-label="Listenansicht">
                        <List size={18} />
                      </ToggleButton>
                    )}
                    <ToggleButton value="gallery" aria-label="Galerieansicht">
                      <Image size={isMobile ? 14 : 18} />
                    </ToggleButton>
                    {isMobile && (
                      <ToggleButton value="compact" aria-label="Kompaktansicht">
                        <List size={14} />
                      </ToggleButton>
                    )}
                  </ToggleButtonGroup>

                  {!isMobile && (
                    <>
                      <IconButton
                        onClick={() => loadItems(false, true)}
                        size="small"
                        sx={{
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        title="Aktualisieren"
                        aria-label="Aktualisieren"
                      >
                        <RefreshCw size={18} />
                      </IconButton>

                      <IconButton
                        onClick={() => setShareDialogOpen(true)}
                        size="small"
                        sx={{
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        title="Filter teilen"
                        aria-label="Filter teilen"
                      >
                        <Share2 size={18} />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
            )}

            {/* Multi-select toolbar & Status filter */}
            {showMyItems && filteredItems.length > 0 && (
              <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Status Filter with Counts */}
                <Select
                  size="small"
                  value={
                    Array.isArray(statusFilter) && statusFilter.length === 6
                      ? 'all'
                      : Array.isArray(statusFilter) && statusFilter.length === 1
                      ? statusFilter[0]
                      : 'all'
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'all') {
                      setStatusFilter(['draft', 'published', 'paused', 'sold', 'expired', 'archived']);
                    } else {
                      setStatusFilter([value]);
                    }
                  }}
                  sx={{
                    minWidth: 140,
                    borderRadius: 2,
                    '& .MuiSelect-select': { py: 0.75 }
                  }}
                >
                  <MenuItem value="all">
                    Alle Status ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})
                  </MenuItem>
                  <MenuItem value="published">Live ({statusCounts.published || 0})</MenuItem>
                  <MenuItem value="draft">Entwurf ({statusCounts.draft || 0})</MenuItem>
                  <MenuItem value="paused">Pausiert ({statusCounts.paused || 0})</MenuItem>
                  <MenuItem value="sold">Verkauft ({statusCounts.sold || 0})</MenuItem>
                  <MenuItem value="archived">Archiviert ({statusCounts.archived || 0})</MenuItem>
                  <MenuItem value="expired">Abgelaufen ({statusCounts.expired || 0})</MenuItem>
                </Select>

                {/* Multi-select toggle */}
                <IconButton
                  onClick={toggleSelectionMode}
                  color={isSelectionMode ? 'primary' : 'default'}
                  sx={{
                    border: '1px solid',
                    borderColor: isSelectionMode ? 'primary.main' : 'divider',
                    borderRadius: 2,
                  }}
                  title={isSelectionMode ? 'Auswahl beenden' : 'Mehrfachauswahl'}
                >
                  {isSelectionMode ? <CheckSquare size={20} /> : <Square size={20} />}
                </IconButton>

                {isSelectionMode && (
                  <>
                    <IconButton
                      onClick={selectAllItems}
                      disabled={selectedItemIds.size === filteredItems.length}
                      size="small"
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                      title={`Alle auswählen (${filteredItems.length})`}
                    >
                      <CheckSquare size={18} />
                    </IconButton>

                    <Chip
                      label={`${selectedItemIds.size} ausgewählt`}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />

                    <IconButton
                      onClick={handleBulkDelete}
                      disabled={selectedItemIds.size === 0}
                      color="error"
                      size="small"
                      sx={{
                        border: '1px solid',
                        borderColor: 'error.main',
                        borderRadius: 2,
                        bgcolor: selectedItemIds.size > 0 ? 'error.main' : 'transparent',
                        color: selectedItemIds.size > 0 ? 'white' : 'error.main',
                        '&:hover': {
                          bgcolor: 'error.dark',
                          color: 'white',
                        }
                      }}
                      title={`Löschen (${selectedItemIds.size})`}
                    >
                      <Trash2 size={18} />
                    </IconButton>
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
            onItemUpdated={handleItemUpdate}
            allItems={filteredItems}
            onLoadMore={loadMoreItems}
            hasMore={hasMore}
            loadingMore={loadingMore}
            isSelectionMode={isSelectionMode}
            selectedItemIds={selectedItemIds}
            onToggleSelect={toggleItemSelection}
          />
        ) : viewMode === 'compact' ? (
          <ItemCompactList
            items={filteredItems}
            onItemUpdated={handleItemUpdate}
            allItems={filteredItems}
            onLoadMore={loadMoreItems}
            hasMore={hasMore}
            loadingMore={loadingMore}
            isOwnItem={showMyItems}
            isSelectionMode={isSelectionMode}
            selectedItemIds={selectedItemIds}
            onToggleSelect={toggleItemSelection}
          />
        ) : viewMode === 'gallery' ? (
          <>
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
                      onItemUpdated={handleItemUpdate}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedItemIds.has(item.id)}
                      onToggleSelect={toggleItemSelection}
                      onClick={() => {
                        sessionStorage.setItem('returnSearch', location.search);
                        navigate(`/item/${item.id}`, { state: { allItems: filteredItems } });
                      }}
                    />
                  </Box>
                );
              })}
            </Box>

            {/* Load More Button für Gallery */}
            {hasMore && !loadingMore && filteredItems.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={loadMoreItems}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                  }}
                >
                  Mehr laden
                </Button>
              </Box>
            )}

            {/* Loading Indicator */}
            {loadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={40} />
              </Box>
            )}
          </>
        ) : (
          <ItemList
            items={filteredItems}
            sellerProfiles={profiles}
            allItems={filteredItems}
            onLoadMore={loadMoreItems}
            hasMore={hasMore}
            loadingMore={loadingMore}
            isOwnItem={showMyItems}
            onItemUpdated={handleItemUpdate}
            isSelectionMode={isSelectionMode}
            selectedItemIds={selectedItemIds}
            onToggleSelect={toggleItemSelection}
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

          <AdvancedFilterSidebar
            open={filterOpen}
            onClose={handleFilterClose}
            onFilterChange={handleFilterChange}
            selectedFilters={selectedFilters}
            totalItems={filteredItems.length}
          />
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

      <ShareFilterDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        url={generateShareableURL()}
        description={getFilterDescription()}
        filterCount={getActiveFilterCount()}
      />

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
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          <GlobalCacheProvider>
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
                      <Route path="/categories" element={<CategoryTreePage />} />
                      <Route path="/test/filter-counts" element={<FilterCountsTest />} />
                      <Route path="/test/filter-sidebar" element={<AdvancedFilterSidebarTest />} />
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
          </GlobalCacheProvider>
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
