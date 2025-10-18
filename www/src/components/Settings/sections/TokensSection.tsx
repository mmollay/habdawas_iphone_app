import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Collapse,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Gift,
  RefreshCw,
  Heart,
  Filter,
  Sparkles,
  Calendar,
  ChevronDown,
  ChevronUp,
  Award,
  User,
  Users,
} from 'lucide-react';
import { useTokens } from '../../../hooks/useTokens';
import { useCreditsStats } from '../../../hooks/useCreditsStats';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../../../utils/formatNumber';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

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

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage' | 'bonus' | 'refund';
  description: string | null;
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
  const { user } = useAuth();
  const { balance, totalEarned, totalSpent, loading, refetch, fetchTransactions } = useTokens();
  const { personalCredits, communityPotBalance, loading: creditsLoading, refetch: refetchCredits } = useCreditsStats();
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'purchase' | 'usage' | 'bonus' | 'refund'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filterAiOnly, setFilterAiOnly] = useState(false);

  // Expandable details state
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  const toggleExpand = (transactionId: string) => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const loadCreditTransactions = async () => {
    if (!user) return;

    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCreditTransactions(data || []);
    } catch (error) {
      console.error('Error loading credit transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    loadCreditTransactions();
  }, [user]);

  // Filter transactions
  const filteredTransactions = creditTransactions.filter(transaction => {
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

    return true;
  });

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
            {creditsLoading ? <CircularProgress size={32} color="inherit" /> : formatNumber(personalCredits)}
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
            {creditsLoading ? <CircularProgress size={28} /> : formatNumber(communityPotBalance)}
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

      {/* Credit Usage Statistics */}
      {creditTransactions.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: '#f8f9fa' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Nutzungsstatistik
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Gesamt gekauft
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                +{creditTransactions.filter(t => t.transaction_type === 'purchase').reduce((sum, t) => sum + t.amount, 0)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Gesamt verbraucht
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                {creditTransactions.filter(t => t.transaction_type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Anzahl Transaktionen
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {creditTransactions.length}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Filters */}
      {creditTransactions.length > 0 && (
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: '#fafafa' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Filter size={18} color="#666" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Filter
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {/* Transaktionstyp Filter */}
            <FormControl size="small" fullWidth>
              <InputLabel id="filter-type-label">Transaktionstyp</InputLabel>
              <Select
                labelId="filter-type-label"
                value={filterType}
                label="Transaktionstyp"
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Filter size={16} />
                    <span>Alle ({creditTransactions.length})</span>
                  </Box>
                </MenuItem>
                <MenuItem value="purchase">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCart size={16} color="#4caf50" />
                    <span>Käufe ({creditTransactions.filter(t => t.transaction_type === 'purchase').length})</span>
                  </Box>
                </MenuItem>
                <MenuItem value="usage">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDown size={16} color="#f44336" />
                    <span>Verbrauch ({creditTransactions.filter(t => t.transaction_type === 'usage').length})</span>
                  </Box>
                </MenuItem>
                <MenuItem value="bonus">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Gift size={16} color="#2196f3" />
                    <span>Bonus ({creditTransactions.filter(t => t.transaction_type === 'bonus').length})</span>
                  </Box>
                </MenuItem>
                <MenuItem value="refund">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RefreshCw size={16} color="#ff9800" />
                    <span>Rückerstattung ({creditTransactions.filter(t => t.transaction_type === 'refund').length})</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* Zeitraum Filter */}
            <FormControl size="small" fullWidth>
              <InputLabel id="filter-period-label">Zeitraum</InputLabel>
              <Select
                labelId="filter-period-label"
                value={filterPeriod}
                label="Zeitraum"
                onChange={(e) => setFilterPeriod(e.target.value as typeof filterPeriod)}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={16} />
                    <span>Alle Zeiträume</span>
                  </Box>
                </MenuItem>
                <MenuItem value="today">Heute</MenuItem>
                <MenuItem value="week">Letzte 7 Tage</MenuItem>
                <MenuItem value="month">Letzte 30 Tage</MenuItem>
              </Select>
            </FormControl>

            {/* AI-Only Filter (nur bei Verbrauch) */}
            {filterType === 'usage' && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filterAiOnly}
                      onChange={(e) => setFilterAiOnly(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Sparkles size={14} />
                      <Typography variant="body2">Nur AI-Inserate</Typography>
                    </Box>
                  }
                />
              </Box>
            )}
          </Box>

          {/* Filter-Zusammenfassung */}
          {(filterType !== 'all' || filterPeriod !== 'all' || filterAiOnly) && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                {filteredTransactions.length} von {creditTransactions.length} Transaktionen
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  setFilterType('all');
                  setFilterPeriod('all');
                  setFilterAiOnly(false);
                }}
                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
              >
                Filter zurücksetzen
              </Button>
            </Box>
          )}
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Credit-Transaktionen
        </Typography>
      </Box>

      {loadingTransactions ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : creditTransactions.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Noch keine Transaktionen vorhanden.
        </Alert>
      ) : filteredTransactions.length === 0 ? (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Keine Transaktionen mit den aktuellen Filtern gefunden. Versuchen Sie, die Filter zurückzusetzen.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {filteredTransactions.map((transaction) => {
            const metadata = transaction.metadata as any;
            const packageType = metadata?.package_type || 'personal';
            const isCommunityDonation = transaction.transaction_type === 'purchase' && packageType === 'community';
            const isExpanded = expandedTransactions.has(transaction.id);
            const hasGeminiTokens = metadata?.gemini_total_tokens > 0;
            const hasDetails = metadata?.package_id || hasGeminiTokens;

            return (
              <Paper
                key={transaction.id}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: isCommunityDonation ? '2px solid' : '1px solid',
                  borderColor: isCommunityDonation ? '#e91e63' : 'divider',
                  bgcolor: isCommunityDonation ? 'rgba(233, 30, 99, 0.02)' : 'white',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: isCommunityDonation ? '0 4px 20px rgba(233, 30, 99, 0.2)' : '0 2px 12px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Community Hero Badge */}
                {isCommunityDonation && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 20,
                      background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      boxShadow: '0 2px 8px rgba(233, 30, 99, 0.3)',
                    }}
                  >
                    <Award size={14} />
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      Community Hero
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      icon={getTransactionIcon(transaction.transaction_type)}
                      label={getTransactionTypeLabel(transaction.transaction_type)}
                      color={getTransactionTypeColor(transaction.transaction_type)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />

                    {/* Community/Personal Badge */}
                    {transaction.transaction_type === 'purchase' && (
                      <Chip
                        icon={packageType === 'community' ? <Users size={12} /> : <User size={12} />}
                        label={packageType === 'community' ? 'Community' : 'Personal'}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: packageType === 'community' ? '#e91e63' : '#667eea',
                          color: packageType === 'community' ? '#e91e63' : '#667eea',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    )}

                    {/* AI Badge for usage transactions */}
                    {transaction.transaction_type === 'usage' && hasGeminiTokens && (
                      <Chip
                        icon={<Sparkles size={12} />}
                        label="AI"
                        size="small"
                        variant="outlined"
                        color="secondary"
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: transaction.amount > 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Credits
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {transaction.description || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(transaction.created_at)}
                    </Typography>
                  </Box>

                  {hasDetails && (
                    <IconButton
                      size="small"
                      onClick={() => toggleExpand(transaction.id)}
                      sx={{
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <ChevronDown size={20} />
                    </IconButton>
                  )}
                </Box>

                {/* Expandable Details */}
                {hasDetails && (
                  <Collapse in={isExpanded}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'divider' }}>
                      {/* Purchase Details */}
                      {metadata?.package_id && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Paket-Details:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Paket-ID: {metadata.package_id}
                          </Typography>
                          {metadata.amount_paid && (
                            <Typography variant="body2" color="text.secondary">
                              Betrag: {metadata.amount_paid}€
                            </Typography>
                          )}
                          {metadata.credits && (
                            <Typography variant="body2" color="text.secondary">
                              Credits: {metadata.credits}
                              {metadata.bonus > 0 && ` + ${metadata.bonus} Bonus`}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Gemini Token Details */}
                      {hasGeminiTokens && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Gemini Token-Verbrauch:
                          </Typography>
                          <Stack spacing={0.5} sx={{ pl: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                Input Tokens:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {metadata.gemini_input_tokens?.toLocaleString() || 0}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                Output Tokens:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {metadata.gemini_output_tokens?.toLocaleString() || 0}
                              </Typography>
                            </Box>
                            <Divider sx={{ my: 0.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Total Tokens:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {metadata.gemini_total_tokens?.toLocaleString() || 0}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Credits berechnet:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {metadata.credits_calculated || Math.abs(transaction.amount)} Credits
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};
