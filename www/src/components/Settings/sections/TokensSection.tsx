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
              <Coins size={{ xs: 20, md: 24 }} color="#1a73e8" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, mb: 0.25, fontWeight: 500 }}>
                Personal Credits
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#202124', fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                {creditsLoading ? <CircularProgress size={{ xs: 24, md: 32 }} /> : formatNumber(personalCredits)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, mb: { xs: 1.5, md: 2 }, px: 0.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, display: 'block', mb: 0.25 }}>
                Gekauft
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#34a853', fontSize: { xs: '0.875rem', md: '0.95rem' } }}>
                +{creditTransactions.filter(t => t.transaction_type === 'purchase' && (t.metadata as any)?.package_type !== 'community').reduce((sum, t) => sum + t.amount, 0)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, display: 'block', mb: 0.25 }}>
                Verbraucht
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#5f6368', fontSize: { xs: '0.875rem', md: '0.95rem' } }}>
                {creditTransactions.filter(t => t.transaction_type === 'usage').reduce((sum, t) => sum + Math.abs(t.amount), 0)}
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
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Credits kaufen</Box>
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
              <Heart size={{ xs: 20, md: 24 }} color="#c51162" fill="#c51162" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, mb: 0.25, fontWeight: 500 }}>
                Community-Topf
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, color: '#c51162', fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                {creditsLoading ? <CircularProgress size={{ xs: 24, md: 32 }} /> : formatNumber(communityPotBalance)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ px: 0.5, mb: { xs: 1.5, md: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, display: 'block', mb: 0.25 }}>
              Meine Spenden
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#c51162', fontSize: { xs: '0.875rem', md: '0.95rem' } }}>
              {creditTransactions.filter(t => t.transaction_type === 'purchase' && (t.metadata as any)?.package_type === 'community').reduce((sum, t) => sum + t.amount, 0) || 0} Credits
            </Typography>
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
