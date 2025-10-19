import { useState, useEffect, useRef } from 'react';
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
  Collapse,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Send, X, Mail, Users, History, Eye, RefreshCw, Sparkles, ChevronDown, ChevronUp, Save, FileText, Trash2 } from 'lucide-react';
import { Box as MuiBox } from '@mui/material';
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

interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  header: string;
  body: string;
  footer: string;
  created_at: string;
}

const AVAILABLE_PLACEHOLDERS = [
  { key: '{{name}}', description: 'Vollständiger Name des Empfängers' },
  { key: '{{first_name}}', description: 'Vorname des Empfängers' },
  { key: '{{email}}', description: 'E-Mail-Adresse' },
  { key: '{{unsubscribe_link}}', description: 'Link zum Abmelden' },
];

export const NewsletterManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [placeholdersExpanded, setPlaceholdersExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Refs for text fields to track cursor position
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const headerRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const footerRef = useRef<HTMLTextAreaElement | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'header' | 'body' | 'footer'>('body');

  // Template state
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateToOverwrite, setTemplateToOverwrite] = useState<string>(''); // 'new' or template ID
  const [deleteTemplateOpen, setDeleteTemplateOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string>('');

  useEffect(() => {
    fetchSubscribersCount();
    fetchNewsletters();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('newsletter_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleSaveTemplate = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Betreff und Nachricht dürfen nicht leer sein');
      return;
    }

    if (templateToOverwrite === 'new' && !templateName.trim()) {
      setError('Bitte gib einen Namen für die neue Vorlage ein');
      return;
    }

    if (!templateToOverwrite) {
      setError('Bitte wähle eine Option aus');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht authentifiziert');

      if (templateToOverwrite === 'new') {
        // Create new template
        const { error: insertError } = await supabase
          .from('newsletter_templates')
          .insert({
            name: templateName,
            subject,
            header,
            body,
            footer,
            created_by: user.id,
          });

        if (insertError) throw insertError;
        setSuccess('✨ Vorlage erfolgreich erstellt!');
      } else {
        // Update existing template
        const { error: updateError } = await supabase
          .from('newsletter_templates')
          .update({
            subject,
            header,
            body,
            footer,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateToOverwrite);

        if (updateError) throw updateError;

        const template = templates.find(t => t.id === templateToOverwrite);
        setSuccess(`✨ Vorlage "${template?.name}" erfolgreich aktualisiert!`);
      }

      setTemplateName('');
      setTemplateToOverwrite('');
      setSaveTemplateOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Vorlage');
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setHeader(template.header || '');
      setBody(template.body);
      setFooter(template.footer || '');
      setSuccess(`Vorlage "${template.name}" geladen`);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const { error: deleteError } = await supabase
        .from('newsletter_templates')
        .delete()
        .eq('id', templateToDelete);

      if (deleteError) throw deleteError;

      const template = templates.find(t => t.id === templateToDelete);
      setSuccess(`🗑️ Vorlage "${template?.name}" erfolgreich gelöscht!`);
      setDeleteTemplateOpen(false);
      setTemplateToDelete('');
      setSelectedTemplate('');
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Vorlage');
    }
  };

  const handleGenerateWithAI = async () => {
    try {
      setGenerating(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Nicht authentifiziert');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-newsletter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Fehler bei der KI-Generierung');
      }

      setSubject(result.subject);
      setHeader(result.header || '');
      setBody(result.body);
      setFooter(result.footer || '');
      setSuccess('✨ Newsletter erfolgreich mit KI generiert!');
    } catch (err) {
      console.error('Error generating newsletter:', err);
      if (err instanceof Error && err.message === 'Failed to fetch') {
        setError(
          '⚠️ Edge Function nicht erreichbar. Bitte stelle sicher, dass die "generate-newsletter" ' +
          'Edge Function deployed ist und der GOOGLE_GEMINI_API_KEY gesetzt ist. ' +
          'Siehe Deployment-Anleitung für Details.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Fehler bei der KI-Generierung');
      }
    } finally {
      setGenerating(false);
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
            header,
            body,
            footer,
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
      setHeader('');
      setBody('');
      setFooter('');

      // Refresh newsletters list
      fetchNewsletters();
    } catch (err) {
      console.error('Error sending newsletter:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Versenden');
    } finally {
      setSending(false);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    // Insert placeholder at cursor position in the last focused field
    switch (lastFocusedField) {
      case 'subject': {
        const ref = subjectRef.current;
        if (ref) {
          const start = ref.selectionStart || 0;
          const end = ref.selectionEnd || 0;
          const newValue = subject.substring(0, start) + placeholder + subject.substring(end);
          setSubject(newValue);
          // Set cursor position after placeholder
          setTimeout(() => {
            ref.focus();
            ref.setSelectionRange(start + placeholder.length, start + placeholder.length);
          }, 0);
        } else {
          setSubject(subject + placeholder);
        }
        break;
      }
      case 'header': {
        const ref = headerRef.current;
        if (ref) {
          const start = ref.selectionStart || 0;
          const end = ref.selectionEnd || 0;
          const newValue = header.substring(0, start) + placeholder + header.substring(end);
          setHeader(newValue);
          setTimeout(() => {
            ref.focus();
            ref.setSelectionRange(start + placeholder.length, start + placeholder.length);
          }, 0);
        } else {
          setHeader(header + placeholder);
        }
        break;
      }
      case 'body': {
        const ref = bodyRef.current;
        if (ref) {
          const start = ref.selectionStart || 0;
          const end = ref.selectionEnd || 0;
          const newValue = body.substring(0, start) + placeholder + body.substring(end);
          setBody(newValue);
          setTimeout(() => {
            ref.focus();
            ref.setSelectionRange(start + placeholder.length, start + placeholder.length);
          }, 0);
        } else {
          setBody(body + placeholder);
        }
        break;
      }
      case 'footer': {
        const ref = footerRef.current;
        if (ref) {
          const start = ref.selectionStart || 0;
          const end = ref.selectionEnd || 0;
          const newValue = footer.substring(0, start) + placeholder + footer.substring(end);
          setFooter(newValue);
          setTimeout(() => {
            ref.focus();
            ref.setSelectionRange(start + placeholder.length, start + placeholder.length);
          }, 0);
        } else {
          setFooter(footer + placeholder);
        }
        break;
      }
    }
  };

  const replacePlaceholdersForPreview = (text: string): string => {
    return text
      .replace(/\{\{name\}\}/g, 'Max Mustermann')
      .replace(/\{\{first_name\}\}/g, 'Max')
      .replace(/\{\{email\}\}/g, 'max@example.com')
      .replace(/\{\{unsubscribe_link\}\}/g, 'https://habdawas.at/settings');
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
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: subscribersCount === 0 ? 2 : 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={18} style={{ color: '#1565c0' }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              {subscribersCount} Abonnenten
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Empfänger für diesen Newsletter
            </Typography>
          </Box>
        </Box>

        {subscribersCount === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Aktuell gibt es keine Newsletter-Abonnenten. User können sich in ihren Einstellungen für den Newsletter anmelden.
          </Alert>
        )}
      </Card>

      <Card sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Newsletter erstellen
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 240 }} size="small">
                <InputLabel>Vorlage laden</InputLabel>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    handleLoadTemplate(e.target.value);
                  }}
                  label="Vorlage laden"
                  disabled={generating || sending}
                  startAdornment={
                    <FileText size={16} style={{ marginLeft: 8, marginRight: 4, color: '#666' }} />
                  }
                >
                  <MenuItem value="">
                    <em>Keine Vorlage auswählen</em>
                  </MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedTemplate && (
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => {
                    setTemplateToDelete(selectedTemplate);
                    setDeleteTemplateOpen(true);
                  }}
                  disabled={generating || sending}
                  title="Vorlage löschen"
                >
                  <Trash2 size={18} />
                </IconButton>
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <Sparkles size={18} />}
              onClick={handleGenerateWithAI}
              disabled={generating}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5568d3 30%, #6a3f91 90%)',
                }
              }}
            >
              {generating ? 'Generiere...' : 'Mit KI generieren'}
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Betreff"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="z.B. Neue Features bei HabDaWas"
          sx={{ mb: 2 }}
          disabled={sending || generating}
          inputRef={subjectRef}
          onFocus={() => setLastFocusedField('subject')}
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Header (optional)"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          placeholder="z.B. HabDaWas - Deine Community-Plattform"
          helperText="Erscheint ganz oben im Newsletter (z.B. Logo-Text, Begrüßung)"
          sx={{ mb: 2 }}
          disabled={sending || generating}
          inputRef={headerRef}
          onFocus={() => setLastFocusedField('header')}
        />

        <TextField
          fullWidth
          multiline
          rows={10}
          label="Nachricht"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Schreibe hier deine Newsletter-Nachricht oder nutze die KI-Generierung..."
          helperText="Hauptinhalt des Newsletters. Du kannst Platzhalter verwenden (siehe unten)."
          sx={{ mb: 2 }}
          disabled={sending || generating}
          inputRef={bodyRef}
          onFocus={() => setLastFocusedField('body')}
        />

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Footer (optional - empfohlen für DSGVO-Konformität)"
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
          placeholder={`z.B.:\n\nDu erhältst diese E-Mail, weil du den HabDaWas-Newsletter abonniert hast.\nZum Abmelden: {{unsubscribe_link}}\n\nHabDaWas GmbH | Musterstraße 1 | 1010 Wien\nImpressum: https://habdawas.at/impressum`}
          helperText="Footer mit Abmelde-Link, Impressum, etc. (wichtig für gesetzliche Anforderungen)"
          sx={{ mb: 2 }}
          disabled={sending || generating}
          inputRef={footerRef}
          onFocus={() => setLastFocusedField('footer')}
        />

        {/* Placeholders Section */}
        <Card sx={{ mb: 2, bgcolor: 'action.hover' }}>
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setPlaceholdersExpanded(!placeholdersExpanded)}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Verfügbare Platzhalter
            </Typography>
            {placeholdersExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Box>
          <Collapse in={placeholdersExpanded}>
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <List dense sx={{ py: 0 }}>
                {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
                  <ListItem
                    key={placeholder.key}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 0.5,
                      py: 0.5,
                      '&:hover': { bgcolor: 'action.selected', cursor: 'pointer' }
                    }}
                    onClick={() => insertPlaceholder(placeholder.key)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={placeholder.key}
                            size="small"
                            sx={{ fontFamily: 'monospace', fontSize: '0.7rem', height: 20 }}
                          />
                          <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                            {placeholder.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  Klicke auf einen Platzhalter, um ihn einzufügen.
                </Typography>
              </Alert>
            </Box>
          </Collapse>
        </Card>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<Eye size={18} />}
            onClick={() => setPreviewOpen(true)}
            disabled={!subject || !body || sending || generating}
          >
            Vorschau
          </Button>
          <Button
            variant="outlined"
            startIcon={<Save size={18} />}
            onClick={() => setSaveTemplateOpen(true)}
            disabled={!subject || !body || sending || generating}
          >
            Als Vorlage speichern
          </Button>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
            onClick={handleSendNewsletter}
            disabled={!subject || !body || sending || subscribersCount === 0 || generating}
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
          <Alert severity="info" sx={{ mb: 3 }}>
            Diese Vorschau zeigt Beispieldaten für Platzhalter. Beim Versand werden die echten Empfängerdaten eingesetzt.
          </Alert>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            {/* Header */}
            {header && (
              <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                <Typography
                  sx={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.4,
                    fontSize: '0.9rem',
                    color: 'text.secondary',
                  }}
                >
                  {replacePlaceholdersForPreview(header)}
                </Typography>
              </Box>
            )}

            {/* Subject */}
            <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', fontWeight: 700 }}>
              {replacePlaceholdersForPreview(subject)}
            </Typography>

            {/* Body */}
            <Typography
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                color: 'text.primary',
                mb: 3,
              }}
            >
              {replacePlaceholdersForPreview(body)}
            </Typography>

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              {footer ? (
                <Typography
                  sx={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.4,
                    fontSize: '0.85rem',
                    color: 'text.secondary',
                  }}
                >
                  {replacePlaceholdersForPreview(footer)}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Du erhältst diese E-Mail, weil du den Newsletter von HabDaWas abonniert hast.<br />
                  <a href="#" style={{ color: '#1976d2' }}>Newsletter-Einstellungen ändern</a>
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPreviewOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Als Vorlage speichern
            </Typography>
            <IconButton size="small" onClick={() => setSaveTemplateOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Erstelle eine neue Vorlage oder überschreibe eine bestehende Vorlage mit dem aktuellen Newsletter-Inhalt.
          </Alert>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Aktion wählen</InputLabel>
            <Select
              value={templateToOverwrite}
              onChange={(e) => setTemplateToOverwrite(e.target.value)}
              label="Aktion wählen"
            >
              <MenuItem value="new">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Save size={16} />
                  Neue Vorlage erstellen
                </Box>
              </MenuItem>
              {templates.length > 0 && (
                <>
                  <MenuItem disabled>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Bestehende Vorlage überschreiben:
                    </Typography>
                  </MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileText size={16} />
                        {template.name}
                      </Box>
                    </MenuItem>
                  ))}
                </>
              )}
            </Select>
          </FormControl>

          {templateToOverwrite === 'new' && (
            <TextField
              fullWidth
              label="Name der neuen Vorlage"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="z.B. Monatsupdate, Feature-Ankündigung"
              autoFocus
            />
          )}

          {templateToOverwrite && templateToOverwrite !== 'new' && (
            <Alert severity="warning">
              Die ausgewählte Vorlage "{templates.find(t => t.id === templateToOverwrite)?.name}" wird mit dem aktuellen Inhalt überschrieben.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => {
            setTemplateName('');
            setTemplateToOverwrite('');
            setSaveTemplateOpen(false);
          }}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTemplate}
            disabled={!templateToOverwrite || (templateToOverwrite === 'new' && !templateName.trim())}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={deleteTemplateOpen} onClose={() => setDeleteTemplateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Trash2 size={20} color="#d32f2f" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Vorlage löschen?
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bist du sicher, dass du die Vorlage "<strong>{templates.find(t => t.id === templateToDelete)?.name}</strong>" löschen möchtest?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => {
            setDeleteTemplateOpen(false);
            setTemplateToDelete('');
          }}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Trash2 size={18} />}
            onClick={handleDeleteTemplate}
          >
            Löschen
          </Button>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Newsletter-Verwaltung
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Versende personalisierte Newsletter an alle Abonnenten
          </Typography>
        </Box>
        <IconButton onClick={() => { fetchNewsletters(); fetchSubscribersCount(); }} disabled={loading}>
          <RefreshCw size={20} />
        </IconButton>
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
