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
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import { RefreshCcw, DollarSign, Award, Users } from 'lucide-react';
import { useDonations } from '../../hooks/useDonations';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';

export const DonationsOverview = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { donations, loading, error, refresh, totalDonations, totalCredits } = useDonations();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'community_pot' ? 'Community-Topf' : 'Persönliche Credits';
  };

  const getTypeColor = (type: string) => {
    return type === 'community_pot' ? 'primary' : 'secondary';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Spenden-Übersicht
        </Typography>
        <Tooltip title="Aktualisieren">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw size={20} className={refreshing ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DollarSign size={20} color={theme.palette.primary.main} />
              <Typography variant="body2" color="text.secondary">
                Gesamtspenden
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={700}>
              {formatCurrency(totalDonations)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Award size={20} color={theme.palette.success.main} />
              <Typography variant="body2" color="text.secondary">
                Credits vergeben
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={700}>
              {formatNumber(totalCredits)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Users size={20} color={theme.palette.info.main} />
              <Typography variant="body2" color="text.secondary">
                Anzahl Spenden
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={700}>
              {formatNumber(donations.length)}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Donations Table */}
      {donations.length === 0 ? (
        <Alert severity="info">
          Noch keine Spenden vorhanden.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell>Datum</TableCell>
                {!isMobile && <TableCell>Benutzer</TableCell>}
                <TableCell align="right">Betrag</TableCell>
                <TableCell align="center">Credits</TableCell>
                <TableCell align="center">Typ</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {donations.map((donation: any) => (
                <TableRow key={donation.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(donation.created_at), 'dd.MM.yyyy', { locale: de })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(donation.created_at), 'HH:mm', { locale: de })} Uhr
                    </Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2">
                        {donation.profiles?.full_name || 'Unbekannt'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {donation.profiles?.email}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(Number(donation.amount))}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={formatNumber(donation.credits_granted)}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getTypeLabel(donation.donation_type)}
                      size="small"
                      color={getTypeColor(donation.donation_type)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={donation.status}
                      size="small"
                      color={getStatusColor(donation.status)}
                    />
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
