import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Coins, ArrowRight, AlertCircle } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const TokenSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch: refetchTokens, balance } = useTokens();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creditsAdded, setCreditsAdded] = useState(false);
  const [webhookFailed, setWebhookFailed] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      navigate('/tokens/buy');
      return;
    }

    // Check if donation was processed by looking for a donation record with this session_id
    const checkDonationProcessed = async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('donations')
        .select('id, created_at')
        .eq('stripe_session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking donation:', error);
        return false;
      }

      return !!data; // Returns true if donation record exists
    };

    // Initialize and start polling
    const startPolling = async () => {
      let pollCount = 0;
      const maxPolls = 20; // 20 seconds total (give webhook time)

      const pollInterval = setInterval(async () => {
        pollCount++;
        const processed = await checkDonationProcessed();

        console.log(`Poll ${pollCount}: donation processed=${processed}`);

        if (processed) {
          // Payment was processed!
          console.log('Payment confirmed!');
          setCreditsAdded(true);
          setLoading(false);
          clearInterval(pollInterval);
          refetchTokens(); // Update the hook's state
        } else if (pollCount >= maxPolls) {
          // Timeout - webhook likely failed
          console.log('Polling timeout - payment not processed');
          setWebhookFailed(true);
          setLoading(false);
          clearInterval(pollInterval);
        }
      }, 1000);

      return () => clearInterval(pollInterval);
    };

    const cleanup = startPolling();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [searchParams, navigate, refetchTokens, user]);

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
            boxShadow: 3,
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={64} sx={{ mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Zahlung wird verarbeitet...
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Bitte warte einen Moment, während wir deine Credits gutschreiben.
              </Typography>
            </>
          ) : webhookFailed ? (
            <>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 3,
                  borderRadius: '50%',
                  bgcolor: 'warning.main',
                  color: 'white',
                  mb: 3,
                }}
              >
                <AlertCircle size={64} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
                Zahlung erfolgreich, Credits verzögert
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Deine Zahlung wurde erfolgreich verarbeitet, aber die Credits konnten noch nicht gutgeschrieben werden.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Bitte warte einige Minuten oder kontaktiere den Support, falls die Credits nicht innerhalb von 10 Minuten erscheinen.
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Coins size={20} />}
                  onClick={() => navigate('/settings?section=tokens')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Zur Credits-Übersicht
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => window.location.reload()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Seite neu laden
                </Button>
              </Box>
            </>
          ) : creditsAdded ? (
            <>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 3,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  color: 'white',
                  mb: 3,
                }}
              >
                <CheckCircle size={64} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
                Zahlung erfolgreich!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Deine Credits wurden erfolgreich gutgeschrieben und stehen dir jetzt zur Verfügung.
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Coins size={20} />}
                  onClick={() => navigate('/settings?section=tokens')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Zur Credits-Übersicht
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  endIcon={<ArrowRight size={20} />}
                  onClick={() => navigate('/create')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Jetzt Inserat erstellen
                </Button>
              </Box>
            </>
          ) : null}
        </Paper>
      </Container>
    </Box>
  );
};
