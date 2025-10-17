import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Snackbar,
  InputAdornment,
  Divider,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Save } from 'lucide-react';
import { useAdmin, SystemSettings } from '../../hooks/useAdmin';

const SystemSettingsTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getSystemSettings, updateSystemSettings } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [settings, setSettings] = useState<SystemSettings>({
    id: '',
    token_system_mode: 'enabled',
    default_token_package: 100,
    token_price_per_100: 1.99,
    platform_message: null,
    updated_at: '',
    updated_by: null,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler beim Laden: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await updateSystemSettings({
        token_system_mode: settings.token_system_mode,
        default_token_package: settings.default_token_package,
        token_price_per_100: settings.token_price_per_100,
        platform_message: settings.platform_message,
      });
      setSnackbar({
        open: true,
        message: 'Einstellungen erfolgreich gespeichert',
        severity: 'success',
      });
      await loadSettings();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler beim Speichern: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Lade Einstellungen...</Typography>
      </Box>
    );
  }

  const ContentWrapper = isMobile ? Box : Paper;
  const wrapperProps = isMobile ? {} : { sx: { p: 3 } };

  return (
    <Box>
      {/* Header - Hidden on mobile */}
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
        System-Einstellungen
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 4 }, display: { xs: 'none', md: 'block' } }}>
        Verwalte Token-Preise und System-Konfiguration
      </Typography>

      <ContentWrapper {...wrapperProps}>
        {/* Token-System Section */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Token-System
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Token-System Modus</InputLabel>
          <Select
            value={settings.token_system_mode}
            label="Token-System Modus"
            onChange={(e) => setSettings({ ...settings, token_system_mode: e.target.value as any })}
          >
            <MenuItem value="enabled">Aktiviert - Normale Token-Nutzung</MenuItem>
            <MenuItem value="donation_only">Nur Spenden - Kostenloser Test-Modus</MenuItem>
            <MenuItem value="disabled">Deaktiviert - Keine Token-Funktion</MenuItem>
          </Select>
        </FormControl>

        {settings.token_system_mode === 'donation_only' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Im Spenden-Modus können Benutzer alle Funktionen kostenlos testen.
            Das ist ideal für Freunde während der Testphase.
          </Alert>
        )}

        {settings.token_system_mode === 'disabled' && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Im deaktivierten Modus sind alle Token-Funktionen ausgeblendet.
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Token-Preise Section */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Token-Preise
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Hier kannst du die Preisstruktur für Token-Pakete festlegen. Diese Preise gelten systemweit und beeinflussen alle Kauf-Optionen.
        </Typography>

        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Basis-Einheit"
              type="number"
              fullWidth
              value={settings.default_token_package}
              onChange={(e) => setSettings({ ...settings, default_token_package: parseInt(e.target.value) || 0 })}
              InputProps={{
                endAdornment: <InputAdornment position="end">Tokens</InputAdornment>,
              }}
              helperText="Die kleinste kaufbare Token-Menge (z.B. 100)"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Preis pro 100 Tokens"
              type="number"
              fullWidth
              value={settings.token_price_per_100}
              onChange={(e) => setSettings({ ...settings, token_price_per_100: parseFloat(e.target.value) || 0 })}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
              }}
              inputProps={{ step: 0.01, min: 0 }}
              helperText="Basispreis für 100 Tokens (z.B. 1,99 €)"
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} mb={1}>
            Berechnungsbeispiel:
          </Typography>
          <Typography variant="body2" component="div">
            100 Tokens = {settings.token_price_per_100.toFixed(2)} €<br />
            200 Tokens = {(settings.token_price_per_100 * 2).toFixed(2)} €<br />
            500 Tokens = {(settings.token_price_per_100 * 5).toFixed(2)} €<br />
            1.000 Tokens = {(settings.token_price_per_100 * 10).toFixed(2)} €
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Die Token-Pakete auf der Kaufseite können zusätzliche Bonus-Tokens enthalten (z.B. 10% mehr bei größeren Paketen).
          </Typography>
        </Alert>

        <Divider sx={{ my: 3 }} />

        {/* Plattform-Nachricht Section */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Plattform-Nachricht
        </Typography>

        <TextField
          label="Nachricht an alle Benutzer (optional)"
          multiline
          rows={4}
          fullWidth
          value={settings.platform_message || ''}
          onChange={(e) => setSettings({ ...settings, platform_message: e.target.value || null })}
          placeholder="Z.B.: 'Willkommen in der Beta-Phase! Bitte melden Sie Bugs an office@ssi.at'"
          helperText="Diese Nachricht wird allen Benutzern auf der Startseite angezeigt"
        />

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save size={20} />}
            onClick={handleSave}
            disabled={saveLoading}
          >
            {saveLoading ? 'Speichert...' : 'Einstellungen speichern'}
          </Button>
        </Box>
      </ContentWrapper>

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

export default SystemSettingsTab;
