import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import { Save, Info, Users, DollarSign, Gift, List, Settings } from 'lucide-react';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { DonationsOverview } from './DonationsOverview';
import { ManualCreditGrant } from './ManualCreditGrant';
import { CommunityPotTransactions } from './CommunityPotTransactions';
import { formatNumber } from '../../utils/formatNumber';

export const CreditSystemSettings = () => {
  const [currentSubTab, setCurrentSubTab] = useState(0);

  return (
    <Box>
      {/* Sub-Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentSubTab}
          onChange={(_, newValue) => setCurrentSubTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<Settings size={18} />}
            label="Einstellungen"
            iconPosition="start"
            sx={{ textTransform: 'none', minHeight: 48 }}
          />
          <Tab
            icon={<DollarSign size={18} />}
            label="Spenden"
            iconPosition="start"
            sx={{ textTransform: 'none', minHeight: 48 }}
          />
          <Tab
            icon={<Gift size={18} />}
            label="Credits vergeben"
            iconPosition="start"
            sx={{ textTransform: 'none', minHeight: 48 }}
          />
          <Tab
            icon={<List size={18} />}
            label="Transaktionen"
            iconPosition="start"
            sx={{ textTransform: 'none', minHeight: 48 }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentSubTab === 0 && <CreditSystemSettingsTab />}
      {currentSubTab === 1 && <DonationsOverview />}
      {currentSubTab === 2 && <ManualCreditGrant />}
      {currentSubTab === 3 && <CommunityPotTransactions />}
    </Box>
  );
};

// Separate component for settings tab
const CreditSystemSettingsTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { settings, loading, error, updateSetting } = useSystemSettings();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Local form state
  const [formData, setFormData] = useState({
    dailyFreeListings: settings?.dailyFreeListings || 5,
    costPerListing: settings?.costPerListing || 0.20,
    powerUserCreditPrice: settings?.powerUserCreditPrice || 0.20,
    minDonationAmount: settings?.minDonationAmount || 5.00,
    powerUserMinPurchase: settings?.powerUserMinPurchase || 10.00,
    lowPotWarningThreshold: settings?.lowPotWarningThreshold || 100,
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        dailyFreeListings: settings.dailyFreeListings,
        costPerListing: settings.costPerListing,
        powerUserCreditPrice: settings.powerUserCreditPrice,
        minDonationAmount: settings.minDonationAmount,
        powerUserMinPurchase: settings.powerUserMinPurchase,
        lowPotWarningThreshold: settings.lowPotWarningThreshold,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);

      // Update all settings
      await Promise.all([
        updateSetting({ setting_key: 'daily_free_listings', setting_value: formData.dailyFreeListings }),
        updateSetting({ setting_key: 'cost_per_listing', setting_value: formData.costPerListing }),
        updateSetting({ setting_key: 'power_user_credit_price', setting_value: formData.powerUserCreditPrice }),
        updateSetting({ setting_key: 'min_donation_amount', setting_value: formData.minDonationAmount }),
        updateSetting({ setting_key: 'power_user_min_purchase', setting_value: formData.powerUserMinPurchase }),
        updateSetting({ setting_key: 'low_pot_warning_threshold', setting_value: formData.lowPotWarningThreshold }),
      ]);

      setSaveMessage({ type: 'success', text: 'Einstellungen erfolgreich gespeichert!' });
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Fehler beim Speichern der Einstellungen.' });
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  const ContentWrapper = isMobile ? Box : Paper;
  const wrapperProps = isMobile ? {} : { sx: { p: 3 } };

  return (
    <Box>
      {/* Header - Hidden on mobile */}
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
        Credit-System Einstellungen
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 4 }, display: { xs: 'none', md: 'block' } }}>
        Konfiguriere das Community-Spendentopf & Power-User System
      </Typography>

      {/* Info Alert */}
      <Alert severity="info" icon={<Info size={20} />} sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Wie funktioniert das System?
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          <strong>Community-Topf</strong>: Alle User spenden in einen gemeinsamen Topf<br/>
          <strong>Gratis-User</strong>: Bekommen täglich X kostenlose Inserate (solange Topf nicht leer)<br/>
          <strong>Power-User</strong>: Kaufen eigene Credits für unbegrenzte Inserate
        </Typography>
      </Alert>

      {/* Current Community Pot Status */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          bgcolor: 'primary.50',
          borderLeft: '4px solid',
          borderColor: 'primary.main'
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Aktueller Community-Topf
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {formatNumber(settings?.communityPotBalance)} Inserate
            </Typography>
          </Box>
          <Chip
            icon={<Users size={16} />}
            label={settings?.communityPotBalance! > settings?.lowPotWarningThreshold! ? 'Gesund' : 'Niedrig'}
            color={settings?.communityPotBalance! > settings?.lowPotWarningThreshold! ? 'success' : 'warning'}
          />
        </Box>
      </Paper>

      {saveMessage && (
        <Alert severity={saveMessage.type} sx={{ mb: 3 }} onClose={() => setSaveMessage(null)}>
          {saveMessage.text}
        </Alert>
      )}

      {/* Settings Form */}
      <ContentWrapper {...wrapperProps}>
        {/* Gratis-Inserate Section */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Gratis-Inserate Einstellungen
        </Typography>

        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Kostenlose Inserate pro Tag"
              type="number"
              value={formData.dailyFreeListings}
              onChange={(e) => setFormData({ ...formData, dailyFreeListings: parseInt(e.target.value) })}
              helperText="Anzahl der kostenlosen Inserate die jeder User pro Tag erstellen kann"
              InputProps={{
                endAdornment: <InputAdornment position="end">Inserate/Tag</InputAdornment>
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Warnschwelle Community-Topf"
              type="number"
              value={formData.lowPotWarningThreshold}
              onChange={(e) => setFormData({ ...formData, lowPotWarningThreshold: parseInt(e.target.value) })}
              helperText="Bei wie vielen verbleibenden Inseraten soll gewarnt werden?"
              InputProps={{
                endAdornment: <InputAdornment position="end">Inserate</InputAdornment>
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Kosten & Preise Section */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Kosten & Preise
        </Typography>

        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Kosten pro Inserat"
              type="number"
              inputProps={{ step: 0.01 }}
              value={formData.costPerListing}
              onChange={(e) => setFormData({ ...formData, costPerListing: parseFloat(e.target.value) })}
              helperText="Tatsächliche Kosten (Gemini API + Server) pro Inserat"
              InputProps={{
                endAdornment: <InputAdornment position="end">EUR</InputAdornment>
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Power-User Credit Preis"
              type="number"
              inputProps={{ step: 0.01 }}
              value={formData.powerUserCreditPrice}
              onChange={(e) => setFormData({ ...formData, powerUserCreditPrice: parseFloat(e.target.value) })}
              helperText="Preis pro Power-User Credit"
              InputProps={{
                endAdornment: <InputAdornment position="end">EUR/Credit</InputAdornment>
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Minimale Spende"
              type="number"
              inputProps={{ step: 0.01 }}
              value={formData.minDonationAmount}
              onChange={(e) => setFormData({ ...formData, minDonationAmount: parseFloat(e.target.value) })}
              helperText="Mindestbetrag für Community-Topf Spenden"
              InputProps={{
                endAdornment: <InputAdornment position="end">EUR</InputAdornment>
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Minimaler Power-User Kauf"
              type="number"
              inputProps={{ step: 0.01 }}
              value={formData.powerUserMinPurchase}
              onChange={(e) => setFormData({ ...formData, powerUserMinPurchase: parseFloat(e.target.value) })}
              helperText="Mindestbetrag für Power-User Credit Kauf"
              InputProps={{
                endAdornment: <InputAdornment position="end">EUR</InputAdornment>
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Berechnungen Section */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Aktuelle Berechnungen
        </Typography>

        <Box sx={{ bgcolor: 'grey.100', p: { xs: 2, md: 3 }, borderRadius: 1, mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            1 EUR Spende = <strong>{formatNumber(Math.floor(1 / formData.costPerListing))} Inserate</strong> für Community-Topf
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            1 EUR Power-User = <strong>{formatNumber(Math.floor(1 / formData.powerUserCreditPrice))} Credits</strong> persönlich
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Min. Spende {formData.minDonationAmount} EUR = <strong>{formatNumber(Math.floor(formData.minDonationAmount / formData.costPerListing))} Inserate</strong>
          </Typography>
          <Typography variant="body2">
            Min. Power-User {formData.powerUserMinPurchase} EUR = <strong>{formatNumber(Math.floor(formData.powerUserMinPurchase / formData.powerUserCreditPrice))} Credits</strong>
          </Typography>
        </Box>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
            onClick={handleSave}
            disabled={saving}
            size="large"
          >
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </Button>
        </Box>
      </ContentWrapper>
    </Box>
  );
};
