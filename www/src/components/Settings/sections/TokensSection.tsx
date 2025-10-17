import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Coins, TrendingUp, TrendingDown, ShoppingCart, Gift, RefreshCw, Heart } from 'lucide-react';
import { useTokens } from '../../../hooks/useTokens';
import { useCreditsStats } from '../../../hooks/useCreditsStats';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../../../utils/formatNumber';

interface TokenTransaction {
  id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage' | 'bonus' | 'refund';
  item_id: string | null;
  gemini_input_tokens: number | null;
  gemini_output_tokens: number | null;
  gemini_total_tokens: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getTransactionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    purchase: 'Kauf',
    usage: 'Verbrauch',
    bonus: 'Bonus',
    refund: 'Erstattung',
  };
  return labels[type] || type;
};

const getTransactionTypeColor = (type: string): 'success' | 'error' | 'info' | 'warning' => {
  const colors: Record<string, 'success' | 'error' | 'info' | 'warning'> = {
    purchase: 'success',
    usage: 'error',
    bonus: 'info',
    refund: 'warning',
  };
  return colors[type] || 'info';
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'purchase':
      return <ShoppingCart size={16} />;
    case 'usage':
      return <TrendingDown size={16} />;
    case 'bonus':
      return <Gift size={16} />;
    case 'refund':
      return <RefreshCw size={16} />;
    default:
      return <Coins size={16} />;
  }
};

export const TokensSection = () => {
  const navigate = useNavigate();
  const { balance, totalEarned, totalSpent, loading, refetch, fetchTransactions } = useTokens();
  const creditsStats = useCreditsStats();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const data = await fetchTransactions(50);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3, display: { xs: 'none', md: 'block' } }}>
        Credits-Guthaben
      </Typography>

      {/* New Credits System Overview */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 4,
        }}
      >
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Coins size={20} />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Personal Credits
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            {creditsStats.loading ? <CircularProgress size={32} color="inherit" /> : formatNumber(creditsStats.personalCredits)}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
            Verfügbar für Inserate
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            border: '1px solid rgba(233, 30, 99, 0.3)',
            bgcolor: 'rgba(233, 30, 99, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Heart size={20} color="#e91e63" />
            <Typography variant="body2" color="text.secondary">
              Community-Topf
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#e91e63' }}>
            {creditsStats.loading ? <CircularProgress size={28} /> : formatNumber(creditsStats.communityPotBalance)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Kostenlose Inserate
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Button
            fullWidth
            variant="contained"
            startIcon={<ShoppingCart size={18} />}
            onClick={() => navigate('/tokens')}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
              mb: 1,
            }}
          >
            Credits kaufen
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Heart size={18} />}
            onClick={() => navigate('/tokens?tab=community')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              borderColor: '#e91e63',
              color: '#e91e63',
              '&:hover': {
                borderColor: '#c2185b',
                bgcolor: 'rgba(233, 30, 99, 0.05)',
              },
            }}
          >
            Community spenden
          </Button>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Legacy Token-Transaktionen
        </Typography>
      </Box>

      {loadingTransactions ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : transactions.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Noch keine Transaktionen vorhanden.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                <TableCell sx={{ fontWeight: 600 }}>Typ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Betrag</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Gemini Tokens</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Datum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  sx={{
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                  }}
                >
                  <TableCell>
                    <Chip
                      icon={getTransactionIcon(transaction.transaction_type)}
                      label={getTransactionTypeLabel(transaction.transaction_type)}
                      color={getTransactionTypeColor(transaction.transaction_type)}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: transaction.amount > 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {transaction.gemini_total_tokens ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {transaction.gemini_total_tokens.toLocaleString()} total
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {transaction.gemini_input_tokens?.toLocaleString()} in / {transaction.gemini_output_tokens?.toLocaleString()} out
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(transaction.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
