import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Coins,
  ShoppingCart,
  Heart,
} from 'lucide-react';
import { useCreditsStats } from '../../../hooks/useCreditsStats';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../../../utils/formatNumber';
import { useAuth } from '../../../contexts/AuthContext';
import { TransactionsList } from '../../Shared/TransactionsList';


export const TokensSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { personalCredits, communityPotBalance, loading: creditsLoading } = useCreditsStats();

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3, display: { xs: 'none', md: 'block' } }}>
        Mein Guthaben
      </Typography>

      {/* Google MD3 Style Credits Overview - Compact & Mobile Optimized */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: { xs: 2, md: 3 },
          mb: { xs: 3, md: 4 },
        }}
      >
        {/* Personal Credits Card - Google Blue Style */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: { xs: 2, md: 3 },
            bgcolor: '#f8f9fa',
            border: '1px solid #e8eaed',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, md: 2 }, mb: { xs: 2, md: 2.5 } }}>
            <Box
              sx={{
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: 2,
                bgcolor: '#e8f0fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Coins size={24} color="#1a73e8" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, mb: 0.25, fontWeight: 500 }}>
                Personal Inserate
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#202124', fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                {creditsLoading ? <CircularProgress size={28} /> : formatNumber(personalCredits)}
              </Typography>
            </Box>
          </Box>

          <Button
            fullWidth
            variant="contained"
            startIcon={<ShoppingCart size={16} />}
            onClick={() => navigate('/tokens')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              py: { xs: 1, md: 1.25 },
              bgcolor: '#1a73e8',
              color: 'white',
              borderRadius: 2,
              boxShadow: 'none',
              fontSize: { xs: '0.875rem', md: '1rem' },
              '&:hover': {
                bgcolor: '#1557b0',
                boxShadow: '0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15)',
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Inserate kaufen</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Kaufen</Box>
          </Button>
        </Paper>

        {/* Community Pot Card - Google Red/Pink Style */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: { xs: 2, md: 3 },
            bgcolor: '#fef7ff',
            border: '1px solid #f3e8fd',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, md: 2 }, mb: { xs: 2, md: 2.5 } }}>
            <Box
              sx={{
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: 2,
                bgcolor: '#fce8f3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Heart size={24} color="#c51162" fill="#c51162" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, mb: 0.25, fontWeight: 500 }}>
                Community-Topf
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#c51162', fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                {creditsLoading ? <CircularProgress size={28} /> : formatNumber(communityPotBalance)}
              </Typography>
            </Box>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<Heart size={16} />}
            onClick={() => navigate('/tokens?tab=community')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              py: { xs: 1, md: 1.25 },
              borderColor: '#c51162',
              color: '#c51162',
              borderRadius: 2,
              borderWidth: 1.5,
              fontSize: { xs: '0.875rem', md: '1rem' },
              '&:hover': {
                borderColor: '#a00037',
                bgcolor: 'rgba(197, 17, 98, 0.04)',
                borderWidth: 1.5,
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Jetzt spenden</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Spenden</Box>
          </Button>
        </Paper>
      </Box>

      {/* Transactions List - Using Shared Component */}
      <TransactionsList
        mode="user"
        userId={user?.id}
        showUserColumn={false}
        showFilters={true}
        showStats={false}
        showRefresh={false}
        limit={50}
      />
    </Box>
  );
};
