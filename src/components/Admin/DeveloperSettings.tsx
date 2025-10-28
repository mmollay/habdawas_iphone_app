import { Box, Typography, Paper, Switch, FormControlLabel, Alert, Divider } from '@mui/material';
import { Code, Info } from 'lucide-react';
import { useDeveloperMode } from '../../contexts/DeveloperModeContext';

export const DeveloperSettings = () => {
  const { isDeveloperMode, toggleDeveloperMode } = useDeveloperMode();

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Code size={24} />
          Entwickler-Modus
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aktiviere Debug-Features und Entwickler-Tools für Testing und Entwicklung.
        </Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="info" icon={<Info size={20} />} sx={{ mb: 3 }}>
          Der Entwickler-Modus aktiviert zusätzliche Features, die nur für Entwicklung und Testing gedacht sind.
          Diese Einstellung wird lokal in deinem Browser gespeichert.
        </Alert>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isDeveloperMode}
                onChange={toggleDeveloperMode}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Entwickler-Modus {isDeveloperMode ? 'aktiv' : 'inaktiv'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isDeveloperMode
                    ? 'Debug-Features sind aktiviert'
                    : 'Produktionsmodus - Debug-Features deaktiviert'}
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Aktive Features im Entwickler-Modus:
          </Typography>
          <Box component="ul" sx={{ mt: 2, pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>AI-Analyse Vorschau:</strong> Zeigt detaillierte Vorschau der erkannten Attribute,
              Kategorien und KI-Analyse vor dem Speichern des Inserats
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Erweiterte Logs:</strong> Zusätzliche Console-Ausgaben für Debugging
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
              <em>Weitere Debug-Features werden in Zukunft hinzugefügt...</em>
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 2, mt: 2, bgcolor: isDeveloperMode ? 'success.light' : 'grey.100' }}>
        <Typography variant="body1" fontWeight={600} gutterBottom>
          Status: {isDeveloperMode ? '✅ Entwickler-Modus aktiv' : '🔒 Produktionsmodus'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isDeveloperMode
            ? 'Du siehst jetzt zusätzliche Debug-Informationen beim Erstellen von Inseraten.'
            : 'Standard-Modus für Endbenutzer. Inserate werden direkt ohne Vorschau gespeichert.'}
        </Typography>
      </Paper>
    </Box>
  );
};
