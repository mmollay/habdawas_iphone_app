import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
  TextField,
  InputAdornment,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Coins,
  Check,
  Sparkles,
  Crown,
  ShoppingCart,
  ArrowLeft,
  Heart,
  Users,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Header } from '../Layout/Header';
import { Footer } from '../Layout/Footer';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../contexts/AuthContext';
import { useCreditsStats } from '../../hooks/useCreditsStats';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  bonus: number;
  popular?: boolean;
  bestValue?: boolean;
  features: string[];
}

export const CreditPurchasePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const creditsStats = useCreditsStats();
  const [selectedTab, setSelectedTab] = useState<'personal' | 'community'>(0 as any);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customDonation, setCustomDonation] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCanceledMessage, setShowCanceledMessage] = useState(searchParams.get('canceled') === 'true');

  // Set tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'community') {
      setSelectedTab(1 as any);
    } else {
      setSelectedTab(0 as any);
    }
  }, [searchParams]);

  // Helper functions for dynamic calculations
  const calculateCredits = (euros: number): number => {
    if (!settings) return 0;
    return Math.floor(euros / settings.powerUserCreditPrice);
  };

  const calculateListings = (euros: number): number => {
    if (!settings) return 0;
    return Math.floor(euros / settings.costPerListing);
  };

  // Personal Credit Packages - Dynamically calculated based on settings
  const personalPackages: CreditPackage[] = settings
    ? [
        {
          id: 'STARTER',
          credits: calculateCredits(5),
          price: 5,
          bonus: 0,
          features: [
            '1 Inserat = 1 Basic-Inserat',
            'Premium-Features kosten zusätzlich',
            'Keine monatlichen Limits',
            'Inserate verfallen nicht',
          ],
        },
        {
          id: 'POPULAR',
          credits: calculateCredits(10),
          price: 10,
          bonus: Math.floor(calculateCredits(10) * 0.1), // 10% Bonus
          popular: true,
          features: [
            '1 Inserat = 1 Basic-Inserat',
            'Premium-Features kosten zusätzlich',
            '10% Bonus Inserate',
            'Keine monatlichen Limits',
            'Inserate verfallen nicht',
          ],
        },
        {
          id: 'PRO',
          credits: calculateCredits(20),
          price: 20,
          bonus: Math.floor(calculateCredits(20) * 0.15), // 15% Bonus
          bestValue: true,
          features: [
            '1 Inserat = 1 Basic-Inserat',
            'Premium-Features kosten zusätzlich',
            '15% Bonus Inserate',
            'Beste Preis-Leistung',
            'Keine monatlichen Limits',
            'Inserate verfallen nicht',
          ],
        },
      ]
    : [];

  // Community Donation Packages - Dynamically calculated based on settings
  const communityPackages = settings
    ? [
        {
          id: 'SUPPORTER',
          amount: 5,
          impact: `~${formatNumber(calculateListings(5))} kostenlose Inserate`,
          icon: Heart,
          color: '#e91e63',
        },
        {
          id: 'CONTRIBUTOR',
          amount: 10,
          impact: `~${formatNumber(calculateListings(10))} kostenlose Inserate`,
          icon: Users,
          color: '#9c27b0',
          popular: true,
        },
        {
          id: 'CHAMPION',
          amount: 25,
          impact: `~${formatNumber(calculateListings(25))} kostenlose Inserate`,
          icon: Award,
          color: '#ff9800',
        },
      ]
    : [];

  const handlePurchase = async (packageId: string, type: 'personal' | 'community') => {
    if (!user) {
      setError('Bitte melde dich an, um fortzufahren.');
      return;
    }

    setSelectedPackage(packageId);
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Bitte melde dich an, um fortzufahren.');
        return;
      }

      // TODO: Implement checkout session creation
      // This should call your Stripe/payment edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packageId: packageId.toLowerCase(),
            type,
            amount: type === 'community' ? customDonation : undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (result.needsConfig) {
          setError('Zahlungssystem ist noch nicht konfiguriert. Bitte kontaktiere den Administrator.');
        } else {
          setError(result.error || 'Fehler beim Erstellen der Checkout-Session');
        }
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      } else {
        setError('Keine Checkout-URL erhalten');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalCreditCard = (pkg: CreditPackage) => {
    const totalCredits = pkg.credits + pkg.bonus;
    const pricePerCredit = (pkg.price / totalCredits).toFixed(2);
    const isHighlighted = pkg.popular || pkg.bestValue;

    return (
      <Card
        key={pkg.id}
        sx={{
          position: 'relative',
          border: isHighlighted ? '2px solid' : '1px solid',
          borderColor: isHighlighted ? 'primary.main' : 'divider',
          borderRadius: 3,
          bgcolor: 'white',
          overflow: 'visible',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isHighlighted ? 3 : 0,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
        }}
      >
        {isHighlighted && (
          <Chip
            icon={pkg.popular ? <Sparkles size={14} /> : <Crown size={14} />}
            label={pkg.popular ? 'Beliebt' : 'Beste Wahl'}
            size="small"
            sx={{
              position: 'absolute',
              top: -12,
              right: 20,
              bgcolor: pkg.popular ? 'primary.main' : '#ff9800',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem',
              height: 26,
              px: 1,
              '& .MuiChip-icon': { color: 'white' },
              boxShadow: 2,
            }}
          />
        )}

        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              color: 'primary.main',
              letterSpacing: '0.12em',
              lineHeight: 1,
              mb: 2,
            }}
          >
            {pkg.id}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', sm: '3rem' },
                  lineHeight: 1,
                  color: 'text.primary',
                }}
              >
                {totalCredits}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                Inserate
              </Typography>
            </Box>
            {pkg.bonus > 0 && (
              <Chip
                label={`+${pkg.bonus} Bonus`}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: 'success.light',
                  color: 'success.dark',
                  fontWeight: 700,
                }}
              />
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.5,
              mb: 1,
              py: 2,
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '2.25rem' },
                lineHeight: 1,
                color: 'text.primary',
              }}
            >
              {formatCurrency(pkg.price)}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>
            {formatCurrency(parseFloat(pricePerCredit))} pro Inserat
          </Typography>

          <Box sx={{ mb: 3, flexGrow: 1 }}>
            {pkg.features.map((feature, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 0.75,
                }}
              >
                <Check size={18} style={{ color: '#4caf50', flexShrink: 0, marginTop: '2px' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>

          <Button
            fullWidth
            variant={isHighlighted ? 'contained' : 'outlined'}
            size="large"
            startIcon={
              loading && selectedPackage === pkg.id ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <ShoppingCart size={18} />
              )
            }
            onClick={() => handlePurchase(pkg.id, 'personal')}
            disabled={loading || settingsLoading}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              py: 1.75,
              fontSize: '1rem',
              mt: 'auto',
              borderRadius: 2,
            }}
          >
            {loading && selectedPackage === pkg.id ? 'Laden...' : 'Inserate kaufen'}
          </Button>
        </Box>
      </Card>
    );
  };

  const renderCommunityDonationCard = (pkg: any) => {
    const Icon = pkg.icon;
    const listings = calculateListings(pkg.amount);

    return (
      <Card
        key={pkg.id}
        sx={{
          position: 'relative',
          border: pkg.popular ? '2px solid' : '1px solid',
          borderColor: pkg.popular ? pkg.color : 'divider',
          borderRadius: 3,
          bgcolor: 'white',
          overflow: 'visible',
          transition: 'all 0.3s ease',
          boxShadow: pkg.popular ? 3 : 0,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
        }}
      >
        {pkg.popular && (
          <Chip
            icon={<Sparkles size={14} />}
            label="Beliebt"
            size="small"
            sx={{
              position: 'absolute',
              top: -12,
              right: 20,
              bgcolor: pkg.color,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem',
              height: 26,
              px: 1,
              '& .MuiChip-icon': { color: 'white' },
              boxShadow: 2,
            }}
          />
        )}

        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: `${pkg.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={24} style={{ color: pkg.color }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
              }}
            >
              {pkg.id}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  color: 'text.primary',
                }}
              >
                {formatCurrency(pkg.amount)}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: pkg.color,
                fontWeight: 600,
                mt: 1,
              }}
            >
              = {formatNumber(listings)} kostenlose Inserate
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: `${pkg.color}10`,
              borderRadius: 2,
              p: 2,
              mb: 3,
              border: '1px solid',
              borderColor: `${pkg.color}30`,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
              Impact:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pkg.impact} für die Community
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={
              loading && selectedPackage === pkg.id ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Heart size={18} />
              )
            }
            onClick={() => handlePurchase(pkg.id, 'community')}
            disabled={loading || settingsLoading}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              py: 1.75,
              fontSize: '1rem',
              borderRadius: 2,
              bgcolor: pkg.color,
              '&:hover': {
                bgcolor: pkg.color,
                filter: 'brightness(0.9)',
              },
            }}
          >
            {loading && selectedPackage === pkg.id ? 'Laden...' : 'Jetzt spenden'}
          </Button>
        </Box>
      </Card>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        onNavigate={(page) => {
          if (page === 'items') navigate('/');
          else if (page === 'messages') navigate('/messages');
          else if (page === 'settings') navigate('/settings');
        }}
        onLoginClick={() => {}}
        showSearch={false}
      />

      <Box sx={{ flex: 1, bgcolor: '#fafafa' }}>
        <Snackbar
          open={showCanceledMessage}
          autoHideDuration={6000}
          onClose={() => setShowCanceledMessage(false)}
          message="Zahlung abgebrochen"
        />

        <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
          <Container maxWidth="lg">
            <Button
              startIcon={<ArrowLeft size={18} />}
              onClick={() => navigate(-1)}
              sx={{ textTransform: 'none', fontWeight: 500, color: 'text.secondary' }}
            >
              Zurück
            </Button>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 6 }}>
          {/* Hero Section - Simplified & Clear */}
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 2,
                color: 'text.primary',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              HabDaWas Inserate
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}
            >
              Inserate für Power-User • Spenden für die Community
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 4, maxWidth: 900, mx: 'auto' }}>
              {error}
            </Alert>
          )}

          {/* Tabs - Google MD3 Style Compact */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                display: 'inline-flex',
                gap: 1.5,
                p: 0.75,
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                border: '1px solid #e8eaed',
              }}
            >
              <Box
                onClick={() => setSelectedTab(0 as any)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 1, sm: 1.25 },
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  bgcolor: selectedTab === 0 ? '#e8f0fe' : 'transparent',
                  border: '2px solid',
                  borderColor: selectedTab === 0 ? '#1a73e8' : 'transparent',
                  '&:hover': {
                    bgcolor: selectedTab === 0 ? '#e8f0fe' : 'rgba(26, 115, 232, 0.08)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 28, sm: 32 },
                    height: { xs: 28, sm: 32 },
                    borderRadius: 1.5,
                    bgcolor: selectedTab === 0 ? '#1a73e8' : '#e8eaed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Zap size={selectedTab === 0 ? 16 : 14} style={{ color: selectedTab === 0 ? 'white' : '#5f6368' }} />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.8rem', sm: '0.95rem' },
                      color: selectedTab === 0 ? '#1a73e8' : '#5f6368',
                      lineHeight: 1.2,
                      display: { xs: 'none', sm: 'block' },
                    }}
                  >
                    Personal Inserate
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: selectedTab === 0 ? '#1a73e8' : '#5f6368',
                      lineHeight: 1.2,
                      display: { xs: 'block', sm: 'none' },
                    }}
                  >
                    Inserate
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: selectedTab === 0 ? '#1a73e8' : '#5f6368',
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                      fontWeight: 700,
                    }}
                  >
                    {creditsStats.loading ? '...' : `${formatNumber(creditsStats.personalCredits)} Inserate`}
                  </Typography>
                </Box>
              </Box>

              <Box
                onClick={() => setSelectedTab(1 as any)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 1, sm: 1.25 },
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  bgcolor: selectedTab === 1 ? '#fef7ff' : 'transparent',
                  border: '2px solid',
                  borderColor: selectedTab === 1 ? '#c51162' : 'transparent',
                  '&:hover': {
                    bgcolor: selectedTab === 1 ? '#fef7ff' : 'rgba(197, 17, 98, 0.08)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 28, sm: 32 },
                    height: { xs: 28, sm: 32 },
                    borderRadius: 1.5,
                    bgcolor: selectedTab === 1 ? '#c51162' : '#e8eaed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Heart size={selectedTab === 1 ? 16 : 14} style={{ color: selectedTab === 1 ? 'white' : '#5f6368' }} />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.8rem', sm: '0.95rem' },
                      color: selectedTab === 1 ? '#c51162' : '#5f6368',
                      lineHeight: 1.2,
                      display: { xs: 'none', sm: 'block' },
                    }}
                  >
                    Community Spenden
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: selectedTab === 1 ? '#c51162' : '#5f6368',
                      lineHeight: 1.2,
                      display: { xs: 'block', sm: 'none' },
                    }}
                  >
                    Spenden
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: selectedTab === 1 ? '#c51162' : '#5f6368',
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                      fontWeight: 700,
                    }}
                  >
                    {creditsStats.loading ? '...' : `${formatNumber(creditsStats.communityPotBalance)} Inserate`}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Personal Inserate */}
          {selectedTab === 0 && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Personal Inserate kaufen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
                  Für Power-User, die unbegrenzte Inserate benötigen. Inserate verfallen nicht und können jederzeit verwendet werden.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 3,
                  maxWidth: 1200,
                  mx: 'auto',
                }}
              >
                {personalPackages.map(renderPersonalCreditCard)}
              </Box>

              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(25, 118, 210, 0.05)',
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                  maxWidth: 900,
                  mx: 'auto',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  💡 <strong>So funktionieren Inserate:</strong> 1 Inserat = 1 Basic-Inserat. Premium-Features (z.B. Hervorhebung, Top-Platzierung) kosten zusätzliche Inserate. Inserate verfallen nie!
                </Typography>
              </Box>
            </Box>
          )}

          {/* Community Donations */}
          {selectedTab === 1 && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Heart size={22} style={{ color: '#e91e63' }} />
                  Community unterstützen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', mb: 2 }}>
                  Mit deiner Spende ermöglichst du kostenlosen Zugang für alle! Deine Spende füllt den Community-Topf
                  und ermöglicht kostenlose Inserate für die Allgemeinheit.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#e91e63' }}>
                  🏆 Top-Spender werden in unserer Hall of Fame geehrt!
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 3,
                  maxWidth: 1200,
                  mx: 'auto',
                  mb: 4,
                }}
              >
                {communityPackages.map(renderCommunityDonationCard)}
              </Box>

              {/* Custom Donation */}
              <Box
                sx={{
                  maxWidth: 600,
                  mx: 'auto',
                  p: 4,
                  borderRadius: 3,
                  bgcolor: 'white',
                  border: '2px dashed',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
                  Eigener Betrag
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={customDonation}
                  onChange={(e) => setCustomDonation(parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary">
                          = {formatNumber(calculateListings(customDonation))} Inserate
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: settings?.minDonationAmount || 5, step: 1 }}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Heart size={18} />}
                  onClick={() => handlePurchase('CUSTOM', 'community')}
                  disabled={loading || customDonation < (settings?.minDonationAmount || 5) || settingsLoading}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.75,
                    fontSize: '1rem',
                    borderRadius: 2,
                    bgcolor: '#e91e63',
                    '&:hover': {
                      bgcolor: '#c2185b',
                    },
                  }}
                >
                  {formatCurrency(customDonation)} spenden
                </Button>
                {customDonation < (settings?.minDonationAmount || 5) && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                    Mindestbetrag: {formatCurrency(settings?.minDonationAmount || 5)}
                  </Typography>
                )}
              </Box>

              {/* Impact Info */}
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(233, 30, 99, 0.05)',
                  border: '1px solid rgba(233, 30, 99, 0.1)',
                  maxWidth: 900,
                  mx: 'auto',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  🌟 <strong>So funktioniert's:</strong> Jeder gespendete Euro wird 1:1 in kostenlose Inserate
                  umgewandelt. Mit 10€ ermöglichst du {formatNumber(calculateListings(10))} kostenlose Inserate für die
                  Community!
                </Typography>
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};
