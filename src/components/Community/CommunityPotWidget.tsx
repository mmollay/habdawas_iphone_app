import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { Coins, Heart, Info, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { useCommunityStats } from '../../hooks/useCommunityStats';
import { useAuth } from '../../contexts/AuthContext';

interface CommunityPotWidgetProps {
  variant?: 'compact' | 'full';
  onDonate?: () => void;
}

export const CommunityPotWidget = ({ variant = 'compact', onDonate }: CommunityPotWidgetProps) => {
  const { user } = useAuth();
  const { stats, loading, error, refresh } = useCommunityStats();
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error || !stats) {
    return null;
  }

  const isLowBalance = stats.totalBalance < 100;
  const userContribution = stats.userListingsDonated;

  // Compact variant for header/sidebar
  if (variant === 'compact') {
    return (
      <>
        <Paper
          elevation={2}
          sx={{
            p: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={() => setShowDetails(true)}
        >
          <Coins size={20} color={isLowBalance ? '#ed6c02' : '#2e7d32'} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', lineHeight: 1 }}>
              Community-Topf
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '1rem' }}>
              {stats.totalBalance}
            </Typography>
          </Box>
          {userContribution > 0 && (
            <Chip
              label={`+${userContribution}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 18 }}
            />
          )}
        </Paper>

        {/* Details Dialog */}
        <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Coins size={24} />
            Community-Spendentopf
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" onClick={refresh}>
              <RefreshCw size={18} />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              {/* Erklärung */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.50', mb: 2, borderLeft: '4px solid', borderColor: 'info.main' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Info size={20} color="#0288d1" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Wie funktioniert der Community-Topf?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Der Community-Topf ist ein gemeinsamer Pool an Credits. User können Geld spenden, das in Credits umgewandelt wird.
                      Diese Credits werden dann verwendet, um Inserate kostenlos zu finanzieren. So kann jeder ein Inserat erstellen,
                      auch ohne eigene Credits - solange der Topf gefüllt ist! 🎁
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Current Balance */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: isLowBalance ? 'warning.50' : 'success.50', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Credits im Topf
                      <Tooltip title="Jedes Inserat kostet 1 Credit. Aktuell können noch so viele kostenlose Inserate erstellt werden.">
                        <Info size={14} style={{ cursor: 'help' }} />
                      </Tooltip>
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: isLowBalance ? 'warning.main' : 'success.main' }}>
                      {stats.totalBalance}
                    </Typography>
                  </Box>
                  <Tooltip title={isLowBalance ? 'Weniger als 100 Credits - bitte spenden!' : 'Über 100 Credits - alles im grünen Bereich!'}>
                    <Chip
                      icon={isLowBalance ? <TrendingUp size={16} /> : <Users size={16} />}
                      label={isLowBalance ? 'Niedrig' : 'Gut gefüllt'}
                      color={isLowBalance ? 'warning' : 'success'}
                    />
                  </Tooltip>
                </Box>
              </Paper>

              <Divider sx={{ my: 2 }} />

              {/* User Contribution */}
              {user && userContribution > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Heart size={16} /> Dein Beitrag
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.100', flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Gespendete Inserate
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {userContribution}
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.100', flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Gespendet
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {stats.userDonationAmount.toFixed(2)} €
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              )}

              {/* Community Stats */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp size={16} /> Community-Statistik
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.100' }}>
                    <Tooltip title="Anzahl der User, die bereits gespendet haben">
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                        Aktive Spender
                        <Info size={12} />
                      </Typography>
                    </Tooltip>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {stats.activeDonors}
                    </Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.100' }}>
                    <Tooltip title="Anzahl der Credits, die bereits für kostenlose Inserate verwendet wurden">
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                        Credits verwendet
                        <Info size={12} />
                      </Typography>
                    </Tooltip>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {stats.totalListingsFinanced}
                    </Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.100' }}>
                    <Tooltip title="Gesamtbetrag aller Spenden in Euro">
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                        Spenden gesamt
                        <Info size={12} />
                      </Typography>
                    </Tooltip>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {stats.totalDonationAmount.toFixed(2)} €
                    </Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.100' }}>
                    <Tooltip title="Anzahl der Spendenvorgänge">
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                        Spendenvorgänge
                        <Info size={12} />
                      </Typography>
                    </Tooltip>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {stats.totalDonations}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setShowDetails(false)}>
              Schließen
            </Button>
            {user && onDonate && (
              <Button
                variant="contained"
                startIcon={<Heart size={18} />}
                onClick={() => {
                  setShowDetails(false);
                  onDonate();
                }}
              >
                Jetzt spenden
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Full variant for dashboard page
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Coins size={28} color={isLowBalance ? '#ed6c02' : '#2e7d32'} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Community-Spendentopf
          </Typography>
        </Box>
        <Tooltip title="Aktualisieren">
          <IconButton size="small" onClick={refresh}>
            <RefreshCw size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Erklärung */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.50', mb: 2, borderLeft: '4px solid', borderColor: 'info.main' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Info size={20} color="#0288d1" style={{ flexShrink: 0, marginTop: 2 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Wie funktioniert der Community-Topf?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Der Community-Topf ist ein gemeinsamer Pool an Credits. User können Geld spenden, das in Credits umgewandelt wird.
              Diese Credits werden dann verwendet, um Inserate kostenlos zu finanzieren. So kann jeder ein Inserat erstellen,
              auch ohne eigene Credits - solange der Topf gefüllt ist! 🎁
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Current Balance */}
      <Paper elevation={0} sx={{ p: 3, bgcolor: isLowBalance ? 'warning.50' : 'success.50', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              Credits im Topf
              <Tooltip title="Jedes Inserat kostet 1 Credit. Aktuell können noch so viele kostenlose Inserate erstellt werden.">
                <Info size={14} style={{ cursor: 'help' }} />
              </Tooltip>
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 700, color: isLowBalance ? 'warning.main' : 'success.main' }}>
              {stats.totalBalance}
            </Typography>
          </Box>
          <Tooltip title={isLowBalance ? 'Weniger als 100 Credits - bitte spenden!' : 'Über 100 Credits - alles im grünen Bereich!'}>
            <Chip
              icon={isLowBalance ? <TrendingUp size={20} /> : <Users size={20} />}
              label={isLowBalance ? 'Niedrig - Bitte spenden!' : 'Gut gefüllt'}
              color={isLowBalance ? 'warning' : 'success'}
              sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
            />
          </Tooltip>
        </Box>
      </Paper>

      {/* Rest of full variant content... */}
      {user && onDonate && (
        <Button
          variant="contained"
          startIcon={<Heart size={20} />}
          onClick={onDonate}
          fullWidth
          size="large"
        >
          Zum Community-Topf beitragen
        </Button>
      )}
    </Paper>
  );
};
