import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Chip, Switch, FormControlLabel, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ChevronDown, MapPin, Package, Tag, Calendar, Gift, Phone } from 'lucide-react';

interface ItemSettingsPreviewProps {
  pickupAddress: string;
  shippingEnabled: boolean;
  shippingCostType: 'free' | 'fixed' | 'ai_calculated';
  shippingCostFixed: number;
  shippingDescription?: string;
  priceNegotiable: boolean;
  isFree: boolean;
  duration: number;
  onShippingEnabledChange: (enabled: boolean) => void;
  onShippingCostTypeChange: (type: 'free' | 'fixed' | 'ai_calculated') => void;
  onShippingCostFixedChange: (cost: number) => void;
  onShippingDescriptionChange?: (description: string) => void;
  onPriceNegotiableChange: (negotiable: boolean) => void;
  onIsFreeChange: (free: boolean) => void;
  onDurationChange: (days: number) => void;
  pickupEnabled: boolean;
  onPickupEnabledChange: (enabled: boolean) => void;
  phoneVisible?: boolean;
}

export const ItemSettingsPreview = ({
  pickupAddress,
  shippingEnabled,
  shippingCostType,
  shippingCostFixed,
  shippingDescription,
  priceNegotiable,
  isFree,
  duration,
  onShippingEnabledChange,
  onShippingCostTypeChange,
  onShippingCostFixedChange,
  onShippingDescriptionChange,
  onPriceNegotiableChange,
  onIsFreeChange,
  onDurationChange,
  pickupEnabled,
  onPickupEnabledChange,
  phoneVisible = false,
}: ItemSettingsPreviewProps) => {
  const getShippingText = () => {
    if (!shippingEnabled) return 'Nicht verfügbar';
    if (shippingCostType === 'free') return 'Kostenlos';
    if (shippingCostType === 'fixed') return `€${shippingCostFixed.toFixed(2)}`;
    return 'KI-berechnet';
  };

  return (
    <Accordion
      sx={{
        mt: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        '&:before': { display: 'none' },
        boxShadow: 'none',
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={20} />}
        sx={{
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Artikel-Einstellungen
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {pickupEnabled && (
            <Chip
              icon={<MapPin size={14} />}
              label={pickupAddress ? `Abholung: ${pickupAddress}` : 'Abholung möglich'}
              size="small"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
          {pickupEnabled && phoneVisible && (
            <Chip
              icon={<Phone size={14} />}
              label="Tel. sichtbar"
              size="small"
              color="info"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
          <Chip
            icon={<Package size={14} />}
            label={`Versand: ${getShippingText()}`}
            size="small"
            color={shippingEnabled ? 'primary' : 'default'}
            sx={{ fontSize: '0.75rem' }}
          />
          {isFree && (
            <Chip
              icon={<Gift size={14} />}
              label="Zu verschenken"
              size="small"
              color="success"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
          {!isFree && priceNegotiable && (
            <Chip
              icon={<Tag size={14} />}
              label="VB"
              size="small"
              sx={{ fontSize: '0.75rem', fontWeight: 700, bgcolor: 'warning.main', color: 'white' }}
            />
          )}
          <Chip
            icon={<Calendar size={14} />}
            label={`${duration} Tage`}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 1.75, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapPin size={16} />
              Abholung
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={pickupEnabled}
                  onChange={(e) => onPickupEnabledChange(e.target.checked)}
                  size="small"
                />
              }
              label="Abholung aktivieren"
            />
            {pickupEnabled && (
              <Box sx={{ mt: 1, ml: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  📍 {pickupAddress || 'Keine Adresse ausgewählt'}
                </Typography>
                {phoneVisible && (
                  <Typography variant="caption" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Phone size={12} /> Telefonnummer wird im Inserat angezeigt
                  </Typography>
                )}
                {!phoneVisible && pickupAddress && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    🔒 Telefonnummer wird nicht angezeigt
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Package size={16} />
              Versand
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={shippingEnabled}
                  onChange={(e) => onShippingEnabledChange(e.target.checked)}
                  size="small"
                />
              }
              label="Versand aktivieren"
              sx={{ mb: 1.5 }}
            />

            {shippingEnabled && (
              <Box sx={{ ml: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Versandkosten</InputLabel>
                  <Select
                    value={shippingCostType}
                    label="Versandkosten"
                    onChange={(e) => onShippingCostTypeChange(e.target.value as 'free' | 'fixed' | 'ai_calculated')}
                  >
                    <MenuItem value="ai_calculated">KI-berechnet</MenuItem>
                    <MenuItem value="fixed">Festpreis</MenuItem>
                    <MenuItem value="free">Kostenlos</MenuItem>
                  </Select>
                </FormControl>

                {(shippingCostType === 'fixed' || shippingCostType === 'ai_calculated') && (
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={shippingCostType === 'ai_calculated' ? 'Versandkosten (€) - Manuell festlegen' : 'Versandkosten (€)'}
                    value={shippingCostFixed}
                    onChange={(e) => onShippingCostFixedChange(Number(e.target.value))}
                    inputProps={{ min: 0, step: 0.5 }}
                    helperText={shippingCostType === 'ai_calculated' ? 'Im manuellen Modus wird keine KI-Berechnung durchgeführt' : undefined}
                  />
                )}

                {onShippingDescriptionChange && (
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    label="Versandinformationen (optional)"
                    value={shippingDescription || ''}
                    onChange={(e) => onShippingDescriptionChange(e.target.value)}
                    placeholder="z.B. Versand mit DHL, 1-3 Werktage"
                  />
                )}
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tag size={16} />
              Preis
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isFree}
                    onChange={(e) => {
                      onIsFreeChange(e.target.checked);
                      if (e.target.checked) {
                        onPriceNegotiableChange(false);
                      }
                    }}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Zu verschenken</Typography>
                    <Typography variant="caption" color="text.secondary">Artikel kostenlos abgeben</Typography>
                  </Box>
                }
              />

              {!isFree && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={priceNegotiable}
                      onChange={(e) => onPriceNegotiableChange(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Verhandlungsbasis (VB)</Typography>
                      <Typography variant="caption" color="text.secondary">Preis ist verhandelbar</Typography>
                    </Box>
                  }
                />
              )}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={16} />
              Laufzeit
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Anzeigedauer</InputLabel>
              <Select
                value={duration}
                label="Anzeigedauer"
                onChange={(e) => onDurationChange(Number(e.target.value))}
              >
                <MenuItem value={7}>7 Tage</MenuItem>
                <MenuItem value={14}>14 Tage</MenuItem>
                <MenuItem value={30}>30 Tage</MenuItem>
                <MenuItem value={60}>60 Tage</MenuItem>
                <MenuItem value={90}>90 Tage</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Das Inserat wird nach Ablauf automatisch deaktiviert
            </Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
