import { useState, useEffect } from 'react';
import { Container, Box, Alert, CircularProgress, useMediaQuery, useTheme, Drawer, IconButton, AppBar, Toolbar, Typography, Chip } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Profile, PickupAddress } from '../../lib/supabase';
import { SettingsSidebar } from './SettingsSidebar';
import { ProfileSection } from './sections/ProfileSection';
import { SecuritySection } from './sections/SecuritySection';
import { AISection } from './sections/AISection';
import { NotificationsSection } from './sections/NotificationsSection';
import { AddressesSection } from './sections/AddressesSection';
import { ShippingSection } from './sections/ShippingSection';
import { DisplaySection } from './sections/DisplaySection';
import { TokensSection } from './sections/TokensSection';
import AdminPage from '../Admin/AdminPage';
import { Menu as MenuIcon, Check, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useProfileAutoSave } from '../../hooks/useProfileAutoSave';

type SettingsSection = 'overview' | 'profile' | 'security' | 'addresses' | 'shipping' | 'display' | 'ai' | 'notifications' | 'tokens' | 'admin';

export const SettingsPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [pickupAddresses, setPickupAddresses] = useState<PickupAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<SettingsSection>(
    (searchParams.get('section') as SettingsSection) || 'profile'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    language: 'de',
    notifications_enabled: true,
    email_notifications: true,
    newsletter_subscribed: false,
    show_phone_publicly: false,
    ai_text_style: 'balanced',
    ai_text_length: 'medium',
    ai_include_emoji: false,
    ai_allow_line_breaks: false,
    ai_auto_publish: false,
    ai_analyze_all_images: false,
    shipping_enabled: false,
    shipping_cost: 5,
    shipping_cost_type: 'fixed' as 'free' | 'fixed' | 'ai_calculated',
    shipping_description: null as string | null,
    pickup_enabled: true,
    show_location_publicly: false,
    show_location_to_public: true,
    location_description: null as string | null,
    default_listing_duration: 30,
    hand_preference: 'right' as 'left' | 'right',
    show_seller_profile: true,
  });

  const autoSaveData = user ? {
    full_name: formData.full_name || null,
    phone: formData.phone || null,
    bio: formData.bio || null,
    language: formData.language || null,
    notifications_enabled: formData.notifications_enabled,
    email_notifications: formData.email_notifications,
    newsletter_subscribed: formData.newsletter_subscribed,
    show_phone_publicly: formData.show_phone_publicly,
    ai_text_style: formData.ai_text_style,
    ai_text_length: formData.ai_text_length,
    ai_include_emoji: formData.ai_include_emoji,
    ai_auto_publish: formData.ai_auto_publish,
    ai_allow_line_breaks: formData.ai_allow_line_breaks,
    ai_analyze_all_images: formData.ai_analyze_all_images,
    shipping_enabled: formData.shipping_enabled,
    shipping_cost: formData.shipping_cost,
    shipping_cost_type: formData.shipping_cost_type,
    shipping_description: formData.shipping_description,
    pickup_enabled: formData.pickup_enabled,
    show_location_publicly: formData.show_location_publicly,
    location_description: formData.location_description,
    default_listing_duration: formData.default_listing_duration,
    show_location_to_public: formData.show_location_to_public,
    hand_preference: formData.hand_preference,
    show_seller_profile: formData.show_seller_profile,
  } : {};

  const { status: autoSaveStatus, lastSaved } = useProfileAutoSave({
    userId: user?.id || '',
    data: autoSaveData,
    enabled: !!user,
    debounceMs: 1000,
  });

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (data) {
        setProfile(data);

        const newFormData = {
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          bio: data.bio || '',
          language: data.language || 'de',
          notifications_enabled: data.notifications_enabled ?? true,
          email_notifications: data.email_notifications ?? true,
          newsletter_subscribed: data.newsletter_subscribed ?? false,
          show_phone_publicly: data.show_phone_publicly ?? false,
          ai_text_style: data.ai_text_style || 'balanced',
          ai_text_length: data.ai_text_length || 'medium',
          ai_include_emoji: data.ai_include_emoji ?? false,
          ai_allow_line_breaks: data.ai_allow_line_breaks ?? false,
          ai_auto_publish: data.ai_auto_publish ?? false,
          ai_analyze_all_images: data.ai_analyze_all_images ?? false,
          shipping_enabled: data.shipping_enabled ?? false,
          shipping_cost: data.shipping_cost ?? 0,
          shipping_cost_type: (data.shipping_cost_type || 'fixed') as 'free' | 'fixed' | 'ai_calculated',
          shipping_description: data.shipping_description || null,
          pickup_enabled: data.pickup_enabled ?? true,
          show_location_publicly: data.show_location_publicly ?? false,
          show_location_to_public: data.show_location_to_public ?? true,
          location_description: data.location_description || null,
          default_listing_duration: data.default_listing_duration ?? 30,
          hand_preference: (data.hand_preference || 'right') as 'left' | 'right',
          show_seller_profile: data.show_seller_profile ?? true,
        };

        setFormData(newFormData);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Fehler beim Laden des Profils');
    } finally {
      setLoading(false);
    }
  };


  const handleFormChange = (field: string, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return 'gerade eben';
    if (seconds < 60) return `vor ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `vor ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `vor ${hours}h`;
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    const section = searchParams.get('section') as SettingsSection;
    if (section && ['overview', 'profile', 'security', 'addresses', 'shipping', 'display', 'ai', 'notifications', 'tokens', 'admin'].includes(section)) {
      setCurrentSection(section);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  const renderContent = () => {
    switch (currentSection) {
      case 'profile':
        return (
          <ProfileSection
            profile={profile}
            formData={{
              full_name: formData.full_name,
              email: formData.email,
              phone: formData.phone,
              bio: formData.bio,
              language: formData.language,
            }}
            onFormChange={handleFormChange}
            userId={user?.id || ''}
            onProfileUpdate={loadProfile}
          />
        );
      case 'security':
        return user ? <SecuritySection userId={user.id} /> : null;
      case 'addresses':
        return user ? <AddressesSection userId={user.id} /> : null;
      case 'shipping':
        return (
          <ShippingSection
            formData={{
              shipping_enabled: formData.shipping_enabled,
              shipping_cost: formData.shipping_cost,
              shipping_cost_type: formData.shipping_cost_type,
              shipping_description: formData.shipping_description,
              pickup_enabled: formData.pickup_enabled,
              show_location_publicly: formData.show_location_publicly,
              location_description: formData.location_description,
              show_ai_shipping_costs: false,
            }}
            onFormChange={handleFormChange}
          />
        );
      case 'display':
        return (
          <DisplaySection
            formData={{
              language: formData.language,
              show_location_to_public: formData.show_location_to_public,
              default_listing_duration: formData.default_listing_duration,
              hand_preference: formData.hand_preference,
              show_seller_profile: formData.show_seller_profile,
            }}
            onFormChange={handleFormChange}
          />
        );
      case 'ai':
        return (
          <AISection
            formData={{
              ai_text_style: formData.ai_text_style,
              ai_text_length: formData.ai_text_length,
              ai_include_emoji: formData.ai_include_emoji,
              ai_auto_publish: formData.ai_auto_publish,
              ai_allow_line_breaks: formData.ai_allow_line_breaks,
              ai_analyze_all_images: formData.ai_analyze_all_images,
            }}
            onFormChange={handleFormChange}
          />
        );
      case 'tokens':
        return <TokensSection />;
      case 'notifications':
        return (
          <NotificationsSection
            formData={{
              notifications_enabled: formData.notifications_enabled,
              email_notifications: formData.email_notifications,
              newsletter_subscribed: formData.newsletter_subscribed,
            }}
            onFormChange={handleFormChange}
          />
        );
      case 'admin':
        return <AdminPage />;
      default:
        return null;
    }
  };

  const getSectionLabel = () => {
    const labels: Record<SettingsSection, string> = {
      overview: 'Übersicht',
      profile: 'Persönliche Daten',
      security: 'Sicherheit',
      addresses: 'Adressen',
      shipping: 'Versand & Abholung',
      display: 'Anzeige',
      ai: 'KI-Assistent',
      notifications: 'Benachrichtigungen',
      tokens: 'Token-Guthaben',
      admin: 'Administration',
    };
    return labels[currentSection];
  };

  if (isMobile) {
    return (
        <Box>
        <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon size={24} />
            </IconButton>
            <Typography variant="h6" fontWeight={600}>
              {getSectionLabel()}
            </Typography>
            <Box sx={{ ml: 'auto' }}>
              {autoSaveStatus === 'saving' && (
                <Chip
                  icon={<Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  label="Speichert..."
                  size="small"
                  sx={{ height: 28 }}
                />
              )}
              {autoSaveStatus === 'saved' && lastSaved && (
                <Chip
                  icon={<Check size={14} />}
                  label={`Gespeichert ${getRelativeTime(lastSaved)}`}
                  size="small"
                  color="success"
                  sx={{ height: 28 }}
                />
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
            },
          }}
        >
          <SettingsSidebar
            currentSection={currentSection}
            onSectionChange={(section) => {
              setCurrentSection(section);
              setMobileDrawerOpen(false);
            }}
            collapsed={false}
            onToggleCollapse={() => {}}
            isMobile={true}
          />
        </Drawer>

        <Box sx={{ py: 2, px: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {renderContent()}
        </Box>
      </Box>
    );
  }

  return (
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 200px)' }}>
      <SettingsSidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <Box sx={{ flex: 1, pl: 4, pr: 4, py: 4, position: 'relative' }}>
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            right: 24,
            zIndex: 1000,
          }}
        >
          {autoSaveStatus === 'saving' && (
            <Chip
              icon={<Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              label="Speichert..."
              size="small"
              sx={{ height: 28 }}
            />
          )}
          {autoSaveStatus === 'saved' && lastSaved && (
            <Chip
              icon={<Check size={14} />}
              label={`Gespeichert ${getRelativeTime(lastSaved)}`}
              size="small"
              color="success"
              sx={{ height: 28 }}
            />
          )}
        </Box>
        <Container maxWidth="lg" disableGutters>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
};
