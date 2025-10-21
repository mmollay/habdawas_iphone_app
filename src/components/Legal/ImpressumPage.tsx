import { Box, Container, Typography, Paper, Divider, useTheme, useMediaQuery } from '@mui/material';
import { FileText } from 'lucide-react';
import { APP_NAME } from '../../version';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

export const ImpressumPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ flex: 1, py: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{
          mb: { xs: 3, sm: 4 },
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          borderRadius: 4,
          py: { xs: 3, sm: 4 },
          px: 2,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }
        }}>
          <Box sx={{
            display: 'inline-flex',
            p: 1.5,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.15)',
            mb: 1.5,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 1
          }}>
            <FileText size={isMobile ? 32 : 40} color="#ffffff" />
          </Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom sx={{ fontWeight: 700, color: 'white', position: 'relative', zIndex: 1 }}>
            Impressum & Haftungsausschluss
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, position: 'relative', zIndex: 1 }}>
            Angaben gemäß § 5 TMG (Telemediengesetz)
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 5 }, borderRadius: 3 }}>

          {/* Betreiber */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Betreiber der Plattform
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
              {APP_NAME}
            </Typography>
            <Typography variant="body1" paragraph>
              Betrieben von: SSI - Service Support Internet
            </Typography>
            <Typography variant="body1" paragraph>
              Hollenthon 33
            </Typography>
            <Typography variant="body1" paragraph>
              2812 Hollenthon
            </Typography>
            <Typography variant="body1" paragraph>
              Österreich
            </Typography>
          </Box>

          {/* Kontakt */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Kontakt
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Mail size={20} color="#1976d2" />
              <Typography variant="body1">
                E-Mail: <a href="mailto:info@habdawas.at" style={{ color: '#1976d2', textDecoration: 'none' }}>info@habdawas.at</a>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Phone size={20} color="#1976d2" />
              <Typography variant="body1">
                Telefon: +43 650 25 26 266
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Globe size={20} color="#1976d2" />
              <Typography variant="body1">
                Website: <a href="https://www.habdawas.at" style={{ color: '#1976d2', textDecoration: 'none' }}>www.habdawas.at</a>
              </Typography>
            </Box>
          </Box>

          {/* Verantwortlich */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Verantwortlich für den Inhalt
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" paragraph>
              Martin Mollay
            </Typography>
            <Typography variant="body1" paragraph>
              Hollenthon 33
            </Typography>
            <Typography variant="body1" paragraph>
              2812 Hollenthon
            </Typography>
            <Typography variant="body1" paragraph>
              Österreich
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Haftungsausschluss */}
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
            Haftungsausschluss (Disclaimer)
          </Typography>

          {/* Haftung für Inhalte */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            1. Haftung für Inhalte der Plattform
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </Typography>

          {/* Haftung für Nutzerinhalte */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            2. Haftung für Nutzerinhalte
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Die auf dieser Plattform von Nutzern eingestellten Inhalte (Artikelbeschreibungen, Bilder, Preise etc.) werden von den Nutzern selbst erstellt und verantwortet. Der Betreiber übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit, Zuverlässigkeit und Aktualität dieser Inhalte.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            <strong>Wichtiger Hinweis:</strong> Der Betreiber ist lediglich Vermittler und wird nicht Vertragspartei der zwischen den Nutzern geschlossenen Kaufverträge. Für die Erfüllung der Verträge, die Qualität der Waren, Gewährleistungsansprüche sowie für Zahlungsabwicklungen sind ausschließlich die jeweiligen Vertragsparteien (Verkäufer und Käufer) verantwortlich.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Der Betreiber haftet nicht für:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Die Erfüllung oder Nichterfüllung von Kaufverträgen zwischen Nutzern
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Mängel, Schäden oder Verluste an gekauften oder verkauften Artikeln
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Falsche oder irreführende Artikelbeschreibungen durch Nutzer
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Zahlungsausfälle, Betrug oder sonstige Pflichtverletzungen von Nutzern
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Verstöße von Nutzern gegen gesetzliche Bestimmungen oder Rechte Dritter
            </Typography>
          </Box>

          {/* Haftung für Links */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            3. Haftung für externe Links
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Unser Angebot kann Links zu externen Websites Dritter enthalten, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </Typography>

          {/* Urheberrecht */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            4. Urheberrecht
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Die durch den Betreiber der Plattform erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
          </Typography>

          {/* Gewährleistung und Verfügbarkeit */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            5. Gewährleistungsausschluss und Verfügbarkeit
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Der Betreiber übernimmt keine Gewähr für die ständige Verfügbarkeit der Plattform. Wartungsarbeiten, technische Störungen oder höhere Gewalt können zu vorübergehenden Unterbrechungen oder Einschränkungen führen.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Der Betreiber behält sich das Recht vor, die Plattform jederzeit zu ändern, zu ergänzen, zu unterbrechen oder einzustellen, ohne dass hieraus Ansprüche gegen den Betreiber entstehen.
          </Typography>

          {/* Datensicherheit */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            6. Datensicherheit
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Der Betreiber weist darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Der Nutzer ist selbst für die Sicherung seiner Zugangsdaten und die Geheimhaltung seines Passworts verantwortlich. Der Betreiber haftet nicht für unbefugten Zugriff auf das Nutzerkonto durch Dritte, wenn dieser durch mangelnde Sorgfalt des Nutzers ermöglicht wurde.
          </Typography>

          {/* Schlussbestimmung */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            7. Salvatorische Klausel
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Sollten einzelne Bestimmungen dieses Impressums bzw. Haftungsausschlusses unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ bgcolor: '#e3f2fd', p: 3, borderRadius: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              Wichtiger Hinweis für Nutzer
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              <strong>{APP_NAME}</strong> ist eine reine Vermittlungsplattform. Der Betreiber wird nicht Vertragspartei der Kaufverträge zwischen Nutzern und übernimmt keinerlei Verantwortung für die Abwicklung dieser Verträge.
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              Nutzer sind selbst dafür verantwortlich:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 0 }}>
              <Typography component="li" variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
                Wahrheitsgemäße und vollständige Angaben zu machen
              </Typography>
              <Typography component="li" variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
                Die Seriosität ihrer Vertragspartner zu prüfen
              </Typography>
              <Typography component="li" variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
                Kaufverträge ordnungsgemäß zu erfüllen
              </Typography>
              <Typography component="li" variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
                Bei Problemen direkt mit dem Vertragspartner Kontakt aufzunehmen
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Stand: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
