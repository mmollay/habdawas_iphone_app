import { Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Stack, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { ChevronDown, Mail, Phone, HelpCircle, Package, MessageSquare, Shield, User, Heart, CreditCard, Sparkles } from 'lucide-react';

const faqData = [
  {
    icon: User,
    question: 'Wie erstelle ich ein Konto?',
    answer: 'Klicken Sie auf das Profil-Symbol im Header und wählen Sie "Registrieren". Geben Sie Ihre E-Mail-Adresse ein und erstellen Sie ein sicheres Passwort. Nach der Registrierung können Sie sofort mit dem Verkaufen und Kaufen beginnen. Bei Ihrer ersten Anmeldung werden Sie durch einen kurzen Onboarding-Prozess geführt, um Ihre Standardadresse und Präferenzen festzulegen.'
  },
  {
    icon: Package,
    question: 'Wie stelle ich einen Artikel ein?',
    answer: 'Nach dem Login klicken Sie auf den "+" Button im Header. Laden Sie bis zu 10 Fotos hoch und geben Sie einen aussagekräftigen Titel, eine detaillierte Beschreibung und Ihren Preis an. Sie können auch Kategorien, Zustand, Versandoptionen und weitere Details festlegen. Nutzen Sie die KI-Unterstützung, um automatisch Beschreibungen und Versandkosten generieren zu lassen. Artikel können als Entwurf gespeichert und später veröffentlicht werden.'
  },
  {
    icon: MessageSquare,
    question: 'Wie kontaktiere ich einen Verkäufer?',
    answer: 'Öffnen Sie die Detailansicht eines Artikels und klicken Sie auf "Nachricht senden". Sie können dem Verkäufer direkt über unser integriertes Nachrichtensystem schreiben. Alle Nachrichten werden sicher verschlüsselt übertragen, und Ihre Kontaktdaten bleiben geschützt. Sie werden über neue Nachrichten benachrichtigt.'
  },
  {
    icon: Package,
    question: 'Wie funktioniert der Versand?',
    answer: 'Als Verkäufer legen Sie in den Einstellungen Ihre Standard-Versandoptionen fest: kostenloser Versand, feste Versandkosten oder KI-berechnete Kosten basierend auf Größe und Gewicht. Sie können auch Selbstabholung anbieten. Die Versandadresse können Sie für jeden Artikel individuell festlegen. Die genauen Versanddetails besprechen Sie mit dem Käufer über das Nachrichtensystem.'
  },
  {
    icon: Package,
    question: 'Wie kann ich meine Artikel bearbeiten oder löschen?',
    answer: 'Klicken Sie auf einen Ihrer Artikel in der Übersicht. Im Detailmenü finden Sie Optionen zum Bearbeiten, Löschen oder Duplizieren. Sie können Titel, Beschreibung, Preis, Bilder und alle anderen Details jederzeit anpassen. Artikel können als Entwurf gespeichert, pausiert oder als verkauft markiert werden. Gelöschte Artikel können nicht wiederhergestellt werden.'
  },
  {
    icon: CreditCard,
    question: 'Wie funktioniert das Token-System?',
    answer: 'HABDAWAS verwendet ein Token-basiertes System. Bei der Registrierung erhalten Sie 100 kostenlose Tokens. Das Einstellen von Artikeln kostet 5 Tokens, Premium-Features wie KI-Analyse kosten zusätzliche Tokens. Sie können jederzeit Tokens nachkaufen. Die Grundnutzung bleibt kostenlos - ohne KI-Features können Sie unbegrenzt Artikel einstellen.'
  },
  {
    icon: CreditCard,
    question: 'Wie bezahle ich einen Artikel?',
    answer: 'Die Zahlungsmodalitäten vereinbaren Sie direkt mit dem Verkäufer über das Nachrichtensystem. Gängige Optionen sind Banküberweisung, Barzahlung bei Abholung oder PayPal. HABDAWAS verarbeitet keine Zahlungen direkt. Wir empfehlen bei größeren Beträgen sichere Zahlungsmethoden zu verwenden und den Artikel vor der Zahlung zu prüfen.'
  },
  {
    icon: Shield,
    question: 'Was mache ich bei Problemen mit einem Verkäufer/Käufer?',
    answer: 'Versuchen Sie zunächst, das Problem direkt mit der anderen Partei über unser Nachrichtensystem zu klären. Falls keine Einigung möglich ist oder Sie betrügerisches Verhalten vermuten, kontaktieren Sie bitte unseren Support unter info@habdawas.at. Wir nehmen alle Meldungen ernst und prüfen jeden Fall. Bei schwerwiegenden Verstößen können Accounts gesperrt werden.'
  },
  {
    icon: User,
    question: 'Wie kann ich mein Profil vervollständigen?',
    answer: 'Klicken Sie auf das Profil-Symbol und wählen Sie "Einstellungen". Hier können Sie Ihre Kontaktdaten, Adressen, Versandpräferenzen und Anzeigeoptionen verwalten. Ein vollständiges Profil mit verifizierter Telefonnummer schafft Vertrauen bei anderen Nutzern und erhöht Ihre Verkaufschancen. Sie können auch KI-Funktionen aktivieren und Ihre Linkshänder-Präferenz für optimierte Navigation einstellen.'
  },
  {
    icon: Heart,
    question: 'Wie funktioniert die Favoritenliste?',
    answer: 'Wenn Sie einen interessanten Artikel finden, klicken Sie auf das Herz-Symbol, um ihn zu Ihrer Favoritenliste hinzuzufügen. Ihre Favoriten werden automatisch synchronisiert und sind von allen Ihren Geräten aus zugänglich. Sie finden Ihre Favoriten in den Einstellungen unter "Favoriten".'
  }
];

export const HelpPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{
        mb: { xs: 3, sm: 5 },
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        borderRadius: 4,
        py: { xs: 4, sm: 6 },
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
          p: 2,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.15)',
          mb: 2,
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 1
        }}>
          <HelpCircle size={isMobile ? 36 : 48} color="#ffffff" />
        </Box>
        <Typography variant={isMobile ? 'h4' : 'h3'} component="h1" gutterBottom sx={{ fontWeight: 700, color: 'white', position: 'relative', zIndex: 1 }}>
          Hilfe & Support
        </Typography>
        <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6, opacity: 0.95, position: 'relative', zIndex: 1 }}>
          Wir helfen Ihnen gerne weiter. Hier finden Sie Antworten auf die häufigsten Fragen.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ mb: 3, bgcolor: 'transparent', border: 'none' }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, px: { xs: 1, sm: 0 } }}>
            <Box sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#e3f2fd'
            }}>
              <MessageSquare size={24} color="#1976d2" />
            </Box>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600 }}>
              Häufig gestellte Fragen
            </Typography>
          </Box>

        <Stack spacing={1.5}>
          {faqData.map((faq, index) => {
            const Icon = faq.icon;
            return (
              <Accordion
                key={index}
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px !important',
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': {
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.08)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown size={20} />}
                  sx={{
                    px: { xs: 2, sm: 3 },
                    py: 1.5,
                    '& .MuiAccordionSummary-content': { my: 1.5 }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flex: 1 }}>
                    <Box sx={{
                      display: 'inline-flex',
                      p: 0.75,
                      borderRadius: 1.5,
                      bgcolor: '#e3f2fd',
                      flexShrink: 0
                    }}>
                      <Icon size={isMobile ? 16 : 18} color="#1976d2" />
                    </Box>
                    <Typography variant={isMobile ? 'body2' : 'subtitle1'} sx={{ fontWeight: 600, flex: 1 }}>
                      {faq.question}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3, pt: 0 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          px: { xs: 2, sm: 3 },
          py: 2.5,
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              display: 'inline-flex',
              p: 1,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.15)'
            }}>
              <Mail size={24} color="#ffffff" />
            </Box>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600 }}>
              Kontakt & Support
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 3 }}>
            Haben Sie weitere Fragen oder benötigen Sie persönliche Unterstützung? Unser Support-Team hilft Ihnen gerne weiter.
          </Typography>

          <Stack spacing={2}>
            <Card elevation={0} sx={{
              bgcolor: '#f5f9ff',
              border: '1px solid #e3f2fd',
              borderRadius: 3,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#1976d2',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)'
              }
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{
                    display: 'inline-flex',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#e3f2fd',
                    flexShrink: 0
                  }}>
                    <Mail size={24} color="#1976d2" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      E-Mail Support
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      <strong>info@habdawas.at</strong><br />
                      Antwortzeit: Innerhalb von 24 Stunden (Werktags)
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{
              bgcolor: '#f5f9ff',
              border: '1px solid #e3f2fd',
              borderRadius: 3,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#1976d2',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)'
              }
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{
                    display: 'inline-flex',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#e3f2fd',
                    flexShrink: 0
                  }}>
                    <Phone size={24} color="#1976d2" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Telefon Support
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      <strong>+43 650 25 26 266</strong><br />
                      Montag - Freitag: 9:00 - 17:00 Uhr
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Card elevation={0} sx={{
            mt: 3,
            bgcolor: '#fff3e0',
            borderRadius: 3,
            border: '1px solid #ffe0b2'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{
                  display: 'inline-flex',
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: '#ffe0b2',
                  flexShrink: 0
                }}>
                  <Sparkles size={20} color="#e65100" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#e65100' }}>
                    Schnelle Hilfe
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    Bei technischen Problemen oder Fragen zur Nutzung empfehlen wir Ihnen, zunächst unsere FAQ oben durchzulesen.
                    Die meisten Fragen werden dort bereits beantwortet. Für individuelle Anliegen steht Ihnen unser Support-Team
                    gerne zur Verfügung.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Container>
  );
};
