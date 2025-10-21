import { Box, Button, Chip, Paper, useTheme, useMediaQuery, Typography } from '@mui/material';
import { Check, X, Save, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FloatingActionBarProps {
  onPublish: () => void;
  onCancel: () => void;
  isPublishing: boolean;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  hasChanges: boolean;
  isDraft: boolean;
  itemStatus?: string;
  isFirstItem?: boolean;
}

export const FloatingActionBar = ({
  onPublish,
  onCancel,
  isPublishing,
  autoSaveStatus,
  hasChanges,
  isDraft,
  itemStatus,
}: FloatingActionBarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showSavedChip, setShowSavedChip] = useState(false);

  useEffect(() => {
    if (autoSaveStatus === 'saving') {
      setShowSavedChip(true);
    } else if (autoSaveStatus === 'saved') {
      const timer = setTimeout(() => {
        setShowSavedChip(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (autoSaveStatus === 'idle' || autoSaveStatus === 'error') {
      setShowSavedChip(false);
    }
  }, [autoSaveStatus]);

  const getAutoSaveIcon = () => {
    if (isPublishing || !showSavedChip) {
      return null;
    }
    if (autoSaveStatus === 'saving') {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'primary.main',
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.6 },
              '50%': { opacity: 1 },
            },
          }}
        >
          <Save size={16} />
        </Box>
      );
    }
    if (autoSaveStatus === 'saved') {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'success.main',
            animation: 'fadeIn 0.3s ease-in',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'scale(0.8)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <Save size={16} />
        </Box>
      );
    }
    if (autoSaveStatus === 'error') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <Save size={16} />
        </Box>
      );
    }
    return null;
  };

  const getButtonText = () => {
    if (isPublishing) {
      return isDraft ? 'Wird veröffentlicht...' : 'Wird gespeichert...';
    }
    if (itemStatus === 'draft') {
      return 'Veröffentlichen';
    }
    if (itemStatus === 'published') {
      return 'Änderungen speichern';
    }
    if (itemStatus === 'paused') {
      return 'Speichern';
    }
    return 'Änderungen übernehmen';
  };

  return (
    <>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: isMobile ? 16 : 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          bgcolor: 'background.paper',
          borderRadius: 4,
          border: isDraft ? '2px solid' : '1px solid',
          borderColor: isDraft ? 'warning.main' : 'divider',
          boxShadow: isDraft ? '0 12px 48px rgba(237, 108, 2, 0.15)' : '0 8px 32px rgba(0,0,0,0.08)',
          minWidth: isMobile ? 'calc(100% - 32px)' : 'auto',
          maxWidth: isMobile ? 'calc(100% - 32px)' : 600,
          overflow: 'hidden',
        }}
      >
        {isDraft && (
          <Box
            sx={{
              bgcolor: 'rgba(237, 108, 2, 0.04)',
              px: 2.5,
              py: 0.75,
              borderBottom: '1px solid rgba(237, 108, 2, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info size={14} color="#ed6c02" style={{ flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{
                  color: '#e65100',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                }}
              >
                Änderungen werden automatisch gespeichert
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 20 }}>
              {getAutoSaveIcon()}
            </Box>
          </Box>
        )}

        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1.5,
            flexDirection: 'row',
            position: 'relative',
          }}
        >
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isPublishing}
            startIcon={<X size={18} />}
            sx={{
              height: 40,
              borderRadius: 2,
              textTransform: 'none',
              px: 2.5,
              fontWeight: 500,
            }}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={onPublish}
            disabled={isPublishing || !hasChanges}
            startIcon={<Check size={18} />}
            sx={{
              height: 40,
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              bgcolor: isDraft ? 'warning.main' : 'primary.main',
              '&:hover': {
                bgcolor: isDraft ? 'warning.dark' : 'primary.dark',
              },
            }}
          >
            {getButtonText()}
          </Button>
        </Box>
    </Paper>
    </>
  );
};
