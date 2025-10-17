import { Box, Container, Typography, Paper, Divider, useTheme, useMediaQuery } from '@mui/material';
import { FileText } from 'lucide-react';
import { APP_NAME } from '../../version';

export const AGBPage = () => {
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
            Allgemeine Geschäftsbedingungen
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, position: 'relative', zIndex: 1 }}>
            Stand: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 5 }, borderRadius: 3 }}>

          {/* § 1 Geltungsbereich */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 1 Geltungsbereich und Vertragsgegenstand
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            1.1 Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") regeln die Nutzung der Online-Plattform {APP_NAME} (nachfolgend "Plattform") durch registrierte und nicht registrierte Nutzer.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            1.2 {APP_NAME} ist eine Online-Plattform, die es Nutzern ermöglicht, Artikel zum Verkauf anzubieten und Kaufverträge mit anderen Nutzern abzuschließen. Der Betreiber fungiert ausschließlich als Vermittler und wird nicht selbst Vertragspartei der zwischen den Nutzern geschlossenen Kaufverträge.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            1.3 Mit der Registrierung bzw. Nutzung der Plattform erklärt sich der Nutzer mit diesen AGB einverstanden. Abweichende, entgegenstehende oder ergänzende AGB des Nutzers werden nicht Vertragsbestandteil, es sei denn, ihrer Geltung wird ausdrücklich schriftlich zugestimmt.
          </Typography>

          {/* § 2 Registrierung */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 2 Registrierung und Nutzerkonto
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            2.1 Für die vollständige Nutzung der Plattform, insbesondere zum Einstellen von Artikeln und zur Kontaktaufnahme mit anderen Nutzern, ist eine Registrierung erforderlich.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            2.2 Die Registrierung ist nur natürlichen Personen gestattet, die das 18. Lebensjahr vollendet und unbeschränkte Geschäftsfähigkeit haben. Minderjährige dürfen die Plattform nur mit Zustimmung ihrer gesetzlichen Vertreter nutzen.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            2.3 Der Nutzer verpflichtet sich, bei der Registrierung wahrheitsgemäße und vollständige Angaben zu machen. Die Registrierungsdaten sind vertraulich zu behandeln und vor dem Zugriff Dritter zu schützen.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            2.4 Pro Person ist nur ein Nutzerkonto zulässig. Die Übertragung des Nutzerkontos an Dritte ist untersagt.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            2.5 Der Betreiber behält sich vor, Registrierungen ohne Angabe von Gründen abzulehnen oder bereits bestehende Nutzerkonten zu sperren oder zu löschen, insbesondere bei Verstößen gegen diese AGB.
          </Typography>

          {/* § 3 Pflichten des Verkäufers */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 3 Pflichten des Verkäufers
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            3.1 Der Verkäufer ist verpflichtet, seine Artikel wahrheitsgemäß, vollständig und nicht irreführend zu beschreiben. Alle wesentlichen Eigenschaften und Mängel des Artikels sind anzugeben.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            3.2 Der Verkäufer garantiert, dass er zur Veräußerung der angebotenen Artikel berechtigt ist und diese frei von Rechten Dritter sind.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            3.3 Es ist untersagt, folgende Artikel anzubieten:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Artikel, deren Verkauf gesetzlich verboten ist oder die gegen die guten Sitten verstoßen
            </Typography>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Gefälschte, gestohlene oder rechtswidrig erworbene Artikel
            </Typography>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Artikel, die Rechte Dritter (z.B. Urheberrechte, Markenrechte) verletzen
            </Typography>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Waffen, Drogen, Medikamente oder andere gefährliche Gegenstände
            </Typography>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Jugendgefährdende oder indizierte Medien
            </Typography>
          </Box>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            3.4 Der Verkäufer verpflichtet sich, eingegangene Kaufverträge ordnungsgemäß zu erfüllen und die vereinbarten Artikel unverzüglich nach Zahlungseingang zu versenden oder zur Abholung bereitzustellen.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            3.5 Für die ordnungsgemäße Verpackung und den sicheren Versand der Artikel ist ausschließlich der Verkäufer verantwortlich.
          </Typography>

          {/* § 4 Pflichten des Käufers */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 4 Pflichten des Käufers
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            4.1 Der Käufer verpflichtet sich, den vereinbarten Kaufpreis nebst eventuellen Versandkosten unverzüglich nach Vertragsschluss zu zahlen.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            4.2 Der Käufer hat die Angaben des Verkäufers vor dem Kauf sorgfältig zu prüfen und sich bei Unklarheiten vor Vertragsschluss mit dem Verkäufer in Verbindung zu setzen.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            4.3 Bei Abholung der Ware ist der Käufer verpflichtet, den vereinbarten Termin einzuhalten oder rechtzeitig abzusagen.
          </Typography>

          {/* § 5 Vertragsschluss */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 5 Vertragsschluss zwischen Nutzern
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            5.1 Das Einstellen eines Artikels auf der Plattform stellt ein rechtlich bindendes Angebot des Verkäufers zum Abschluss eines Kaufvertrages dar.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            5.2 Der Kaufvertrag kommt direkt zwischen Verkäufer und Käufer zustande, wenn sich beide Parteien über die wesentlichen Vertragsbestandteile (Artikel, Preis, Versand/Abholung) geeinigt haben.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            5.3 Der Betreiber der Plattform wird nicht Vertragspartei dieser Kaufverträge. Die Nutzer sind selbst dafür verantwortlich, die Kaufverträge ordnungsgemäß abzuwickeln.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            5.4 Zahlungen und Warenübergabe erfolgen ausschließlich zwischen den Vertragsparteien. Der Betreiber wickelt keine Zahlungen ab und übernimmt keine Treuhandfunktion.
          </Typography>

          {/* § 6 Haftungsausschluss */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 6 Haftungsbeschränkung
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            6.1 Der Betreiber haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, die auf einer vorsätzlichen oder fahrlässigen Pflichtverletzung beruhen, sowie für Schäden, die von der Haftung nach dem Produkthaftungsgesetz umfasst werden.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            6.2 Bei leichter Fahrlässigkeit haftet der Betreiber nur bei Verletzung einer wesentlichen Vertragspflicht (Kardinalpflicht), deren Erfüllung die ordnungsgemäße Durchführung des Vertrages überhaupt erst ermöglicht und auf deren Einhaltung der Nutzer regelmäßig vertrauen darf. In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            6.3 Der Betreiber übernimmt keine Haftung für die Richtigkeit, Vollständigkeit, Zuverlässigkeit, Aktualität und Brauchbarkeit der von Nutzern eingestellten Inhalte. Die Verantwortung für die Inhalte liegt ausschließlich beim jeweiligen Nutzer.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            6.4 Der Betreiber haftet nicht für Schäden, die aus der Nutzung oder Nichtverfügbarkeit der Plattform entstehen, insbesondere nicht für:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Nicht erfüllte, verspätet erfüllte oder mangelhaft erfüllte Kaufverträge zwischen Nutzern
            </Typography>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Zahlungsausfälle oder Betrugshandlungen von Nutzern
            </Typography>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Mängel, Schäden oder Verluste an gekauften Artikeln
            </Typography>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Technische Störungen, Unterbrechungen oder Datenverluste
            </Typography>
            <Typography component="li" variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
              Unbefugten Zugriff Dritter auf Nutzerkonten
            </Typography>
          </Box>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            6.5 Die vorstehenden Haftungsausschlüsse und -beschränkungen gelten nicht, soweit der Betreiber den Schaden vorsätzlich oder grob fahrlässig verursacht hat.
          </Typography>

          {/* § 7 Gewährleistung */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 7 Gewährleistungsausschluss
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            7.1 Da Kaufverträge ausschließlich zwischen den Nutzern zustande kommen, ist für Gewährleistungsansprüche allein der jeweilige Verkäufer verantwortlich. Der Betreiber übernimmt keine Gewährleistung für die von Nutzern angebotenen Artikel.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            7.2 Bei Privatverkäufen zwischen Privatpersonen kann die Gewährleistung gesetzlich ausgeschlossen werden, sofern dies ausdrücklich vereinbart wird. Dennoch haftet der Verkäufer für arglistig verschwiegene Mängel.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            7.3 Handelt der Verkäufer als Unternehmer, gelten die gesetzlichen Gewährleistungsrechte.
          </Typography>

          {/* § 8 Token-System */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 8 Token-System und Gebühren
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            8.1 Die Plattform verwendet ein Token-basiertes System. Tokens sind digitale Währungseinheiten, die für bestimmte Funktionen auf der Plattform erforderlich sind.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            8.2 Bei der Registrierung erhält jeder neue Nutzer ein Startguthaben von 100 kostenlosen Tokens. Das Einstellen eines Artikels kostet 5 Tokens. Premium-Features wie KI-gestützte Bildanalyse und automatische Beschreibungsgenerierung kosten zusätzliche Tokens.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            8.3 Tokens können jederzeit über das integrierte Zahlungssystem nachgekauft werden. Die aktuellen Preise werden vor dem Kauf transparent angezeigt.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            8.4 Tokens sind nicht übertragbar, nicht rückerstattungsfähig und verfallen nicht. Eine Auszahlung von Token-Guthaben in Geld ist nicht möglich.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            8.5 Der Betreiber behält sich das Recht vor, die Token-Preise und die Kosten für einzelne Funktionen jederzeit anzupassen. Bereits erworbene Tokens behalten ihren Wert. Änderungen werden den Nutzern rechtzeitig mitgeteilt.
          </Typography>

          {/* § 9 Datenschutz */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 9 Datenschutz und Datenverarbeitung
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            9.1 Der Betreiber erhebt, verarbeitet und nutzt personenbezogene Daten der Nutzer nur im Rahmen der gesetzlichen Bestimmungen, insbesondere der Datenschutz-Grundverordnung (DSGVO).
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            9.2 Nähere Informationen zur Datenverarbeitung sind in der separaten Datenschutzerklärung aufgeführt.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            9.3 Der Nutzer ist verpflichtet, personenbezogene Daten anderer Nutzer, die er im Rahmen der Nutzung der Plattform erhält, vertraulich zu behandeln und ausschließlich für die Abwicklung des jeweiligen Geschäfts zu verwenden.
          </Typography>

          {/* § 10 Urheberrecht */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 10 Urheberrechte und Nutzungsrechte
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            10.1 Alle Inhalte der Plattform (Texte, Bilder, Grafiken, Design, Software) sind urheberrechtlich geschützt. Die Nutzung ist nur im Rahmen des bestimmungsgemäßen Gebrauchs der Plattform gestattet.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            10.2 Durch das Hochladen von Bildern und Texten räumt der Nutzer dem Betreiber ein einfaches, zeitlich und räumlich unbeschränktes Nutzungsrecht ein, diese Inhalte auf der Plattform zu veröffentlichen und zu vervielfältigen.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            10.3 Der Nutzer garantiert, dass er über alle erforderlichen Rechte an den hochgeladenen Inhalten verfügt und keine Rechte Dritter verletzt werden.
          </Typography>

          {/* § 11 Laufzeit und Kündigung */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 11 Laufzeit und Beendigung der Mitgliedschaft
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            11.1 Die Nutzung der Plattform erfolgt auf unbestimmte Zeit.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            11.2 Sowohl der Nutzer als auch der Betreiber können die Mitgliedschaft jederzeit ohne Einhaltung einer Frist durch Löschung des Nutzerkontos beenden.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            11.3 Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt insbesondere bei schwerwiegenden oder wiederholten Verstößen gegen diese AGB vor.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            11.4 Im Falle der Beendigung werden aktive Artikel automatisch deaktiviert. Bereits geschlossene Kaufverträge bleiben hiervon unberührt und sind ordnungsgemäß zu erfüllen. Verbleibende Token-Guthaben verfallen nicht und können bis zur endgültigen Löschung des Kontos genutzt werden.
          </Typography>

          {/* § 12 Änderungen der AGB */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 12 Änderungen der AGB
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            12.1 Der Betreiber behält sich das Recht vor, diese AGB jederzeit zu ändern, soweit dies erforderlich ist und dem Nutzer unter Berücksichtigung der Interessen des Betreibers zumutbar ist.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            12.2 Änderungen werden dem Nutzer mindestens 4 Wochen vor ihrem Inkrafttreten per E-Mail mitgeteilt. Widerspricht der Nutzer den Änderungen nicht innerhalb von 4 Wochen nach Zugang der Mitteilung, gelten die geänderten AGB als angenommen. Der Betreiber wird den Nutzer in der Mitteilung auf sein Widerspruchsrecht und die Bedeutung der Widerrufsfrist hinweisen.
          </Typography>

          {/* § 13 Schlussbestimmungen */}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 2, mt: { xs: 2, sm: 4 }, color: 'primary.main' }}>
            § 13 Schlussbestimmungen
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            13.1 Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            13.2 Ist der Nutzer Verbraucher, so gilt diese Rechtswahl nur insoweit, als dadurch keine zwingenden gesetzlichen Bestimmungen des Staates, in dem der Nutzer seinen gewöhnlichen Aufenthalt hat, eingeschränkt werden.
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ lineHeight: 1.8 }}>
            13.3 Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt. An die Stelle der unwirksamen oder undurchführbaren Bestimmung tritt eine wirksame und durchführbare Regelung, die dem wirtschaftlichen Zweck der unwirksamen bzw. undurchführbaren Bestimmung am nächsten kommt.
          </Typography>

          <Divider sx={{ my: { xs: 3, sm: 4 } }} />

          <Box sx={{
            bgcolor: '#e3f2fd',
            border: '1px solid #bbdefb',
            p: { xs: 2, sm: 3 },
            borderRadius: 3
          }}>
            <Typography variant={isMobile ? 'body2' : 'subtitle2'} sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>
              Hinweis zur Online-Streitbeilegung:
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 1.5 }}>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit. Die Plattform finden Sie unter: https://ec.europa.eu/consumers/odr/
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 0 }}>
              Wir sind nicht bereit und nicht verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
