import { useState } from 'react';
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
  Divider,
} from '@mui/material';
import { Coins, Check, Sparkles, Crown, ShoppingCart, ArrowLeft, Heart, Gift } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTokens } from '../../hooks/useTokens';
import { supabase } from '../../lib/supabase';
import { Header } from '../Layout/Header';
import { Footer } from '../Layout/Footer';

interface TokenPackage {
  id: string;
  tokens: number;
  price: number;
  bonus: number;
  estimatedListings: string;
  popular?: boolean;
  bestValue?: boolean;
  features: string[];
  type: 'purchase' | 'donation';
}

export const TokenPurchasePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { balance } = useTokens();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCanceledMessage, setShowCanceledMessage] = useState(searchParams.get('canceled') === 'true');

  const packages: TokenPackage[] = [
    {
      id: 'BASIC',
      tokens: 125000,
      price: 4.90,
      bonus: 0,
      estimatedListings: '~50',
      popular: true,
      type: 'purchase',
      features: [
        'Verbrauchsbasiert',
        '~50 Inserate mit KI',
        'ca. 0,10€ pro Inserat',
        'Ideal zum Starten',
      ],
    },
    {
      id: 'STANDARD',
      tokens: 275000,
      price: 9.90,
      bonus: 0,
      estimatedListings: '~110',
      bestValue: true,
      type: 'purchase',
      features: [
        'Verbrauchsbasiert',
        '~110 Inserate mit KI',
        'ca. 0,09€ pro Inserat',
        '10% günstiger',
        'Für regelmäßige Verkäufer',
      ],
    },
    {
      id: 'PRO',
      tokens: 437500,
      price: 14.90,
      bonus: 0,
      estimatedListings: '~175',
      type: 'purchase',
      features: [
        'Verbrauchsbasiert',
        '~175 Inserate mit KI',
        'ca. 0,085€ pro Inserat',
        '30% günstiger',
        'Für Vielverkäufer',
      ],
    },
    {
      id: 'SUPPORTER',
      tokens: 12500,
      price: 4.90,
      bonus: 0,
      estimatedListings: '~5',
      type: 'donation',
      features: [
        'Unterstütze die Plattform',
        'Hilf anderen Nutzern',
        'Zeige deine Wertschätzung',
        'Jeder Betrag hilft!',
      ],
    },
  ];

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Bitte melde dich an, um Tokens zu kaufen.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ packageId: packageId.toLowerCase() }),
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

  const renderPackageCard = (pkg: TokenPackage) => {
    const totalTokens = pkg.tokens + pkg.bonus;
    const pricePerToken = (pkg.price / totalTokens).toFixed(4);
    const isHighlighted = pkg.popular || pkg.bestValue;
    const isDonation = pkg.type === 'donation';

    return (
      <Card
        key={pkg.id}
        sx={{
          position: 'relative',
          border: isHighlighted || isDonation ? '2px solid' : '1px solid',
          borderColor: isDonation ? '#e91e63' : isHighlighted ? 'primary.main' : 'divider',
          borderRadius: 4,
          bgcolor: 'white',
          overflow: 'visible',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isHighlighted || isDonation ? 2 : 0,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
        }}
      >
        {(isHighlighted || isDonation) && (
          <Chip
            icon={isDonation ? <Heart size={14} /> : pkg.popular ? <Sparkles size={14} /> : <Crown size={14} />}
            label={isDonation ? 'Spende' : pkg.popular ? 'Beliebt' : 'Beste Wahl'}
            size="small"
            sx={{
              position: 'absolute',
              top: -12,
              right: 20,
              bgcolor: isDonation ? '#e91e63' : pkg.popular ? 'primary.main' : '#ff9800',
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

        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              color: isDonation ? '#e91e63' : 'primary.main',
              letterSpacing: '0.12em',
              lineHeight: 1,
            }}
          >
            {pkg.id}
          </Typography>

          <Box sx={{ my: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2.75rem', sm: '3rem' },
                  lineHeight: 1,
                  color: 'text.primary',
                }}
              >
                {totalTokens.toLocaleString('de-DE')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Tokens
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: isDonation ? '#e91e63' : 'primary.main',
                fontWeight: 600,
                mt: 1,
                fontSize: '0.875rem',
              }}
            >
              {isDonation ? 'für die Community' : `~${pkg.estimatedListings} Inserate`}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.5,
              mb: 1,
              py: 2.5,
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
              {pkg.price.toFixed(2)}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 600 }}>
              €
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 3, fontSize: '0.8rem' }}>
            {isDonation ? 'Einmalige Spende' : `${pricePerToken}€ pro Token`}
          </Typography>

          <Box sx={{ mb: 3.5, flexGrow: 1 }}>
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
                <Check size={18} style={{ color: isDonation ? '#e91e63' : '#4caf50', flexShrink: 0, marginTop: '2px' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>

          <Button
            fullWidth
            variant={isHighlighted || isDonation ? 'contained' : 'outlined'}
            size="large"
            startIcon={
              loading && selectedPackage === pkg.id ? (
                <CircularProgress size={18} color="inherit" />
              ) : isDonation ? (
                <Heart size={18} />
              ) : (
                <ShoppingCart size={18} />
              )
            }
            onClick={() => handlePurchase(pkg.id)}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              py: 1.75,
              fontSize: '1rem',
              mt: 'auto',
              borderRadius: 2,
              ...(isDonation && {
                bgcolor: '#e91e63',
                '&:hover': {
                  bgcolor: '#c2185b',
                },
              }),
              transition: 'all 0.2s ease',
            }}
          >
            {loading && selectedPackage === pkg.id ? 'Laden...' : isDonation ? 'Jetzt spenden' : 'Kaufen'}
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
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: 'text.primary',
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            Tokens kaufen oder spenden
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}>
            Jeden Monat erhältst du <strong>10 kostenlose Inserate</strong>! Brauchst du mehr? Kein Problem - kaufe einfach Token nach.
            Wer viel verkauft, verdient meist auch gut und kann mit fairem Preis-Leistungs-Verhältnis weiter machen.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}>
            Die Plattform bleibt für Gelegenheitsverkäufer komplett <strong>kostenlos</strong>!
            Mit deiner Spende oder deinem Token-Kauf unterstützt du den weiteren Betrieb und hilfst der gesamten Community.
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
              px: 3,
              py: 1.25,
              borderRadius: 12,
              bgcolor: 'rgba(25, 118, 210, 0.08)',
              border: '1px solid rgba(25, 118, 210, 0.2)',
            }}
          >
            <Coins size={20} style={{ color: '#1976d2' }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Dein Guthaben: {balance} Tokens
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 5,
          }}
        >
          {packages.filter(pkg => pkg.type === 'purchase').map(renderPackageCard)}
        </Box>

        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 5,
            mt: 5
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'center'
              }}
            >
              <Heart size={22} style={{ color: '#e91e63' }} />
              Unterstütze die Community
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.7 }}>
              Mit deiner Spende ermöglichst du kostenlosen Zugang für alle und hilfst beim Ausbau der Plattform
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ maxWidth: 400, width: '100%' }}>
              {packages.filter(pkg => pkg.type === 'donation').map(renderPackageCard)}
            </Box>
          </Box>
        </Box>
      </Container>
      </Box>

      <Footer />
    </Box>
  );
};
