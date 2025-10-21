import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  Typography,
  Snackbar,
} from '@mui/material';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';

interface ItemModerationBarProps {
  itemId: string;
  itemStatus: string;
  onStatusChange?: () => void;
}

export const ItemModerationBar = ({ itemId, itemStatus, onStatusChange }: ItemModerationBarProps) => {
  const { hasPermission } = usePermissions();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const canApprove = hasPermission('items.approve');
  const canReject = hasPermission('items.reject');

  if (!canApprove && !canReject) {
    return null;
  }

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('approve_item', {
        item_id: itemId,
      });

      if (error) throw error;

      setSnackbar({ open: true, message: 'Inserat erfolgreich freigegeben', severity: 'success' });
      onStatusChange?.();
    } catch (error: any) {
      setSnackbar({ open: true, message: `Fehler: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setSnackbar({ open: true, message: 'Bitte gib einen Grund für die Ablehnung an', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('reject_item', {
        item_id: itemId,
        reason: rejectReason,
      });

      if (error) throw error;

      setSnackbar({ open: true, message: 'Inserat wurde abgelehnt', severity: 'success' });
      setRejectDialog(false);
      setRejectReason('');
      onStatusChange?.();
    } catch (error: any) {
      setSnackbar({ open: true, message: `Fehler: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Paper
        sx={{
          p: 1.5,
          mb: 2,
          bgcolor: 'rgba(255, 152, 0, 0.08)',
          border: '1px solid',
          borderColor: 'warning.main',
        }}
      >
        <Box display="flex" alignItems="center" gap={0.75} mb={1}>
          <AlertTriangle size={16} style={{ color: '#ed6c02' }} />
          <Typography variant="body2" fontWeight={600}>
            Moderations-Aktionen
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={0.75} mb={1.5}>
          <Typography variant="body2" fontSize="0.8125rem" color="text.secondary">
            Status: <strong>{itemStatus === 'published' ? 'Veröffentlicht' : itemStatus === 'archived' ? 'Archiviert' : itemStatus === 'draft' ? 'Entwurf' : itemStatus}</strong>
          </Typography>
        </Box>

        <Box display="flex" gap={1.5}>
          {canApprove && itemStatus !== 'published' && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircle size={16} />}
              onClick={handleApprove}
              disabled={loading}
              sx={{ textTransform: 'none', fontSize: '0.8125rem', py: 0.5 }}
            >
              Freigeben
            </Button>
          )}

          {canReject && itemStatus === 'published' && (
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<XCircle size={16} />}
              onClick={() => setRejectDialog(true)}
              disabled={loading}
              sx={{ textTransform: 'none', fontSize: '0.8125rem', py: 0.5 }}
            >
              Ablehnen / Sperren
            </Button>
          )}

          {itemStatus === 'archived' && (
            <Alert severity="warning" sx={{ flex: 1, py: 0.25, fontSize: '0.8125rem' }}>
              Dieses Inserat wurde archiviert
            </Alert>
          )}

          {itemStatus === 'published' && (
            <Alert severity="success" sx={{ flex: 1, py: 0.25, fontSize: '0.8125rem' }}>
              Dieses Inserat ist veröffentlicht und öffentlich sichtbar
            </Alert>
          )}
        </Box>
      </Paper>

      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Inserat ablehnen</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bitte gib einen Grund für die Ablehnung an. Der Verkäufer wird benachrichtigt.
          </Typography>
          <TextField
            label="Ablehnungsgrund"
            multiline
            rows={4}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="z.B. Verstößt gegen Nutzungsbedingungen, Unerlaubter Inhalt, Falsche Kategorie..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={loading || !rejectReason.trim()}
          >
            Ablehnen
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
