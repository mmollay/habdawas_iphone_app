import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import { Brain, Save, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AISettings {
  ai_model: string;
  newsletter_ai_model: string;
}

interface ModelPricing {
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  estimatedCostPerListing: number; // Assuming 8000 input + 2000 output tokens (≈10k total)
}

const GEMINI_MODELS = [
  {
    value: 'gemini-2.0-flash-exp',
    label: 'Gemini 2.0 Flash (Preview) - Gratis & Schnell',
    description: 'Kostenlos während Preview, Native Tool Use, 1M Token Context',
    pricing: {
      inputCostPerMillion: 0.00, // Free during preview
      outputCostPerMillion: 0.00,
      estimatedCostPerListing: 0.00,
    } as ModelPricing,
  },
  {
    value: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite - Am Günstigsten',
    description: 'Günstigste Option, optimiert für High-Volume & Low-Latency',
    pricing: {
      inputCostPerMillion: 0.02,
      outputCostPerMillion: 0.08,
      estimatedCostPerListing: (8000 * 0.02 / 1000000) + (2000 * 0.08 / 1000000),
    } as ModelPricing,
  },
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash - Beste Balance',
    description: 'Optimales Preis-Leistungs-Verhältnis, "Thinking" Mode, 1M Context',
    pricing: {
      inputCostPerMillion: 0.15,
      outputCostPerMillion: 0.60,
      estimatedCostPerListing: (8000 * 0.15 / 1000000) + (2000 * 0.60 / 1000000),
    } as ModelPricing,
  },
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro - Höchste Qualität',
    description: 'Premium Qualität, optimiert für Coding & komplexe Reasoning-Tasks',
    pricing: {
      inputCostPerMillion: 1.25,
      outputCostPerMillion: 10.00,
      estimatedCostPerListing: (8000 * 1.25 / 1000000) + (2000 * 10.00 / 1000000),
    } as ModelPricing,
  },
];

export const AISettings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('credit_system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['ai_model', 'newsletter_ai_model']);

      if (error) throw error;

      const settingsMap = data?.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {} as Record<string, string>) || {};

      setSettings({
        ai_model: settingsMap.ai_model || 'gemini-2.0-flash-exp',
        newsletter_ai_model: settingsMap.newsletter_ai_model || 'gemini-2.0-flash-exp',
      });
    } catch (err) {
      console.error('Error loading AI settings:', err);
      setError('Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Update ai_model (Inserate)
      const { error: aiModelError } = await supabase
        .from('credit_system_settings')
        .update({
          setting_value: settings.ai_model,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'ai_model');

      if (aiModelError) throw aiModelError;

      // Update newsletter_ai_model
      const { error: newsletterModelError } = await supabase
        .from('credit_system_settings')
        .update({
          setting_value: settings.newsletter_ai_model,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'newsletter_ai_model');

      if (newsletterModelError) throw newsletterModelError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving AI settings:', err);
      setError('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedInserateModel = GEMINI_MODELS.find(m => m.value === settings?.ai_model);
  const selectedNewsletterModel = GEMINI_MODELS.find(m => m.value === settings?.newsletter_ai_model);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            KI-Einstellungen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Konfiguriere KI-Modelle für verschiedene Funktionen
          </Typography>
        </Box>
        <IconButton onClick={fetchSettings} disabled={loading}>
          <RefreshCw size={20} />
        </IconButton>
      </Box>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, mb: { xs: 2, md: 3 } }}>
          <Brain size={isMobile ? 20 : 24} />
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600 }}>
            Modell-Auswahl
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Preis-Info */}
        <Alert severity="info" sx={{ mb: 3, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            💰 Preisangaben pro Inserat
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Die angezeigten Kosten beziehen sich auf <strong>ein durchschnittliches Inserat</strong> mit ca. <strong>10.000 Tokens</strong> (≈8.000 Input + 2.000 Output). Dies entspricht einer typischen Bildanalyse mit mehreren API-Aufrufen.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Einstellungen erfolgreich gespeichert
          </Alert>
        )}

        {/* Inserate KI-Modell */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            mb: 1.5,
            color: 'text.secondary',
            fontSize: { xs: '0.85rem', md: '0.875rem' }
          }}
        >
          📦 Inserate-Erstellung (Bildanalyse)
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="ai-model-label" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
            KI-Modell für Inserate
          </InputLabel>
          <Select
            labelId="ai-model-label"
            id="ai-model"
            value={settings?.ai_model || ''}
            label="KI-Modell für Inserate"
            onChange={(e) => setSettings({ ...settings!, ai_model: e.target.value })}
          >
            {GEMINI_MODELS.map((model) => (
              <MenuItem key={model.value} value={model.value}>
                <Box sx={{ width: '100%', py: { xs: 0.5, md: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.85rem', md: '0.875rem' },
                        flex: { xs: '1 1 100%', sm: '1 1 auto' }
                      }}
                    >
                      {model.label}
                    </Typography>
                    {model.pricing.estimatedCostPerListing > 0 ? (
                      <Chip
                        icon={<DollarSign size={10} />}
                        label={`${model.pricing.estimatedCostPerListing.toFixed(4)}€`}
                        size="small"
                        color="primary"
                        sx={{ fontSize: { xs: '0.65rem', md: '0.7rem' }, height: { xs: 18, md: 20 } }}
                      />
                    ) : (
                      <Chip
                        label="GRATIS"
                        size="small"
                        color="success"
                        sx={{ fontSize: { xs: '0.65rem', md: '0.7rem' }, height: { xs: 18, md: 20 }, fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                  >
                    {model.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider sx={{ my: 2.5 }} />

        {/* Newsletter KI-Modell */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            mb: 1.5,
            color: 'text.secondary',
            fontSize: { xs: '0.85rem', md: '0.875rem' }
          }}
        >
          📧 Newsletter-Generierung (Text-KI)
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="newsletter-ai-model-label" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
            KI-Modell für Newsletter
          </InputLabel>
          <Select
            labelId="newsletter-ai-model-label"
            id="newsletter-ai-model"
            value={settings?.newsletter_ai_model || ''}
            label="KI-Modell für Newsletter"
            onChange={(e) => setSettings({ ...settings!, newsletter_ai_model: e.target.value })}
          >
            {GEMINI_MODELS.map((model) => (
              <MenuItem key={model.value} value={model.value}>
                <Box sx={{ width: '100%', py: { xs: 0.5, md: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.85rem', md: '0.875rem' },
                        flex: { xs: '1 1 100%', sm: '1 1 auto' }
                      }}
                    >
                      {model.label}
                    </Typography>
                    {model.pricing.estimatedCostPerListing > 0 ? (
                      <Chip
                        icon={<DollarSign size={10} />}
                        label={`${model.pricing.estimatedCostPerListing.toFixed(4)}€`}
                        size="small"
                        color="primary"
                        sx={{ fontSize: { xs: '0.65rem', md: '0.7rem' }, height: { xs: 18, md: 20 } }}
                      />
                    ) : (
                      <Chip
                        label="GRATIS"
                        size="small"
                        color="success"
                        sx={{ fontSize: { xs: '0.65rem', md: '0.7rem' }, height: { xs: 18, md: 20 }, fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                  >
                    {model.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mt: 2.5 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
