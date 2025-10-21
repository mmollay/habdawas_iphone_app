import { Paper, Typography, Box, TextField, Divider, Switch, FormControlLabel, MenuItem, useMediaQuery, useTheme } from '@mui/material';

interface AISectionProps {
  formData: {
    ai_text_style: string;
    ai_text_length: string;
    ai_include_emoji: boolean;
    ai_auto_publish: boolean;
    ai_allow_line_breaks: boolean;
    ai_analyze_all_images: boolean;
  };
  onFormChange: (field: string, value: string | boolean) => void;
}

export const AISection = ({ formData, onFormChange }: AISectionProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const ContentWrapper = isMobile ? Box : Paper;
  const wrapperProps = isMobile ? {} : { sx: { p: 3 } };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
        KI-Assistent
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, display: { xs: 'none', md: 'block' } }}>
        Passe an, wie die KI deine Inseratentexte erstellen soll
      </Typography>

      <ContentWrapper {...wrapperProps}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Textgenerierung
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            select
            label="Schreibstil"
            value={formData.ai_text_style}
            onChange={(e) => onFormChange('ai_text_style', e.target.value)}
            helperText="Der Ton und die Art der generierten Texte"
          >
            <MenuItem value="formal">Förmlich - Professionell und sachlich</MenuItem>
            <MenuItem value="casual">Locker - Freundlich und ungezwungen</MenuItem>
            <MenuItem value="detailed">Detailreich - Ausführlich und informativ</MenuItem>
            <MenuItem value="concise">Prägnant - Kurz und auf den Punkt</MenuItem>
            <MenuItem value="balanced">Ausgewogen - Gute Balance (empfohlen)</MenuItem>
          </TextField>

          <TextField
            fullWidth
            select
            label="Textlänge"
            value={formData.ai_text_length}
            onChange={(e) => onFormChange('ai_text_length', e.target.value)}
            helperText="Bevorzugte Länge der Beschreibungen"
          >
            <MenuItem value="short">Kurz - Ca. 2-3 Sätze</MenuItem>
            <MenuItem value="medium">Mittel - Ca. 4-6 Sätze (empfohlen)</MenuItem>
            <MenuItem value="long">Lang - Ca. 7-10 Sätze</MenuItem>
          </TextField>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          Erweiterte Optionen
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.ai_include_emoji}
                onChange={(e) => onFormChange('ai_include_emoji', e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Emojis verwenden
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Die KI fügt passende Emojis in die Beschreibungen ein
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', m: 0 }}
          />

          <Box sx={{ height: 1, bgcolor: 'divider', my: 0.5 }} />

          <FormControlLabel
            control={
              <Switch
                checked={formData.ai_allow_line_breaks}
                onChange={(e) => onFormChange('ai_allow_line_breaks', e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Zeilenumbrüche erlauben
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Die KI strukturiert Texte mit Absätzen für bessere Lesbarkeit
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', m: 0 }}
          />

          <Box sx={{ height: 1, bgcolor: 'divider', my: 0.5 }} />

          <FormControlLabel
            control={
              <Switch
                checked={formData.ai_auto_publish}
                onChange={(e) => onFormChange('ai_auto_publish', e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Automatisch veröffentlichen
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Inserate werden direkt nach der KI-Generierung veröffentlicht
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', m: 0 }}
          />

          <Box sx={{ height: 1, bgcolor: 'divider', my: 0.5 }} />

          <FormControlLabel
            control={
              <Switch
                checked={formData.ai_analyze_all_images}
                onChange={(e) => onFormChange('ai_analyze_all_images', e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Alle Bilder analysieren
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Bei mehreren Bildern werden alle analysiert (teurer, aber detaillierter)
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', m: 0 }}
          />

        </Box>

      </ContentWrapper>
    </Box>
  );
};
