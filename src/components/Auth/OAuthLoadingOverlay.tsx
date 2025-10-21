import { Box, Typography, CircularProgress, Backdrop } from '@mui/material';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface OAuthLoadingOverlayProps {
  open: boolean;
}

export const OAuthLoadingOverlay = ({ open }: OAuthLoadingOverlayProps) => {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          animation: `${fadeIn} 0.3s ease-out`,
        }}
      >
        {/* Google Logo mit Animation */}
        <Box
          sx={{
            position: 'relative',
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component="img"
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            sx={{
              width: 48,
              height: 48,
              animation: `${pulse} 2s ease-in-out infinite`,
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
            }}
          />
          <CircularProgress
            size={80}
            thickness={2}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: 'primary.main',
            }}
          />
        </Box>

        {/* Text */}
        <Box sx={{ textAlign: 'center', maxWidth: 300 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: 'text.primary',
            }}
          >
            Weiterleitung zu Google...
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.6,
            }}
          >
            Sie werden zum Google-Login weitergeleitet. Nach erfolgreicher Anmeldung kehren Sie automatisch zur App zurück.
          </Typography>
        </Box>
      </Box>
    </Backdrop>
  );
};
