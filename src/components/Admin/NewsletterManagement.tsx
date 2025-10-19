import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { Send, X, Mail, Users, History, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Newsletter {
  id: string;
  subject: string;
  body: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at?: string;
}

export const NewsletterManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);

  // Form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchSubscribersCount();
    fetchNewsletters();
  }, []);

  const fetchSubscribersCount = async () => {
    try {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('newsletter_subscribed', true);

      if (countError) throw countError;
      setSubscribersCount(count || 0);
    } catch (err) {
      console.error('Error fetching subscribers count:', err);
    }
  };

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setNewsletters(data || []);
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Betreff und Nachricht dürfen nicht leer sein');
      return;
    }

    if (subscribersCount === 0) {
      setError('Keine Newsletter-Abonnenten vorhanden');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Nicht authentifiziert');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-newsletter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject,
            body,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Versenden des Newsletters');
      }

      if (result.isSimulated) {
        setSuccess(
          `⚠️ Newsletter wurde simuliert (Resend nicht konfiguriert). ` +
          `Würde an ${result.recipientsCount} Abonnenten gesendet werden.`
        );
      } else {
        setSuccess(
          `Newsletter erfolgreich an ${result.sentCount} von ${result.recipientsCount} Abonnenten gesendet!`
        );
      }

      // Clear form
      setSubject('');
      setBody('');

      // Refresh newsletters list
      fetchNewsletters();
    } catch (err) {
      console.error('Error sending newsletter:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Versenden');
    } finally {
      setSending(false);
    }
  };

  const getStatusChip = (status: Newsletter['status']) => {
    const statusConfig = {
      draft: { label: 'Entwurf', color: 'default' as const },
      sending: { label: 'Wird gesendet', color: 'info' as const },
      sent: { label: 'Gesendet', color: 'success' as const },
      failed: { label: 'Fehlgeschlagen', color: 'error' as const },
    };

    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const renderComposeTab = () => (
    <Box>
      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} style={{ color: '#1976d2' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {subscribersCount} Abonnenten
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Empfänger für diesen Newsletter
            </Typography>
          </Box>
        </Box>

        {subscribersCount === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Aktuell gibt es keine Newsletter-Abonnenten. User können sich in ihren Einstellungen für den Newsletter anmelden.
          </Alert>
        )}
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Newsletter erstellen
        </Typography>

        <TextField
          fullWidth
          label="Betreff"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="z.B. Neue Features bei HabDaWas"
          sx={{ mb: 3 }}
          disabled={sending}
        />

        <TextField
          fullWidth
          multiline
          rows={12}
          label="Nachricht"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Schreibe hier deine Newsletter-Nachricht..."
          helperText="Du kannst Zeilenumbrüche verwenden. HTML wird automatisch formatiert."
          sx={{ mb: 3 }}
          disabled={sending}
        />

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<Eye size={18} />}
            onClick={() => setPreviewOpen(true)}
            disabled={!subject || !body || sending}
          >
            Vorschau
          </Button>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
            onClick={handleSendNewsletter}
            disabled={!subject || !body || sending || subscribersCount === 0}
          >
            {sending ? 'Wird gesendet...' : `An ${subscribersCount} Abonnenten senden`}
          </Button>
        </Box>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Newsletter-Vorschau
            </Typography>
            <IconButton size="small" onClick={() => setPreviewOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>
              {subject}
            </Typography>
            <Typography
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                color: 'text.primary',
              }}
            >
              {body}
            </Typography>
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Du erhältst diese E-Mail, weil du den Newsletter von HabDaWas abonniert hast.<br />
                Newsletter-Einstellungen ändern
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPreviewOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderHistoryTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Versandte Newsletter ({newsletters.length})
        </Typography>
        <IconButton onClick={fetchNewsletters} disabled={loading}>
          <RefreshCw size={20} />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : newsletters.length === 0 ? (
        <Alert severity="info">
          Noch keine Newsletter versendet. Erstelle deinen ersten Newsletter im "Erstellen"-Tab.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Betreff</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Empfänger</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Versendet</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Datum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {newsletters.map((newsletter) => (
                <TableRow key={newsletter.id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {newsletter.subject}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 300,
                      }}
                    >
                      {newsletter.body}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(newsletter.status)}</TableCell>
                  <TableCell>{newsletter.recipients_count}</TableCell>
                  <TableCell>
                    {newsletter.sent_count > 0 ? (
                      <Box>
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          {newsletter.sent_count} ✓
                        </Typography>
                        {newsletter.failed_count > 0 && (
                          <Typography variant="caption" sx={{ color: 'error.main' }}>
                            {newsletter.failed_count} ✗
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(newsletter.sent_at || newsletter.created_at), 'dd.MM.yyyy', { locale: de })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(newsletter.sent_at || newsletter.created_at), 'HH:mm', { locale: de })} Uhr
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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Newsletter-Verwaltung
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Versende Newsletter an alle Abonnenten
        </Typography>
      </Box>

      <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 3 }}>
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Mail size={16} />
              Erstellen
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History size={16} />
              Verlauf ({newsletters.length})
            </Box>
          }
        />
      </Tabs>

      {selectedTab === 0 && renderComposeTab()}
      {selectedTab === 1 && renderHistoryTab()}
    </Box>
  );
};
