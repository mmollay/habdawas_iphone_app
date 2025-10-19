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
}

interface ModelPricing {
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  estimatedCostFor5kTokens: number; // Assuming 4000 input + 1000 output tokens
}

const GEMINI_MODELS = [
  {
    value: 'gemini-2.0-flash-exp',
    label: 'Gemini 2.0 Flash (Preview) - Gratis & Schnell',
    description: 'Kostenlos während Preview, Native Tool Use, 1M Token Context',
    pricing: {
      inputCostPerMillion: 0.00, // Free during preview
      outputCostPerMillion: 0.00,
      estimatedCostFor5kTokens: 0.00,
    } as ModelPricing,
  },
  {
    value: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite - Am Günstigsten',
    description: 'Günstigste Option, optimiert für High-Volume & Low-Latency',
    pricing: {
      inputCostPerMillion: 0.02,
      outputCostPerMillion: 0.08,
      estimatedCostFor5kTokens: (4000 * 0.02 / 1000000) + (1000 * 0.08 / 1000000),
    } as ModelPricing,
  },
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash - Beste Balance',
    description: 'Optimales Preis-Leistungs-Verhältnis, "Thinking" Mode, 1M Context',
    pricing: {
      inputCostPerMillion: 0.15,
      outputCostPerMillion: 0.60,
      estimatedCostFor5kTokens: (4000 * 0.15 / 1000000) + (1000 * 0.60 / 1000000),
    } as ModelPricing,
  },
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro - Höchste Qualität',
    description: 'Premium Qualität, optimiert für Coding & komplexe Reasoning-Tasks',
    pricing: {
      inputCostPerMillion: 1.25,
      outputCostPerMillion: 10.00,
      estimatedCostFor5kTokens: (4000 * 1.25 / 1000000) + (1000 * 10.00 / 1000000),
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
        .eq('setting_key', 'ai_model')
        .single();

      if (error) throw error;

      setSettings({
        ai_model: data?.setting_value || 'gemini-2.0-flash-exp',
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

      const { error } = await supabase
        .from('credit_system_settings')
        .update({
          setting_value: settings.ai_model,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'ai_model');

      if (error) throw error;

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

  const selectedModel = GEMINI_MODELS.find(m => m.value === settings?.ai_model);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            KI-Einstellungen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Konfiguriere KI-Funktionen und API-Einstellungen
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

        <Divider sx={{ mb: 3 }} />

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

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="ai-model-label">Gemini-Modell</InputLabel>
          <Select
            labelId="ai-model-label"
            id="ai-model"
            value={settings?.ai_model || ''}
            label="Gemini-Modell"
            onChange={(e) => setSettings({ ...settings!, ai_model: e.target.value })}
          >
            {GEMINI_MODELS.map((model) => (
              <MenuItem key={model.value} value={model.value}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1">{model.label}</Typography>
                    {model.pricing.estimatedCostFor5kTokens > 0 ? (
                      <Chip
                        icon={<DollarSign size={12} />}
                        label={`${model.pricing.estimatedCostFor5kTokens.toFixed(4)}€`}
                        size="small"
                        color="primary"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    ) : (
                      <Chip
                        label="GRATIS"
                        size="small"
                        color="success"
                        sx={{ fontSize: '0.7rem', height: 20, fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {model.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedModel && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Aktuell ausgewählt: {selectedModel.label}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {selectedModel.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Chip
                icon={<TrendingUp size={14} />}
                label={selectedModel.pricing.estimatedCostFor5kTokens > 0
                  ? `~${selectedModel.pricing.estimatedCostFor5kTokens.toFixed(4)}€ / großes Inserat`
                  : 'Kostenlos während Preview'}
                size="small"
                color={selectedModel.pricing.estimatedCostFor5kTokens > 0 ? 'primary' : 'success'}
                sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}
              />
            </Box>
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
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

      {/* Pricing Comparison Table */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, mb: 2 }}>
          <DollarSign size={isMobile ? 18 : 22} />
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600 }}>
            Preisvergleich (~5000 Tokens)
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
          Geschätzte Kosten für ein großes Inserat mit Bildanalyse (ca. 4000 Input + 1000 Output Tokens)
        </Typography>

        <TableContainer sx={{
          overflowX: 'auto',
          '& .MuiTable-root': {
            minWidth: isMobile ? 280 : 650,
          }
        }}>
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Modell</TableCell>
                {!isMobile && (
                  <>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Input €/1M</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Output €/1M</TableCell>
                  </>
                )}
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  Kosten/Inserat
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  Preis-Leistung
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {GEMINI_MODELS.map((model) => (
                <TableRow
                  key={model.value}
                  sx={{
                    bgcolor: model.value === settings?.ai_model ? 'primary.50' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <TableCell sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: model.value === settings?.ai_model ? 600 : 400, fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
                        {model.label.split(' - ')[0]}
                      </Typography>
                      {!isMobile && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {model.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  {!isMobile && (
                    <>
                      <TableCell align="right" sx={{ fontSize: '0.875rem' }}>
                        {model.pricing.inputCostPerMillion > 0
                          ? `${model.pricing.inputCostPerMillion.toFixed(4)}€`
                          : 'Gratis'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.875rem' }}>
                        {model.pricing.outputCostPerMillion > 0
                          ? `${model.pricing.outputCostPerMillion.toFixed(4)}€`
                          : 'Gratis'}
                      </TableCell>
                    </>
                  )}
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, fontWeight: 600 }}>
                    {model.pricing.estimatedCostFor5kTokens > 0
                      ? `${model.pricing.estimatedCostFor5kTokens.toFixed(4)}€`
                      : 'Gratis'}
                  </TableCell>
                  <TableCell align="center">
                    {model.pricing.estimatedCostFor5kTokens === 0 ? (
                      <Chip label="⭐ Gratis" color="success" size="small" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }} />
                    ) : model.value === 'gemini-2.5-flash-lite' ? (
                      <Chip label="💰 Günstigste" color="primary" size="small" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }} />
                    ) : model.value === 'gemini-2.5-flash' ? (
                      <Chip label="⚡ Balance" color="info" size="small" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }} />
                    ) : (
                      <Chip label="🎯 Premium" color="warning" size="small" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Alert severity="warning" sx={{ mt: 2, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            Hinweis: Dies sind Schätzungen basierend auf Google's Preismodell. Tatsächliche Kosten können je nach
            Bildgröße und Analysekomplexität variieren.
          </Typography>
        </Alert>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3 }}>
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600, mb: 2 }}>
          Modell-Informationen
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
              Verwendung
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
              Das ausgewählte Modell wird für die KI-gestützte Bildanalyse beim Erstellen von Inseraten verwendet.
              Nutzer sehen die Ergebnisse des hier ausgewählten Modells.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
              Test-Empfehlung
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
              Um die verschiedenen Modelle zu testen, wählen Sie ein Modell aus, speichern Sie die Einstellung
              und erstellen Sie anschließend ein Test-Inserat mit Bildanalyse. Vergleichen Sie Qualität,
              Geschwindigkeit und Kosten der verschiedenen Modelle.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
