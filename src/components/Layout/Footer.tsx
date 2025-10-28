import { Box, Container, Typography, Link, Stack } from '@mui/material';
import { Heart, Download } from 'lucide-react';
import { APP_VERSION, APP_NAME } from '../../version';
import { useNavigate } from 'react-router-dom';
import { exportAltTexts } from '../../utils/altTextExport';
import { useState } from 'react';

export const Footer = () => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportButton, setShowExportButton] = useState(false);

  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVersionDoubleClick = () => {
    setShowExportButton(prev => !prev);
  };

  const handleExportAltTexts = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isExporting) return;

    setIsExporting(true);
    try {
      await exportAltTexts();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
    <Box component="footer" sx={{ bgcolor: '#f5f5f5', color: 'text.primary', mt: 'auto', borderTop: '1px solid', borderColor: 'divider', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.5, sm: 2 }}
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
              © {new Date().getFullYear()} {APP_NAME}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.7rem',
                color: 'text.disabled',
                opacity: 0.5,
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onDoubleClick={handleVersionDoubleClick}
              title="Doppelklick für Admin-Funktionen"
            >
              v{APP_VERSION}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center" flexWrap="wrap" sx={{ justifyContent: 'center' }}>
            <Link
              href="/about"
              onClick={handleNavigation('/about')}
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: '0.813rem', '&:hover': { color: 'primary.main' } }}
            >
              Über uns
            </Link>
            <Link
              href="/categories"
              onClick={handleNavigation('/categories')}
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: '0.813rem', '&:hover': { color: 'primary.main' } }}
            >
              Kategorien
            </Link>
            <Link
              href="/help"
              onClick={handleNavigation('/help')}
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: '0.813rem', '&:hover': { color: 'primary.main' } }}
            >
              Hilfe
            </Link>
            <Link
              href="/agb"
              onClick={handleNavigation('/agb')}
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: '0.813rem', '&:hover': { color: 'primary.main' } }}
            >
              AGB
            </Link>
            <Link
              href="/datenschutz"
              onClick={handleNavigation('/datenschutz')}
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: '0.813rem', '&:hover': { color: 'primary.main' } }}
            >
              Datenschutz
            </Link>
            <Link
              href="/impressum"
              onClick={handleNavigation('/impressum')}
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: '0.813rem', '&:hover': { color: 'primary.main' } }}
            >
              Impressum
            </Link>
          </Stack>

          <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                Mit
              </Typography>
              <Heart size={12} fill="red" color="red" />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                von
              </Typography>
              <Link
                href="https://www.ssi.at"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                color="primary"
                fontWeight={600}
                sx={{ fontSize: '0.813rem' }}
              >
                SSI
              </Link>
            </Stack>

            {/* Diskrete Export-Funktion - nur sichtbar nach Doppelklick auf Version */}
            {showExportButton && (
              <Link
                href="#"
                onClick={handleExportAltTexts}
                underline="none"
                sx={{
                  fontSize: '0.75rem',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  transition: 'opacity 0.2s ease',
                  '&:hover': {
                    opacity: 0.7
                  },
                  cursor: isExporting ? 'wait' : 'pointer'
                }}
                title="Alt-Text Export"
              >
                <Download size={14} />
                {isExporting ? 'Exportiere...' : 'Alt-Texte'}
              </Link>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
    {/* Safe Area Bottom Background */}
    <Box sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'env(safe-area-inset-bottom)',
      bgcolor: '#f5f5f5'
    }} />
    </>
  );
};
