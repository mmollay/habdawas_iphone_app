import { Box, Button, Typography, Chip, CircularProgress, Alert } from '@mui/material';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { useCategorySuggestions } from '../hooks/useCategorySuggestions';
import { CategorySelection } from '../types/categories';
import { useEffect } from 'react';

interface CategorySuggestionsProps {
  title: string;
  description: string;
  onSelect: (selection: CategorySelection) => void;
  currentCategory?: CategorySelection;
}

/**
 * Komponente die AI-basierte Kategorie-Vorschläge anzeigt
 *
 * Wird im ItemForm verwendet um dem User passende Kategorien
 * basierend auf Titel und Beschreibung vorzuschlagen.
 */
export const CategorySuggestions = ({
  title,
  description,
  onSelect,
  currentCategory,
}: CategorySuggestionsProps) => {
  const { suggestions, loading, error, getSuggestions } = useCategorySuggestions();

  // Auto-trigger wenn Titel + Beschreibung gefüllt sind
  useEffect(() => {
    if (title.length > 10 && description.length > 20 && !currentCategory) {
      getSuggestions(title, description);
    }
  }, [title, description, currentCategory]);

  // Zeige nichts wenn bereits eine Kategorie gewählt wurde
  if (currentCategory && Object.keys(currentCategory).length > 0) {
    return null;
  }

  // Zeige nichts wenn noch zu wenig Text
  if (title.length < 10 || description.length < 20) {
    return (
      <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Lightbulb size={20} />
          <Typography variant="body2" color="text.secondary">
            Fülle Titel und Beschreibung aus, um automatische Kategorie-Vorschläge zu erhalten
          </Typography>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2, textAlign: 'center' }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
          Analysiere Produkt und suche passende Kategorien...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Lightbulb size={20} />
          <Typography variant="body2">
            Keine passenden Kategorien gefunden. Bitte wähle manuell eine Kategorie aus.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'success.lighter',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'success.light',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <Lightbulb size={20} color="green" />
          <Typography variant="subtitle2" fontWeight={600}>
            Vorgeschlagene Kategorien
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Basierend auf deiner Beschreibung haben wir folgende Kategorien gefunden:
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {suggestions.map((suggestion, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                bgcolor: 'white',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.lighter',
                  transform: 'translateX(4px)',
                },
              }}
              onClick={() => onSelect(suggestion.categorySelection)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  {suggestion.path}
                </Typography>
                <Chip
                  label={`${Math.round(suggestion.confidence * 100)}%`}
                  size="small"
                  color={suggestion.confidence > 0.7 ? 'success' : 'default'}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {suggestion.reasoning}
              </Typography>

              <Button
                size="small"
                startIcon={<CheckCircle size={16} />}
                sx={{ mt: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(suggestion.categorySelection);
                }}
              >
                Diese Kategorie wählen
              </Button>
            </Box>
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          💡 Tipp: Klicke auf einen Vorschlag oder wähle manuell eine andere Kategorie
        </Typography>
      </Box>
    </Box>
  );
};
