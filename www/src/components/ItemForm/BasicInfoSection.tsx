import { Box, TextField, Typography, MenuItem, Autocomplete, Chip, FormControlLabel, Switch, FormControl, InputLabel, Select } from '@mui/material';
import { conditionOptions } from '../../utils/translations';

interface BasicInfoSectionProps {
  title: string;
  description: string;
  price: string;
  category: string;
  brand: string;
  condition: string;
  tags?: string[];
  priceNegotiable?: boolean;
  isFree?: boolean;
  priceOnRequest?: boolean;
  duration?: number;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onTagsChange?: (value: string[]) => void;
  onPriceNegotiableChange?: (value: boolean) => void;
  onIsFreeChange?: (value: boolean) => void;
  onPriceOnRequestChange?: (value: boolean) => void;
  onDurationChange?: (value: number) => void;
  isMobile?: boolean;
  hideExtendedSettings?: boolean;
}

const categories = [
  'Elektronik',
  'Möbel',
  'Kleidung',
  'Bücher',
  'Sport',
  'Spielzeug',
  'Haushalt',
  'Garten',
  'Auto & Motorrad',
  'Sonstiges',
];


const commonTags = [
  'vintage',
  'neu',
  'handmade',
  'bio',
  'nachhaltig',
  'limitiert',
  'sammlerstück',
  'retro',
  'modern',
  'klassisch',
];

export const BasicInfoSection = ({
  title,
  description,
  price,
  category,
  brand,
  condition,
  tags = [],
  priceNegotiable,
  isFree,
  priceOnRequest,
  duration,
  onTitleChange,
  onDescriptionChange,
  onPriceChange,
  onCategoryChange,
  onBrandChange,
  onConditionChange,
  onTagsChange,
  onPriceNegotiableChange,
  onIsFreeChange,
  onPriceOnRequestChange,
  onDurationChange,
  isMobile = false,
  hideExtendedSettings = false,
}: BasicInfoSectionProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Titel"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          fullWidth
          required
          placeholder="z.B. iPhone 13 Pro Max 256GB"
        />

        <TextField
          label="Beschreibung"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          fullWidth
          required
          multiline
          rows={isMobile ? 4 : 6}
          placeholder="Detaillierte Beschreibung des Artikels..."
        />

        <TextField
          label="Preis"
          value={price}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.,]/g, '');
            onPriceChange(val);
          }}
          fullWidth
          required
          type="text"
          placeholder="0.00"
          inputProps={{ inputMode: 'decimal' }}
          helperText="in Euro (€)"
        />

        <TextField
          label="Kategorie"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          fullWidth
          select
        >
          <MenuItem value="">Keine Kategorie</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Marke"
          value={brand}
          onChange={(e) => onBrandChange(e.target.value)}
          fullWidth
          placeholder="z.B. Apple, Samsung, IKEA..."
        />

        <TextField
          label="Zustand"
          value={condition}
          onChange={(e) => onConditionChange(e.target.value)}
          fullWidth
          select
        >
          <MenuItem value="">Bitte wählen</MenuItem>
          {conditionOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {onTagsChange && (
          <Autocomplete
            multiple
            freeSolo
            options={commonTags}
            value={tags}
            onChange={(_, newValue) => {
              onTagsChange(newValue);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  size="small"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Tags hinzufügen..."
                helperText="Drücke Enter um eigene Tags hinzuzufügen"
              />
            )}
          />
        )}

        {!hideExtendedSettings && onPriceNegotiableChange && onIsFreeChange && onPriceOnRequestChange && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isFree || false}
                  onChange={(e) => {
                    onIsFreeChange(e.target.checked);
                    if (e.target.checked) {
                      if (onPriceNegotiableChange) onPriceNegotiableChange(false);
                      if (onPriceOnRequestChange) onPriceOnRequestChange(false);
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

            {!isFree && !priceOnRequest && (
              <FormControlLabel
                control={
                  <Switch
                    checked={priceNegotiable || false}
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

            {!isFree && (
              <FormControlLabel
                control={
                  <Switch
                    checked={priceOnRequest || false}
                    onChange={(e) => {
                      onPriceOnRequestChange(e.target.checked);
                      if (e.target.checked && onPriceNegotiableChange) {
                        onPriceNegotiableChange(false);
                      }
                    }}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Preis auf Anfrage</Typography>
                    <Typography variant="caption" color="text.secondary">Preis wird nicht angezeigt</Typography>
                  </Box>
                }
              />
            )}
          </Box>
        )}

        {!hideExtendedSettings && onDurationChange && (
          <FormControl fullWidth>
            <InputLabel>Anzeigedauer</InputLabel>
            <Select
              value={duration || 30}
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
        )}
    </Box>
  );
};
