import { Paper, Typography, Box, Switch, FormControlLabel, useMediaQuery, useTheme } from '@mui/material';

interface NotificationsSectionProps {
  formData: {
    notifications_enabled: boolean;
    email_notifications: boolean;
    newsletter_subscribed: boolean;
  };
  onFormChange: (field: string, value: boolean) => void;
}

export const NotificationsSection = ({ formData, onFormChange }: NotificationsSectionProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const ContentWrapper = isMobile ? Box : Paper;
  const wrapperProps = isMobile ? {} : { sx: { p: 3 } };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
        Benachrichtigungen
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, display: { xs: 'none', md: 'block' } }}>
        Wähle aus, wie du über Neuigkeiten informiert werden möchtest
      </Typography>

      <ContentWrapper {...wrapperProps}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.notifications_enabled}
                onChange={(e) => onFormChange('notifications_enabled', e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Push-Benachrichtigungen
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Erhalte Benachrichtigungen über neue Nachrichten und Aktivitäten
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', m: 0 }}
          />

          <Box sx={{ height: 1, bgcolor: 'divider', my: 0.5 }} />

          <FormControlLabel
            control={
              <Switch
                checked={formData.email_notifications}
                onChange={(e) => onFormChange('email_notifications', e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  E-Mail-Benachrichtigungen
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Erhalte wichtige Updates und Neuigkeiten per E-Mail
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', m: 0 }}
          />

          <Box sx={{ height: 1, bgcolor: 'divider', my: 0.5 }} />

          <FormControlLabel
            control={
              <Switch
                checked={formData.newsletter_subscribed}
                onChange={(e) => onFormChange('newsletter_subscribed', e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Newsletter abonnieren
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Erhalte regelmäßig Angebote, Tipps und Neuigkeiten per E-Mail
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
