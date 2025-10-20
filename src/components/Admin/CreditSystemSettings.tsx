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
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save,
  Info,
  Users,
  DollarSign,
  Gift,
  List,
  Settings,
  RefreshCw,
  Package,
  ChevronDown,
  TrendingUp,
  Coins,
  Heart,
} from 'lucide-react';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { ManualCreditGrant } from './ManualCreditGrant';
import { TransactionsList } from '../Shared/TransactionsList';
import { ProductManagement } from './ProductManagement';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';

export const CreditSystemSettings = () => {
  const [currentSubTab, setCurrentSubTab] = useState(() => {
    const savedSubTab = localStorage.getItem('creditSystemSubTab');
    return savedSubTab ? parseInt(savedSubTab) : 0;
  });

  useEffect(() => {
    localStorage.setItem('creditSystemSubTab', currentSubTab.toString());
  }, [currentSubTab]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Inserate-Verwaltung
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Preise, Community-Topf & Inserate-Pakete verwalten
          </Typography>
        </Box>
        <IconButton onClick={() => window.location.reload()}>
          <RefreshCw size={20} />
        </IconButton>
      </Box>

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
            label="Preise & Einstellungen"
            iconPosition="start"
            sx={{ textTransform: 'none', minHeight: 48 }}
          />
          <Tab
            icon={<List size={18} />}
            label="Transaktionen & Spenden"
            iconPosition="start"
            sx={{ textTransform: 'none', minHeight: 48 }}
          />
          <Tab
            icon={<Gift size={18} />}
            label="Inserate vergeben"
            iconPosition="start"
            sx={{ textTransform: 'none', minHeight: 48 }}
          />
          <Tab
            icon={<Package size={18} />}
            label="Inserate-Pakete"
            iconPosition="start"
            sx={{ textTransform: 'none', minHeight: 48 }}
          />
        </Tabs>
      </Paper>

      {currentSubTab === 0 && <CreditSystemSettingsTab />}
      {currentSubTab === 1 && (
        <TransactionsList
          mode="admin"
          showUserColumn={true}
          showFilters={true}
          showStats={true}
          showRefresh={true}
          limit={100}
        />
      )}
      {currentSubTab === 2 && <ManualCreditGrant />}
      {currentSubTab === 3 && <ProductManagement />}
    </Box>
  );
};

const CreditSystemSettingsTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { settings, loading, error, updateSetting } = useSystemSettings();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Local form state with new donation price field
  const [formData, setFormData] = useState({
    // Basis-Kosten
    costPerListing: settings?.costPerListing || 0.20,

    // Personal-Inserate (Power-User)
    personalInseratePrice: settings?.powerUserCreditPrice || 0.25,
    personalMinPurchase: settings?.powerUserMinPurchase || 10.00,

    // Community-Spenden
    donationInseratePrice: settings?.donationInseratePrice || 0.20,
    minDonationAmount: settings?.minDonationAmount || 5.00,

    // Community-Topf
    lowPotWarningThreshold: settings?.lowPotWarningThreshold || 100,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        costPerListing: settings.costPerListing,
        personalInseratePrice: settings.powerUserCreditPrice,
        personalMinPurchase: settings.powerUserMinPurchase,
        donationInseratePrice: settings.donationInseratePrice || settings.costPerListing,
        minDonationAmount: settings.minDonationAmount,
        lowPotWarningThreshold: settings.lowPotWarningThreshold,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);

      await Promise.all([
        updateSetting({ setting_key: 'cost_per_listing', setting_value: formData.costPerListing }),
        updateSetting({ setting_key: 'power_user_credit_price', setting_value: formData.personalInseratePrice }),
        updateSetting({ setting_key: 'power_user_min_purchase', setting_value: formData.personalMinPurchase }),
        updateSetting({ setting_key: 'donation_inserate_price', setting_value: formData.donationInseratePrice }),
        updateSetting({ setting_key: 'min_donation_amount', setting_value: formData.minDonationAmount }),
        updateSetting({ setting_key: 'low_pot_warning_threshold', setting_value: formData.lowPotWarningThreshold }),
      ]);

      setSaveMessage({ type: 'success', text: '✅ Einstellungen erfolgreich gespeichert!' });
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Fehler beim Speichern der Einstellungen.' });
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  // Calculate package prices dynamically
  const calculatePersonalPackages = () => [
    { euros: 5, inserate: Math.floor(5 / formData.personalInseratePrice), bonus: 0 },
    { euros: 10, inserate: Math.floor(10 / formData.personalInseratePrice), bonus: Math.floor(Math.floor(10 / formData.personalInseratePrice) * 0.1) },
    { euros: 20, inserate: Math.floor(20 / formData.personalInseratePrice), bonus: Math.floor(Math.floor(20 / formData.personalInseratePrice) * 0.15) },
  ];

  const calculateDonationPackages = () => [
    { euros: 5, inserate: Math.floor(5 / formData.donationInseratePrice) },
    { euros: 10, inserate: Math.floor(10 / formData.donationInseratePrice) },
    { euros: 25, inserate: Math.floor(25 / formData.donationInseratePrice) },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
  }

  const personalPackages = calculatePersonalPackages();
  const donationPackages = calculateDonationPackages();

  return (
    <Box>
      {/* Quick Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Users size={24} color="white" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Community-Topf
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatNumber(settings?.communityPotBalance || 0)} Inserate
                  </Typography>
                </Box>
                <Chip
                  icon={<TrendingUp size={14} />}
                  label={(settings?.communityPotBalance || 0) > formData.lowPotWarningThreshold ? 'Gesund' : 'Niedrig'}
                  color={(settings?.communityPotBalance || 0) > formData.lowPotWarningThreshold ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <DollarSign size={24} color="white" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Durchschnittspreis
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatCurrency((formData.personalInseratePrice + formData.donationInseratePrice) / 2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    pro Inserat
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {saveMessage && (
        <Alert severity={saveMessage.type} sx={{ mb: 3 }} onClose={() => setSaveMessage(null)}>
          {saveMessage.text}
        </Alert>
      )}

      {/* Compact Accordion Sections */}
      <Box sx={{ mb: 3 }}>
        {/* 1. Basis-Kosten */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ChevronDown size={20} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DollarSign size={20} color={theme.palette.primary.main} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Basis-Kosten
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tatsächliche Kosten pro Inserat (API + Server)
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Kosten pro Inserat"
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  value={formData.costPerListing}
                  onChange={(e) => setFormData({ ...formData, costPerListing: parseFloat(e.target.value) || 0 })}
                  helperText="Gemini API + Serverkosten"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    Kosten pro 100 Inserate:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatCurrency(formData.costPerListing * 100)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* 2. Personal-Inserate (Power-User) */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ChevronDown size={20} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Coins size={20} color={theme.palette.success.main} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Personal-Inserate (Power-User)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Verkaufspreise für persönliche Inserate
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Preis pro Inserat"
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  value={formData.personalInseratePrice}
                  onChange={(e) => setFormData({ ...formData, personalInseratePrice: parseFloat(e.target.value) || 0 })}
                  helperText="Verkaufspreis an Power-User"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Minimaler Kauf"
                  type="number"
                  inputProps={{ step: 0.50, min: 0 }}
                  value={formData.personalMinPurchase}
                  onChange={(e) => setFormData({ ...formData, personalMinPurchase: parseFloat(e.target.value) || 0 })}
                  helperText="Mindestbetrag"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{
                  p: 2,
                  bgcolor: 'success.50',
                  borderRadius: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    Gewinn pro Inserat:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatCurrency(formData.personalInseratePrice - formData.costPerListing)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({((((formData.personalInseratePrice - formData.costPerListing) / formData.costPerListing) * 100) || 0).toFixed(0)}% Marge)
                  </Typography>
                </Box>
              </Grid>

              {/* Preview Cards for Personal Packages */}
              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  📦 Paket-Vorschau (Personal)
                </Typography>
                <Grid container spacing={2}>
                  {personalPackages.map((pkg, idx) => {
                    const total = pkg.inserate + pkg.bonus;
                    const pricePerInserat = pkg.euros / total;
                    return (
                      <Grid size={{ xs: 12, sm: 4 }} key={idx}>
                        <Card variant="outlined" sx={{
                          bgcolor: idx === 1 ? 'primary.50' : 'background.paper',
                          borderColor: idx === 1 ? 'primary.main' : 'divider',
                        }}>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {formatCurrency(pkg.euros)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {total} Inserate
                              {pkg.bonus > 0 && <Chip label={`+${pkg.bonus} Bonus`} size="small" sx={{ ml: 1, height: 20 }} />}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(pricePerInserat)}/Inserat
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* 3. Community-Spenden */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ChevronDown size={20} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Heart size={20} color={theme.palette.error.main} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Community-Spenden
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Umwandlung von Spenden in kostenlose Inserate
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Preis pro Inserat"
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  value={formData.donationInseratePrice}
                  onChange={(e) => setFormData({ ...formData, donationInseratePrice: parseFloat(e.target.value) || 0 })}
                  helperText="1 EUR Spende = X Inserate"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Minimale Spende"
                  type="number"
                  inputProps={{ step: 0.50, min: 0 }}
                  value={formData.minDonationAmount}
                  onChange={(e) => setFormData({ ...formData, minDonationAmount: parseFloat(e.target.value) || 0 })}
                  helperText="Mindestbetrag"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{
                  p: 2,
                  bgcolor: 'error.50',
                  borderRadius: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    1 EUR generiert:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {formatNumber(Math.floor(1 / formData.donationInseratePrice))} Inserate
                  </Typography>
                </Box>
              </Grid>

              {/* Preview Cards for Donation Packages */}
              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  💝 Spendenpaket-Vorschau
                </Typography>
                <Grid container spacing={2}>
                  {donationPackages.map((pkg, idx) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={idx}>
                      <Card variant="outlined" sx={{
                        bgcolor: idx === 1 ? 'error.50' : 'background.paper',
                        borderColor: idx === 1 ? 'error.main' : 'divider',
                      }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {formatCurrency(pkg.euros)} Spende
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            = {pkg.inserate} kostenlose Inserate
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            für die Community
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* 4. Community-Topf Warnung */}
        <Accordion>
          <AccordionSummary expandIcon={<ChevronDown size={20} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Info size={20} color={theme.palette.warning.main} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Warnungen & Schwellwerte
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Benachrichtigungen bei niedrigem Community-Topf
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Warnschwelle Community-Topf"
                  type="number"
                  inputProps={{ step: 10, min: 0 }}
                  value={formData.lowPotWarningThreshold}
                  onChange={(e) => setFormData({ ...formData, lowPotWarningThreshold: parseInt(e.target.value) || 0 })}
                  helperText="Warnung wenn weniger Inserate verfügbar"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">Inserate</InputAdornment>
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Alert severity={(settings?.communityPotBalance || 0) > formData.lowPotWarningThreshold ? 'success' : 'warning'}>
                  Aktuell: <strong>{formatNumber(settings?.communityPotBalance || 0)} Inserate</strong> im Topf
                  <br />
                  {(settings?.communityPotBalance || 0) > formData.lowPotWarningThreshold
                    ? '✅ Status: Gesund'
                    : '⚠️ Status: Warnung - Topf auffüllen!'}
                </Alert>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Save Button */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Änderungen speichern?
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Alle Preise werden sofort für neue Käufe übernommen
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
            onClick={handleSave}
            disabled={saving}
            sx={{ minWidth: 200 }}
          >
            {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
