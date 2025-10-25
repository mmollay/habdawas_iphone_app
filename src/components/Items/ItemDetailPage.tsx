import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Typography,
  Chip,
  IconButton,
  Divider,
  TextField,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MapPin, Calendar, Heart, Send, Package, Truck, ZoomIn, Tag, Ruler, Weight, Box as BoxIcon, Palette, Sparkles, Grid3x3, Hash, Share2, X, ChevronLeft, ChevronRight, MessageCircle, ArrowUp, Phone, Pencil, Trash2, Check, Image as ImageIcon, ShieldCheck, XCircle } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { Item, supabase, Profile, PickupAddress } from '../../lib/supabase';
import { getRelativeTimeString } from '../../utils/dateUtils';
import { getDetailImageUrl, getFullImageUrl } from '../../utils/imageUtils';
import { conditionOptions, getConditionLabel } from '../../utils/translations';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { ItemShareDialog } from '../Common/ItemShareDialog';
import { useHandPreference } from '../../contexts/HandPreferenceContext';
import { useItemView } from '../../hooks/useItemView';
import { useAutoSave } from '../../hooks/useAutoSave';
import { usePermissions } from '../../hooks/usePermissions';
import { useCategory } from '../../hooks/useCategories';
import { getCategoryName } from '../../utils/categories';
import { useItemAttributes, getAttributeValue, getAttributeLabel } from '../../hooks/useItemAttributes';
import { InlineTextField } from './InlineEdit/InlineTextField';
import { InlineSelect } from './InlineEdit/InlineSelect';
import { InlineChipList } from './InlineEdit/InlineChipList';
import { InlineImageGallery } from './InlineEdit/InlineImageGallery';
import { FloatingActionBar } from './InlineEdit/FloatingActionBar';
import { Modal } from '../Common/Modal';
import { OnboardingTooltip } from '../Common/OnboardingTooltip';
import { SellerProfile } from './SellerProfile';

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { handPreference } = useHandPreference();
  const { isFavorite, toggleFavorite, loading: favoriteLoading } = useFavoritesContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);
  const [pickupAddress, setPickupAddress] = useState<PickupAddress | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const skipLoadRef = useRef(false);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [scrollTranslate, setScrollTranslate] = useState(0);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [itemImages, setItemImages] = useState<string[]>([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [draftData, setDraftData] = useState<any>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isFirstItem, setIsFirstItem] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const [showImageManagementModal, setShowImageManagementModal] = useState(false);

  // Moderation states
  const { hasPermission } = usePermissions();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { status: autoSaveStatus } = useAutoSave({
    itemId: id || '',
    draftData,
    enabled: isEditMode && hasUnsavedChanges,
    debounceMs: 1500,
  });

  // Load category hierarchy
  const { category: itemCategory, path: categoryPath } = useCategory(item?.category_id);

  // Load item attributes
  const { attributes: itemAttributes, loading: attributesLoading } = useItemAttributes(item?.id);

  const allItems = (location.state as { allItems?: Item[] })?.allItems || [];
  const currentIndex = allItems.findIndex(i => i.id === id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allItems.length - 1;

  const navigateBack = () => {
    const returnSearch = sessionStorage.getItem('returnSearch');
    if (returnSearch) {
      navigate(`/${returnSearch}`);
      sessionStorage.removeItem('returnSearch');
    } else {
      navigate('/');
    }
  };

  const navigateToItem = useCallback(async (direction: 'prev' | 'next') => {
    const targetItem = direction === 'prev' && hasPrevious
      ? allItems[currentIndex - 1]
      : direction === 'next' && hasNext
      ? allItems[currentIndex + 1]
      : null;

    if (!targetItem) return;

    setItem(targetItem);
    setCurrentImageIndex(0);
    window.scrollTo(0, 0);

    // Load additional images for target item
    const { data: imagesData } = await supabase
      .from('item_images')
      .select('image_url, display_order, is_primary')
      .eq('item_id', targetItem.id)
      .order('display_order', { ascending: true });

    if (imagesData && imagesData.length > 0) {
      setItemImages(imagesData.map(img => img.image_url));
    } else {
      setItemImages(targetItem.image_url ? [targetItem.image_url] : []);
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('show_location_to_public, full_name, phone_verified')
      .eq('id', targetItem.user_id)
      .maybeSingle();
    setSellerProfile(profileData);

    // Load pickup address if available
    if (targetItem.selected_address_id) {
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', targetItem.selected_address_id)
        .maybeSingle();

      setPickupAddress(addressData);
    } else {
      setPickupAddress(null);
    }

    skipLoadRef.current = true;
    navigate(`/item/${targetItem.id}`, { state: { allItems }, replace: true });
  }, [allItems, currentIndex, hasPrevious, hasNext, navigate]);

  const images = itemImages.length > 0 ? itemImages : (item?.image_url ? [item.image_url] : []);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const imageSwipeHandlers = useSwipeable({
    onSwipedLeft: handleNextImage,
    onSwipedRight: handlePrevImage,
    trackMouse: false,
    trackTouch: true,
  });


  const itemSwipeHandlers = useSwipeable({
    onSwipedLeft: () => hasNext && navigateToItem('next'),
    onSwipedRight: () => hasPrevious && navigateToItem('prev'),
    trackMouse: false,
    trackTouch: true,
  });

  useItemView(item?.id, !!item);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadItem = async () => {
    if (!id) return;

    if (skipLoadRef.current) {
      skipLoadRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/');
        return;
      }

      // If item is draft, only owner can view it
      if (data.status === 'draft' && (!user || user.id !== data.user_id)) {
        navigate('/');
        return;
      }

      setItem(data);

      // Enable edit mode for drafts or if there are unsaved draft changes
      if (user && user.id === data.user_id) {
        if (data.status === 'draft') {
          if (data.draft_data) {
            setDraftData(data.draft_data);
          }
          setIsEditMode(true);
          setHasUnsavedChanges(true);

          const { count } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .neq('status', 'draft');

          const isFirst = count === 0;
          setIsFirstItem(isFirst);

          const hasSeenOnboarding = localStorage.getItem('hasSeenItemEditOnboarding');
          if (isFirst && !hasSeenOnboarding) {
            setTimeout(() => {
              setShowOnboarding(true);
            }, 800);
          }
        } else if (data.has_draft && data.draft_data) {
          setDraftData(data.draft_data);
          setHasUnsavedChanges(true);
          setIsEditMode(true);
        }
      }

      // Load additional images from item_images table
      const { data: imagesData } = await supabase
        .from('item_images')
        .select('image_url, display_order, is_primary')
        .eq('item_id', id)
        .order('display_order', { ascending: true });

      if (imagesData && imagesData.length > 0) {
        setItemImages(imagesData.map(img => img.image_url));
      } else {
        // Fallback to main image_url if no images in item_images table
        setItemImages(data.image_url ? [data.image_url] : []);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('show_location_to_public, full_name, phone_verified')
        .eq('id', data.user_id)
        .maybeSingle();

      if (profileError) throw profileError;
      setSellerProfile(profileData);

      // Load pickup address if available
      if (data.selected_address_id) {
        const { data: addressData } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', data.selected_address_id)
          .maybeSingle();

        setPickupAddress(addressData);
      } else {
        setPickupAddress(null);
      }
    } catch (err) {
      console.error('Error loading item:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItem();
  }, [id, navigate]);

  useEffect(() => {
    if (item?.title) {
      document.title = item.title;
    }
    return () => {
      document.title = 'Bazar - Dein Online-Flohmarkt';
    };
  }, [item?.title]);

  const handleEnterEditMode = () => {
    if (!item) return;

    const initialDraft = item.has_draft && item.draft_data
      ? item.draft_data
      : {
          title: item.title,
          description: item.description,
          price: item.price,
          price_negotiable: item.price_negotiable || false,
          is_free: item.is_free || false,
          category: item.category || '',
          brand: item.brand || '',
          condition: item.condition || '',
          size: item.size || '',
          weight: item.weight || '',
          dimensions_length: item.dimensions_length || '',
          dimensions_width: item.dimensions_width || '',
          dimensions_height: item.dimensions_height || '',
          material: item.material || '',
          colors: item.colors || [],
          style: item.style || '',
          serial_number: item.serial_number || '',
          features: item.features || [],
          accessories: item.accessories || [],
        };

    setDraftData(initialDraft);
    setIsEditMode(true);
    setHasUnsavedChanges(false);
  };

  const handleUpdateDraft = (field: string, value: any) => {
    setDraftData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handlePublish = async () => {
    if (!item || !id) return;

    setIsPublishing(true);
    try {
      const { images, ...validDraftData } = draftData;

      const updateData: any = {
        ...validDraftData,
        status: item.status === 'draft' ? 'published' : item.status,
        has_draft: false,
        draft_data: null,
        draft_updated_at: null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setItem({ ...item, ...validDraftData });
      setIsEditMode(false);
      setHasUnsavedChanges(false);
      setDraftData({});

      await loadItem();
    } catch (err) {
      console.error('Error publishing:', err);
      setError('Fehler beim Veröffentlichen der Änderungen');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCancelEdit = async () => {
    if (!id) return;

    try {
      await supabase
        .from('items')
        .update({
          has_draft: false,
          draft_data: null,
          draft_updated_at: null,
        })
        .eq('id', id);

      setIsEditMode(false);
      setHasUnsavedChanges(false);
      setDraftData({});
    } catch (err) {
      console.error('Error canceling edit:', err);
    }
  };

  const handlePublishDraft = async () => {
    if (!item || !id || item.status !== 'draft') return;

    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setItem({ ...item, status: 'published' });
      await loadItem();
    } catch (err) {
      console.error('Error publishing draft:', err);
      setError('Fehler beim Veröffentlichen des Entwurfs');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setSnackbar({ open: true, message: 'Bitte gib einen Grund für die Ablehnung an', severity: 'error' });
      return;
    }

    setRejectLoading(true);
    try {
      const { error } = await supabase.rpc('reject_item', {
        item_id: id,
        reason: rejectReason,
      });

      if (error) throw error;

      setSnackbar({ open: true, message: 'Inserat wurde abgelehnt', severity: 'success' });
      setRejectDialog(false);
      setRejectReason('');

      // Reload item to reflect new status
      await loadItem();
    } catch (error: any) {
      setSnackbar({ open: true, message: `Fehler: ${error.message}`, severity: 'error' });
    } finally {
      setRejectLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentImageIndex(0);
  }, [item?.id]);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 600;
      const opacity = Math.max(0, 1 - (scrollY / maxScroll));
      const translateY = -(scrollY * 0.05);
      setScrollOpacity(opacity);
      setScrollTranslate(translateY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (showImageModal) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (hasPrevious) {
            e.preventDefault();
            navigateToItem('prev');
          }
          break;
        case 'ArrowRight':
          if (hasNext) {
            e.preventDefault();
            navigateToItem('next');
          }
          break;
        case 'ArrowUp':
          if (hasPrevious) {
            e.preventDefault();
            navigateToItem('prev');
          }
          break;
        case 'ArrowDown':
          if (hasNext) {
            e.preventDefault();
            navigateToItem('next');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrevious, hasNext, showImageModal, navigateToItem]);



  const handleFavoriteClick = async () => {
    if (!item) return;
    await toggleFavorite(item.id);
  };

  const handleInlineEditSave = () => {
  };

  const handleShareClick = () => {
    setShareDialogOpen(true);
  };

  const handleShareClose = () => {
    setShareDialogOpen(false);
  };


  const handleSendMessage = async () => {
    if (!user) {
      alert('Bitte melde dich an, um eine Nachricht zu senden.');
      return;
    }

    if (!message.trim() || !item) {
      setError('Bitte gib eine Nachricht ein.');
      return;
    }

    if (user.id === item.user_id) {
      setError('Du kannst dir selbst keine Nachricht senden.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const { data: existingConversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', item.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', item.user_id)
        .maybeSingle();

      if (conversationError && conversationError.code !== 'PGRST116') {
        throw conversationError;
      }

      let conversationId: string;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            item_id: item.id,
            buyer_id: user.id,
            seller_id: item.user_id,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;
      }

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message.trim(),
        });

      if (messageError) throw messageError;

      setMessage('');
      setMessageSent(true);
      setTimeout(() => setMessageSent(false), 3000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Fehler beim Senden der Nachricht. Bitte versuche es erneut.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Print-only content */}
      <Box className="print-only" sx={{ display: 'none' }}>
        {/* Clean Print Header */}
        <Box className="print-header">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <img src="/logo.png" alt="HABDAWAS Logo" className="print-logo" />
            </Box>
            <Box sx={{ textAlign: 'right', fontSize: '8pt', color: '#666' }}>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '8pt' }}>Gedruckt: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Compact Title and Main Info */}
        <Box className="print-main-section">
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {/* Image Column */}
            <Box className="print-image-container">
              {images.slice(0, 1).map((img, idx) => (
                <img key={idx} src={img} alt={item.title} className="print-main-image" />
              ))}
            </Box>

            {/* Info Column */}
            <Box sx={{ flex: 1 }}>
              <Typography className="print-title">{item.title}</Typography>
              <Box className="print-price-box">{item.price.toFixed(2)} €</Box>
            </Box>
          </Box>
        </Box>

        {/* Compact Details Grid */}
        <Box className="print-details-grid">
            {(item.postal_code || item.location) && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">📍 Standort:</Box>
                <Box className="print-detail-value">
                  {item.postal_code && item.location
                    ? `${item.postal_code} ${item.location}`
                    : item.postal_code || item.location}
                </Box>
              </Box>
            )}

            {item.condition && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">✨ Zustand:</Box>
                <Box className="print-detail-value">{getConditionLabel(item.condition)}</Box>
              </Box>
            )}

            {item.brand && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">🏷️ Marke:</Box>
                <Box className="print-detail-value">{item.brand}</Box>
              </Box>
            )}

            {item.category && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">📦 Kategorie:</Box>
                <Box className="print-detail-value">{item.category}</Box>
              </Box>
            )}

            {item.subcategory && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">📑 Unterkategorie:</Box>
                <Box className="print-detail-value">{item.subcategory}</Box>
              </Box>
            )}

            {item.shipping_cost !== null && item.shipping_cost !== undefined && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">🚚 Versandkosten:</Box>
                <Box className="print-detail-value">
                  {item.shipping_cost === 0 ? 'Kostenloser Versand' : `${item.shipping_cost.toFixed(2)} €`}
                </Box>
              </Box>
            )}

            {item.size && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">📏 Größe:</Box>
                <Box className="print-detail-value">{item.size}</Box>
              </Box>
            )}

            {(item.dimensions_length || item.dimensions_width || item.dimensions_height) && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">📐 Abmessungen:</Box>
                <Box className="print-detail-value">
                  {item.dimensions_length && item.dimensions_width && item.dimensions_height
                    ? `${item.dimensions_length} × ${item.dimensions_width} × ${item.dimensions_height} cm`
                    : [item.dimensions_length, item.dimensions_width, item.dimensions_height].filter(Boolean).join(' × ') + ' cm'}
                </Box>
              </Box>
            )}

            {item.weight && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">⚖️ Gewicht:</Box>
                <Box className="print-detail-value">{item.weight}</Box>
              </Box>
            )}

            {item.quantity && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">🔢 Verfügbare Menge:</Box>
                <Box className="print-detail-value">{item.quantity}</Box>
              </Box>
            )}

            {item.colors && item.colors.length > 0 && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">🎨 Farben:</Box>
                <Box className="print-detail-value">{item.colors.join(', ')}</Box>
              </Box>
            )}

            {item.material && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">🧵 Material:</Box>
                <Box className="print-detail-value">{item.material}</Box>
              </Box>
            )}

            {item.style && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">✂️ Stil:</Box>
                <Box className="print-detail-value">{item.style}</Box>
              </Box>
            )}

            {item.serial_number && item.serial_number.toLowerCase() !== 'unbekannt' && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">🔖 Seriennummer:</Box>
                <Box className="print-detail-value">{item.serial_number}</Box>
              </Box>
            )}

            {item.item_number && (
              <Box className="print-detail-row">
                <Box className="print-detail-label">🔢 Artikelnummer:</Box>
                <Box className="print-detail-value">{item.item_number}</Box>
              </Box>
            )}
        </Box>

        {/* Description */}
        {item.description && (
          <Box className="print-description-box">
            <span className="print-section-title">📝 Beschreibung:</span>
            <Typography className="print-description-text">{item.description}</Typography>
          </Box>
        )}

        {/* Features & Accessories */}
        {(item.features?.length > 0 || item.accessories?.length > 0) && (
          <Box className="print-extra-box">
            {item.features?.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <span className="print-section-title">⭐ Merkmale:</span> {item.features.join(' • ')}
              </Box>
            )}
            {item.accessories?.length > 0 && (
              <Box>
                <span className="print-section-title">🎁 Zubehör:</span> {item.accessories.join(' • ')}
              </Box>
            )}
          </Box>
        )}

        {/* Seller Contact Info */}
        {sellerProfile && (
          <Box className="print-contact-section">
            <Box className="print-section-title">📞 Kontakt zum Anbieter:</Box>
            <Box sx={{ fontSize: '8.5pt', lineHeight: 1.5 }}>
              {sellerProfile.full_name && (
                <Box>
                  <strong>Name:</strong> {sellerProfile.full_name}
                  {sellerProfile.phone_verified && (
                    <Chip
                      icon={<ShieldCheck size={14} />}
                      label="Telefon verifiziert"
                      size="small"
                      color="success"
                      sx={{ ml: 1, height: 20 }}
                    />
                  )}
                </Box>
              )}
              {pickupAddress?.phone && pickupAddress?.show_phone_publicly && (
                <Box><strong>Telefon:</strong> {pickupAddress.phone}</Box>
              )}
              <Box><strong>Nachricht:</strong> Über HABDAWAS.at Nachrichten-System</Box>
            </Box>
          </Box>
        )}

        {/* Compact Footer */}
        <Box className="print-footer">
          <Typography variant="caption" sx={{ fontSize: '7pt' }}>
            HABDAWAS.at • Hollenthon 33, 2812 Hollenthon • +43 650 25 26 266 • ID: {item.id.slice(0, 10)}
          </Typography>
        </Box>
      </Box>

      {/* Item Share Dialog */}
      {item && (
        <ItemShareDialog
          open={shareDialogOpen}
          onClose={handleShareClose}
          url={window.location.href}
          title={item.title}
          price={item.price}
        />
      )}

      {!isMobile && allItems.length > 0 && (
        <Box sx={{
          position: 'fixed',
          top: 72,
          left: 0,
          right: 0,
          zIndex: 100,
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1.5,
        }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: 48 }}>
              <Button
                variant="text"
                startIcon={<ChevronLeft size={18} />}
                onClick={navigateBack}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  px: 2,
                  height: 40,
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                Zurück
              </Button>

              {user?.id === item.user_id && (
                <>
                  <Button
                    variant={isEditMode ? "contained" : "outlined"}
                    startIcon={<Pencil size={18} />}
                    onClick={() => setIsEditMode(!isEditMode)}
                    sx={{
                      textTransform: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      px: 2.5,
                      height: 40,
                      borderRadius: 2,
                      boxShadow: isEditMode ? 1 : 0,
                    }}
                  >
                    Bearbeiten
                  </Button>
                </>
              )}

              {/* Admin Sperren Button */}
              {hasPermission('items.reject') && item.status === 'published' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<XCircle size={18} />}
                  onClick={() => setRejectDialog(true)}
                  disabled={rejectLoading}
                  sx={{
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    px: 2.5,
                    height: 40,
                    borderRadius: 2,
                  }}
                >
                  Sperren
                </Button>
              )}

              {user?.id === item.user_id && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                      bgcolor: (draftData.status || item.status) === 'draft' ? 'rgba(237, 108, 2, 0.08)' :
                               (draftData.status || item.status) === 'published' ? 'rgba(46, 125, 50, 0.08)' :
                               (draftData.status || item.status) === 'paused' ? 'rgba(158, 158, 158, 0.08)' :
                               (draftData.status || item.status) === 'sold' ? 'rgba(211, 47, 47, 0.08)' :
                               (draftData.status || item.status) === 'reserved' ? 'rgba(2, 136, 209, 0.08)' :
                               'rgba(0, 0, 0, 0.08)',
                      border: '1px solid',
                      borderColor: (draftData.status || item.status) === 'draft' ? 'rgba(237, 108, 2, 0.3)' :
                                   (draftData.status || item.status) === 'published' ? 'rgba(46, 125, 50, 0.3)' :
                                   (draftData.status || item.status) === 'paused' ? 'rgba(158, 158, 158, 0.3)' :
                                   (draftData.status || item.status) === 'sold' ? 'rgba(211, 47, 47, 0.3)' :
                                   (draftData.status || item.status) === 'reserved' ? 'rgba(2, 136, 209, 0.3)' :
                                   'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: (draftData.status || item.status) === 'draft' ? '#ed6c02' :
                                 (draftData.status || item.status) === 'published' ? '#2e7d32' :
                                 (draftData.status || item.status) === 'paused' ? '#9e9e9e' :
                                 (draftData.status || item.status) === 'sold' ? '#d32f2f' :
                                 (draftData.status || item.status) === 'reserved' ? '#0288d1' :
                                 'rgba(0, 0, 0, 0.6)',
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: (draftData.status || item.status) === 'draft' ? '#ed6c02' :
                               (draftData.status || item.status) === 'published' ? '#2e7d32' :
                               (draftData.status || item.status) === 'paused' ? '#9e9e9e' :
                               (draftData.status || item.status) === 'sold' ? '#d32f2f' :
                               (draftData.status || item.status) === 'reserved' ? '#0288d1' :
                               'rgba(0, 0, 0, 0.7)',
                      }}
                    >
                      {(draftData.status || item.status) === 'draft' ? 'Entwurf' :
                       (draftData.status || item.status) === 'published' ? 'Veröffentlicht' :
                       (draftData.status || item.status) === 'paused' ? 'Pausiert' :
                       (draftData.status || item.status) === 'sold' ? 'Verkauft' :
                       (draftData.status || item.status) === 'reserved' ? 'Reserviert' :
                       (draftData.status || item.status) === 'archived' ? 'Archiviert' :
                       (draftData.status || item.status) === 'inactive' ? 'Inaktiv' :
                       'Aktiv'}
                    </Typography>
                  </Box>

                  <IconButton
                    onClick={() => setShowDeleteModal(true)}
                    sx={{
                      color: 'text.secondary',
                      height: 40,
                      width: 40,
                      '&:hover': {
                        bgcolor: 'rgba(211, 47, 47, 0.08)',
                        color: 'error.main',
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </>
              )}

              <Box sx={{ flex: 1 }} />

              {/* Favorite & Share buttons - Desktop */}
              <IconButton
                onClick={handleFavoriteClick}
                disabled={!user || favoriteLoading}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                }}
              >
                {item && isFavorite(item.id) ? <Heart size={20} fill="currentColor" /> : <Heart size={20} />}
              </IconButton>
              <IconButton
                onClick={handleShareClick}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                }}
              >
                <Share2 size={20} />
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 40, px: 1.5, borderRadius: 2, bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                <IconButton
                  onClick={() => navigateToItem('prev')}
                  disabled={!hasPrevious}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&.Mui-disabled': { color: 'action.disabled' },
                  }}
                >
                  <ChevronLeft size={20} />
                </IconButton>

                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50, textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
                  {currentIndex + 1} / {allItems.length}
                </Typography>

                <IconButton
                  onClick={() => navigateToItem('next')}
                  disabled={!hasNext}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&.Mui-disabled': { color: 'action.disabled' },
                  }}
                >
                  <ChevronRight size={20} />
                </IconButton>
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 3, px: isMobile ? 0 : 3, pt: !isMobile && allItems.length > 0 ? 14 : (isMobile ? 2 : 3) }}>

        {user && item && user.id === item.user_id && item.status === 'published' && item.has_draft && (
          <Box
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'warning.main',
              bgcolor: 'rgba(237, 108, 2, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: 'warning.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Pencil size={24} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.1rem' }}>
                Unveröffentlichte Änderungen
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Du hast Änderungen vorgenommen, die noch nicht veröffentlicht wurden. Übernimm die Änderungen, damit sie für andere sichtbar werden.
              </Typography>
            </Box>
            <Button
              size="large"
              variant="contained"
              color="warning"
              onClick={handlePublish}
              disabled={isPublishing}
              startIcon={isPublishing ? <CircularProgress size={18} color="inherit" /> : <Check size={20} />}
              sx={{
                minWidth: 180,
                height: 48,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
                flexShrink: 0,
              }}
            >
              {isPublishing ? 'Wird aktualisiert...' : 'Änderungen übernehmen'}
            </Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0 : 2 }}>
          {!isMobile && (
            <Box
              sx={{
                flex: '1 1 40%',
                position: 'sticky',
                top: allItems.length > 0 ? 160 : 80,
                alignSelf: 'flex-start',
                maxHeight: allItems.length > 0 ? 'calc(100vh - 260px)' : 'calc(100vh - 180px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {user?.id === item.user_id && isEditMode ? (
                <Box sx={{ position: 'relative' }}>
                  <InlineImageGallery
                    images={draftData.images || images.map(url => ({
                      preview: url,
                      existingUrl: url,
                      isPrimary: url === images[0],
                    }))}
                    onChange={(newImages) => handleUpdateDraft('images', newImages)}
                    isEditing={isEditMode}
                  />
                  <IconButton
                    onClick={() => setShowImageManagementModal(true)}
                    sx={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      '&:hover': {
                        bgcolor: 'white',
                        transform: 'scale(1.05)',
                      },
                      boxShadow: 3,
                      zIndex: 10,
                    }}
                  >
                    <ImageIcon size={20} />
                  </IconButton>
                </Box>
              ) : (
                <>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: images.length > 1 ? 'calc(100% - 120px)' : '100%',
                  bgcolor: '#f5f5f5',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 3,
                }}
                onClick={() => setShowImageModal(true)}
              >
                <Box
                  component="img"
                  src={getDetailImageUrl(images[currentImageIndex])}
                  alt={item.title}
                  loading="lazy"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transition: 'opacity 0.3s ease-in-out',
                  }}
                />
                {images.length > 1 && (
                  <>
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                      disabled={currentImageIndex === 0}
                      sx={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.95)',
                        '&:hover': { bgcolor: 'white' },
                        '&.Mui-disabled': {
                          bgcolor: 'rgba(255,255,255,0.5)',
                          opacity: 0.5,
                        },
                        boxShadow: 2,
                        zIndex: 2,
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                      disabled={currentImageIndex === images.length - 1}
                      sx={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.95)',
                        '&:hover': { bgcolor: 'white' },
                        '&.Mui-disabled': {
                          bgcolor: 'rgba(255,255,255,0.5)',
                          opacity: 0.5,
                        },
                        boxShadow: 2,
                        zIndex: 2,
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'rgba(0,0,0,0.65)',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        zIndex: 20,
                      }}
                    >
                      {currentImageIndex + 1} / {images.length}
                    </Box>
                  </>
                )}
              </Box>

              {/* Thumbnail Row */}
              {images.length > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    overflowX: 'auto',
                    pb: 1,
                    '&::-webkit-scrollbar': {
                      height: 6,
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: '#f5f5f5',
                      borderRadius: 3,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: '#ccc',
                      borderRadius: 3,
                      '&:hover': {
                        bgcolor: '#999',
                      },
                    },
                  }}
                >
                  {images.map((imageUrl, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      sx={{
                        minWidth: 100,
                        width: 100,
                        height: 100,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: currentImageIndex === index ? '3px solid #1976d2' : '3px solid transparent',
                        opacity: currentImageIndex === index ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src={getDetailImageUrl(imageUrl)}
                        alt={`${item.title} - Vorschau ${index + 1}`}
                        loading="lazy"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {index === 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            bgcolor: 'primary.main',
                            color: 'white',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          Haupt
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
                </>
              )}
            </Box>
          )}

          <Box
            {...(isMobile && allItems.length > 0 ? itemSwipeHandlers : {})}
            sx={{
              flex: isMobile ? '1' : '1 1 60%',
              bgcolor: 'white',
              borderRadius: 2,
              overflow: isMobile ? 'visible' : 'visible',
              maxHeight: isMobile ? 'none' : 'none',
              mt: isMobile ? '-55px' : 0,
            }}
          >
            {isMobile && (
              <>
                <Box
                  {...imageSwipeHandlers}
                  sx={{
                    position: 'fixed',
                    top: 55,
                    left: 0,
                    right: 0,
                    width: '100%',
                    height: '400px',
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    zIndex: 1,
                  }}
                  onClick={() => setShowImageModal(true)}
                >
                <Box
                  component="img"
                  src={getDetailImageUrl(images[currentImageIndex])}
                  alt={item.title}
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transform: `translateY(${scrollTranslate}px)`,
                    opacity: scrollOpacity,
                    transition: 'opacity 0.1s ease-out',
                    willChange: 'transform, opacity',
                  }}
                />
                {user?.id === item.user_id && isEditMode && (
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); setShowImageManagementModal(true); }}
                    sx={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      '&:hover': {
                        bgcolor: 'white',
                        transform: 'scale(1.05)',
                      },
                      boxShadow: 3,
                      zIndex: 20,
                      opacity: scrollOpacity,
                      transition: 'opacity 0.1s ease-out',
                    }}
                  >
                    <ImageIcon size={20} />
                  </IconButton>
                )}
                {images.length > 1 && (
                  <>
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                      disabled={currentImageIndex === 0}
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'white' },
                        '&.Mui-disabled': {
                          bgcolor: 'rgba(255,255,255,0.5)',
                          opacity: 0.5,
                        },
                        boxShadow: 2,
                        zIndex: 2,
                        opacity: scrollOpacity,
                        transition: 'opacity 0.1s ease-out',
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                      disabled={currentImageIndex === images.length - 1}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'white' },
                        '&.Mui-disabled': {
                          bgcolor: 'rgba(255,255,255,0.5)',
                          opacity: 0.5,
                        },
                        boxShadow: 2,
                        zIndex: 2,
                        opacity: scrollOpacity,
                        transition: 'opacity 0.1s ease-out',
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        zIndex: 20,
                        opacity: scrollOpacity,
                        transition: 'opacity 0.1s ease-out',
                      }}
                    >
                      {currentImageIndex + 1} / {images.length}
                    </Box>
                  </>
                )}
              </Box>
                {/* Platzhalter für fixiertes Bild */}
                {allItems.length === 0 && <Box sx={{ height: { xs: '400px', md: '400px' } }} />}
                {allItems.length > 0 && <Box sx={{ height: { xs: '400px', md: '400px' } }} />}
                <Box
                  sx={{
                    position: 'sticky',
                    top: 55,
                    left: 0,
                    right: 0,
                    width: '100%',
                    bgcolor: 'white',
                    borderBottom: '1px solid #e0e0e0',
                    zIndex: 100,
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Button
                    variant="text"
                    startIcon={<ChevronLeft size={18} />}
                    onClick={navigateBack}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      color: 'text.secondary',
                      fontSize: '0.9375rem',
                      px: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        color: 'primary.main',
                      },
                    }}
                  >
                    Zurück zur Liste
                  </Button>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {user?.id === item.user_id && (
                      <>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.25,
                            py: 0.4,
                            borderRadius: 1.5,
                            bgcolor: (draftData.status || item.status) === 'draft' ? 'rgba(237, 108, 2, 0.08)' :
                                     (draftData.status || item.status) === 'published' ? 'rgba(46, 125, 50, 0.08)' :
                                     (draftData.status || item.status) === 'paused' ? 'rgba(158, 158, 158, 0.08)' :
                                     (draftData.status || item.status) === 'sold' ? 'rgba(211, 47, 47, 0.08)' :
                                     (draftData.status || item.status) === 'reserved' ? 'rgba(2, 136, 209, 0.08)' :
                                     'rgba(0, 0, 0, 0.08)',
                            border: '1px solid',
                            borderColor: (draftData.status || item.status) === 'draft' ? 'rgba(237, 108, 2, 0.3)' :
                                         (draftData.status || item.status) === 'published' ? 'rgba(46, 125, 50, 0.3)' :
                                         (draftData.status || item.status) === 'paused' ? 'rgba(158, 158, 158, 0.3)' :
                                         (draftData.status || item.status) === 'sold' ? 'rgba(211, 47, 47, 0.3)' :
                                         (draftData.status || item.status) === 'reserved' ? 'rgba(2, 136, 209, 0.3)' :
                                         'rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          <Box
                            sx={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              bgcolor: (draftData.status || item.status) === 'draft' ? '#ed6c02' :
                                       (draftData.status || item.status) === 'published' ? '#2e7d32' :
                                       (draftData.status || item.status) === 'paused' ? '#9e9e9e' :
                                       (draftData.status || item.status) === 'sold' ? '#d32f2f' :
                                       (draftData.status || item.status) === 'reserved' ? '#0288d1' :
                                       'rgba(0, 0, 0, 0.6)',
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: (draftData.status || item.status) === 'draft' ? '#ed6c02' :
                                     (draftData.status || item.status) === 'published' ? '#2e7d32' :
                                     (draftData.status || item.status) === 'paused' ? '#9e9e9e' :
                                     (draftData.status || item.status) === 'sold' ? '#d32f2f' :
                                     (draftData.status || item.status) === 'reserved' ? '#0288d1' :
                                     'rgba(0, 0, 0, 0.7)',
                            }}
                          >
                            {(draftData.status || item.status) === 'draft' ? 'Entwurf' :
                             (draftData.status || item.status) === 'published' ? 'Veröffentlicht' :
                             (draftData.status || item.status) === 'paused' ? 'Pausiert' :
                             (draftData.status || item.status) === 'sold' ? 'Verkauft' :
                             (draftData.status || item.status) === 'reserved' ? 'Reserviert' :
                             (draftData.status || item.status) === 'archived' ? 'Archiviert' :
                             (draftData.status || item.status) === 'inactive' ? 'Inaktiv' :
                             'Aktiv'}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => setIsEditMode(!isEditMode)}
                          size="small"
                          sx={{
                            color: isEditMode ? 'primary.main' : 'text.primary',
                            bgcolor: isEditMode ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            '&:hover': { bgcolor: isEditMode ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0,0,0,0.04)' }
                          }}
                        >
                          <Pencil size={18} />
                        </IconButton>
                      </>
                    )}
                    {/* Favorite & Share buttons - always visible */}
                    <IconButton
                      onClick={handleFavoriteClick}
                      disabled={!user || favoriteLoading}
                      size="small"
                      sx={{
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                      }}
                    >
                      {item && isFavorite(item.id) ? <Heart size={18} fill="currentColor" /> : <Heart size={18} />}
                    </IconButton>
                    <IconButton
                      onClick={handleShareClick}
                      size="small"
                      sx={{
                        color: 'text.primary',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                      }}
                    >
                      <Share2 size={18} />
                    </IconButton>
                  </Box>
                </Box>
              </>
            )}

            <Box
              sx={{
                p: isMobile ? 2 : 3,
                px: isMobile ? 2 : 3,
                maxWidth: 800,
                bgcolor: 'white',
                borderRadius: 0,
                position: 'relative',
                zIndex: 10,
              }}
            >
              <Box ref={titleRef} sx={{ mb: isMobile ? 1 : 3 }}>
                <InlineTextField
                  value={draftData.title || item.title}
                  isEditing={isEditMode}
                  onChange={(value) => handleUpdateDraft('title', value)}
                  onSave={handleInlineEditSave}
                  variant={isMobile ? 'h5' : 'h4'}
                  placeholder="Artikeltitel"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: isMobile ? 1.5 : 1.5 }}>
                {(item.postal_code || item.location) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MapPin size={18} color="#666" />
                    <Typography variant="body2" color="text.secondary">
                      {item.postal_code && item.location
                        ? `${item.postal_code} ${item.location}`
                        : item.postal_code || item.location}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={18} color="#666" />
                  <Typography variant="body2" color="text.secondary">
                    {getRelativeTimeString(item.created_at)}
                  </Typography>
                </Box>
              </Box>


              <Box sx={{ mb: isMobile ? 1.5 : 3 }}>
                {isEditMode ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {(draftData.is_free !== undefined ? draftData.is_free : item.is_free) ? (
                        <Typography variant={isMobile ? 'h4' : 'h3'} color="primary.main" fontWeight="bold">
                          Zu verschenken
                        </Typography>
                      ) : (draftData.price_on_request !== undefined ? draftData.price_on_request : item.price_on_request) ? (
                        <Typography variant={isMobile ? 'h4' : 'h3'} color="primary.main" fontWeight="bold">
                          Auf Anfrage
                        </Typography>
                      ) : (
                        <>
                          <InlineTextField
                            value={String(draftData.price !== undefined ? draftData.price : item.price)}
                            isEditing={isEditMode}
                            onChange={(value) => handleUpdateDraft('price', parseFloat(value) || 0)}
                            onSave={handleInlineEditSave}
                            type="number"
                            variant={isMobile ? 'h4' : 'h3'}
                            placeholder="0.00"
                            displayValue={`${parseFloat(String(draftData.price !== undefined ? draftData.price : item.price)).toFixed(2)} €`}
                            displayColor="primary.main"
                          />
                          {(draftData.price_negotiable !== undefined ? draftData.price_negotiable : item.price_negotiable) && (
                            <Chip
                              label="VB"
                              size="small"
                              sx={{ ml: 1.5, height: 28, fontWeight: 700, bgcolor: 'warning.main', color: 'white' }}
                            />
                          )}
                        </>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        mt: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        onClick={() => {
                          const newValue = !(draftData.price_negotiable !== undefined ? draftData.price_negotiable : item.price_negotiable);
                          handleUpdateDraft('price_negotiable', newValue);
                          if (newValue) {
                            handleUpdateDraft('is_free', false);
                            handleUpdateDraft('price_on_request', false);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          cursor: ((draftData.is_free !== undefined ? draftData.is_free : item.is_free) || (draftData.price_on_request !== undefined ? draftData.price_on_request : item.price_on_request)) ? 'not-allowed' : 'pointer',
                          opacity: ((draftData.is_free !== undefined ? draftData.is_free : item.is_free) || (draftData.price_on_request !== undefined ? draftData.price_on_request : item.price_on_request)) ? 0.5 : 1,
                          userSelect: 'none',
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            border: '2px solid',
                            borderColor: (draftData.price_negotiable !== undefined ? draftData.price_negotiable : item.price_negotiable) ? 'primary.main' : '#666',
                            borderRadius: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: (draftData.price_negotiable !== undefined ? draftData.price_negotiable : item.price_negotiable) ? 'primary.main' : 'transparent',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {(draftData.price_negotiable !== undefined ? draftData.price_negotiable : item.price_negotiable) && (
                            <Box sx={{ width: 12, height: 8, borderLeft: '2px solid white', borderBottom: '2px solid white', transform: 'rotate(-45deg)', mb: 0.5 }} />
                          )}
                        </Box>
                        <Typography variant="body1" sx={{ color: 'text.primary' }}>VB</Typography>
                      </Box>

                      <Box
                        onClick={() => {
                          const newValue = !(draftData.is_free !== undefined ? draftData.is_free : item.is_free);
                          handleUpdateDraft('is_free', newValue);
                          if (newValue) {
                            handleUpdateDraft('price_negotiable', false);
                            handleUpdateDraft('price_on_request', false);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            border: '2px solid',
                            borderColor: (draftData.is_free !== undefined ? draftData.is_free : item.is_free) ? 'primary.main' : '#666',
                            borderRadius: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: (draftData.is_free !== undefined ? draftData.is_free : item.is_free) ? 'primary.main' : 'transparent',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {(draftData.is_free !== undefined ? draftData.is_free : item.is_free) && (
                            <Box sx={{ width: 12, height: 8, borderLeft: '2px solid white', borderBottom: '2px solid white', transform: 'rotate(-45deg)', mb: 0.5 }} />
                          )}
                        </Box>
                        <Typography variant="body1" sx={{ color: 'text.primary' }}>Gratis</Typography>
                      </Box>

                      <Box
                        onClick={() => {
                          const newValue = !(draftData.price_on_request !== undefined ? draftData.price_on_request : item.price_on_request);
                          handleUpdateDraft('price_on_request', newValue);
                          if (newValue) {
                            handleUpdateDraft('is_free', false);
                            handleUpdateDraft('price_negotiable', false);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            border: '2px solid',
                            borderColor: (draftData.price_on_request !== undefined ? draftData.price_on_request : item.price_on_request) ? 'primary.main' : '#666',
                            borderRadius: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: (draftData.price_on_request !== undefined ? draftData.price_on_request : item.price_on_request) ? 'primary.main' : 'transparent',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {(draftData.price_on_request !== undefined ? draftData.price_on_request : item.price_on_request) && (
                            <Box sx={{ width: 12, height: 8, borderLeft: '2px solid white', borderBottom: '2px solid white', transform: 'rotate(-45deg)', mb: 0.5 }} />
                          )}
                        </Box>
                        <Typography variant="body1" sx={{ color: 'text.primary' }}>Auf Anfrage</Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant={isMobile ? 'h4' : 'h3'} color="primary.main" fontWeight="bold">
                      {item.is_free ? 'Zu verschenken' : item.price_on_request ? 'Auf Anfrage' : `${item.price.toFixed(2)} €`}
                      {item.price_negotiable && !item.is_free && !item.price_on_request && (
                        <Chip
                          label="VB"
                          size="small"
                          sx={{ ml: 1.5, height: 28, fontWeight: 700, bgcolor: 'warning.main', color: 'white' }}
                        />
                      )}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: isMobile ? 2 : 3 }} />

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Beschreibung
              </Typography>
              <InlineTextField
                value={draftData.description || item.description}
                isEditing={isEditMode}
                onChange={(value) => handleUpdateDraft('description', value)}
                onSave={handleInlineEditSave}
                multiline
                rows={12}
                placeholder="Artikelbeschreibung"
              />

              {(
                categoryPath.length > 0 || itemAttributes.length > 0 ||
                item.category || item.subcategory ||
                item.size || item.weight || item.dimensions_length ||
                item.material || item.colors?.length || item.style ||
                item.features?.length || item.accessories?.length ||
                (item.serial_number && item.serial_number.toLowerCase() !== 'unbekannt')
              ) && (
                <>
                  <Divider sx={{ my: isMobile ? 2 : 3 }} />

                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Produktdetails
                  </Typography>

                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {(categoryPath.length > 0 || item.category || item.subcategory || isEditMode) && (
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          p: 2,
                          bgcolor: isEditMode ? '#e3f2fd' : '#f8f9fa',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: isEditMode ? '#2196f3' : 'grey.200',
                        }}
                      >
                        {!isEditMode && (
                          <Box sx={{ mt: 0.25, color: 'primary.main' }}>
                            <Grid3x3 size={20} />
                          </Box>
                        )}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <InlineSelect
                              value={draftData.category || item.category || ''}
                              isEditing={isEditMode} onSave={handleInlineEditSave}
                              onChange={(value) => handleUpdateDraft('category', value)}
                              options={[
                                { value: 'Elektronik', label: 'Elektronik' },
                                { value: 'Kleidung', label: 'Kleidung' },
                                { value: 'Möbel', label: 'Möbel' },
                                { value: 'Bücher', label: 'Bücher' },
                                { value: 'Sport', label: 'Sport' },
                                { value: 'Spielzeug', label: 'Spielzeug' },
                                { value: 'Haushalt', label: 'Haushalt' },
                                { value: 'Garten', label: 'Garten' },
                                { value: 'Auto', label: 'Auto & Motorrad' },
                                { value: 'Sonstiges', label: 'Sonstiges' },
                              ]}
                              placeholder="Kategorie wählen"
                              label="Kategorie"
                            />
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
                                Kategorie
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                                {categoryPath.length > 0
                                  ? categoryPath.map(cat => getCategoryName(cat, 'de')).join(' › ')
                                  : [item.category, item.subcategory].filter(Boolean).join(' › ')}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Dynamic Attributes from category_attributes */}
                    {itemAttributes.length > 0 && itemAttributes.map((attr) => {
                      const label = getAttributeLabel(attr, 'de');
                      const value = getAttributeValue(attr);

                      if (!value && !isEditMode) return null;

                      return (
                        <Box
                          key={attr.id}
                          sx={{
                            display: 'flex',
                            gap: 1.5,
                            p: 2,
                            bgcolor: isEditMode ? '#e8f5e9' : '#f8f9fa',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: isEditMode ? '#4caf50' : 'grey.200',
                          }}
                        >
                          {!isEditMode && (
                            <Box sx={{ mt: 0.25, color: 'info.main' }}>
                              <Tag size={20} />
                            </Box>
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: 0.8,
                                display: 'block',
                                mb: 0.5
                              }}
                            >
                              {label}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}

                    {/* Zustand (Condition) Box */}
                    {item.condition && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Box sx={{ mt: 0.25, color: 'info.main' }}><Tag size={20} /></Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
                            Zustand
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                            {getConditionLabel(item.condition)}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Marke (Brand) Box */}
                    {item.brand && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Box sx={{ mt: 0.25, color: 'primary.main' }}><Tag size={20} /></Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
                            Marke
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500, textTransform: 'uppercase' }}>
                            {item.brand}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {((item.size && item.size.toLowerCase() !== 'unbekannt') || isEditMode) && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: isEditMode ? '#fff3e0' : '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: isEditMode ? '#ff9800' : 'grey.200' }}>
                        {!isEditMode && <Box sx={{ mt: 0.25, color: 'success.main' }}><Ruler size={20} /></Box>}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <InlineTextField
                              value={draftData.size || item.size || ''}
                              isEditing={isEditMode} onSave={handleInlineEditSave}
                              onChange={(value) => handleUpdateDraft('size', value)}
                              label="Größe"
                              placeholder="z.B. XL, 42, 180cm"
                            />
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>Größe</Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{item.size}</Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}

                    {((item.weight && item.weight.toLowerCase() !== 'unbekannt') || isEditMode) && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: isEditMode ? '#fff3e0' : '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: isEditMode ? '#ff9800' : 'grey.200' }}>
                        {!isEditMode && <Box sx={{ mt: 0.25, color: 'warning.main' }}><Weight size={20} /></Box>}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <InlineTextField
                              value={draftData.weight || item.weight || ''}
                              isEditing={isEditMode} onSave={handleInlineEditSave}
                              onChange={(value) => handleUpdateDraft('weight', value)}
                              label="Gewicht"
                              placeholder="z.B. 500g, 2kg"
                            />
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>Gewicht</Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{item.weight}</Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}

                    {(item.dimensions_length || isEditMode) && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: isEditMode ? '#fff3e0' : '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: isEditMode ? '#ff9800' : 'grey.200' }}>
                        {!isEditMode && <Box sx={{ mt: 0.25, color: 'info.main' }}><BoxIcon size={20} /></Box>}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <InlineTextField
                                value={draftData.dimensions_length || item.dimensions_length || ''}
                                isEditing={isEditMode} onSave={handleInlineEditSave}
                                onChange={(value) => handleUpdateDraft('dimensions_length', value)}
                                label="Länge (cm)"
                                placeholder="Länge"
                              />
                              <InlineTextField
                                value={draftData.dimensions_width || item.dimensions_width || ''}
                                isEditing={isEditMode} onSave={handleInlineEditSave}
                                onChange={(value) => handleUpdateDraft('dimensions_width', value)}
                                label="Breite (cm)"
                                placeholder="Breite"
                              />
                              <InlineTextField
                                value={draftData.dimensions_height || item.dimensions_height || ''}
                                isEditing={isEditMode} onSave={handleInlineEditSave}
                                onChange={(value) => handleUpdateDraft('dimensions_height', value)}
                                label="Höhe (cm)"
                                placeholder="Höhe"
                              />
                            </Box>
                          ) : (
                            item.dimensions_length && (
                              <>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>Abmessungen</Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                                  {[item.dimensions_length, item.dimensions_width, item.dimensions_height].filter(Boolean).join(' × ')}
                                </Typography>
                              </>
                            )
                          )}
                        </Box>
                      </Box>
                    )}

                    {((item.material && item.material.toLowerCase() !== 'unbekannt') || isEditMode) && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: isEditMode ? '#fff3e0' : '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: isEditMode ? '#ff9800' : 'grey.200' }}>
                        {!isEditMode && <Box sx={{ mt: 0.25, color: 'secondary.main' }}><Sparkles size={20} /></Box>}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <InlineTextField
                              value={draftData.material || item.material || ''}
                              isEditing={isEditMode} onSave={handleInlineEditSave}
                              onChange={(value) => handleUpdateDraft('material', value)}
                              label="Material"
                              placeholder="z.B. Baumwolle, Holz, Metall"
                            />
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>Material</Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{item.material}</Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}

                    {((item.style && item.style.toLowerCase() !== 'unbekannt') || isEditMode) && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: isEditMode ? '#fff3e0' : '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: isEditMode ? '#ff9800' : 'grey.200' }}>
                        {!isEditMode && <Box sx={{ mt: 0.25, color: 'primary.main' }}><Tag size={20} /></Box>}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <InlineTextField
                              value={draftData.style || item.style || ''}
                              isEditing={isEditMode} onSave={handleInlineEditSave}
                              onChange={(value) => handleUpdateDraft('style', value)}
                              label="Stil"
                              placeholder="z.B. Modern, Vintage, Klassisch"
                            />
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>Stil</Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{item.style}</Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}

                    {(item.colors?.length > 0 || isEditMode) && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: isEditMode ? '#fff3e0' : '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: isEditMode ? '#ff9800' : 'grey.200' }}>
                        {!isEditMode && <Box sx={{ mt: 0.25, color: 'error.main' }}><Palette size={20} /></Box>}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <InlineChipList
                              value={draftData.colors || item.colors || []}
                              isEditing={isEditMode} onSave={handleInlineEditSave}
                              onChange={(value) => handleUpdateDraft('colors', value)}
                              label="Farben"
                              placeholder="Farbe hinzufügen"
                              color="primary"
                            />
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>Farben</Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                {item.colors?.map((color, idx) => (
                                  <Chip key={idx} label={color} size="small" sx={{ height: 26, fontSize: '0.85rem', fontWeight: 500, bgcolor: 'primary.50', color: 'primary.dark', border: 1, borderColor: 'primary.200' }} />
                                ))}
                              </Box>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}

                    {(item.features?.length > 0 || isEditMode) && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: isEditMode ? '#e8f5e9' : '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: isEditMode ? '#4caf50' : 'grey.200' }}>
                        {!isEditMode && <Box sx={{ mt: 0.25, color: 'success.main' }}><Sparkles size={20} /></Box>}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <InlineChipList
                              value={draftData.features || item.features || []}
                              isEditing={isEditMode} onSave={handleInlineEditSave}
                              onChange={(value) => handleUpdateDraft('features', value)}
                              label="Eigenschaften"
                              placeholder="Eigenschaft hinzufügen"
                              color="success"
                            />
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.75 }}>Eigenschaften</Typography>
                              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                {item.features?.map((feature, idx) => (
                                  <Chip key={idx} label={feature} size="small" sx={{ height: 26, fontSize: '0.85rem', fontWeight: 500, bgcolor: 'success.50', color: 'success.dark', border: 1, borderColor: 'success.200' }} />
                                ))}
                              </Box>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}

                    {(item.accessories?.length > 0 || isEditMode) && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: isEditMode ? '#e3f2fd' : '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: isEditMode ? '#2196f3' : 'grey.200' }}>
                        {!isEditMode && <Box sx={{ mt: 0.25, color: 'info.main' }}><Package size={20} /></Box>}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <InlineChipList
                              value={draftData.accessories || item.accessories || []}
                              isEditing={isEditMode} onSave={handleInlineEditSave}
                              onChange={(value) => handleUpdateDraft('accessories', value)}
                              label="Zubehör"
                              placeholder="Zubehör hinzufügen"
                              color="info"
                            />
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.75 }}>Zubehör</Typography>
                              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                {item.accessories.map((accessory, idx) => (
                                  <Chip key={idx} label={accessory} size="small" sx={{ height: 26, fontSize: '0.85rem', fontWeight: 500, bgcolor: 'info.50', color: 'info.dark', border: 1, borderColor: 'info.200' }} />
                                ))}
                              </Box>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}

                    {((item.serial_number && item.serial_number.toLowerCase() !== 'unbekannt') || isEditMode) && (
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: isEditMode ? '#fff3e0' : '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: isEditMode ? '#ff9800' : 'grey.200' }}>
                        {!isEditMode && <Box sx={{ mt: 0.25, color: 'grey.600' }}><Hash size={20} /></Box>}
                        <Box sx={{ flex: 1 }}>
                          {isEditMode ? (
                            <InlineTextField
                              value={draftData.serial_number || item.serial_number || ''}
                              isEditing={isEditMode} onSave={handleInlineEditSave}
                              onChange={(value) => handleUpdateDraft('serial_number', value)}
                              label="Seriennummer"
                              placeholder="Seriennummer oder Artikelnummer"
                            />
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>Seriennummer</Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'text.primary', fontWeight: 500 }}>{item.serial_number}</Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </>
              )}

              {(item.tags?.length > 0 || isEditMode) && (
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>Tags</Typography>
                  {isEditMode ? (
                    <InlineChipList
                      value={draftData.tags || item.tags || []}
                      isEditing={isEditMode} onSave={handleInlineEditSave}
                      onChange={(value) => handleUpdateDraft('tags', value)}
                      placeholder="Tag hinzufügen und Enter drücken"
                    />
                  ) : (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {item.tags.map((tag, idx) => (
                        <Chip key={idx} label={`#${tag}`} size="small" variant="filled" />
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              <Divider sx={{ my: isMobile ? 2 : 3 }} />

              {(item.snapshot_shipping_enabled || item.snapshot_pickup_enabled || isEditMode) && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Versand & Abholung
                  </Typography>

                  {isEditMode ? (
                    <>
                      <Box sx={{ mb: 2, p: isMobile ? 1.5 : 2, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <MapPin size={isMobile ? 18 : 20} color="#1976d2" />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={draftData.snapshot_pickup_enabled !== undefined ? draftData.snapshot_pickup_enabled : item.snapshot_pickup_enabled}
                                onChange={(e) => handleUpdateDraft('snapshot_pickup_enabled', e.target.checked)}
                              />
                            }
                            label={<Typography variant={isMobile ? 'body1' : 'subtitle1'} fontWeight={600}>Abholung möglich</Typography>}
                            sx={{ m: 0 }}
                          />
                        </Box>
                        {(draftData.snapshot_pickup_enabled !== undefined ? draftData.snapshot_pickup_enabled : item.snapshot_pickup_enabled) && (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {user && item.snapshot_show_location_publicly && item.snapshot_pickup_address ? (
                                <>
                                  {item.snapshot_pickup_address}<br />
                                  {item.snapshot_pickup_postal_code} {item.snapshot_pickup_city}, {item.snapshot_pickup_country}
                                </>
                              ) : (
                                <>
                                  {item.location || item.snapshot_pickup_city ? (
                                    <>Standort: {item.location || item.snapshot_pickup_city}{item.snapshot_pickup_country ? `, ${item.snapshot_pickup_country}` : ''}</>
                                  ) : (
                                    'Standort auf Anfrage'
                                  )}
                                </>
                              )}
                            </Typography>
                            <InlineTextField
                              value={draftData.snapshot_location_description !== undefined ? draftData.snapshot_location_description : (item.snapshot_location_description || '')}
                              isEditing={isEditMode}
                              onChange={(value) => handleUpdateDraft('snapshot_location_description', value)}
                              onSave={handleInlineEditSave}
                              placeholder="Optionale Beschreibung zur Abholung"
                              label="Abholbeschreibung"
                            />
                          </>
                        )}
                      </Box>

                      <Box sx={{ mb: 2, p: isMobile ? 1.5 : 2, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <Truck size={isMobile ? 18 : 20} color="#1976d2" />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={draftData.snapshot_shipping_enabled !== undefined ? draftData.snapshot_shipping_enabled : item.snapshot_shipping_enabled}
                                onChange={(e) => handleUpdateDraft('snapshot_shipping_enabled', e.target.checked)}
                              />
                            }
                            label={<Typography variant={isMobile ? 'body1' : 'subtitle1'} fontWeight={600}>Versand verfügbar</Typography>}
                            sx={{ m: 0 }}
                          />
                        </Box>
                        {(draftData.snapshot_shipping_enabled !== undefined ? draftData.snapshot_shipping_enabled : item.snapshot_shipping_enabled) && (
                          <>
                            <InlineSelect
                              value={draftData.snapshot_shipping_cost_type !== undefined ? draftData.snapshot_shipping_cost_type : (item.snapshot_shipping_cost_type || 'fixed')}
                              isEditing={isEditMode}
                              onChange={(value) => handleUpdateDraft('snapshot_shipping_cost_type', value)}
                              onSave={handleInlineEditSave}
                              options={[
                                { value: 'free', label: 'Kostenloser Versand' },
                                { value: 'fixed', label: 'Feste Versandkosten' },
                                { value: 'ai_calculated', label: 'KI-berechnet' }
                              ]}
                              label="Versandkostentyp"
                            />
                            {(draftData.snapshot_shipping_cost_type !== undefined ? draftData.snapshot_shipping_cost_type : item.snapshot_shipping_cost_type) === 'fixed' && (
                              <Box sx={{ mt: 1 }}>
                                <InlineTextField
                                  value={String(draftData.snapshot_shipping_cost !== undefined ? draftData.snapshot_shipping_cost : (item.snapshot_shipping_cost || 0))}
                                  isEditing={isEditMode}
                                  onChange={(value) => handleUpdateDraft('snapshot_shipping_cost', parseFloat(value) || 0)}
                                  onSave={handleInlineEditSave}
                                  type="number"
                                  placeholder="0.00"
                                  label="Versandkosten (€)"
                                  displayValue={`${parseFloat(String(draftData.snapshot_shipping_cost !== undefined ? draftData.snapshot_shipping_cost : (item.snapshot_shipping_cost || 0))).toFixed(2)} €`}
                                />
                              </Box>
                            )}
                            {(draftData.snapshot_shipping_cost_type !== undefined ? draftData.snapshot_shipping_cost_type : item.snapshot_shipping_cost_type) === 'ai_calculated' && (item.ai_shipping_domestic || item.ai_shipping_international) && (
                              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffe0b2' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Package size={16} color="#f57c00" />
                                  <Typography variant="body2" fontWeight={600} color="#e65100">KI-berechnete Versandkosten</Typography>
                                </Box>
                                {item.ai_shipping_domestic && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                                    📦 {(item.snapshot_pickup_country || item.shipping_from_country) === 'AT' ? 'Österreich' : (item.snapshot_pickup_country || item.shipping_from_country) === 'DE' ? 'Deutschland' : 'Inland'}: ca. {item.ai_shipping_domestic.toFixed(2)} €
                                  </Typography>
                                )}
                                {item.ai_shipping_international && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                                    🌍 EU-Ausland: ca. {item.ai_shipping_international.toFixed(2)} €
                                  </Typography>
                                )}
                                {item.estimated_weight_kg && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                    Geschätztes Gewicht: {item.estimated_weight_kg} kg
                                  </Typography>
                                )}
                                {item.package_dimensions && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                                    Geschätzte Maße: {item.package_dimensions.length}×{item.package_dimensions.width}×{item.package_dimensions.height} cm
                                  </Typography>
                                )}
                              </Box>
                            )}
                            <Box sx={{ mt: 1 }}>
                              <InlineTextField
                                value={draftData.snapshot_shipping_description !== undefined ? draftData.snapshot_shipping_description : (item.snapshot_shipping_description || '')}
                                isEditing={isEditMode}
                                onChange={(value) => handleUpdateDraft('snapshot_shipping_description', value)}
                                onSave={handleInlineEditSave}
                                placeholder="Optionale Versandbeschreibung"
                                label="Versandbeschreibung"
                              />
                            </Box>
                          </>
                        )}
                      </Box>
                    </>
                  ) : (
                    <>
                      {item.snapshot_pickup_enabled && (
                        <Box sx={{ mb: 2, p: isMobile ? 1.5 : 2, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <MapPin size={isMobile ? 18 : 20} color="#1976d2" />
                            <Typography variant={isMobile ? 'body1' : 'subtitle1'} fontWeight={600}>Abholung möglich</Typography>
                          </Box>
                          {user && item.snapshot_show_location_publicly && item.snapshot_pickup_address ? (
                            <>
                              <Typography variant="body2" color="text.secondary">{item.snapshot_pickup_address}</Typography>
                              <Typography variant="body2" color="text.secondary">{item.snapshot_pickup_postal_code} {item.snapshot_pickup_city}, {item.snapshot_pickup_country}</Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {item.location || item.snapshot_pickup_city ? (
                                <>Standort: {item.location || item.snapshot_pickup_city}{item.snapshot_pickup_country ? `, ${item.snapshot_pickup_country}` : ''}</>
                              ) : (
                                'Standort auf Anfrage'
                              )}
                            </Typography>
                          )}
                          {item.snapshot_location_description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>{item.snapshot_location_description}</Typography>
                          )}
                        </Box>
                      )}

                      {item.snapshot_shipping_enabled && (
                        <>
                          {item.snapshot_shipping_cost_type === 'free' && (
                            <Box sx={{ mb: 2, p: isMobile ? 1.5 : 2, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Truck size={isMobile ? 18 : 20} color="#1976d2" />
                                <Typography variant={isMobile ? 'body1' : 'subtitle1'} fontWeight={600}>Versand verfügbar</Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">Versandkosten: Kostenlos</Typography>
                              {item.snapshot_shipping_description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>{item.snapshot_shipping_description}</Typography>
                              )}
                            </Box>
                          )}

                          {item.snapshot_shipping_cost_type === 'fixed' && (
                            <Box sx={{ mb: 2, p: isMobile ? 1.5 : 2, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Truck size={isMobile ? 18 : 20} color="#1976d2" />
                                <Typography variant={isMobile ? 'body1' : 'subtitle1'} fontWeight={600}>Versand verfügbar</Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Versandkosten: {(item.snapshot_shipping_cost && item.snapshot_shipping_cost > 0) ? `${item.snapshot_shipping_cost.toFixed(2)} €` : 'Auf Anfrage'}
                              </Typography>
                              {item.snapshot_shipping_description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>{item.snapshot_shipping_description}</Typography>
                              )}
                            </Box>
                          )}

                          {item.snapshot_shipping_cost_type === 'ai_calculated' && (item.ai_shipping_domestic || item.ai_shipping_international) && (
                            <Box sx={{ mb: 2, p: isMobile ? 1.5 : 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffe0b2' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <Package size={isMobile ? 18 : 20} color="#f57c00" />
                                <Typography variant={isMobile ? 'body1' : 'subtitle1'} fontWeight={600} color="#e65100">KI-berechnete Versandkosten</Typography>
                              </Box>
                              {item.ai_shipping_domestic && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  📦 {(item.snapshot_pickup_country || item.shipping_from_country) === 'AT' ? 'Österreich' : (item.snapshot_pickup_country || item.shipping_from_country) === 'DE' ? 'Deutschland' : 'Inland'}: ca. {item.ai_shipping_domestic.toFixed(2)} €
                                </Typography>
                              )}
                              {item.ai_shipping_international && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>🌍 EU-Ausland: ca. {item.ai_shipping_international.toFixed(2)} €</Typography>
                              )}
                              {item.estimated_weight_kg && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem', fontStyle: 'italic' }}>
                                  Geschätztes Gewicht: {item.estimated_weight_kg} kg
                                </Typography>
                              )}
                              {item.package_dimensions && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                                  Geschätzte Maße: {item.package_dimensions.length}×{item.package_dimensions.width}×{item.package_dimensions.height} cm
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontSize: '0.75rem' }}>
                                ⓘ Diese Versandkosten wurden automatisch von der KI basierend auf Größe und Gewicht geschätzt.
                              </Typography>
                              {item.snapshot_shipping_description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontStyle: 'italic' }}>{item.snapshot_shipping_description}</Typography>
                              )}
                            </Box>
                          )}
                        </>
                      )}
                    </>
                  )}

                  <Divider sx={{ my: isMobile ? 2 : 3 }} />
                </>
              )}

              {!isEditMode && item.user_id && (
                <Box sx={{ mb: isMobile ? 2 : 3 }}>
                  <SellerProfile userId={item.user_id} currentItemId={item.id} />
                </Box>
              )}

              <Box sx={{ bgcolor: '#f0f7ff', p: isMobile ? 2 : 3, borderRadius: 2, mb: isMobile ? 2 : 3, border: '1px solid #e3f2fd' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Verkäufer kontaktieren</Typography>
                  {sellerProfile?.phone_verified && (
                    <Chip
                      icon={<ShieldCheck size={14} />}
                      label="Telefon verifiziert"
                      size="small"
                      color="success"
                      sx={{ height: 24 }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                  Interesse an diesem Artikel? Kontaktiere den Verkäufer für weitere Informationen oder um einen Kauf zu vereinbaren.
                </Typography>

                {pickupAddress?.phone && pickupAddress?.show_phone_publicly && (
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #e3f2fd', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 36, height: 36, flexShrink: 0 }}>
                      <Phone size={18} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.25 }}>
                        Telefon
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        <a href={`tel:${pickupAddress.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {pickupAddress.phone}
                        </a>
                      </Typography>
                    </Box>
                  </Box>
                )}

                {messageSent && (
                  <Alert severity="success" sx={{ mb: 2 }}>Nachricht erfolgreich gesendet!</Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
                )}

                {!user && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Bitte melde dich an, um den Verkäufer zu kontaktieren.
                  </Alert>
                )}

                {user && user.id === item.user_id && (
                  <Alert severity="info" sx={{ mb: 0 }}>
                    Dies ist dein eigenes Inserat.
                  </Alert>
                )}

                {user && user.id !== item.user_id && (
                  <>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Schreibe eine Nachricht an den Verkäufer..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      sx={{ mb: 2, bgcolor: 'white' }}
                      disabled={!user}
                      inputRef={messageInputRef}
                    />

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleSendMessage}
                      disabled={!user || !message.trim() || sending}
                      startIcon={<Send size={18} />}
                    >
                      {sending ? 'Wird gesendet...' : 'Nachricht senden'}
                    </Button>
                  </>
                )}
              </Box>

              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                Inserat-ID: {item.id.slice(0, 8)}{isMobile && <br />} • Veröffentlicht am {new Date(item.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} um {new Date(item.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>

      {showImageModal && (
        <div className="lightbox-overlay" onClick={() => setShowImageModal(false)}>
          <button
            className={isMobile ? (handPreference === 'left' ? "lightbox-close lightbox-close-mobile lightbox-close-left" : "lightbox-close lightbox-close-mobile") : "lightbox-close"}
            onClick={() => setShowImageModal(false)}
            aria-label="Schließen"
          >
            ✕
          </button>
          {images.length > 1 && (
            <>
              <IconButton
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                disabled={currentImageIndex === 0}
                sx={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  color: 'black',
                  '&:hover': { bgcolor: 'white' },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(0,0,0,0.3)',
                  },
                  boxShadow: 3,
                  zIndex: 1502,
                  width: 48,
                  height: 48,
                }}
              >
                <ChevronLeft size={32} />
              </IconButton>
              <IconButton
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                disabled={currentImageIndex === images.length - 1}
                sx={{
                  position: 'absolute',
                  right: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  color: 'black',
                  '&:hover': { bgcolor: 'white' },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(0,0,0,0.3)',
                  },
                  boxShadow: 3,
                  zIndex: 1502,
                  width: 48,
                  height: 48,
                }}
              >
                <ChevronRight size={32} />
              </IconButton>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 3,
                  py: 1,
                  borderRadius: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  zIndex: 1502,
                }}
              >
                {currentImageIndex + 1} / {images.length}
              </Box>
            </>
          )}
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={getFullImageUrl(images[currentImageIndex])} alt={item.title} loading="lazy" />
          </div>
        </div>
      )}

      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: handPreference === 'left' ? 'flex-start' : 'flex-end',
            px: 3,
            pb: 1.5,
            gap: 1,
            zIndex: 500,
            pointerEvents: 'none',
            '& > *': {
              pointerEvents: 'auto',
            },
          }}
        >
          {handPreference === 'right' ? (
            <>
              {showScrollTop && (
                <IconButton
                  onClick={scrollToTop}
                  sx={{
                    bgcolor: 'rgba(25, 118, 210, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ArrowUp size={28} />
                </IconButton>
              )}
              {allItems.length > 0 && hasPrevious && (
                <IconButton
                  onClick={() => navigateToItem('prev')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    border: 2,
                    borderColor: 'rgba(25, 118, 210, 0.8)',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronLeft size={28} color="#1976d2" />
                </IconButton>
              )}
              {allItems.length > 0 && hasNext && (
                <IconButton
                  onClick={() => navigateToItem('next')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    border: 2,
                    borderColor: 'rgba(25, 118, 210, 0.8)',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronRight size={28} color="#1976d2" />
                </IconButton>
              )}
            </>
          ) : (
            <>
              {allItems.length > 0 && hasNext && (
                <IconButton
                  onClick={() => navigateToItem('next')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    border: 2,
                    borderColor: 'rgba(25, 118, 210, 0.8)',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronRight size={28} color="#1976d2" />
                </IconButton>
              )}
              {allItems.length > 0 && hasPrevious && (
                <IconButton
                  onClick={() => navigateToItem('prev')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    border: 2,
                    borderColor: 'rgba(25, 118, 210, 0.8)',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronLeft size={28} color="#1976d2" />
                </IconButton>
              )}
              {showScrollTop && (
                <IconButton
                  onClick={scrollToTop}
                  sx={{
                    bgcolor: 'rgba(25, 118, 210, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ArrowUp size={28} />
                </IconButton>
              )}
            </>
          )}
        </Box>
      )}

      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            left: handPreference === 'left' ? 16 : 'auto',
            right: handPreference === 'left' ? 'auto' : 16,
            bottom: 24,
            display: 'flex',
            gap: 1,
            zIndex: 500,
          }}
        >
          {handPreference === 'right' ? (
            <>
              {showScrollTop && (
                <IconButton
                  onClick={scrollToTop}
                  sx={{
                    bgcolor: 'rgba(25, 118, 210, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ArrowUp size={28} />
                </IconButton>
              )}
              {allItems.length > 0 && hasPrevious && (
                <IconButton
                  onClick={() => navigateToItem('prev')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    border: 2,
                    borderColor: 'rgba(25, 118, 210, 0.8)',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronLeft size={28} color="#1976d2" />
                </IconButton>
              )}
              {allItems.length > 0 && hasNext && (
                <IconButton
                  onClick={() => navigateToItem('next')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    border: 2,
                    borderColor: 'rgba(25, 118, 210, 0.8)',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronRight size={28} color="#1976d2" />
                </IconButton>
              )}
            </>
          ) : (
            <>
              {allItems.length > 0 && hasNext && (
                <IconButton
                  onClick={() => navigateToItem('next')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    border: 2,
                    borderColor: 'rgba(25, 118, 210, 0.8)',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronRight size={28} color="#1976d2" />
                </IconButton>
              )}
              {allItems.length > 0 && hasPrevious && (
                <IconButton
                  onClick={() => navigateToItem('prev')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    border: 2,
                    borderColor: 'rgba(25, 118, 210, 0.8)',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronLeft size={28} color="#1976d2" />
                </IconButton>
              )}
              {showScrollTop && (
                <IconButton
                  onClick={scrollToTop}
                  sx={{
                    bgcolor: 'rgba(25, 118, 210, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    boxShadow: 3,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.95)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ArrowUp size={28} />
                </IconButton>
              )}
            </>
          )}
        </Box>
      )}

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Artikel löschen"
        maxWidth="xs"
        actions={
          <>
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={async () => {
                await supabase.from('items').delete().eq('id', item?.id);
                setShowDeleteModal(false);
                navigate('/');
              }}
              variant="contained"
              color="error"
              sx={{ textTransform: 'none' }}
            >
              Löschen
            </Button>
          </>
        }
      >
        <Typography>
          Möchtest du diesen Artikel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </Typography>
      </Modal>

      {isEditMode && user && item && user.id === item.user_id && (
        <FloatingActionBar
          onPublish={handlePublish}
          onCancel={handleCancelEdit}
          isPublishing={isPublishing}
          autoSaveStatus={autoSaveStatus}
          hasChanges={hasUnsavedChanges}
          isDraft={item.status === 'draft'}
          itemStatus={item.status}
          isFirstItem={isFirstItem}
        />
      )}

      <OnboardingTooltip
        show={showOnboarding}
        targetElement={titleRef.current}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('hasSeenItemEditOnboarding', 'true');
        }}
        title="Inline-Bearbeitung"
        description="Klicke einfach auf einen beliebigen Bereich wie den Titel, die Beschreibung oder die Bilder, um sie direkt zu bearbeiten. Deine Änderungen werden automatisch gespeichert."
      />

      <Modal
        open={showImageManagementModal}
        onClose={() => setShowImageManagementModal(false)}
        title="Bilder verwalten"
        maxWidth="xl"
        fullScreen
        actions={
          <Button
            onClick={() => setShowImageManagementModal(false)}
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Fertig
          </Button>
        }
      >
        <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
          <InlineImageGallery
            images={draftData.images || images.map(url => ({
              preview: url,
              existingUrl: url,
              isPrimary: url === images[0],
            }))}
            onChange={(newImages) => handleUpdateDraft('images', newImages)}
            isEditing={isEditMode}
          />
        </Box>
      </Modal>

      {/* Reject/Sperren Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Inserat ablehnen/sperren</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bitte gib einen Grund für die Ablehnung/Sperrung an. Der Verkäufer wird benachrichtigt.
          </Typography>
          <TextField
            label="Ablehnungsgrund"
            multiline
            rows={4}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="z.B. Verstößt gegen Nutzungsbedingungen, Unerlaubter Inhalt, Falsche Kategorie..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={rejectLoading || !rejectReason.trim()}
          >
            Sperren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
