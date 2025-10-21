import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Card,
  CardContent,
  TextField,
  Switch,
  FormControlLabel,
  Autocomplete,
  MenuItem,
  CircularProgress,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Plus, MapPin, Trash2, Home } from 'lucide-react';
import { supabase, PickupAddress } from '../../../lib/supabase';
import { Modal } from '../../Common/Modal';
import { countries } from '../../../data/countries';
import { searchCitiesByPostalCode } from '../../../utils/postalCodeLookup';

interface AddressesSectionProps {
  userId: string;
}

export const AddressesSection = ({ userId }: AddressesSectionProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [addresses, setAddresses] = useState<PickupAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<PickupAddress | null>(null);
  const [saving, setSaving] = useState(false);

  const [newAddress, setNewAddress] = useState({
    name: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'AT',
    phone: '',
    show_phone_publicly: false,
    is_default: false,
    address_type: 'both',
    is_default_shipping: false,
  });

  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      if (newAddress.postal_code.length >= 4) {
        setLoadingCities(true);
        try {
          const suggestions = await searchCitiesByPostalCode(newAddress.postal_code, newAddress.country);
          const cities = suggestions.map(s => s.city);
          console.log('AddressesSection: Found cities for', newAddress.postal_code, newAddress.country, ':', cities);
          setCitySuggestions(cities);

          if (cities.length === 1 && !newAddress.city) {
            setNewAddress(prev => ({ ...prev, city: cities[0] }));
          }
        } catch (error) {
          console.error('Error fetching cities:', error);
        } finally {
          setLoadingCities(false);
        }
      } else {
        setCitySuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchCities, 500);
    return () => clearTimeout(timeoutId);
  }, [newAddress.postal_code, newAddress.country]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setNewAddress({
      name: '',
      address: '',
      postal_code: '',
      city: '',
      country: 'AT',
      phone: '',
      show_phone_publicly: false,
      is_default: false,
      address_type: 'both',
      is_default_shipping: false,
    });
    setDialogOpen(true);
  };

  const handleEditAddress = (address: PickupAddress) => {
    setEditingAddress(address);
    setNewAddress({
      name: address.name || '',
      address: address.address,
      postal_code: address.postal_code,
      city: address.city,
      country: address.country,
      phone: address.phone || '',
      show_phone_publicly: address.show_phone_publicly || false,
      is_default: address.is_default,
      address_type: address.address_type || 'both',
      is_default_shipping: address.is_default_shipping || false,
    });
    setDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!newAddress.address.trim() || !newAddress.postal_code.trim() || !newAddress.city.trim()) {
      return;
    }

    setSaving(true);
    try {
      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update({
            name: newAddress.name.trim() || 'Meine Adresse',
            address: newAddress.address.trim(),
            postal_code: newAddress.postal_code.trim(),
            city: newAddress.city.trim(),
            country: newAddress.country,
            phone: newAddress.phone?.trim() || null,
            show_phone_publicly: newAddress.show_phone_publicly,
            is_default: newAddress.is_default,
            address_type: newAddress.address_type,
            is_default_shipping: newAddress.is_default_shipping,
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: userId,
            name: newAddress.name.trim() || 'Meine Adresse',
            address: newAddress.address.trim(),
            postal_code: newAddress.postal_code.trim(),
            city: newAddress.city.trim(),
            country: newAddress.country,
            phone: newAddress.phone?.trim() || null,
            show_phone_publicly: newAddress.show_phone_publicly,
            is_default: newAddress.is_default,
            address_type: newAddress.address_type,
            is_default_shipping: newAddress.is_default_shipping,
          });

        if (error) throw error;
      }

      await loadAddresses();
      setDialogOpen(false);
    } catch (err) {
      console.error('Error saving address:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Möchtest du diese Adresse wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1 }}>
            Adressen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verwalte deine Adressen für Abholung und Versand
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={handleAddAddress}
          sx={{ ml: { xs: 'auto', md: 'auto' }, mr: { xs: 'auto', md: 0 } }}
        >
          {addresses.length === 0 ? 'Adresse hinzufügen' : isMobile ? '+ Adresse' : 'Neue Adresse'}
        </Button>
      </Box>

      {addresses.length === 0 ? (
        <Paper sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
          <MapPin size={48} style={{ margin: '0 auto 16px', color: '#999' }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Keine Adressen vorhanden
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Füge deine erste Adresse über den Button oben hinzu
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {addresses.map((address) => (
            <Grid size={{ xs: 12, md: 6 }} key={address.id}>
              <Card
                sx={{
                  height: '100%',
                  border: address.is_default ? 2 : 1,
                  borderColor: address.is_default ? 'primary.main' : 'divider',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Home size={20} color={address.is_default ? '#1976d2' : '#666'} />
                      <Typography variant="h6" fontWeight={600}>
                        {address.name || 'Unbenannte Adresse'}
                      </Typography>
                    </Box>
                    {address.is_default && (
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontWeight: 600,
                        }}
                      >
                        Standard
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {address.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {address.postal_code} {address.city}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {countries.find(c => c.code === address.country)?.name || address.country}
                  </Typography>
                  {address.phone && (
                    <Typography variant="body2" color="text.secondary">
                      Tel: {address.phone}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(address.address_type === 'both' || address.address_type === 'pickup_only') && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 1.5,
                          py: 0.75,
                          bgcolor: 'rgba(25, 118, 210, 0.08)',
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'primary.main',
                        }}
                      >
                        <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                          Abholung
                        </Typography>
                      </Box>
                    )}
                    {(address.address_type === 'both' || address.address_type === 'shipping_only') && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 1.5,
                          py: 0.75,
                          bgcolor: 'rgba(46, 125, 50, 0.08)',
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'success.main',
                        }}
                      >
                        <Typography variant="caption" color="success.main" fontWeight={600} sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                          Versand
                        </Typography>
                      </Box>
                    )}
                    {address.is_default_shipping && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 1.5,
                          py: 0.75,
                          bgcolor: 'rgba(237, 108, 2, 0.08)',
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'warning.main',
                        }}
                      >
                        <Typography variant="caption" color="warning.main" fontWeight={600} sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                          Standard-Versand
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                    <Button
                      variant="outlined"
                      size="medium"
                      onClick={() => handleEditAddress(address)}
                      fullWidth
                      sx={{
                        fontWeight: 600,
                        textTransform: 'none',
                        borderWidth: 1.5,
                        '&:hover': {
                          borderWidth: 1.5,
                        }
                      }}
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="medium"
                      onClick={() => handleDeleteAddress(address.id)}
                      sx={{
                        minWidth: 48,
                        px: 1.5,
                        fontWeight: 600,
                        borderWidth: 1.5,
                        '&:hover': {
                          borderWidth: 1.5,
                        }
                      }}
                    >
                      <Trash2 size={18} strokeWidth={2} />
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingAddress ? 'Adresse bearbeiten' : 'Neue Adresse hinzufügen'}
        maxWidth="md"
        fullScreen={isMobile}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Name (optional)"
              value={newAddress.name}
              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
              placeholder="z.B. Zuhause, Arbeit"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              label="Straße und Hausnummer"
              value={newAddress.address}
              onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="PLZ"
              required
              value={newAddress.postal_code}
              onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
              helperText={loadingCities ? 'Suche Orte...' : citySuggestions.length > 0 ? `${citySuggestions.length} Ort(e) gefunden` : ''}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 8 }}>
            <Autocomplete
              fullWidth
              freeSolo
              loading={loadingCities}
              options={citySuggestions}
              value={newAddress.city}
              onInputChange={(e, value) => {
                setNewAddress({ ...newAddress, city: value || '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ort"
                  required
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              select
              label="Land"
              value={newAddress.country}
              onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
              SelectProps={{ native: true }}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Telefon (optional)"
              value={newAddress.phone}
              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
              helperText="Wird für Artikeldetails verwendet, falls freigegeben"
            />
          </Grid>

          {newAddress.phone && (
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newAddress.show_phone_publicly}
                    onChange={(e) => setNewAddress({ ...newAddress, show_phone_publicly: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Telefonnummer öffentlich anzeigen</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Wenn aktiviert, wird deine Telefonnummer bei Artikeln mit dieser Adresse angezeigt
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              select
              label="Adresstyp"
              value={newAddress.address_type}
              onChange={(e) => setNewAddress({ ...newAddress, address_type: e.target.value as 'pickup_only' | 'shipping_only' | 'both' })}
              helperText="Wähle aus, wofür diese Adresse verwendet werden soll"
            >
              <MenuItem value="both">Abholung & Versand</MenuItem>
              <MenuItem value="pickup_only">Nur Abholung</MenuItem>
              <MenuItem value="shipping_only">Nur Versand</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newAddress.is_default}
                    onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                  />
                }
                label="Als Standard-Adresse für Abholung festlegen"
              />
              {(newAddress.address_type === 'both' || newAddress.address_type === 'shipping_only') && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={newAddress.is_default_shipping}
                      onChange={(e) => setNewAddress({ ...newAddress, is_default_shipping: e.target.checked })}
                    />
                  }
                  label="Als Standard-Versandadresse festlegen"
                />
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 3, mt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => setDialogOpen(false)} size="large" sx={{ minWidth: 120 }}>
                ABBRECHEN
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveAddress}
                disabled={saving || !newAddress.address || !newAddress.postal_code || !newAddress.city}
                size="large"
                sx={{ minWidth: 120 }}
              >
                {saving ? <CircularProgress size={24} /> : 'SPEICHERN'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Modal>
    </Box>
  );
};
