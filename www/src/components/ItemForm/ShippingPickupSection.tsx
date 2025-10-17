import { useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Collapse,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import { ChevronDown, ChevronUp, Truck, MapPin } from 'lucide-react';

interface Address {
  id: string;
  name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  phone?: string;
  address_type: string;
}

interface ShippingPickupSectionProps {
  shippingEnabled: boolean;
  shippingCostType: 'free' | 'fixed' | 'ai_calculated';
  shippingCost: number;
  shippingDescription: string;
  pickupEnabled: boolean;
  selectedAddressId: string;
  showLocationPublicly: boolean;
  locationDescription: string;
  addresses: Address[];
  onShippingEnabledChange: (enabled: boolean) => void;
  onShippingCostTypeChange: (type: 'free' | 'fixed' | 'ai_calculated') => void;
  onShippingCostChange: (cost: number) => void;
  onShippingDescriptionChange: (desc: string) => void;
  onPickupEnabledChange: (enabled: boolean) => void;
  onSelectedAddressChange: (id: string) => void;
  onShowLocationPubliclyChange: (show: boolean) => void;
  onLocationDescriptionChange: (desc: string) => void;
  isMobile?: boolean;
  hideShippingPickupToggles?: boolean;
}

export const ShippingPickupSection = ({
  shippingEnabled,
  shippingCostType,
  shippingCost,
  shippingDescription,
  pickupEnabled,
  selectedAddressId,
  showLocationPublicly,
  locationDescription,
  addresses,
  onShippingEnabledChange,
  onShippingCostTypeChange,
  onShippingCostChange,
  onShippingDescriptionChange,
  onPickupEnabledChange,
  onSelectedAddressChange,
  onShowLocationPubliclyChange,
  onLocationDescriptionChange,
  isMobile = false,
  hideShippingPickupToggles = false,
}: ShippingPickupSectionProps) => {
  const [shippingExpanded, setShippingExpanded] = useState(true);
  const [pickupExpanded, setPickupExpanded] = useState(true);

  const pickupAddresses = addresses.filter(
    (addr) => addr.address_type === 'pickup_only' || addr.address_type === 'both'
  );

  return (
    <Box>
      {!hideShippingPickupToggles && (
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Versand & Abholung
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {shippingEnabled && (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            {!hideShippingPickupToggles && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  cursor: 'pointer',
                  bgcolor: shippingExpanded ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                }}
                onClick={() => setShippingExpanded(!shippingExpanded)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Truck size={20} color="#1976d2" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Versand
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={shippingEnabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          onShippingEnabledChange(e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                  <IconButton size="small" onClick={() => setShippingExpanded(!shippingExpanded)}>
                    {shippingExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </IconButton>
                </Box>
              </Box>
            )}

            <Collapse in={hideShippingPickupToggles || (shippingExpanded && shippingEnabled)}>
              {!hideShippingPickupToggles && <Divider />}
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl>
                <FormLabel>Versandkosten</FormLabel>
                <RadioGroup
                  value={shippingCostType}
                  onChange={(e) => onShippingCostTypeChange(e.target.value as any)}
                >
                  <FormControlLabel
                    value="free"
                    control={<Radio />}
                    label="Kostenloser Versand"
                  />
                  <FormControlLabel
                    value="fixed"
                    control={<Radio />}
                    label="Fester Betrag"
                  />
                  <FormControlLabel
                    value="ai_calculated"
                    control={<Radio />}
                    label="KI-berechnet (basierend auf Gewicht & Maßen)"
                  />
                </RadioGroup>
              </FormControl>

              {shippingCostType === 'fixed' && (
                <TextField
                  label="Versandkosten"
                  type="number"
                  value={shippingCost}
                  onChange={(e) => onShippingCostChange(parseFloat(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 0, step: 0.5 }}
                  helperText="in Euro (€)"
                />
              )}

              <TextField
                label="Versandinformationen"
                value={shippingDescription}
                onChange={(e) => onShippingDescriptionChange(e.target.value)}
                fullWidth
                multiline
                rows={isMobile ? 2 : 3}
                placeholder="z.B. Versand mit DHL, 1-3 Werktage"
              />
              </Box>
            </Collapse>
          </Paper>
        )}

        {pickupEnabled && (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            {!hideShippingPickupToggles && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  cursor: 'pointer',
                  bgcolor: pickupExpanded ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                }}
                onClick={() => setPickupExpanded(!pickupExpanded)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MapPin size={20} color="#1976d2" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Abholung
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pickupEnabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          onPickupEnabledChange(e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                  <IconButton size="small" onClick={() => setPickupExpanded(!pickupExpanded)}>
                    {pickupExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </IconButton>
                </Box>
              </Box>
            )}

            <Collapse in={hideShippingPickupToggles || (pickupExpanded && pickupEnabled)}>
              {!hideShippingPickupToggles && <Divider />}
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Abholadresse"
                value={selectedAddressId}
                onChange={(e) => onSelectedAddressChange(e.target.value)}
                fullWidth
                select
                helperText={pickupAddresses.length === 0 ? 'Bitte füge eine Abholadresse in den Einstellungen hinzu' : ''}
              >
                {pickupAddresses.length === 0 ? (
                  <MenuItem value="">Keine Adresse verfügbar</MenuItem>
                ) : (
                  pickupAddresses.map((addr) => (
                    <MenuItem key={addr.id} value={addr.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {addr.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {addr.address}, {addr.postal_code} {addr.city}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={showLocationPublicly}
                    onChange={(e) => onShowLocationPubliclyChange(e.target.checked)}
                  />
                }
                label="Vollständige Adresse öffentlich anzeigen"
              />

              <TextField
                label="Abholhinweise"
                value={locationDescription}
                onChange={(e) => onLocationDescriptionChange(e.target.value)}
                fullWidth
                multiline
                rows={isMobile ? 2 : 3}
                placeholder="z.B. Hinterhof, Klingel oben rechts"
              />
              </Box>
            </Collapse>
          </Paper>
        )}
      </Box>
    </Box>
  );
};
