import {
  Box,
  Button,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  InputAdornment,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Package, MapPin } from 'lucide-react';

interface ShippingSectionProps {
  formData: {
    shipping_enabled: boolean;
    shipping_cost: number;
    shipping_cost_type: string;
    shipping_description: string | null;
    pickup_enabled: boolean;
    show_location_publicly: boolean;
    location_description: string | null;
    show_ai_shipping_costs: boolean;
  };
  onFormChange: (field: string, value: any) => void;
}

export const ShippingSection = ({ formData, onFormChange }: ShippingSectionProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const ContentWrapper = isMobile ? Box : Paper;
  const wrapperProps = isMobile ? {} : { sx: { p: 3, mb: 3 } };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
        Versand & Abholung
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, display: { xs: 'none', md: 'block' } }}>
        Lege fest, wie Käufer deine Artikel erhalten können
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Diese Einstellungen gelten als Standard für alle deine Artikel.
      </Alert>

      <ContentWrapper {...wrapperProps}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Package size={20} color="#1976d2" />
          <Typography variant="h6" fontWeight={600}>
            Versandoptionen
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={formData.shipping_enabled}
              onChange={(e) => onFormChange('shipping_enabled', e.target.checked)}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Versand anbieten
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Biete Versand für deine Artikel an
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', m: 0, mb: 3 }}
        />

        {formData.shipping_enabled && (
          <Box sx={{ pl: { xs: 0, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}>
                Versandkostenberechnung
              </FormLabel>
              <RadioGroup
                value={formData.shipping_cost_type}
                onChange={(e) => onFormChange('shipping_cost_type', e.target.value)}
              >
                <FormControlLabel
                  value="free"
                  control={<Radio size="small" />}
                  label="Kostenloser Versand"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value="fixed"
                  control={<Radio size="small" />}
                  label="Feste Versandkosten"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value="ai_calculated"
                  control={<Radio size="small" />}
                  label="KI-berechnet (automatisch)"
                />
              </RadioGroup>
            </FormControl>

            {formData.shipping_cost_type === 'fixed' && (
              <TextField
                label="Versandkosten"
                type="number"
                size="small"
                value={formData.shipping_cost}
                onChange={(e) => onFormChange('shipping_cost', parseFloat(e.target.value) || 0)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                  inputProps: { min: 0, step: 0.5 }
                }}
                helperText="Standard-Versandkosten pro Artikel"
                sx={{ maxWidth: 280 }}
              />
            )}

            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Versandbeschreibung (optional)"
              placeholder="z.B. Versand mit DHL, Lieferzeit 2-3 Werktage"
              value={formData.shipping_description || ''}
              onChange={(e) => onFormChange('shipping_description', e.target.value || null)}
              helperText="Zusätzliche Informationen zum Versand"
            />
          </Box>
        )}
      </ContentWrapper>

      <ContentWrapper {...wrapperProps}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <MapPin size={20} color="#1976d2" />
          <Typography variant="h6" fontWeight={600}>
            Abholoptionen
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={formData.pickup_enabled}
              onChange={(e) => onFormChange('pickup_enabled', e.target.checked)}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Abholung ermöglichen
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Käufer können Artikel bei dir abholen
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', m: 0, mb: 3 }}
        />

        {formData.pickup_enabled && (
          <Box sx={{ pl: { xs: 0, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={formData.show_location_publicly}
                  onChange={(e) => onFormChange('show_location_publicly', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Standort öffentlich anzeigen
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {formData.show_location_publicly
                      ? 'Vollständige Adresse wird angezeigt'
                      : 'Nur PLZ und Ort sichtbar'}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', m: 0 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Abholbeschreibung (optional)"
              placeholder="z.B. Abholung nach Vereinbarung, Parkplätze vorhanden"
              value={formData.location_description || ''}
              onChange={(e) => onFormChange('location_description', e.target.value || null)}
              helperText="Zusätzliche Informationen zur Abholung"
            />
          </Box>
        )}
      </ContentWrapper>
    </Box>
  );
};
