import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoverySession, setRecoverySession] = useState(false);

  useEffect(() => {
    // Listen for password recovery event and verify we have a valid session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Password Reset] Auth event:', event);
      console.log('[Password Reset] Session present:', !!session);

      if (event === 'PASSWORD_RECOVERY') {
        console.log('[Password Reset] Password recovery event detected!');
        if (session) {
          console.log('[Password Reset] Valid session found - ready to reset password');
          setRecoverySession(true);
        } else {
          console.error('[Password Reset] No session found - password reset will fail');
          setError('Sitzung abgelaufen. Bitte fordern Sie einen neuen Reset-Link an.');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if we have a valid recovery session
    if (!recoverySession) {
      setError('Keine gültige Sitzung gefunden. Bitte fordern Sie einen neuen Reset-Link an.');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);

    try {
      console.log('[Password Reset] Attempting to update password...');
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('[Password Reset] Update error:', error);
        throw error;
      }

      console.log('[Password Reset] Password updated successfully!');
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('[Password Reset] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="HABDAWAS Logo"
            sx={{
              width: 'auto',
              height: 50,
              maxWidth: '250px',
              mx: 'auto',
              display: 'block',
              objectFit: 'contain',
              mb: 3,
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 500, mb: 1 }}>
            Neues Passwort setzen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bitte geben Sie Ihr neues Passwort ein
          </Typography>
        </Box>

        {success ? (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Ihr Passwort wurde erfolgreich geändert! Sie werden weitergeleitet...
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Neues Passwort"
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

              <TextField
                fullWidth
                label="Passwort bestätigen"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="small"
                      sx={{ mr: 0.5 }}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
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
                {loading ? 'Lädt...' : 'Passwort ändern'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};
