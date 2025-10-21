import { Box, TextField, Typography, Chip } from '@mui/material';

interface DetailedInfoSectionProps {
  size: string;
  weight: string;
  dimensionsLength: string;
  dimensionsWidth: string;
  dimensionsHeight: string;
  material: string;
  colors: string[];
  style: string;
  serialNumber: string;
  onSizeChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onDimensionsChange: (length: string, width: string, height: string) => void;
  onMaterialChange: (value: string) => void;
  onColorsChange: (colors: string[]) => void;
  onStyleChange: (value: string) => void;
  onSerialNumberChange: (value: string) => void;
  isMobile?: boolean;
}

export const DetailedInfoSection = ({
  size,
  weight,
  dimensionsLength,
  dimensionsWidth,
  dimensionsHeight,
  material,
  colors,
  style,
  serialNumber,
  onSizeChange,
  onWeightChange,
  onDimensionsChange,
  onMaterialChange,
  onColorsChange,
  onStyleChange,
  onSerialNumberChange,
  isMobile = false,
}: DetailedInfoSectionProps) => {
  const handleColorInput = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget.querySelector('input');
      if (input && input.value.trim()) {
        const newColor = input.value.trim();
        if (!colors.includes(newColor)) {
          onColorsChange([...colors, newColor]);
        }
        input.value = '';
      }
    }
  };

  const removeColor = (colorToRemove: string) => {
    onColorsChange(colors.filter(c => c !== colorToRemove));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Größe"
          value={size}
          onChange={(e) => onSizeChange(e.target.value)}
          fullWidth
          placeholder="z.B. M, XL, 40x60cm"
        />

        <TextField
          label="Gewicht"
          value={weight}
          onChange={(e) => onWeightChange(e.target.value)}
          fullWidth
          placeholder="z.B. 500g, 2kg"
        />

        <Box>
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
            Abmessungen
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Länge"
              value={dimensionsLength}
              onChange={(e) => onDimensionsChange(e.target.value, dimensionsWidth, dimensionsHeight)}
              fullWidth
              placeholder="cm"
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              label="Breite"
              value={dimensionsWidth}
              onChange={(e) => onDimensionsChange(dimensionsLength, e.target.value, dimensionsHeight)}
              fullWidth
              placeholder="cm"
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              label="Höhe"
              value={dimensionsHeight}
              onChange={(e) => onDimensionsChange(dimensionsLength, dimensionsWidth, e.target.value)}
              fullWidth
              placeholder="cm"
              size={isMobile ? 'small' : 'medium'}
            />
          </Box>
        </Box>

        <TextField
          label="Material"
          value={material}
          onChange={(e) => onMaterialChange(e.target.value)}
          fullWidth
          placeholder="z.B. Holz, Metall, Kunststoff"
        />

        <Box>
          <TextField
            label="Farben"
            fullWidth
            placeholder="Farbe eingeben und Enter drücken"
            onKeyDown={handleColorInput}
            helperText="Enter oder Komma zum Hinzufügen"
          />
          {colors.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {colors.map((color) => (
                <Chip
                  key={color}
                  label={color}
                  onDelete={() => removeColor(color)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Box>

        <TextField
          label="Stil"
          value={style}
          onChange={(e) => onStyleChange(e.target.value)}
          fullWidth
          placeholder="z.B. Modern, Vintage, Klassisch"
        />

        <TextField
          label="Seriennummer"
          value={serialNumber}
          onChange={(e) => onSerialNumberChange(e.target.value)}
          fullWidth
          placeholder="Falls vorhanden"
        />
    </Box>
  );
};
