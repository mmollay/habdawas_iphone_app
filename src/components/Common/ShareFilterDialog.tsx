import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { Copy, Share2, X, QrCode as QrCodeIcon, Mail, Printer, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareFilterDialogProps {
  open: boolean;
  onClose: () => void;
  url: string;
  description?: string;
  filterCount?: number;
}

export const ShareFilterDialog = ({ open, onClose, url, description, filterCount = 0 }: ShareFilterDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showQR, setShowQR] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setSnackbarMessage('Link in Zwischenablage kopiert!');
      setSnackbarOpen(true);
    } catch (error) {
      // Fallback für ältere Browser
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setSnackbarMessage('Link in Zwischenablage kopiert!');
        setSnackbarOpen(true);
      } catch (e) {
        setSnackbarMessage('Kopieren fehlgeschlagen');
        setSnackbarOpen(true);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bazar - Gefilterte Artikel',
          text: description || 'Schau dir diese Artikel an!',
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      handleCopy();
    }
  };

  const getFilterDescription = () => {
    if (description) return description;
    if (filterCount > 0) return `${filterCount} Filter aktiv`;
    return 'Aktuelle Ansicht';
  };

  const shareText = description || `Bazar - ${getFilterDescription()}`;

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}`, '_blank');
    onClose();
  };

  const shareViaTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`, '_blank');
    onClose();
  };

  const shareViaEmail = () => {
    const subject = 'Bazar - Gefilterte Artikel';
    const body = `${shareText}\n\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    onClose();
  };

  const handlePrint = () => {
    onClose();
    setTimeout(() => window.print(), 100);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Share2 size={24} />
            <Typography variant="h6" component="span">
              Filter teilen
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Description */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {getFilterDescription()}
              </Typography>
              <TextField
                fullWidth
                value={url}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Tooltip title="Kopieren">
                      <IconButton onClick={handleCopy} edge="end" size="small">
                        <Copy size={18} />
                      </IconButton>
                    </Tooltip>
                  ),
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'action.hover',
                  }
                }}
              />
            </Box>

            {/* Share Options */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Teilen über
              </Typography>
              <List sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 0,
                overflow: 'hidden',
              }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={shareViaWhatsApp}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <MessageCircle size={20} color="#25D366" />
                    </ListItemIcon>
                    <ListItemText primary="WhatsApp" />
                  </ListItemButton>
                </ListItem>
                <Divider />
                <ListItem disablePadding>
                  <ListItemButton onClick={shareViaTelegram}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box sx={{ width: 20, height: 20 }}>
                        <svg viewBox="0 0 24 24" fill="#0088cc">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                        </svg>
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary="Telegram" />
                  </ListItemButton>
                </ListItem>
                <Divider />
                <ListItem disablePadding>
                  <ListItemButton onClick={shareViaEmail}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Mail size={20} />
                    </ListItemIcon>
                    <ListItemText primary="E-Mail" />
                  </ListItemButton>
                </ListItem>
                <Divider />
                <ListItem disablePadding>
                  <ListItemButton onClick={handlePrint}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Printer size={20} />
                    </ListItemIcon>
                    <ListItemText primary="Drucken" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>

            {/* QR Code Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  QR-Code
                </Typography>
                <Button
                  size="small"
                  startIcon={<QrCodeIcon size={16} />}
                  onClick={() => setShowQR(!showQR)}
                  sx={{ textTransform: 'none' }}
                >
                  {showQR ? 'Ausblenden' : 'Anzeigen'}
                </Button>
              </Box>

              {showQR && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    p: 3,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <QRCodeSVG
                    value={url}
                    size={isMobile ? 200 : 256}
                    level="H"
                    includeMargin
                    style={{
                      border: '8px solid white',
                      borderRadius: '8px',
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Info Text */}
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              💡 Teile diesen Link, um anderen genau diese gefilterte Ansicht zu zeigen.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Schließen
          </Button>
          <Button
            onClick={handleCopy}
            variant="outlined"
            startIcon={<Copy size={18} />}
            sx={{ textTransform: 'none' }}
          >
            Link kopieren
          </Button>
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              variant="contained"
              startIcon={<Share2 size={18} />}
              sx={{ textTransform: 'none' }}
            >
              Teilen
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
