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
        Mein Guthaben
      </Typography>

      {/* Compact Credits Overview */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Coins size={18} />
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                  Personal Credits
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {creditsLoading ? <CircularProgress size={28} color="inherit" /> : formatNumber(personalCredits)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Verfügbar für Inserate
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mb: 0.5 }}>
                Gekauft
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                +{creditTransactions.filter(t => t.transaction_type === 'purchase' && (t.metadata as any)?.package_type !== 'community').reduce((sum, t) => sum + t.amount, 0)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1, mb: 0.5 }}>
                Verbraucht
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                -{creditTransactions.filter(t => t.transaction_type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0)}
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
              py: 1,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Credits kaufen
          </Button>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '2px solid rgba(233, 30, 99, 0.3)',
            bgcolor: 'rgba(233, 30, 99, 0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Heart size={18} color="#e91e63" />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Community-Topf
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#e91e63', mb: 0.5 }}>
                {creditsLoading ? <CircularProgress size={28} /> : formatNumber(communityPotBalance)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Kostenlose Inserate für alle
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Meine Spenden
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#e91e63' }}>
                {creditTransactions.filter(t => t.transaction_type === 'purchase' && (t.metadata as any)?.package_type === 'community').reduce((sum, t) => sum + t.amount, 0) || 0}
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
              py: 1,
              borderColor: '#e91e63',
              color: '#e91e63',
              '&:hover': {
                borderColor: '#c2185b',
                bgcolor: 'rgba(233, 30, 99, 0.08)',
              },
            }}
          >
            Community spenden
          </Button>
        </Paper>
      </Box>

      {/* Compact Filters */}
      {creditTransactions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Transaktionen
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
                ({filteredTransactions.length})
              </Typography>
            </Typography>
            {(filterType !== 'all' || filterPeriod !== 'all' || filterAiOnly) && (
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
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Transaktionstyp Filter */}
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
              </Select>
            </FormControl>

            {/* Zeitraum Filter */}
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

            {/* AI-Only Filter */}
            {filterType === 'usage' && (
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
                    <Typography variant="body2">Nur AI</Typography>
                  </Box>
                }
              />
            )}
          </Box>
        </Box>
      )}

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
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead" sx={{ bgcolor: '#f8f9fa', borderBottom: '2px solid', borderColor: 'divider' }}>
              <Box component="tr">
                <Box component="th" sx={{ textAlign: 'left', p: 1.5, fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                  Typ
                </Box>
                <Box component="th" sx={{ textAlign: 'left', p: 1.5, fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>
                  Beschreibung
                </Box>
                <Box component="th" sx={{ textAlign: 'right', p: 1.5, fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                  Betrag
                </Box>
                <Box component="th" sx={{ textAlign: 'right', p: 1.5, fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>
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
                      sx={{
                        bgcolor: isCommunityDonation ? 'rgba(233, 30, 99, 0.02)' : 'white',
                        '&:hover': {
                          bgcolor: isCommunityDonation ? 'rgba(233, 30, 99, 0.05)' : '#f8f9fa',
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
                      <Box component="td" sx={{ p: 1.5, verticalAlign: 'middle', display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                          {transaction.description || '-'}
                        </Typography>
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
                      <Box component="td" sx={{ p: 1.5, textAlign: 'right', verticalAlign: 'middle', display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {formatDate(transaction.created_at)}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ p: 1.5, textAlign: 'center', verticalAlign: 'middle' }}>
                        {hasDetails && (
                          <IconButton
                            size="small"
                            onClick={() => toggleExpand(transaction.id)}
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
                        <Box component="td" colSpan={5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'divider' }}>
                            {/* Purchase Details */}
                            {metadata?.package_id && (
                              <Box sx={{ mb: hasGeminiTokens ? 1.5 : 0 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                  Paket-Details:
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
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
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                  Gemini Token-Verbrauch:
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
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
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.8rem' }}>
                                      {metadata.gemini_total_tokens?.toLocaleString() || 0}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      Credits
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main', fontSize: '0.8rem' }}>
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
