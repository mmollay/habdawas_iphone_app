import {
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { CheckCircle, XCircle } from 'lucide-react';

interface AttributeStatusTableProps {
  analysis: any; // The merged analysis result
  categoryInfo?: {
    level1?: string;
    level2?: string;
    level3?: string;
  };
}

// Core attributes that should always be checked
const CORE_ATTRIBUTES = [
  { key: 'title', label: 'Titel' },
  { key: 'description', label: 'Beschreibung' },
  { key: 'price', label: 'Preis' },
  { key: 'category_id', label: 'Kategorie' },
  { key: 'condition', label: 'Zustand' },
  { key: 'brand', label: 'Marke' },
  { key: 'material', label: 'Material' },
  { key: 'colors', label: 'Farbe' },
  { key: 'size', label: 'Größe' },
  { key: 'weight', label: 'Gewicht' },
  { key: 'dimensions', label: 'Abmessungen' },
  { key: 'style', label: 'Stil' },
  { key: 'serialNumber', label: 'Seriennummer' },
  { key: 'features', label: 'Features' },
  { key: 'accessories', label: 'Zubehör' },
  { key: 'tags', label: 'Tags' },
];

// Vehicle-specific attributes
const VEHICLE_ATTRIBUTES = [
  { key: 'vehicle_brand', label: 'Fahrzeugmarke' },
  { key: 'vehicle_year', label: 'Baujahr' },
  { key: 'vehicle_mileage', label: 'Kilometerstand' },
  { key: 'vehicle_fuel_type', label: 'Kraftstoffart' },
  { key: 'vehicle_color', label: 'Fahrzeugfarbe' },
  { key: 'vehicle_power_kw', label: 'Leistung (kW)' },
  { key: 'vehicle_first_registration', label: 'Erstzulassung' },
  { key: 'vehicle_tuv_until', label: 'TÜV bis' },
];

export const AttributeStatusTable = ({ analysis, categoryInfo }: AttributeStatusTableProps) => {
  const hasValue = (key: string): boolean => {
    const value = analysis[key];
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
  };

  // Translation maps
  const conditionTranslations: Record<string, string> = {
    'new': 'Neu',
    'like_new': 'Wie neu',
    'very_good': 'Sehr gut',
    'good': 'Gut',
    'acceptable': 'Akzeptabel',
    'for_parts': 'Für Ersatzteile',
  };

  const formatValue = (key: string, value: any): string => {
    if (value === undefined || value === null || value === '') return '';

    // Handle category - show name from categoryInfo instead of UUID
    if (key === 'category_id' && categoryInfo) {
      const parts = [];
      if (categoryInfo.level1) parts.push(categoryInfo.level1);
      if (categoryInfo.level2) parts.push(categoryInfo.level2);
      if (categoryInfo.level3) parts.push(categoryInfo.level3);
      return parts.join(' → ') || String(value);
    }

    // Handle condition - translate to German
    if (key === 'condition') {
      return conditionTranslations[value] || String(value);
    }

    // Handle arrays (colors, tags, features, accessories)
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      return value.join(', ');
    }

    // Handle objects (dimensions)
    if (typeof value === 'object') {
      if (Object.keys(value).length === 0) return '';
      // Format dimensions object
      if (key === 'dimensions') {
        const parts = [];
        if (value.length) parts.push(`L: ${value.length}`);
        if (value.width) parts.push(`B: ${value.width}`);
        if (value.height) parts.push(`H: ${value.height}`);
        return parts.join(' × ');
      }
      return JSON.stringify(value);
    }

    // Handle price with currency
    if (key === 'price') {
      return `€${Number(value).toFixed(2)}`;
    }

    // Handle boolean
    if (typeof value === 'boolean') {
      return value ? 'Ja' : 'Nein';
    }

    // Default: convert to string
    return String(value);
  };

  const getDisplayValue = (key: string): string => {
    return formatValue(key, analysis[key]);
  };

  // Check if this is a vehicle (has any vehicle attributes)
  const isVehicle = VEHICLE_ATTRIBUTES.some(attr => hasValue(attr.key));

  // Combine attributes based on item type
  const allAttributes = isVehicle
    ? [...CORE_ATTRIBUTES, ...VEHICLE_ATTRIBUTES]
    : CORE_ATTRIBUTES;

  // Calculate statistics
  const totalCount = allAttributes.length;
  const filledCount = allAttributes.filter(attr => hasValue(attr.key)).length;
  const missingCount = totalCount - filledCount;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          📋 Erkannte Attribute
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            icon={<CheckCircle size={14} />}
            label={`${filledCount} befüllt`}
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip
            icon={<XCircle size={14} />}
            label={`${missingCount} fehlen`}
            size="small"
            color="error"
            variant="outlined"
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {allAttributes.map((attr) => {
          const filled = hasValue(attr.key);
          const displayValue = filled ? getDisplayValue(attr.key) : '';

          return (
            <Box
              key={attr.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 0.75,
                borderRadius: 1,
                border: '1px solid',
                borderColor: filled ? 'success.light' : 'grey.300',
                bgcolor: filled ? 'success.50' : 'grey.50',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: filled ? 'success.main' : 'grey.400',
                }
              }}
            >
              {filled ? (
                <CheckCircle size={14} color="green" style={{ flexShrink: 0 }} />
              ) : (
                <XCircle size={14} color="#999" style={{ flexShrink: 0 }} />
              )}

              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: filled ? 'success.dark' : 'text.secondary',
                  minWidth: '120px',
                  flexShrink: 0,
                }}
              >
                {attr.label}:
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: filled ? 'text.primary' : 'text.disabled',
                  flex: 1,
                  fontStyle: filled ? 'normal' : 'italic',
                }}
                title={displayValue || 'Nicht vorhanden'}
              >
                {filled ? displayValue : '—'}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
