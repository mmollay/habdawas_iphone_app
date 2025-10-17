import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Box,
  Alert,
  Typography,
  Divider,
  Link,
  Checkbox,
  FormControlLabel,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Eye, EyeOff, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OAuthLoadingOverlay } from './OAuthLoadingOverlay';
import { Capacitor } from '@capacitor/core';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export const LoginDialog = ({ open, onClose }: LoginDialogProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isNative = Capacitor.isNativePlatform();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'success'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp, resetPassword, signInWithGoogle, oauthLoading } = useAuth();

  // Auto-close dialog when user successfully logs in via OAuth
  useEffect(() => {
    if (user && oauthLoading === false && open) {
      console.log('[LoginDialog] User logged in, closing dialog');
      onClose();
    }
  }, [user, oauthLoading, open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
        setEmail('');
        setPassword('');
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('Bitte Namen eingeben');
          setLoading(false);
          return;
        }
        await signUp(email, password, fullName);
        setMode('success');
        setEmail('');
        setPassword('');
        setFullName('');
      } else if (mode === 'forgot') {
        try {
          await resetPassword(email);
          setSuccess('Passwort-Zurücksetzen-Link wurde an Ihre E-Mail gesendet');
          setEmail('');
        } catch (resetError: any) {
          if (resetError?.message?.includes('rate limit') || resetError?.message?.includes('429')) {
            setSuccess('Passwort-Zurücksetzen-Link wurde an Ihre E-Mail gesendet (falls die E-Mail-Adresse existiert)');
            setEmail('');
          } else {
            throw resetError;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      // Don't close dialog here - will be closed after successful OAuth callback
      // onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google-Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setSuccess('');
    setMode('signin');
    setShowPassword(false);
    onClose();
  };

  const handleNavigateHome = () => {
    handleClose();
    navigate('/');
  };

  const getTitle = () => {
    if (mode === 'signin') return 'Anmelden';
    if (mode === 'success') return 'Registrierung erfolgreich!';
    if (mode === 'signup') return 'Konto erstellen';
    return 'Passwort zurücksetzen';
  };

  return (
    <>
      <OAuthLoadingOverlay open={oauthLoading} />
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        fullScreen={window.innerWidth < 600}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3 },
            px: 1,
            py: 2,
          }
        }}
      >
        <DialogContent sx={{ px: 4, py: 3, pt: { xs: 'calc(env(safe-area-inset-top) + 24px)', sm: 3 }, position: 'relative' }}>
          {isMobile && (
          <IconButton
            onClick={handleNavigateHome}
            sx={{
              position: 'absolute',
              top: { xs: 'calc(env(safe-area-inset-top) + 16px)', sm: 16 },
              left: 16,
              bgcolor: 'primary.main',
              color: 'white',
              width: 44,
              height: 44,
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'scale(1.05)',
              },
              boxShadow: 2,
              transition: 'all 0.2s',
            }}
          >
            <Home size={24} />
          </IconButton>
        )}
        <Box sx={{ textAlign: 'center', mb: 3, mt: { xs: 6, sm: 0 } }}>
          <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
            {getTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {mode === 'signin' && 'bei'}
            {mode === 'success' && 'Bitte bestätigen Sie Ihre E-Mail-Adresse.'}
            {mode === 'signup' && 'bei'}
            {mode === 'forgot' && 'bei'}
          </Typography>
          <Box
            component="img"
            src="/logo.png"
            alt="HABDAWAS Logo"
            onClick={handleNavigateHome}
            sx={{
              width: 'auto',
              height: 40,
              maxWidth: '200px',
              mx: 'auto',
              display: 'block',
              objectFit: 'contain',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          />
        </Box>

        {mode === 'success' ? (
          <>
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={handleClose}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 1,
                },
              }}
            >
              Schließen
            </Button>
          </>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <TextField
                  fullWidth
                  label="Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  margin="normal"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              )}
              <TextField
                fullWidth
                label="E-Mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              {mode !== 'forgot' && (
                <TextField
                  fullWidth
                  label="Passwort"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ mr: 0.5 }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              )}

              {mode === 'signin' && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">Angemeldet bleiben</Typography>}
                  />
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => setMode('forgot')}
                    sx={{ cursor: 'pointer', fontWeight: 500 }}
                  >
                    Passwort vergessen?
                  </Link>
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: mode === 'signin' ? 1 : 3,
                  mb: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 1,
                  },
                }}
                disabled={loading}
              >
                {loading ? 'Lädt...' : mode === 'forgot' ? 'Link senden' : getTitle()}
              </Button>

              {/* Google Login - jetzt nach dem Formular, weniger prominent */}
              {mode !== 'forgot' && (
                <>
                  {isNative && (
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.85rem' }}>
                      Google-Anmeldung ist derzeit nur im Web-Browser verfügbar
                    </Alert>
                  )}

                  {!isNative && (
                    <>
                      <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ px: 2, fontSize: '0.85rem' }}>
                          oder
                        </Typography>
                      </Divider>

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        sx={{
                          mb: 2,
                          py: 1.25,
                          textTransform: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          borderColor: 'divider',
                          color: 'text.secondary',
                          borderRadius: 2,
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                      >
                        <Box component="img" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" sx={{ width: 18, height: 18, mr: 1.5 }} />
                        Mit Google anmelden
                      </Button>
                    </>
                  )}
                </>
              )}

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                {mode === 'signin' && (
                  <Typography variant="body2" color="text.secondary">
                    Noch kein Konto?{' '}
                    <Link
                      component="button"
                      type="button"
                      onClick={() => setMode('signup')}
                      sx={{ cursor: 'pointer', fontWeight: 600 }}
                    >
                      Registrieren
                    </Link>
                  </Typography>
                )}
                {mode === 'signup' && (
                  <Typography variant="body2" color="text.secondary">
                    Bereits registriert?{' '}
                    <Link
                      component="button"
                      type="button"
                      onClick={() => setMode('signin')}
                      sx={{ cursor: 'pointer', fontWeight: 600 }}
                    >
                      Anmelden
                    </Link>
                  </Typography>
                )}
                {mode === 'forgot' && (
                  <Typography variant="body2" color="text.secondary">
                    Zurück zur{' '}
                    <Link
                      component="button"
                      type="button"
                      onClick={() => setMode('signin')}
                      sx={{ cursor: 'pointer', fontWeight: 600 }}
                    >
                      Anmeldung
                    </Link>
                  </Typography>
                )}
              </Box>
            </Box>
          </>
        )}
        </DialogContent>
      </Dialog>
    </>
  );
};
