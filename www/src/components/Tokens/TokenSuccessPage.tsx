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
import { CheckCircle, Coins, ArrowRight } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';

export const TokenSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch: refetchTokens } = useTokens();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      navigate('/tokens/buy');
      return;
    }

    const timer = setTimeout(async () => {
      await refetchTokens();
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams, navigate, refetchTokens]);

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
                Bitte warte einen Moment, während wir deine Tokens gutschreiben.
              </Typography>
            </>
          ) : (
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
                Deine Tokens wurden erfolgreich gutgeschrieben und stehen dir jetzt zur Verfügung.
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
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  endIcon={<ArrowRight size={20} />}
                  onClick={() => navigate('/settings')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Zu den Einstellungen
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};
