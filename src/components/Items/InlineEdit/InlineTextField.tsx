import { useState, useEffect, useRef } from 'react';
import { TextField, Typography, Box, IconButton } from '@mui/material';
import { Pencil } from 'lucide-react';

interface InlineTextFieldProps {
  value: string;
  label?: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  onSave?: () => void;
  variant?: 'h4' | 'h5' | 'h6' | 'body1' | 'body2';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  type?: 'text' | 'number';
  displayValue?: string;
  displayColor?: string;
  disabled?: boolean;
}

export const InlineTextField = ({
  value,
  label,
  isEditing,
  onChange,
  onSave,
  variant = 'body1',
  placeholder,
  multiline = false,
  rows = 1,
  required = false,
  type = 'text',
  displayValue,
  displayColor,
  disabled = false,
}: InlineTextFieldProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleBlur = () => {
    setIsActive(false);
    if (onSave) {
      onSave();
    }
  };

  const handleClick = () => {
    if (isEditing && !isActive && !disabled) {
      setIsActive(true);
    }
  };

  if (!isEditing || !isActive) {
    return (
      <Box
        onMouseEnter={() => isEditing && !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        sx={{
          cursor: isEditing && !disabled ? 'pointer' : 'default',
          position: 'relative',
          px: isEditing ? 1.5 : 0,
          py: isEditing ? 1 : 0,
          mx: isEditing ? -1.5 : 0,
          my: isEditing ? -1 : 0,
          borderRadius: 1,
          transition: 'all 0.2s',
          border: isEditing && isHovered && !disabled ? '1px dashed rgba(25, 118, 210, 0.4)' : '1px dashed transparent',
          bgcolor: isEditing && isHovered && !disabled ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {label && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
            {label}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography
            variant={variant}
            sx={{
              whiteSpace: multiline ? 'pre-wrap' : 'normal',
              flex: 1,
              color: displayColor ? displayColor : ((value || '').trim() ? 'text.primary' : 'text.secondary'),
              fontStyle: (value || '').trim() ? 'normal' : 'italic',
              lineHeight: multiline ? 1.8 : 'inherit',
              fontWeight: displayColor ? 'bold' : 'inherit'
            }}
          >
            {displayValue ? displayValue : (value || placeholder || '-')}
          </Typography>
          {isEditing && isHovered && !disabled && (
            <Pencil size={16} style={{ color: 'rgba(25, 118, 210, 0.7)', marginTop: variant === 'h4' ? '8px' : variant === 'h5' ? '4px' : '2px', flexShrink: 0 }} />
          )}
        </Box>
      </Box>
    );
  }

  return (
    <TextField
      inputRef={inputRef}
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      label={label}
      placeholder={placeholder}
      fullWidth
      multiline={multiline}
      rows={rows}
      required={required}
      type={type}
      variant="outlined"
      size="small"
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'white',
        },
      }}
    />
  );
};
