import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  FormControlLabel,
  Checkbox,
  IconButton,
  Button,
  Stack,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Collapse,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Gift,
  RefreshCw,
  Heart,
  Sparkles,
  ChevronDown,
  Award,
  DollarSign,
  Users,
  Coins,
  AlertCircle,
  User,
  Search,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';

// Transaction types from different tables
interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'donation' | 'adjustment';
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

interface TransactionsListProps {
  mode?: 'admin' | 'user';
  userId?: string;
  showUserColumn?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  showRefresh?: boolean;
  defaultFilters?: {
    type?: 'all' | 'purchase' | 'usage' | 'bonus' | 'refund' | 'donation' | 'adjustment';
    period?: 'all' | 'today' | 'week' | 'month';
    aiOnly?: boolean;
  };
  limit?: number;
  onTransactionClick?: (transaction: CreditTransaction) => void;
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
    donation: 'Spende',
    adjustment: 'Anpassung',
  };
  return labels[type] || type;
};

const getTransactionTypeColor = (
  type: string
): 'success' | 'error' | 'info' | 'warning' | 'primary' => {
  const colors: Record<string, 'success' | 'error' | 'info' | 'warning' | 'primary'> = {
    purchase: 'success',
    usage: 'error',
    bonus: 'info',
    refund: 'warning',
    donation: 'primary',
    adjustment: 'warning',
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
    case 'donation':
      return <TrendingUp size={16} />;
    case 'adjustment':
      return <AlertCircle size={16} />;
    default:
      return <Coins size={16} />;
  }
};

export const TransactionsList = ({
  mode = 'user',
  userId,
  showUserColumn = false,
  showFilters = true,
  showStats = true,
  showRefresh = true,
  defaultFilters = {},
  limit = 50,
  onTransactionClick,
}: TransactionsListProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<
    'all' | 'purchase' | 'usage' | 'bonus' | 'refund' | 'donation' | 'adjustment'
  >(defaultFilters.type || 'all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>(
    defaultFilters.period || 'all'
  );
  const [filterAiOnly, setFilterAiOnly] = useState(defaultFilters.aiOnly || false);
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable details state
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  const toggleExpand = (transactionId: string) => {
    setExpandedTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  // Fetch transactions
  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('credit_transactions')
        .select(
          `
          *,
          profiles:user_id (
            id,
            full_name,
            email
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by user if in user mode or userId specified
      if (mode === 'user' && userId) {
        query = query.eq('user_id', userId);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Fehler beim Laden der Transaktionen');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [userId, mode, limit]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by type
    if (filterType !== 'all' && transaction.transaction_type !== filterType) {
      return false;
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const transactionDate = new Date(transaction.created_at);
      const now = new Date();

      if (filterPeriod === 'today') {
        const isToday = transactionDate.toDateString() === now.toDateString();
        if (!isToday) return false;
      } else if (filterPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (transactionDate < weekAgo) return false;
      } else if (filterPeriod === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (transactionDate < monthAgo) return false;
      }
    }

    // Filter by AI-generated (only for usage transactions)
    if (filterAiOnly && transaction.transaction_type === 'usage') {
      const hasGeminiTokens = (transaction.metadata as any)?.gemini_total_tokens > 0;
      if (!hasGeminiTokens) return false;
    }

    // Filter by search query (user name or email)
    if (searchQuery.trim() && showUserColumn) {
      const query = searchQuery.toLowerCase();
      const userName = transaction.profiles?.full_name?.toLowerCase() || '';
      const userEmail = transaction.profiles?.email?.toLowerCase() || '';
      if (!userName.includes(query) && !userEmail.includes(query)) {
        return false;
      }
    }

    return true;
  });

  // Calculate stats
  const stats = {
    totalPurchases: transactions
      .filter((t) => t.transaction_type === 'purchase' && (t.metadata as any)?.package_type !== 'community')
      .reduce((sum, t) => sum + t.amount, 0),
    totalDonations: transactions
      .filter((t) => t.transaction_type === 'purchase' && (t.metadata as any)?.package_type === 'community')
      .reduce((sum, t) => sum + t.amount, 0),
    totalUsage: transactions
      .filter((t) => t.transaction_type === 'usage')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalBonus: transactions
      .filter((t) => t.transaction_type === 'bonus')
      .reduce((sum, t) => sum + t.amount, 0),
    count: transactions.length,
  };

  if (loading && !refreshing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
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
      {/* Stats Cards */}
      {showStats && transactions.length > 0 && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          {stats.totalPurchases > 0 && (
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ShoppingCart size={20} color={theme.palette.success.main} />
                  <Typography variant="body2" color="text.secondary">
                    Käufe
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  +{formatNumber(stats.totalPurchases)}
                </Typography>
              </CardContent>
            </Card>
          )}

          {stats.totalDonations > 0 && (
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Heart size={20} color={theme.palette.primary.main} />
                  <Typography variant="body2" color="text.secondary">
                    Spenden
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  +{formatNumber(stats.totalDonations)}
                </Typography>
              </CardContent>
            </Card>
          )}

          {stats.totalUsage > 0 && (
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingDown size={20} color={theme.palette.error.main} />
                  <Typography variant="body2" color="text.secondary">
                    Verbraucht
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="error.main">
                  -{formatNumber(stats.totalUsage)}
                </Typography>
              </CardContent>
            </Card>
          )}

          {mode === 'admin' && (
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Users size={20} color={theme.palette.info.main} />
                  <Typography variant="body2" color="text.secondary">
                    Transaktionen
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700}>
                  {formatNumber(stats.count)}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {/* Filters */}
      {showFilters && transactions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Transaktionen
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
                ({filteredTransactions.length})
              </Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(filterType !== 'all' || filterPeriod !== 'all' || filterAiOnly || searchQuery) && (
                <Button
                  size="small"
                  onClick={() => {
                    setFilterType('all');
                    setFilterPeriod('all');
                    setFilterAiOnly(false);
                    setSearchQuery('');
                  }}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Filter zurücksetzen
                </Button>
              )}
              {showRefresh && (
                <IconButton onClick={handleRefresh} disabled={refreshing} size="small">
                  <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                </IconButton>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Transaction Type Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="filter-type-label">Typ</InputLabel>
              <Select
                labelId="filter-type-label"
                value={filterType}
                label="Typ"
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="purchase">Käufe</MenuItem>
                <MenuItem value="usage">Verbrauch</MenuItem>
                <MenuItem value="bonus">Bonus</MenuItem>
                <MenuItem value="refund">Rückerstattung</MenuItem>
                <MenuItem value="donation">Spenden</MenuItem>
                <MenuItem value="adjustment">Anpassungen</MenuItem>
              </Select>
            </FormControl>

            {/* Period Filter */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="filter-period-label">Zeitraum</InputLabel>
              <Select
                labelId="filter-period-label"
                value={filterPeriod}
                label="Zeitraum"
                onChange={(e) => setFilterPeriod(e.target.value as typeof filterPeriod)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="today">Heute</MenuItem>
                <MenuItem value="week">7 Tage</MenuItem>
                <MenuItem value="month">30 Tage</MenuItem>
              </Select>
            </FormControl>

            {/* Search Field (Admin mode only) */}
            {showUserColumn && (
              <TextField
                size="small"
                placeholder="Benutzer suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 200 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        edge="end"
                        sx={{ p: 0.5 }}
                      >
                        <X size={16} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {/* AI-Only Filter */}
            {filterType === 'usage' && (
              <FormControlLabel
                control={
                  <Checkbox checked={filterAiOnly} onChange={(e) => setFilterAiOnly(e.target.checked)} size="small" />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Sparkles size={14} />
                    <Typography variant="body2">Nur AI</Typography>
                  </Box>
                }
              />
            )}
          </Box>
        </Box>
      )}

      {/* Transactions List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : transactions.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Noch keine Transaktionen vorhanden.
        </Alert>
      ) : filteredTransactions.length === 0 ? (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Keine Transaktionen mit den aktuellen Filtern gefunden. Versuchen Sie, die Filter zurückzusetzen.
        </Alert>
      ) : (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead" sx={{ bgcolor: '#f8f9fa', borderBottom: '2px solid', borderColor: 'divider' }}>
              <Box component="tr">
                <Box
                  component="th"
                  sx={{ textAlign: 'left', p: 1.5, fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}
                >
                  Typ
                </Box>
                {showUserColumn && !isMobile && (
                  <Box
                    component="th"
                    sx={{ textAlign: 'left', p: 1.5, fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}
                  >
                    Benutzer
                  </Box>
                )}
                <Box
                  component="th"
                  sx={{
                    textAlign: 'left',
                    p: 1.5,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    display: { xs: 'none', sm: 'table-cell' },
                  }}
                >
                  Beschreibung
                </Box>
                <Box
                  component="th"
                  sx={{ textAlign: 'right', p: 1.5, fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}
                >
                  Credits
                </Box>
                <Box
                  component="th"
                  sx={{
                    textAlign: 'right',
                    p: 1.5,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    display: { xs: 'none', md: 'table-cell' },
                  }}
                >
                  Datum
                </Box>
                <Box component="th" sx={{ width: 40, p: 1.5 }}></Box>
              </Box>
            </Box>
            <Box component="tbody">
              {filteredTransactions.map((transaction) => {
                const metadata = transaction.metadata as any;
                const packageType = metadata?.package_type || 'personal';
                const isCommunityDonation = transaction.transaction_type === 'purchase' && packageType === 'community';
                const isExpanded = expandedTransactions.has(transaction.id);
                const hasGeminiTokens = metadata?.gemini_total_tokens > 0;
                const hasDetails = metadata?.package_id || hasGeminiTokens;

                return (
                  <Box component="tbody" key={transaction.id} sx={{ display: 'contents' }}>
                    <Box
                      component="tr"
                      onClick={() => onTransactionClick?.(transaction)}
                      sx={{
                        bgcolor: isCommunityDonation ? 'rgba(233, 30, 99, 0.02)' : 'white',
                        '&:hover': {
                          bgcolor: isCommunityDonation ? 'rgba(233, 30, 99, 0.05)' : '#f8f9fa',
                          cursor: onTransactionClick ? 'pointer' : 'default',
                        },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Box component="td" sx={{ p: 1.5, verticalAlign: 'middle' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                          <Chip
                            icon={getTransactionIcon(transaction.transaction_type)}
                            label={getTransactionTypeLabel(transaction.transaction_type)}
                            color={getTransactionTypeColor(transaction.transaction_type)}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                          />
                          {isCommunityDonation && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.3,
                                bgcolor: '#e91e63',
                                color: 'white',
                                px: 0.8,
                                py: 0.3,
                                borderRadius: 1,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                              }}
                            >
                              <Award size={10} />
                              <span>Hero</span>
                            </Box>
                          )}
                          {transaction.transaction_type === 'usage' && hasGeminiTokens && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.3,
                                bgcolor: 'rgba(156, 39, 176, 0.1)',
                                color: '#9c27b0',
                                px: 0.8,
                                py: 0.3,
                                borderRadius: 1,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                              }}
                            >
                              <Sparkles size={10} />
                              <span>AI</span>
                            </Box>
                          )}
                        </Box>
                      </Box>
                      {showUserColumn && !isMobile && (
                        <Box component="td" sx={{ p: 1.5, verticalAlign: 'middle' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                            {transaction.profiles?.full_name || 'Unbekannt'}
                          </Typography>
                          {transaction.profiles?.email && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {transaction.profiles.email}
                            </Typography>
                          )}
                        </Box>
                      )}
                      <Box
                        component="td"
                        sx={{ p: 1.5, verticalAlign: 'middle', display: { xs: 'none', sm: 'table-cell' } }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                          {transaction.description || '-'}
                        </Typography>
                        {transaction.transaction_type === 'purchase' && metadata?.amount_paid && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mt: 0.25 }}>
                            {metadata.amount_paid}€ bezahlt
                          </Typography>
                        )}
                      </Box>
                      <Box component="td" sx={{ p: 1.5, textAlign: 'right', verticalAlign: 'middle' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: transaction.amount > 0 ? 'success.main' : 'error.main',
                            fontSize: '0.9rem',
                          }}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount}
                        </Typography>
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          p: 1.5,
                          textAlign: 'right',
                          verticalAlign: 'middle',
                          display: { xs: 'none', md: 'table-cell' },
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {formatDate(transaction.created_at)}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ p: 1.5, textAlign: 'center', verticalAlign: 'middle' }}>
                        {hasDetails && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(transaction.id);
                            }}
                            sx={{
                              transition: 'transform 0.2s',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                          >
                            <ChevronDown size={18} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Expandable Details Row */}
                    {hasDetails && isExpanded && (
                      <Box component="tr" key={`${transaction.id}-details`} sx={{ bgcolor: '#f8f9fa' }}>
                        <Box component="td" colSpan={showUserColumn && !isMobile ? 6 : 5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'divider' }}>
                            {/* Purchase Details */}
                            {metadata?.package_id && (
                              <Box sx={{ mb: hasGeminiTokens ? 1.5 : 0 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                                >
                                  Paket-Details:
                                </Typography>
                                <Box
                                  sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}
                                >
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                    ID: {metadata.package_id}
                                  </Typography>
                                  {metadata.amount_paid && (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                      Betrag: {metadata.amount_paid}€
                                    </Typography>
                                  )}
                                  {metadata.credits && (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                      Credits: {metadata.credits}
                                      {metadata.bonus > 0 && ` + ${metadata.bonus} Bonus`}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            )}

                            {/* Gemini Token Details */}
                            {hasGeminiTokens && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                                >
                                  Gemini Token-Verbrauch:
                                </Typography>
                                <Box
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                                    gap: 1.5,
                                  }}
                                >
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      Input
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                      {metadata.gemini_input_tokens?.toLocaleString() || 0}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      Output
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                      {metadata.gemini_output_tokens?.toLocaleString() || 0}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      Total
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.8rem' }}
                                    >
                                      {metadata.gemini_total_tokens?.toLocaleString() || 0}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      Credits
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 700, color: 'success.main', fontSize: '0.8rem' }}
                                    >
                                      {metadata.credits_calculated || Math.abs(transaction.amount)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
