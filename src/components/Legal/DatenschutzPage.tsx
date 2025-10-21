import { Box, Container, Typography, Paper, Divider, useTheme, useMediaQuery } from '@mui/material';
import { APP_NAME } from '../../version';
import { Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';

export const DatenschutzPage = () => {
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
            <Shield size={isMobile ? 32 : 40} color="#ffffff" />
          </Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom sx={{ fontWeight: 700, color: 'white', position: 'relative', zIndex: 1 }}>
            Datenschutzerklärung
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, position: 'relative', zIndex: 1 }}>
            Gemäß Art. 13, 14 DSGVO (Datenschutz-Grundverordnung)
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 5 }, borderRadius: 3 }}>

          {/* Einleitung */}
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, fontStyle: 'italic', bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
            Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG 2003). In dieser Datenschutzerklärung informieren wir Sie über die wichtigsten Aspekte der Datenverarbeitung im Rahmen unserer Plattform.
          </Typography>

          {/* § 1 Verantwortlicher */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <UserCheck size={24} color="#1976d2" />
            1. Verantwortlicher für die Datenverarbeitung
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Verantwortlicher im Sinne der DSGVO:
          </Typography>
          <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {APP_NAME}
            </Typography>
            <Typography variant="body1">Betrieben von: SSI - Service Support Internet</Typography>
            <Typography variant="body1">Martin Mollay</Typography>
            <Typography variant="body1">Hollenthon 33</Typography>
            <Typography variant="body1">2812 Hollenthon</Typography>
            <Typography variant="body1">Österreich</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              E-Mail: <a href="mailto:datenschutz@habdawas.at" style={{ color: '#1976d2' }}>datenschutz@habdawas.at</a>
            </Typography>
            <Typography variant="body1">
              Telefon: +43 650 25 26 266
            </Typography>
          </Box>

          {/* § 2 Erhebung und Speicherung */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Database size={24} color="#1976d2" />
            2. Erhebung und Speicherung personenbezogener Daten
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
            2.1 Beim Besuch der Website
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Beim Aufrufen unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in einem sogenannten Logfile gespeichert. Folgende Informationen werden dabei erfasst:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              IP-Adresse des anfragenden Rechners (anonymisiert)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Datum und Uhrzeit des Zugriffs
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Name und URL der abgerufenen Datei
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Website, von der aus der Zugriff erfolgt (Referrer-URL)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners
            </Typography>
          </Box>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            <strong>Rechtsgrundlage:</strong> Die Verarbeitung erfolgt gemäß Art. 6 Abs. 1 lit. f DSGVO auf Basis unseres berechtigten Interesses an der Verbesserung der Stabilität und Funktionalität unserer Website.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
            2.2 Bei der Registrierung
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Für die vollständige Nutzung unserer Plattform ist eine Registrierung erforderlich. Bei der Registrierung erheben wir folgende Daten:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              E-Mail-Adresse (verpflichtend)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Passwort (verschlüsselt gespeichert)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Benutzername (optional)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Profilbild (optional)
            </Typography>
          </Box>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            <strong>Rechtsgrundlage:</strong> Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Erfüllung des Nutzungsvertrages.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
            2.3 Bei der Nutzung der Plattform
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Im Rahmen der Nutzung unserer Plattform verarbeiten wir folgende Daten:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Artikeldaten (Titel, Beschreibung, Bilder, Preis, Kategorie, Standort)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Nachrichten zwischen Nutzern (verschlüsselt gespeichert)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Versand- und Abholinformationen
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Favoritenlisten
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Einstellungen und Präferenzen
            </Typography>
          </Box>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            <strong>Rechtsgrundlage:</strong> Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Erfüllung des Nutzungsvertrages.
          </Typography>

          {/* § 3 Zweck der Datenverarbeitung */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Eye size={24} color="#1976d2" />
            3. Zweck der Datenverarbeitung
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Wir verarbeiten Ihre personenbezogenen Daten zu folgenden Zwecken:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Bereitstellung und Betrieb der Plattform
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Ermöglichung der Kommunikation zwischen Nutzern
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Veröffentlichung und Verwaltung von Artikeln
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Verhinderung von Missbrauch und Betrug
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Verbesserung unserer Dienstleistungen
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Erfüllung rechtlicher Verpflichtungen
            </Typography>
          </Box>

          {/* § 4 Weitergabe von Daten */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Mail size={24} color="#1976d2" />
            4. Weitergabe von Daten an Dritte
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den im Folgenden aufgeführten Zwecken findet nicht statt.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Wir geben Ihre persönlichen Daten nur an Dritte weiter, wenn:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Sie gemäß Art. 6 Abs. 1 S. 1 lit. a DSGVO Ihre ausdrückliche Einwilligung dazu erteilt haben
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              die Weitergabe nach Art. 6 Abs. 1 S. 1 lit. f DSGVO zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              für die Weitergabe nach Art. 6 Abs. 1 S. 1 lit. c DSGVO eine gesetzliche Verpflichtung besteht
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              dies gesetzlich zulässig und nach Art. 6 Abs. 1 S. 1 lit. b DSGVO für die Abwicklung von Vertragsverhältnissen mit Ihnen erforderlich ist
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
            4.1 Technische Dienstleister
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Wir nutzen externe Dienstleister für den Betrieb unserer Plattform:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Supabase:</strong> Datenbank und Authentifizierung (Server in der EU, DSGVO-konform)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Hosting-Provider:</strong> Server-Infrastruktur (Server in Deutschland/EU)
            </Typography>
          </Box>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Mit allen Dienstleistern wurden Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO geschlossen.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
            4.2 Sichtbarkeit für andere Nutzer
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            <strong>Wichtiger Hinweis:</strong> Bestimmte Daten werden entsprechend der Funktionalität der Plattform für andere Nutzer sichtbar gemacht:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Artikel-Angebote sind öffentlich sichtbar (inkl. Titel, Beschreibung, Bilder, Preis, Standort)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Ihr Benutzername ist für andere Nutzer bei Ihren Artikeln sichtbar
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Nachrichten sind nur für die jeweiligen Gesprächspartner sichtbar
            </Typography>
          </Box>

          {/* § 5 Cookies und Tracking */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock size={24} color="#1976d2" />
            5. Cookies und Tracking-Technologien
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Unsere Website verwendet nur technisch notwendige Cookies. Diese sind erforderlich, um die Funktionalität der Website zu gewährleisten und können nicht deaktiviert werden.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            <strong>Session-Cookies:</strong> Werden verwendet, um Sie während Ihrer Sitzung eingeloggt zu halten.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            <strong>Einstellungs-Cookies:</strong> Speichern Ihre Präferenzen (z.B. Händigkeits-Einstellung).
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Wir verwenden <strong>keine</strong> Marketing-, Analyse- oder Tracking-Cookies von Drittanbietern.
          </Typography>

          {/* § 6 Speicherdauer */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            6. Speicherdauer
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Wir speichern personenbezogene Daten nur so lange, wie dies für die Erfüllung der verfolgten Zwecke erforderlich ist oder Sie Ihr Nutzerkonto aktiv nutzen.
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Kontodaten:</strong> Bis zur Löschung des Nutzerkontos
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Artikel:</strong> Bis zur Löschung durch den Nutzer oder Ablauf der Schaltdauer
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Nachrichten:</strong> Bis zur Löschung durch den Nutzer oder Löschung des Kontos
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Logfiles:</strong> Werden nach 30 Tagen automatisch gelöscht
            </Typography>
          </Box>

          {/* § 7 Ihre Rechte */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            7. Ihre Rechte als Betroffener
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Sie haben gemäß DSGVO folgende Rechte bezüglich Ihrer personenbezogenen Daten:
          </Typography>

          <Box sx={{ bgcolor: '#e3f2fd', p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Art. 15 DSGVO - Recht auf Auskunft
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              Sie haben das Recht, Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten zu verlangen.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
              Art. 16 DSGVO - Recht auf Berichtigung
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              Sie haben das Recht, unverzüglich die Berichtigung unrichtiger oder die Vervollständigung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
              Art. 17 DSGVO - Recht auf Löschung
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              Sie haben das Recht, die Löschung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen, soweit nicht die weitere Verarbeitung erforderlich ist.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
              Art. 18 DSGVO - Recht auf Einschränkung der Verarbeitung
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
              Art. 20 DSGVO - Recht auf Datenübertragbarkeit
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              Sie haben das Recht, Ihre bereitgestellten Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
              Art. 21 DSGVO - Widerspruchsrecht
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten Widerspruch einzulegen.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
              Art. 77 DSGVO - Beschwerderecht
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
              Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.
            </Typography>
          </Box>

          {/* § 8 Datensicherheit */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            8. Datensicherheit
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder den Zugriff unberechtigter Personen zu schützen:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              SSL/TLS-Verschlüsselung für alle Datenübertragungen
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Verschlüsselte Speicherung von Passwörtern (Hashing)
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Regelmäßige Sicherheitsupdates und Backups
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Zugriffskontrollen und Berechtigungskonzepte
            </Typography>
            <Typography component="li" variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Zwei-Faktor-Authentifizierung (optional verfügbar)
            </Typography>
          </Box>

          {/* § 9 Änderungen */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            9. Änderungen der Datenschutzerklärung
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            Wir behalten uns vor, diese Datenschutzerklärung gelegentlich anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Kontakt bei Datenschutzfragen
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              Bei Fragen zur Erhebung, Verarbeitung oder Nutzung Ihrer personenbezogenen Daten, bei Auskünften, Berichtigung, Sperrung oder Löschung von Daten sowie Widerruf erteilter Einwilligungen wenden Sie sich bitte an:
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              <strong>E-Mail:</strong> <a href="mailto:datenschutz@habdawas.at" style={{ color: '#1976d2' }}>datenschutz@habdawas.at</a>
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.7 }}>
              <strong>Telefon:</strong> +43 650 25 26 266
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
              Wir werden Ihre Anfrage schnellstmöglich, spätestens jedoch innerhalb von 30 Tagen beantworten.
            </Typography>
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
