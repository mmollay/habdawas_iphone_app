import { Box, Paper, Typography, IconButton, Button } from '@mui/material';
import { X, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OnboardingTooltipProps {
  show: boolean;
  targetElement: HTMLElement | null;
  onClose: () => void;
  title: string;
  description: string;
  step?: number;
  totalSteps?: number;
}

export const OnboardingTooltip = ({
  show,
  targetElement,
  onClose,
  title,
  description,
  step = 1,
  totalSteps = 1,
}: OnboardingTooltipProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!show || !targetElement) return;

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      setPosition({
        top: rect.top + scrollY - 180,
        left: rect.left + scrollX + rect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [show, targetElement]);

  if (!show || !targetElement) return null;

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1400,
          animation: 'fadeIn 0.3s ease-in-out',
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
        onClick={onClose}
      />

      <Box
        sx={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          transform: 'translateX(-50%)',
          zIndex: 1401,
          animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          '@keyframes slideDown': {
            from: {
              opacity: 0,
              transform: 'translateX(-50%) translateY(-20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateX(-50%) translateY(0)',
            },
          },
        }}
      >
        <Paper
          elevation={24}
          sx={{
            position: 'relative',
            bgcolor: 'white',
            borderRadius: 3,
            p: 3,
            maxWidth: 360,
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.24)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '12px solid white',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
            },
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 32,
              height: 32,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <X size={18} />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              }}
            >
              <Sparkles size={20} color="white" />
            </Box>
            <Box sx={{ flex: 1, pt: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                {title}
              </Typography>
              {totalSteps > 1 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Schritt {step} von {totalSteps}
                </Typography>
              )}
            </Box>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            {description}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.24)',
                },
              }}
            >
              Verstanden
            </Button>
          </Box>
        </Paper>

        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            mt: 2,
            width: 2,
            height: 40,
            bgcolor: 'primary.main',
            borderRadius: 1,
            opacity: 0.4,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 0.4,
              },
              '50%': {
                opacity: 0.8,
              },
            },
          }}
        />
      </Box>
    </>
  );
};
