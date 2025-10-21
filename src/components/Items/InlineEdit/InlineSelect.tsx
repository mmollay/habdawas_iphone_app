import { useState, useEffect, useRef } from 'react';
import { TextField, Typography, Box, MenuItem } from '@mui/material';
import { Pencil } from 'lucide-react';

interface InlineSelectProps {
  value: string;
  label?: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  onSave?: () => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const InlineSelect = ({
  value,
  label,
  isEditing,
  onChange,
  onSave,
  options,
  placeholder,
}: InlineSelectProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
    setIsActive(false);
    if (onSave) {
      onSave();
    }
  };

  const handleClick = () => {
    if (isEditing && !isActive) {
      setIsActive(true);
    }
  };

  const handleBlur = () => {
    setIsActive(false);
  };

  const displayValue = options.find(opt => opt.value === value)?.label || value || placeholder || 'Keine Angabe';

  if (!isEditing || !isActive) {
    return (
      <Box
        onMouseEnter={() => isEditing && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        sx={{
          cursor: isEditing ? 'pointer' : 'default',
          position: 'relative',
          px: isEditing ? 1.5 : 0,
          py: isEditing ? 1 : 0,
          mx: isEditing ? -1.5 : 0,
          my: isEditing ? -1 : 0,
          borderRadius: 1,
          transition: 'all 0.2s',
          border: isEditing && isHovered ? '1px dashed rgba(25, 118, 210, 0.4)' : '1px dashed transparent',
          bgcolor: isEditing && isHovered ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
        }}
      >
        {label && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
            {label}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ flex: 1, color: value ? 'text.primary' : 'text.secondary' }}>
            {displayValue}
          </Typography>
          {isEditing && isHovered && (
            <Pencil size={16} style={{ color: 'rgba(25, 118, 210, 0.7)', flexShrink: 0 }} />
          )}
        </Box>
      </Box>
    );
  }

  return (
    <TextField
      select
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      label={label}
      fullWidth
      variant="outlined"
      size="small"
      autoFocus
      SelectProps={{
        MenuProps: {
          autoFocus: false,
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'white',
        },
      }}
    >
      <MenuItem value="">
        {placeholder || 'Bitte wählen'}
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};
