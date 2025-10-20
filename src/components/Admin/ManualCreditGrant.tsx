import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Stack,
  Autocomplete,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Gift, Heart, Calculator, User } from 'lucide-react';
import { useAdminCredits } from '../../hooks/useAdminCredits';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { supabase } from '../../lib/supabase';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

// Vordefinierte Mengen für Schnellauswahl
const PRESET_AMOUNTS = [
  { label: '50 Inserate', value: 50 },
  { label: '100 Inserate', value: 100 },
  { label: '250 Inserate', value: 250 },
  { label: '500 Inserate', value: 500 },
  { label: '1.000 Inserate', value: 1000 },
  { label: '2.500 Inserate', value: 2500 },
  { label: '5.000 Inserate', value: 5000 },
  { label: '10.000 Inserate', value: 10000 },
  { label: 'Eigene Anzahl', value: 0 },
];

export const ManualCreditGrant = () => {
  const { grantPersonalCredits, addToCommunityPot, loading } = useAdminCredits();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const [grantType, setGrantType] = useState<'personal' | 'community'>('community');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userOptions, setUserOptions] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [presetAmount, setPresetAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<number>(100);
  const [reason, setReason] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Aktuell eingegebene Anzahl
  const inserateAmount = presetAmount === 0 ? customAmount : presetAmount;

  // Berechne Kosten basierend auf Basis-Kosten
  const calculateCost = (): number => {
    if (!settings || inserateAmount <= 0) return 0;
    return inserateAmount * settings.costPerListing;
  };

  // Berechne AI-Modell-Kosten
  const calculateAICost = (): number => {
    if (!settings || inserateAmount <= 0) return 0;
    const tokensPerListing = settings.avgTokensPerListing || 10000;
    const costPerMillion = settings.tokenCostPerMillion || 0.03;
    const costPerListing = (tokensPerListing / 1000000) * costPerMillion;
    return inserateAmount * costPerListing;
  };

  const getAICostPerListing = (): number => {
    if (!settings) return 0;
    const tokensPerListing = settings.avgTokensPerListing || 10000;
    const costPerMillion = settings.tokenCostPerMillion || 0.03;
    return (tokensPerListing / 1000000) * costPerMillion;
  };

  const totalCost = calculateCost();
  const aiCost = calculateAICost();
  const aiCostPerListing = getAICostPerListing();

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUserOptions([]);
      return;
    }

    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setUserOptions(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGrant = async () => {
    setMessage(null);

    if (grantType === 'personal' && !selectedUser) {
      setMessage({ type: 'error', text: 'Bitte wähle einen Benutzer aus.' });
      return;
    }

    if (inserateAmount <= 0) {
      setMessage({ type: 'error', text: 'Anzahl muss größer als 0 sein.' });
      return;
    }

    try {
      if (grantType === 'personal') {
        await grantPersonalCredits({
          userId: selectedUser!.id,
          amount: inserateAmount,
          euroAmount: totalCost,
          pricePerUnit: settings!.costPerListing,
          reason: reason || undefined,
        });
        setMessage({
          type: 'success',
          text: `✅ ${formatNumber(inserateAmount)} Inserate (Wert: ${formatCurrency(totalCost)}) an ${selectedUser!.full_name || selectedUser!.email} vergeben!`,
        });
      } else {
        await addToCommunityPot({
          amount: inserateAmount,
          euroAmount: totalCost,
          pricePerUnit: settings!.costPerListing,
          reason: reason || undefined,
          userId: selectedUser?.id || undefined,
        });
        const donorText = selectedUser ? ` von ${selectedUser.full_name || selectedUser.email}` : '';
        setMessage({
          type: 'success',
          text: `✅ ${formatNumber(inserateAmount)} Inserate (Wert: ${formatCurrency(totalCost)})${donorText} zum Community-Topf hinzugefügt!`,
        });
      }

      // Reset form
      setPresetAmount(100);
      setCustomAmount(100);
      setReason('');
      setSelectedUser(null);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Fehler beim Vergeben der Inserate',
      });
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Inserate vergeben
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vergib Inserate manuell an Benutzer oder den Community-Topf
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Eingabe */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
              {/* Grant Type */}
              <FormControl>
                <FormLabel sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>
                  Wohin vergeben?
                </FormLabel>
                <RadioGroup
                  row
                  value={grantType}
                  onChange={(e) => setGrantType(e.target.value as 'personal' | 'community')}
                >
                  <FormControlLabel
                    value="community"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Heart size={16} />
                        <Typography variant="body2">Community-Topf</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="personal"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Gift size={16} />
                        <Typography variant="body2">Persönlich</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* User Selection - nur bei personal */}
              {grantType === 'personal' && (
                <Autocomplete
                  size="small"
                  options={userOptions}
                  loading={searchLoading}
                  value={selectedUser}
                  onChange={(_, newValue) => setSelectedUser(newValue)}
                  onInputChange={(_, newInputValue) => searchUsers(newInputValue)}
                  getOptionLabel={(option) =>
                    `${option.full_name || 'Kein Name'} (${option.email})`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Benutzer auswählen"
                      placeholder="Name oder E-Mail..."
                      helperText="Mindestens 2 Zeichen eingeben"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {searchLoading ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}

              {/* Optional: Spender bei Community */}
              {grantType === 'community' && (
                <Autocomplete
                  size="small"
                  options={userOptions}
                  loading={searchLoading}
                  value={selectedUser}
                  onChange={(_, newValue) => setSelectedUser(newValue)}
                  onInputChange={(_, newInputValue) => searchUsers(newInputValue)}
                  getOptionLabel={(option) =>
                    `${option.full_name || 'Kein Name'} (${option.email})`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Spender verknüpfen (optional)"
                      placeholder="Name oder E-Mail..."
                      helperText="Für Danksagungen & Hall of Fame"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {searchLoading ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}

              {/* Preset Dropdown */}
              <FormControl size="small" fullWidth>
                <InputLabel>Anzahl wählen</InputLabel>
                <Select
                  value={presetAmount}
                  onChange={(e) => setPresetAmount(Number(e.target.value))}
                  label="Anzahl wählen"
                >
                  {PRESET_AMOUNTS.map((preset) => (
                    <MenuItem key={preset.value} value={preset.value}>
                      {preset.label}
                      {preset.value > 0 && settings && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 'auto', pl: 2, color: 'text.secondary' }}
                        >
                          ({formatCurrency(preset.value * settings.costPerListing)})
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Custom Amount - nur wenn "Eigene Anzahl" gewählt */}
              {presetAmount === 0 && (
                <TextField
                  size="small"
                  fullWidth
                  label="Eigene Anzahl"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(parseInt(e.target.value) || 0)}
                  inputProps={{ min: 1, step: 1 }}
                  helperText="Gib eine beliebige Anzahl ein"
                />
              )}

              {/* Reason */}
              <TextField
                size="small"
                fullWidth
                label="Grund (optional)"
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Z.B. Bonus für aktive Community-Teilnahme"
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column: Vorschau & Submit */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            {/* Kosten-Vorschau */}
            <Card
              sx={{
                bgcolor: inserateAmount > 0 ? 'primary.main' : 'grey.300',
                color: 'white',
                flex: 1,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Calculator size={24} />
                  <Typography variant="h6" fontWeight={700}>
                    Kosten-Berechnung
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Anzahl Inserate:
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {formatNumber(inserateAmount)}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Basis-Kosten pro Inserat:
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatCurrency(settings?.costPerListing || 0)}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: 'rgba(255,255,255,0.18)', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    AI-Modell-Kosten pro Inserat:
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatCurrency(aiCostPerListing)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                    {settings?.aiModel || 'gemini-2.0-flash-exp'} · {formatNumber(settings?.avgTokensPerListing || 10000)} Tokens
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: 'rgba(255,255,255,0.25)', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Gesamtkosten (Basis):
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(totalCost)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                    {formatNumber(inserateAmount)} × {formatCurrency(settings?.costPerListing || 0)}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: 'rgba(255,255,255,0.35)', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Gesamtkosten (AI-Modell):
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatCurrency(aiCost)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                    {formatNumber(inserateAmount)} × {formatCurrency(aiCostPerListing)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Empfänger Info */}
            {grantType === 'personal' && selectedUser && (
              <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <User size={20} color="#2e7d32" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Empfänger:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedUser.full_name || selectedUser.email}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {grantType === 'community' && selectedUser && (
              <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Heart size={20} color="#0288d1" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Spender (optional):
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedUser.full_name || selectedUser.email}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Submit Button */}
            <Button
              variant="contained"
              size="large"
              onClick={handleGrant}
              disabled={
                loading ||
                settingsLoading ||
                inserateAmount <= 0 ||
                (grantType === 'personal' && !selectedUser)
              }
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Gift size={20} />}
              sx={{ py: 2 }}
            >
              {loading
                ? 'Vergebe...'
                : `${formatNumber(inserateAmount)} Inserate vergeben`}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};
