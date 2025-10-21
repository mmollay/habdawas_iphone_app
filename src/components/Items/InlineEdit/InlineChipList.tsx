import { useState, useEffect } from 'react';
import { Box, Chip, TextField, Typography } from '@mui/material';
import { Pencil } from 'lucide-react';

interface InlineChipListProps {
  value: string[];
  label?: string;
  isEditing: boolean;
  onChange: (value: string[]) => void;
  onSave?: () => void;
  placeholder?: string;
  color?: 'primary' | 'success' | 'info' | 'error';
}

export const InlineChipList = ({
  value,
  label,
  isEditing,
  onChange,
  onSave,
  placeholder,
  color = 'primary',
}: InlineChipListProps) => {
  const [localValue, setLocalValue] = useState<string[]>(value);
  const [inputValue, setInputValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleAdd = (newItem: string) => {
    if (newItem.trim() && !localValue.includes(newItem.trim())) {
      const updated = [...localValue, newItem.trim()];
      setLocalValue(updated);
      onChange(updated);
      setInputValue('');
    }
  };

  const handleRemove = (itemToRemove: string) => {
    const updated = localValue.filter(item => item !== itemToRemove);
    setLocalValue(updated);
    onChange(updated);
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
    if (inputValue.trim()) {
      handleAdd(inputValue);
    }
    setIsActive(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  if (!isEditing || !isActive) {
    const hasContent = value && value.length > 0;

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
        {!hasContent ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {placeholder || '-'}
            </Typography>
            {isEditing && isHovered && (
              <Pencil size={16} style={{ color: 'rgba(25, 118, 210, 0.7)', flexShrink: 0 }} />
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5, flex: 1 }}>
              {value.map((item, idx) => (
                <Chip
                  key={idx}
                  label={item}
                  size="small"
                  color={color}
                  variant="outlined"
                  sx={{ height: 26, fontSize: '0.85rem', fontWeight: 500 }}
                />
              ))}
            </Box>
            {isEditing && isHovered && (
              <Pencil size={16} style={{ color: 'rgba(25, 118, 210, 0.7)', marginTop: '4px', flexShrink: 0 }} />
            )}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <TextField
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        label={label}
        placeholder={placeholder || 'Eingeben und Enter drücken'}
        fullWidth
        variant="outlined"
        size="small"
        autoFocus
        helperText="Enter oder Komma zum Hinzufügen"
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'white',
          },
        }}
      />
      {localValue.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {localValue.map((item, idx) => (
            <Chip
              key={idx}
              label={item}
              onDelete={() => handleRemove(item)}
              size="small"
              color={color}
              variant="outlined"
              sx={{ height: 26, fontSize: '0.85rem', fontWeight: 500 }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
