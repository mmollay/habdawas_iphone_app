import { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Chip,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Search, X, TrendingUp, Tag, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Suggestion {
  suggestion: string;
  type: 'title' | 'category' | 'brand';
  count: number;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string, type?: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
}

export const SearchAutocomplete = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Suche nach Produkten...',
  fullWidth = false,
}: SearchAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_search_suggestions', {
          search_text: value,
        });

        if (error) throw error;
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 150);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (suggestion: string, type: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (onSearch) {
      onSearch(suggestion, type);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && onSearch) {
        onSearch(value);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex].suggestion, suggestions[selectedIndex].type);
        } else if (onSearch) {
          onSearch(value, 'manual');
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'title':
        return <Search size={16} />;
      case 'category':
        return <Tag size={16} />;
      case 'brand':
        return <Package size={16} />;
      default:
        return <TrendingUp size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'title':
        return 'Artikel';
      case 'category':
        return 'Kategorie';
      case 'brand':
        return 'Marke';
      default:
        return '';
    }
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        inputRef={inputRef}
        fullWidth={fullWidth}
        size="medium"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
              {value && (
                <IconButton
                  size="small"
                  onClick={() => {
                    onChange('');
                    if (onSearch) {
                      onSearch('');
                    }
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                  }}
                >
                  <X size={18} />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
            borderRadius: 24,
            paddingTop: '6px',
            paddingBottom: '6px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
              borderWidth: 1,
            },
            '&:hover': {
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 0, 0, 0.23)',
              },
            },
            '&.Mui-focused': {
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
            },
          },
          '& input': {
            padding: '8px 0',
          },
          '& input::placeholder': {
            opacity: 0.6,
          },
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
            borderRadius: 2,
          }}
        >
          <List disablePadding>
            {suggestions.map((item, index) => (
              <ListItem key={`${item.type}-${item.suggestion}-${index}`} disablePadding>
                <ListItemButton
                  selected={index === selectedIndex}
                  onClick={() => handleSelect(item.suggestion, item.type)}
                  sx={{
                    py: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      color: 'text.secondary',
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {getTypeIcon(item.type)}
                  </Box>
                  <ListItemText
                    primary={item.suggestion}
                    primaryTypographyProps={{
                      sx: { fontWeight: 500 },
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={getTypeLabel(item.type)}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    />
                    {item.count > 1 && (
                      <Box
                        component="span"
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                        }}
                      >
                        {item.count} Artikel
                      </Box>
                    )}
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};
