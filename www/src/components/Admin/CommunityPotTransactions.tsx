import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { RefreshCcw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useCommunityPotTransactions } from '../../hooks/useCommunityPotTransactions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatNumber } from '../../utils/formatNumber';

type FilterType = 'all' | 'donation' | 'usage' | 'adjustment';

export const CommunityPotTransactions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { transactions, loading, error, refresh, totalDonations, totalUsage } =
    useCommunityPotTransactions({
      transactionType: filter === 'all' ? undefined : filter as any,
    });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'donation':
        return 'Spende';
      case 'usage':
        return 'Nutzung';
      case 'adjustment':
        return 'Anpassung';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'donation':
        return 'success';
      case 'usage':
        return 'error';
      case 'adjustment':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: string): JSX.Element | undefined => {
    switch (type) {
      case 'donation':
        return <TrendingUp size={16} />;
      case 'usage':
        return <TrendingDown size={16} />;
      case 'adjustment':
        return <AlertCircle size={16} />;
      default:
        return undefined;
    }
  };

  if (loading && !refreshing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Typography variant="h5" fontWeight={700}>
          Community-Topf Transaktionen
        </Typography>
        <Tooltip title="Aktualisieren">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw size={20} className={refreshing ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, newFilter) => {
            if (newFilter !== null) {
              setFilter(newFilter);
            }
          }}
          size="small"
          fullWidth={isMobile}
        >
          <ToggleButton value="all">
            Alle
          </ToggleButton>
          <ToggleButton value="donation">
            Spenden
          </ToggleButton>
          <ToggleButton value="usage">
            Nutzung
          </ToggleButton>
          <ToggleButton value="adjustment">
            Anpassungen
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Stats */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Gesamte Spenden
          </Typography>
          <Typography variant="h5" fontWeight={700} color="success.main">
            +{formatNumber(totalDonations)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Gesamte Nutzung
          </Typography>
          <Typography variant="h5" fontWeight={700} color="error.main">
            -{formatNumber(totalUsage)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Netto
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {formatNumber(totalDonations - totalUsage)}
          </Typography>
        </Box>
      </Paper>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <Alert severity="info">Keine Transaktionen vorhanden.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell>Datum</TableCell>
                {!isMobile && <TableCell>Benutzer</TableCell>}
                <TableCell align="center">Typ</TableCell>
                <TableCell align="right">Betrag</TableCell>
                <TableCell align="right">Saldo danach</TableCell>
                {!isMobile && <TableCell>Beschreibung</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction: any) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(transaction.created_at), 'dd.MM.yyyy', { locale: de })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(transaction.created_at), 'HH:mm', { locale: de })} Uhr
                    </Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.profiles?.full_name || 'System'}
                      </Typography>
                      {transaction.profiles?.email && (
                        <Typography variant="caption" color="text.secondary">
                          {transaction.profiles.email}
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Chip
                      icon={getTypeIcon(transaction.transaction_type)}
                      label={getTypeLabel(transaction.transaction_type)}
                      size="small"
                      color={getTypeColor(transaction.transaction_type)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        transaction.amount > 0
                          ? 'success.main'
                          : transaction.amount < 0
                          ? 'error.main'
                          : 'text.primary'
                      }
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {formatNumber(transaction.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={formatNumber(transaction.balance_after)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.description || '-'}
                      </Typography>
                      {transaction.items && (
                        <Typography variant="caption" color="text.secondary">
                          Inserat: {transaction.items.title}
                        </Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
