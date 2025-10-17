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
  Divider,
  Stack,
  Autocomplete,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import { Gift, DollarSign, TrendingUp } from 'lucide-react';
import { useAdminCredits } from '../../hooks/useAdminCredits';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { supabase } from '../../lib/supabase';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

export const ManualCreditGrant = () => {
  const { grantPersonalCredits, addToCommunityPot, loading } = useAdminCredits();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const [grantType, setGrantType] = useState<'personal' | 'community'>('personal');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userOptions, setUserOptions] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [euroAmount, setEuroAmount] = useState<number>(5);
  const [reason, setReason] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calculate credits based on euro amount and grant type
  const calculateCredits = (): number => {
    if (!settings || euroAmount <= 0) return 0;

    const pricePerCredit = grantType === 'community'
      ? settings.costPerListing
      : settings.powerUserCreditPrice;

    return Math.floor(euroAmount / pricePerCredit);
  };

  const creditsToGrant = calculateCredits();

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

    if (euroAmount <= 0) {
      setMessage({ type: 'error', text: 'Betrag muss größer als 0 sein.' });
      return;
    }

    if (creditsToGrant <= 0) {
      setMessage({ type: 'error', text: 'Der eingegebene Betrag ergibt 0 Credits. Bitte erhöhe den Betrag.' });
      return;
    }

    try {
      const pricePerUnit = grantType === 'community'
        ? settings!.costPerListing
        : settings!.powerUserCreditPrice;

      if (grantType === 'personal') {
        await grantPersonalCredits({
          userId: selectedUser!.id,
          amount: creditsToGrant,
          euroAmount: euroAmount,
          pricePerUnit: pricePerUnit,
          reason: reason || undefined,
        });
        setMessage({
          type: 'success',
          text: `Erfolgreich ${formatNumber(creditsToGrant)} Credits (${formatCurrency(euroAmount)}) an ${selectedUser!.full_name || selectedUser!.email} vergeben!`,
        });
      } else {
        await addToCommunityPot({
          amount: creditsToGrant,
          euroAmount: euroAmount,
          pricePerUnit: pricePerUnit,
          reason: reason || undefined,
          userId: selectedUser?.id || undefined, // Optional: Link donor for Hall of Fame
        });
        const donorText = selectedUser ? ` von ${selectedUser.full_name || selectedUser.email}` : '';
        setMessage({
          type: 'success',
          text: `Erfolgreich ${formatNumber(creditsToGrant)} Inserate (${formatCurrency(euroAmount)})${donorText} zum Community-Topf hinzugefügt!`,
        });
      }

      // Reset form
      setEuroAmount(5);
      setReason('');
      setSelectedUser(null);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Fehler beim Vergeben der Credits',
      });
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Manuelle Credit-Vergabe
      </Typography>

      <Paper sx={{ p: 3 }}>
        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Grant Type */}
          <Box>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
              Vergabe-Typ
            </FormLabel>
            <RadioGroup
              row
              value={grantType}
              onChange={(e) => setGrantType(e.target.value as 'personal' | 'community')}
            >
              <FormControlLabel
                value="personal"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Gift size={18} />
                    Persönliche Credits
                  </Box>
                }
              />
              <FormControlLabel
                value="community"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DollarSign size={18} />
                    Community-Topf
                  </Box>
                }
              />
            </RadioGroup>
          </Box>

          <Divider />

          {/* User Selection */}
          <Autocomplete
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
                label={
                  grantType === 'personal'
                    ? 'Benutzer auswählen *'
                    : 'Spender verknüpfen (optional)'
                }
                placeholder="Suche nach Name oder E-Mail..."
                helperText={
                  grantType === 'personal'
                    ? 'Gib mindestens 2 Zeichen ein um zu suchen'
                    : '💡 Optional: Verknüpfe die Spende mit einem User für Dankesliste, Nominierungen & Marketing'
                }
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

          {/* Euro Amount */}
          <TextField
            fullWidth
            label="Betrag in Euro"
            type="number"
            value={euroAmount}
            onChange={(e) => setEuroAmount(parseFloat(e.target.value) || 0)}
            helperText="Gib den Euro-Betrag ein - die Credits werden automatisch berechnet"
            inputProps={{ min: 0.01, step: 0.01 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
            }}
          />

          {/* Preview - High Contrast */}
          {!settingsLoading && euroAmount > 0 && (
            <Card
              sx={{
                bgcolor: creditsToGrant > 0 ? 'success.main' : 'warning.main',
                color: 'white',
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TrendingUp size={24} strokeWidth={2.5} />
                    <Typography variant="h6" fontWeight={700}>
                      {formatNumber(creditsToGrant)} {grantType === 'community' ? 'Inserate' : 'Credits'}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.25)',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {formatCurrency(euroAmount)}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.95,
                    fontWeight: 500,
                  }}
                >
                  Berechnung: {formatCurrency(euroAmount)} ÷ {formatCurrency(
                    grantType === 'community'
                      ? settings?.costPerListing || 0
                      : settings?.powerUserCreditPrice || 0
                  )} = {formatNumber(creditsToGrant)} {grantType === 'community' ? 'Inserate' : 'Credits'}
                  {creditsToGrant === 0 && (
                    <Box
                      component="span"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'warning.dark',
                        fontWeight: 700,
                        ml: 1,
                        px: 1,
                        py: 0.25,
                        borderRadius: 0.5,
                      }}
                    >
                      ⚠️ Betrag zu niedrig
                    </Box>
                  )}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Reason */}
          <TextField
            fullWidth
            label="Grund (optional)"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Z.B. Bonus für aktive Community-Teilnahme"
            helperText="Optionale Begründung für die Credit-Vergabe"
          />

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGrant}
              disabled={
                loading ||
                settingsLoading ||
                creditsToGrant <= 0 ||
                (grantType === 'personal' && !selectedUser)
              }
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Gift size={20} />}
            >
              {loading ? 'Vergebe Credits...' : `${formatNumber(creditsToGrant)} ${grantType === 'community' ? 'Inserate' : 'Credits'} vergeben`}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};
