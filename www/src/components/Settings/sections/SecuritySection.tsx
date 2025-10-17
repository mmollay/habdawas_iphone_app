import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Shield, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SecuritySectionProps {
  userId: string;
}

export const SecuritySection = ({ userId }: SecuritySectionProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  useEffect(() => {
    checkUserAuth();
  }, [userId]);

  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  const checkUserAuth = async () => {
    try {
      setCheckingAuth(true);

      // Get the current user's authentication providers
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) return;

      // Check if user signed up via OAuth (Google, etc.)
      const providers = user.app_metadata.providers || [];
      const hasOAuthProvider = providers.some((p: string) => p !== 'email');

      // Check if user has a password set
      // If user only has OAuth and no email provider, they don't have a password
      const hasEmailProvider = providers.includes('email');

      setIsOAuthUser(hasOAuthProvider);
      setHasPassword(hasEmailProvider && !hasOAuthProvider);

    } catch (err) {
      console.error('Error checking user auth:', err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const calculatePasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    let strength = 0;

    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  };

  const validatePassword = (): string | null => {
    if (!password || password.length < 8) {
      return 'Passwort muss mindestens 8 Zeichen lang sein';
    }

    if (password !== confirmPassword) {
      return 'Passwörter stimmen nicht überein';
    }

    if (passwordStrength === 'weak') {
      return 'Passwort ist zu schwach. Verwende Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen';
    }

    return null;
  };

  const handleSetPassword = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Update the user's password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess('Passwort erfolgreich gesetzt! Du kannst dich jetzt mit deiner E-Mail und diesem Passwort anmelden.');
      setPassword('');
      setConfirmPassword('');
      setHasPassword(true);

      // Refresh auth status
      await checkUserAuth();

    } catch (err: any) {
      console.error('Error setting password:', err);
      setError(err.message || 'Fehler beim Setzen des Passworts');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess('Passwort erfolgreich geändert!');
      setPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return 'default';
    if (passwordStrength === 'weak') return 'error';
    if (passwordStrength === 'medium') return 'warning';
    return 'success';
  };

  const getStrengthLabel = () => {
    if (!passwordStrength) return '';
    if (passwordStrength === 'weak') return 'Schwach';
    if (passwordStrength === 'medium') return 'Mittel';
    return 'Stark';
  };

  const ContentWrapper = isMobile ? Box : Paper;
  const wrapperProps = isMobile ? {} : { sx: { p: 3 } };

  if (checkingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
        Sicherheit
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 4 }, display: { xs: 'none', md: 'block' } }}>
        Verwalte deine Anmeldemethoden und Passwort-Einstellungen
      </Typography>

      <ContentWrapper {...wrapperProps}>
        {/* Login Method Info */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Shield size={24} color="#1976d2" />
            <Typography variant="h6" fontWeight={600}>
              Anmeldemethoden
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {isOAuthUser && (
              <Chip
                icon={<CheckCircle size={16} />}
                label="Google OAuth"
                color="success"
                sx={{ alignSelf: 'flex-start' }}
              />
            )}

            {hasPassword ? (
              <Chip
                icon={<CheckCircle size={16} />}
                label="E-Mail & Passwort"
                color="success"
                sx={{ alignSelf: 'flex-start' }}
              />
            ) : (
              <Chip
                icon={<AlertCircle size={16} />}
                label="Kein Passwort gesetzt"
                color="warning"
                sx={{ alignSelf: 'flex-start' }}
              />
            )}
          </Box>
        </Box>

        {/* Password Section */}
        {!hasPassword && isOAuthUser && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Hinweis:</strong> Du hast dich mit Google angemeldet und hast noch kein Passwort gesetzt.
            </Typography>
            <Typography variant="body2">
              Setze ein Passwort, um dich alternativ auch mit E-Mail und Passwort anmelden zu können.
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Lock size={24} color="#1976d2" />
          <Typography variant="h6" fontWeight={600}>
            {hasPassword ? 'Passwort ändern' : 'Passwort setzen'}
          </Typography>
        </Box>

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            label="Neues Passwort"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 8 Zeichen"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText={
              passwordStrength && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Passwortstärke:
                  </Typography>
                  <Chip
                    label={getStrengthLabel()}
                    color={getStrengthColor()}
                    size="small"
                    sx={{ height: 18, fontSize: '0.7rem' }}
                  />
                </Box>
              )
            }
          />

          <TextField
            fullWidth
            label="Passwort bestätigen"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort wiederholen"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            error={confirmPassword.length > 0 && password !== confirmPassword}
            helperText={
              confirmPassword.length > 0 && password !== confirmPassword
                ? 'Passwörter stimmen nicht überein'
                : ''
            }
          />

          <Box>
            <Button
              variant="contained"
              onClick={hasPassword ? handleChangePassword : handleSetPassword}
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              startIcon={loading ? <CircularProgress size={18} /> : <Lock size={18} />}
              sx={{ mr: 2 }}
            >
              {loading ? 'Wird gespeichert...' : (hasPassword ? 'Passwort ändern' : 'Passwort setzen')}
            </Button>

            {(password || confirmPassword) && (
              <Button
                variant="text"
                onClick={() => {
                  setPassword('');
                  setConfirmPassword('');
                  setError(null);
                  setSuccess(null);
                }}
              >
                Abbrechen
              </Button>
            )}
          </Box>

          {/* Password Requirements */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Passwort-Anforderungen:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <Typography component="li" variant="body2">Mindestens 8 Zeichen</Typography>
              <Typography component="li" variant="body2">Groß- und Kleinbuchstaben</Typography>
              <Typography component="li" variant="body2">Mindestens eine Zahl</Typography>
              <Typography component="li" variant="body2">Empfohlen: Sonderzeichen (!@#$%^&*)</Typography>
            </Box>
          </Alert>
        </Box>
      </ContentWrapper>
    </Box>
  );
};
