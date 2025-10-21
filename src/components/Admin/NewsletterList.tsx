import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { Calendar, Send, Clock, FileText, Edit, Trash2, Eye, MoreVertical, Play, X, Users, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface Newsletter {
  id: string;
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  created_at: string;
  sent_at?: string;
  scheduled_at?: string;
}

interface NewsletterListProps {
  newsletters: Newsletter[];
  onEdit?: (newsletter: Newsletter) => void;
  onDelete?: (newsletterId: string) => void;
  onSend?: (newsletterId: string) => void;
  onPreview?: (newsletter: Newsletter) => void;
  loading?: boolean;
}

export const NewsletterList = ({
  newsletters,
  onEdit,
  onDelete,
  onSend,
  onPreview,
  loading = false,
}: NewsletterListProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Newsletter['status'] | 'all'>('all');

  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>, newsletter: Newsletter) => {
    e.stopPropagation();
    setSelectedNewsletter(newsletter);
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedNewsletter && onEdit) {
      onEdit(selectedNewsletter);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (selectedNewsletter && onDelete) {
      onDelete(selectedNewsletter.id);
    }
    setDeleteDialogOpen(false);
    setSelectedNewsletter(null);
  };

  const handleSendClick = () => {
    if (selectedNewsletter && onSend) {
      onSend(selectedNewsletter.id);
    }
    handleMenuClose();
  };

  const handlePreviewClick = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
    setPreviewDialogOpen(true);
  };

  const getStatusConfig = (status: Newsletter['status']) => {
    const configs = {
      draft: { label: 'Entwurf', color: 'default' as const, icon: FileText, bgColor: '#f5f5f5' },
      scheduled: { label: 'Geplant', color: 'warning' as const, icon: Clock, bgColor: '#fff3e0' },
      sending: { label: 'Wird gesendet', color: 'info' as const, icon: Send, bgColor: '#e3f2fd' },
      sent: { label: 'Gesendet', color: 'success' as const, icon: Send, bgColor: '#e8f5e9' },
      failed: { label: 'Fehlgeschlagen', color: 'error' as const, icon: X, bgColor: '#ffebee' },
    };
    return configs[status];
  };

  const filteredNewsletters = statusFilter === 'all'
    ? newsletters
    : newsletters.filter(n => n.status === statusFilter);

  const statusCounts = {
    all: newsletters.length,
    draft: newsletters.filter(n => n.status === 'draft').length,
    scheduled: newsletters.filter(n => n.status === 'scheduled').length,
    sent: newsletters.filter(n => n.status === 'sent').length,
    failed: newsletters.filter(n => n.status === 'failed').length,
  };

  return (
    <>
      <Box>
        {/* Filter Tabs */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {(['all', 'draft', 'scheduled', 'sent', 'failed'] as const).map((status) => (
            <Chip
              key={status}
              label={`${status === 'all' ? 'Alle' : getStatusConfig(status as Newsletter['status']).label} (${statusCounts[status]})`}
              onClick={() => setStatusFilter(status)}
              color={statusFilter === status ? 'primary' : 'default'}
              variant={statusFilter === status ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>

        {/* Statistics Legend */}
        <Box sx={{ mb: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap', px: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Users size={12} style={{ color: '#666' }} />
            <Typography variant="caption" color="text.secondary">Empfänger</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Send size={12} style={{ color: '#4caf50' }} />
            <Typography variant="caption" color="text.secondary">Gesendet</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle size={12} style={{ color: '#2e7d32' }} />
            <Typography variant="caption" color="text.secondary">Zugestellt</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Eye size={12} style={{ color: '#1976d2' }} />
            <Typography variant="caption" color="text.secondary">Geöffnet</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Play size={12} style={{ color: '#9c27b0' }} />
            <Typography variant="caption" color="text.secondary">Geklickt</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <XCircle size={12} style={{ color: '#d32f2f' }} />
            <Typography variant="caption" color="text.secondary">Fehlgeschlagen</Typography>
          </Box>
        </Box>

        {/* Newsletter List */}
        {filteredNewsletters.length === 0 ? (
          <Alert severity="info">
            {statusFilter === 'all'
              ? 'Noch keine Newsletter erstellt.'
              : `Keine Newsletter mit Status "${getStatusConfig(statusFilter as Newsletter['status']).label}".`}
          </Alert>
        ) : (
          <Stack spacing={0.5}>
            {filteredNewsletters.map((newsletter, index) => {
              const statusConfig = getStatusConfig(newsletter.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Box
                  key={newsletter.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  {/* Status Icon */}
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: statusConfig.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <StatusIcon size={16} style={{ color: statusConfig.color === 'default' ? '#666' : undefined }} />
                  </Box>

                  {/* Subject & Status */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {newsletter.subject}
                      </Typography>
                      <Chip
                        label={statusConfig.label}
                        color={statusConfig.color}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>

                  {/* Date */}
                  <Box sx={{ width: 140, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="caption" color="text.secondary">
                      {newsletter.status === 'scheduled' && newsletter.scheduled_at ? (
                        format(new Date(newsletter.scheduled_at), 'dd.MM.yy HH:mm', { locale: de })
                      ) : newsletter.sent_at ? (
                        format(new Date(newsletter.sent_at), 'dd.MM.yy HH:mm', { locale: de })
                      ) : (
                        format(new Date(newsletter.created_at), 'dd.MM.yy HH:mm', { locale: de })
                      )}
                    </Typography>
                  </Box>

                  {/* Statistics */}
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0 }}>
                    {/* Recipients */}
                    {newsletter.recipients_count > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 45 }}>
                        <Users size={12} style={{ color: '#666' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {newsletter.recipients_count}
                        </Typography>
                      </Box>
                    )}

                    {/* Sent */}
                    {newsletter.sent_count > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 35 }}>
                        <Send size={12} style={{ color: '#4caf50' }} />
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                          {newsletter.sent_count}
                        </Typography>
                      </Box>
                    )}

                    {/* Delivered */}
                    {newsletter.delivered_count && newsletter.delivered_count > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 35 }}>
                        <CheckCircle size={12} style={{ color: '#2e7d32' }} />
                        <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                          {newsletter.delivered_count}
                        </Typography>
                      </Box>
                    )}

                    {/* Opened */}
                    {newsletter.opened_count && newsletter.opened_count > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 35 }}>
                        <Eye size={12} style={{ color: '#1976d2' }} />
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                          {newsletter.opened_count}
                        </Typography>
                      </Box>
                    )}

                    {/* Clicked */}
                    {newsletter.clicked_count && newsletter.clicked_count > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 35 }}>
                        <Play size={12} style={{ color: '#9c27b0' }} />
                        <Typography variant="caption" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                          {newsletter.clicked_count}
                        </Typography>
                      </Box>
                    )}

                    {/* Failed */}
                    {newsletter.failed_count > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 35 }}>
                        <XCircle size={12} style={{ color: '#d32f2f' }} />
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                          {newsletter.failed_count}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    {/* Preview Button */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewClick(newsletter);
                      }}
                      sx={{ width: 28, height: 28 }}
                      title="Vorschau"
                    >
                      <Eye size={16} />
                    </IconButton>

                    {/* Edit Button - only for drafts and scheduled */}
                    {(newsletter.status === 'draft' || newsletter.status === 'scheduled') && onEdit && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(newsletter);
                        }}
                        sx={{ width: 28, height: 28 }}
                        title="Bearbeiten"
                      >
                        <Edit size={16} />
                      </IconButton>
                    )}

                    {/* Delete Button - for all newsletters */}
                    {onDelete && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNewsletter(newsletter);
                          setDeleteDialogOpen(true);
                        }}
                        sx={{ width: 28, height: 28, color: 'error.main' }}
                        title="Löschen"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    )}

                    {/* More Menu - only if there are additional actions */}
                    {newsletter.status === 'draft' && onSend && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, newsletter)}
                        sx={{ width: 28, height: 28 }}
                        title="Weitere Aktionen"
                      >
                        <MoreVertical size={16} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {selectedNewsletter?.status === 'draft' && onSend && (
          <MenuItem onClick={handleSendClick}>
            <Send size={16} style={{ marginRight: 8 }} />
            Jetzt senden
          </MenuItem>
        )}
        {(selectedNewsletter?.status === 'draft' || selectedNewsletter?.status === 'scheduled') && onEdit && (
          <MenuItem onClick={handleEdit}>
            <Edit size={16} style={{ marginRight: 8 }} />
            Bearbeiten
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <Trash2 size={16} style={{ marginRight: 8 }} />
            Löschen
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Newsletter löschen?
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Möchtest du den Newsletter "<strong>{selectedNewsletter?.subject}</strong>" wirklich löschen?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Trash2 size={18} />}
            onClick={handleDeleteConfirm}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Newsletter-Vorschau
            </Typography>
            <IconButton size="small" onClick={() => setPreviewDialogOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNewsletter && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="overline" color="text.secondary">
                  Betreff
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {selectedNewsletter.subject}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Chip
                    label={getStatusConfig(selectedNewsletter.status).label}
                    color={getStatusConfig(selectedNewsletter.status).color}
                    size="small"
                  />
                  {selectedNewsletter.recipients_count > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedNewsletter.recipients_count} Empfänger
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Box
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.default',
                }}
                dangerouslySetInnerHTML={{ __html: selectedNewsletter.body }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
