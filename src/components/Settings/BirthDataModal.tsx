import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  MenuItem,
  Grid,
  Chip,
} from '@mui/material';
import { Calendar, Clock, Globe, MapPin, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { calculateZodiacSign } from '../../utils/zodiac';

interface BirthDataModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentData: {
    birth_date: string;
    birth_time: string;
    birth_place: string;
    birth_timezone: string;
  };
  onSave: () => void;
}

// Liste der gängigsten Zeitzonen
const TIMEZONES = [
  { value: 'Europe/Vienna', label: 'Europa/Wien (GMT+1)' },
  { value: 'Europe/Berlin', label: 'Europa/Berlin (GMT+1)' },
  { value: 'Europe/Zurich', label: 'Europa/Zürich (GMT+1)' },
  { value: 'Europe/London', label: 'Europa/London (GMT+0)' },
  { value: 'Europe/Paris', label: 'Europa/Paris (GMT+1)' },
  { value: 'Europe/Rome', label: 'Europa/Rom (GMT+1)' },
  { value: 'Europe/Madrid', label: 'Europa/Madrid (GMT+1)' },
  { value: 'America/New_York', label: 'Amerika/New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Amerika/Los Angeles (GMT-8)' },
  { value: 'America/Chicago', label: 'Amerika/Chicago (GMT-6)' },
  { value: 'Asia/Tokyo', label: 'Asien/Tokyo (GMT+9)' },
  { value: 'Asia/Dubai', label: 'Asien/Dubai (GMT+4)' },
  { value: 'Australia/Sydney', label: 'Australien/Sydney (GMT+10)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
];

export const BirthDataModal = ({ open, onClose, userId, currentData, onSave }: BirthDataModalProps) => {
  const [formData, setFormData] = useState({
    birth_date: currentData.birth_date || '',
    birth_time: currentData.birth_time || '',
    birth_place: currentData.birth_place || '',
    birth_timezone: currentData.birth_timezone || 'Europe/Vienna',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate zodiac sign whenever birth date changes
  const zodiacSign = calculateZodiacSign(formData.birth_date);

  useEffect(() => {
    if (open) {
      setFormData({
        birth_date: currentData.birth_date || '',
        birth_time: currentData.birth_time || '',
        birth_place: currentData.birth_place || '',
        birth_timezone: currentData.birth_timezone || 'Europe/Vienna',
      });
      setError(null);
      setSuccess(false);
    }
  }, [open, currentData]);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    // Validierung
    if (!formData.birth_date) {
      setError('Bitte gib ein Geburtsdatum ein');
      return;
    }

    if (!formData.birth_time) {
      setError('Bitte gib eine Geburtszeit ein');
      return;
    }

    if (!formData.birth_timezone) {
      setError('Bitte wähle eine Zeitzone aus');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          birth_date: formData.birth_date,
          birth_time: formData.birth_time,
          birth_place: formData.birth_place || null,
          birth_timezone: formData.birth_timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving birth data:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Möchtest du wirklich alle Geburtsdaten löschen?')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          birth_date: null,
          birth_time: null,
          birth_place: null,
          birth_timezone: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setFormData({
        birth_date: '',
        birth_time: '',
        birth_place: '',
        birth_timezone: 'Europe/Vienna',
      });

      setSuccess(true);
      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error clearing birth data:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calendar size={24} />
          <Typography variant="h6" component="span">
            Geburtsdaten
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Diese Daten werden verwendet um deine Inserate besser auf dein Profil abzustimmen.
            Sie sind nicht öffentlich sichtbar.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Geburtsdaten erfolgreich gespeichert!
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Geburtsdatum"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <Calendar size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                }}
                helperText="Für Sternzeichen-Berechnung"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Geburtszeit"
                type="time"
                value={formData.birth_time}
                onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <Clock size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                }}
                helperText="Für Aszendent-Berechnung"
                required
              />
            </Grid>

            {zodiacSign && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      fontSize: '3rem',
                      lineHeight: 1,
                    }}
                  >
                    {zodiacSign.symbol}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Sternzeichen: {zodiacSign.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {zodiacSign.description}
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                      <Chip
                        label={zodiacSign.element === 'fire' ? 'Feuer' : zodiacSign.element === 'earth' ? 'Erde' : zodiacSign.element === 'air' ? 'Luft' : 'Wasser'}
                        size="small"
                        sx={{
                          bgcolor: zodiacSign.color + '20',
                          color: zodiacSign.color,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Zeitzone"
                value={formData.birth_timezone}
                onChange={(e) => setFormData({ ...formData, birth_timezone: e.target.value })}
                InputProps={{
                  startAdornment: <Globe size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                }}
                helperText="Zeitzone zum Geburtszeitpunkt"
                required
              >
                {TIMEZONES.map((tz) => (
                  <MenuItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Geburtsort (optional)"
                value={formData.birth_place}
                onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                InputProps={{
                  startAdornment: <MapPin size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                }}
                placeholder="z.B. Wien, Österreich"
                helperText="Optional: Nur für Anzeigezwecke"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClear}
          disabled={saving || (!formData.birth_date && !formData.birth_time)}
          color="error"
          variant="outlined"
          size="small"
        >
          Löschen
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          disabled={saving}
          startIcon={<X size={18} />}
        >
          Abbrechen
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          startIcon={<Save size={18} />}
        >
          {saving ? 'Speichert...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
