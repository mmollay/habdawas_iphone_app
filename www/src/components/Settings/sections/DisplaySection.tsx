import {
  Box,
  Button,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  TextField,
  Switch,
  Divider,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Globe, MapPin, Clock, Hand, UserCheck, AlertTriangle } from 'lucide-react';

interface DisplaySectionProps {
  formData: {
    language: string;
    show_location_to_public: boolean;
    default_listing_duration: number;
    hand_preference: 'left' | 'right';
    show_seller_profile: boolean;
  };
  onFormChange: (field: string, value: any) => void;
}

export const DisplaySection = ({ formData, onFormChange }: DisplaySectionProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const ContentWrapper = isMobile ? Box : Paper;
  const wrapperProps = isMobile ? {} : { sx: { p: 3 } };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
        Anzeige-Einstellungen
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, display: { xs: 'none', md: 'block' } }}>
        Passe die Darstellung der Anwendung an deine Bedürfnisse an
      </Typography>

      <ContentWrapper {...wrapperProps}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Globe size={20} color="#1976d2" />
              <Typography variant="h6" fontWeight={600}>
                Sprache
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Wähle die Sprache der Benutzeroberfläche
            </Typography>

            <TextField
              fullWidth
              select
              value={formData.language}
              onChange={(e) => onFormChange('language', e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </TextField>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <MapPin size={20} color="#1976d2" />
              <Typography variant="h6" fontWeight={600}>
                Standort-Sichtbarkeit
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Steuere, wer deinen Standort (Ort & Land) bei deinen Artikeln sehen kann
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'grey.50'
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.show_location_to_public}
                    onChange={(e) => onFormChange('show_location_to_public', e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Standort für Besucher sichtbar
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.show_location_to_public
                        ? 'Ort und Land sind für alle sichtbar (auch nicht angemeldete Besucher)'
                        : 'Ort und Land sind nur für angemeldete Nutzer sichtbar'}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </Paper>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontStyle: 'italic' }}>
              ℹ️ Vollständige Adressen sind nur für angemeldete Nutzer sichtbar, wenn du dies in den Abholoptionen aktiviert hast.
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Hand size={20} color="#1976d2" />
              <Typography variant="h6" fontWeight={600}>
                Händigkeit
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Optimiere die Button-Position für deine bevorzugte Hand bei der Ein-Hand-Bedienung
            </Typography>

            <RadioGroup
              value={formData.hand_preference}
              onChange={(e) => onFormChange('hand_preference', e.target.value)}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: formData.hand_preference === 'right' ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => onFormChange('hand_preference', 'right')}
                >
                  <FormControlLabel
                    value="right"
                    control={<Radio checked={formData.hand_preference === 'right'} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            Rechtshänder
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Navigation links, Aktionen rechts
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: formData.hand_preference === 'left' ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => onFormChange('hand_preference', 'left')}
                >
                  <FormControlLabel
                    value="left"
                    control={<Radio checked={formData.hand_preference === 'left'} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            Linkshänder
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Navigation rechts, Aktionen links
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              </Box>
            </RadioGroup>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <UserCheck size={20} color="#1976d2" />
              <Typography variant="h6" fontWeight={600}>
                Verkäuferprofil-Sichtbarkeit
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Zeige dein Profil in deinen Inseraten an, um Vertrauen aufzubauen
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'grey.50'
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.show_seller_profile}
                    onChange={(e) => onFormChange('show_seller_profile', e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Verkäuferprofil in Inseraten anzeigen
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.show_seller_profile
                        ? 'Dein Name, Avatar und andere Inserate werden in deinen Artikeln angezeigt'
                        : 'Nur "Privater Verkäufer" wird angezeigt, keine persönlichen Infos'}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </Paper>

            {!formData.show_seller_profile && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mt: 2,
                  border: 1,
                  borderColor: 'warning.main',
                  borderRadius: 1,
                  bgcolor: 'warning.50'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} color="#ed6c02" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="warning.dark" sx={{ mb: 0.5 }}>
                      Hinweis zur Sichtbarkeit
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Inserate mit sichtbarem Verkäuferprofil wirken seriöser und erhalten durchschnittlich 40% mehr Anfragen. Dein Name und Avatar helfen Interessenten, Vertrauen aufzubauen.
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontStyle: 'italic' }}>
              ℹ️ Du kannst dein Profilbild und deinen Namen jederzeit in den persönlichen Daten ändern.
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Clock size={20} color="#1976d2" />
              <Typography variant="h6" fontWeight={600}>
                Standard-Schaltdauer
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Lege fest, wie lange deine Inserate standardmäßig online bleiben. Diese Dauer wird bei jedem neuen Inserat verwendet.
            </Typography>

            <TextField
              fullWidth
              type="number"
              value={formData.default_listing_duration}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 10 && value <= 30) {
                  onFormChange('default_listing_duration', value);
                }
              }}
              inputProps={{
                min: 10,
                max: 30,
                step: 1
              }}
              helperText="Zwischen 10 und 30 Tagen"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="body2" color="text.secondary">
                      Tage
                    </Typography>
                  </InputAdornment>
                )
              }}
            />

            <Paper
              elevation={0}
              sx={{
                p: 2,
                mt: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'grey.50'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                📅 Deine Inserate werden nach Ablauf dieser Dauer automatisch als "abgelaufen" markiert und sind nicht mehr öffentlich sichtbar. Du kannst sie jederzeit wieder aktivieren.
              </Typography>
            </Paper>
          </Box>
        </Box>

      </ContentWrapper>
    </Box>
  );
};
