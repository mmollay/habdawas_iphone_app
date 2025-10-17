import { Container, Typography, Box, Paper, Chip } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewsPage = () => {
  const navigate = useNavigate();

  const newsItems = [
    {
      version: '1.3.1',
      date: '2025-10-08',
      items: [
        {
          category: 'Behoben',
          color: 'error' as const,
          changes: [
            'SPA-Routing für Netlify: 404-Fehler bei direkten URLs und Page-Reload behoben',
            'Tab-Filter nach Reload: "Meine Inserate" und "Favoriten" zeigen nach Reload korrekte Daten'
          ]
        },
        {
          category: 'Verbessert',
          color: 'primary' as const,
          changes: [
            'Desktop Upload-Buttons: Kamera-Button wird auf Desktop ausgeblendet (nur auf Mobile sichtbar)',
            'Desktop zeigt nur "Bilder auswählen" Button - klarere Benutzererfahrung'
          ]
        }
      ]
    },
    {
      version: '1.3.0',
      date: '2025-10-08',
      items: [
        {
          category: 'Hinzugefügt',
          color: 'success' as const,
          changes: [
            'Profilbild-Upload im Onboarding: Neuer optionaler Schritt für Profilbilder',
            'Webcam-Integration: Direkter Foto-Zugriff für Profilbilder',
            'Automatische Bildoptimierung: Canvas-basierte Größenanpassung'
          ]
        },
        {
          category: 'Verbessert',
          color: 'primary' as const,
          changes: [
            'Upload-Performance: Drastisch reduzierte Dateigrößen',
            'Einstellungen/Profilbild: Menu-Button mit zwei Optionen'
          ]
        }
      ]
    },
    {
      version: '1.2.1',
      date: '2025-10-07',
      items: [
        {
          category: 'Behoben',
          color: 'error' as const,
          changes: [
            'Doppeltes Laden: Items wurden beim Seitenaufruf zweimal geladen',
            'DOM-Nesting-Warnung: Ungültige HTML-Struktur in SearchAutocomplete'
          ]
        }
      ]
    },
    {
      version: '1.2.0',
      date: '2025-10-06',
      items: [
        {
          category: 'Hinzugefügt',
          color: 'success' as const,
          changes: [
            'News-Seite: Zentrale Übersicht über alle Neuigkeiten und Updates',
            'Mobile Kamera-Zugriff: Direkter Kamerazugriff beim Hochladen von Bildern'
          ]
        },
        {
          category: 'Verbessert',
          color: 'primary' as const,
          changes: [
            'Upload-Flow: Optimierte Benutzerführung beim Artikel erstellen',
            'Automatisches Öffnen der Bildauswahl nach Seitenladen',
            'Großes Upload-Feld ohne Paper-Container wenn keine Bilder vorhanden'
          ]
        }
      ]
    },
    {
      version: '1.1.1',
      date: '2025-10-06',
      items: [
        {
          category: 'Verbessert',
          color: 'primary' as const,
          changes: [
            'Speichern-Logik: Status-Management beim Speichern optimiert',
            'Auto-Save-Anzeige: Intelligentere Anzeige des Speicher-Status',
            'Artikel-Erstellung: Abbrechen-Button in der Fußzeile entfernt'
          ]
        }
      ]
    },
    {
      version: '1.1.0',
      date: '2025-10-04',
      items: [
        {
          category: 'Hinzugefügt',
          color: 'success' as const,
          changes: [
            'Bild-Optimierung: Drastische Performance-Verbesserung durch intelligente Bildverarbeitung',
            'Lazy Loading: Native Browser-Lazy-Loading für alle Bilder',
            'LazyImage Component: Wiederverwendbare Komponente mit Shimmer-Effekt'
          ]
        },
        {
          category: 'Verbessert',
          color: 'primary' as const,
          changes: [
            'Ladezeiten: Bis zu 95% kleinere Bilddateien'
          ]
        }
      ]
    },
    {
      version: '1.0.0',
      date: '2025-10-04',
      items: [
        {
          category: 'Hinzugefügt',
          color: 'success' as const,
          changes: [
            'Händigkeits-Präferenz: Benutzer können zwischen Links- und Rechtshänder-Modus wählen',
            'Professionelle Druckansicht: Vollständig überarbeitetes Print-Layout',
            'AGB-Seite: Umfassende rechtlich abgesicherte Allgemeine Geschäftsbedingungen',
            'Datenschutz-Seite: DSGVO-konforme Datenschutzerklärung',
            'Erweiterte Fußzeile: Vollständig neu gestalteter Footer'
          ]
        }
      ]
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          cursor: 'pointer'
        }}
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={24} />
        <Typography variant="h4" fontWeight={600}>
          Neuigkeiten
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {newsItems.map((news) => (
          <Paper
            key={news.version}
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={`Version ${news.version}`}
                color="primary"
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="body2" color="text.secondary">
                {news.date}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {news.items.map((item, idx) => (
                <Box key={idx}>
                  <Chip
                    label={item.category}
                    color={item.color}
                    size="small"
                    sx={{ mb: 1.5, fontWeight: 500 }}
                  />
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {item.changes.map((change, changeIdx) => (
                      <Typography
                        key={changeIdx}
                        component="li"
                        variant="body2"
                        sx={{
                          mb: 0.5,
                          lineHeight: 1.6,
                          color: 'text.primary'
                        }}
                      >
                        {change}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Weitere Updates findest du im{' '}
          <a
            href="https://github.com/yourusername/yourrepo/blob/main/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'none' }}
          >
            vollständigen Changelog
          </a>
        </Typography>
      </Box>
    </Container>
  );
};

export default NewsPage;
