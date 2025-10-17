import { Box, Container, Typography, Paper, Grid, Button, Chip } from '@mui/material';
import {
  Zap,
  Shield,
  DollarSign,
  Sparkles,
  Heart,
  ArrowRight,
  Leaf,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AboutPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <DollarSign size={28} />,
      title: 'Fair & Transparent',
      description: '5 Gratis-Inserate jeden Monat. Credits für Power-User, Spenden für die Community.',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: <Sparkles size={28} />,
      title: 'KI-gestützt',
      description: 'Intelligente Bilderkennung erstellt automatisch Titel und Beschreibung.',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: <Zap size={28} />,
      title: 'Ultraschnell',
      description: 'Moderne Technologie für blitzschnelle Ladezeiten.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: <Shield size={28} />,
      title: 'DSGVO-konform',
      description: 'Deine Daten gehören dir. Kein Tracking, keine Datenweitergabe.',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      icon: <Heart size={28} />,
      title: 'Einfach & Intuitiv',
      description: 'In unter 2 Minuten ist dein Inserat online.',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      icon: <Leaf size={28} />,
      title: 'Nachhaltig & Grün',
      description: 'Second-Hand verlängert Produktlebenszyklen und schont unsere Umwelt. Gemeinsam für eine nachhaltige Zukunft.',
      gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)'
    }
  ];

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
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
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              label="🇦🇹 Made in Austria"
              sx={{
                mb: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                backdropFilter: 'blur(10px)',
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                mb: 3,
                fontSize: { xs: '2.5rem', md: '4rem' },
                letterSpacing: '-0.02em',
                textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
            >
              HABDAWAS
            </Typography>
            <Typography
              variant="h5"
              sx={{
                maxWidth: 700,
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', md: '1.4rem' },
                opacity: 0.95,
                mb: 4,
              }}
            >
              Die moderne Kleinanzeigen-Plattform.
              <br />
              5 Gratis-Inserate jeden Monat. Schnell und intelligent.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={20} />}
              onClick={() => navigate('/')}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                }
              }}
            >
              Jetzt starten
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '1.8rem', md: '2.5rem' }
            }}
          >
            Warum HABDAWAS?
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}
          >
            Moderne Technologie trifft auf faire Konditionen.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 2,
            maxWidth: 1000,
            mx: 'auto'
          }}
        >
          {features.map((feature, index) => (
            <Box
              key={index}
              sx={{
                p: 2.5,
                borderRadius: 2,
                background: 'white',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: feature.gradient,
                  color: 'white',
                }}
              >
                {feature.icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {feature.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Nachhaltigkeits-Sektion */}
        <Paper
          elevation={0}
          sx={{
            mt: 8,
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Leaf size={48} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
              Nachhaltig handeln. Bewusst leben.
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.95, fontSize: '1.1rem', maxWidth: 700, mx: 'auto', lineHeight: 1.8 }}>
              Jeder Second-Hand-Kauf ist ein Beitrag zur Kreislaufwirtschaft. Statt neue Ressourcen zu verbrauchen,
              geben wir Dingen ein zweites Leben. Gemeinsam reduzieren wir Müll, schonen Ressourcen und tragen
              zu einer nachhaltigeren Zukunft bei.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', mt: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>♻️ Kreislaufwirtschaft</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Produkte länger nutzen</Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>🌍 Weniger CO₂</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Ressourcen schonen</Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>💚 Gemeinsam</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Für unsere Zukunft</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 8,
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
              Bereit loszulegen?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.95, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              Werde Teil der Community und erlebe, wie einfach Kaufen und Verkaufen sein kann.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={20} />}
              onClick={() => navigate('/')}
              sx={{
                bgcolor: 'white',
                color: '#f5576c',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                }
              }}
            >
              Inserat erstellen
            </Button>
          </Box>
        </Paper>

        <Box sx={{ mt: 8 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 4,
              textAlign: 'center',
              fontSize: { xs: '1.8rem', md: '2.2rem' }
            }}
          >
            Kontakt
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, 1fr)'
              },
              gap: 3,
              maxWidth: 900,
              mx: 'auto'
            }}
          >
            {/* Adresse */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                  }}
                >
                  <MapPin size={20} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Adresse
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                <strong>HABDAWAS.at</strong><br />
                Hollenthon 33<br />
                2812 Hollenthon<br />
                Österreich
              </Typography>
            </Paper>

            {/* Telefon */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                  }}
                >
                  <Phone size={20} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Telefon
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  lineHeight: 1.8
                }}
              >
                +43 650 25 26 266
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Mo-Fr: 9:00-18:00 Uhr
              </Typography>
            </Paper>

            {/* E-Mail */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                  }}
                >
                  <Mail size={20} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  E-Mail
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  lineHeight: 1.8,
                  wordBreak: 'break-all'
                }}
              >
                info@habdawas.at
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Antwort binnen 24h
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
