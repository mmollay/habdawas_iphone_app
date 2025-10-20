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
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Send, X, Mail, Users, History, Eye, RefreshCw, Sparkles, Save, FileText, Trash2 } from 'lucide-react';
import { Box as MuiBox } from '@mui/material';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Bold,
  Essentials,
  Italic,
  Paragraph,
  Undo,
  Heading,
  Link,
  List as CKList,
  ListProperties,
  Alignment,
  Font,
  SourceEditing,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { EmailHeader, EmailFooter } from '../../types/email-templates';

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
  const [generating, setGenerating] = useState(false);

  // Email Headers & Footers
  const [emailHeaders, setEmailHeaders] = useState<EmailHeader[]>([]);
  const [emailFooters, setEmailFooters] = useState<EmailFooter[]>([]);

  // Form state
  const [subject, setSubject] = useState('');
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [selectedHeaderId, setSelectedHeaderId] = useState<string>('');
  const [selectedFooterId, setSelectedFooterId] = useState<string>('');
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
    fetchEmailHeaders();
    fetchEmailFooters();
  }, []);

  const fetchEmailHeaders = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('email_headers')
        .select('*')
        .order('is_default', { ascending: false });

      if (fetchError) throw fetchError;
      setEmailHeaders(data || []);

      // Auto-select default header
      const defaultHeader = data?.find(h => h.is_default);
      if (defaultHeader) {
        setSelectedHeaderId(defaultHeader.id);
      }
    } catch (err) {
      console.error('Error fetching email headers:', err);
    }
  };

  const fetchEmailFooters = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('email_footers')
        .select('*')
        .order('is_default', { ascending: false });

      if (fetchError) throw fetchError;
      setEmailFooters(data || []);

      // Auto-select default footer
      const defaultFooter = data?.find(f => f.is_default);
      if (defaultFooter) {
        setSelectedFooterId(defaultFooter.id);
      }
    } catch (err) {
      console.error('Error fetching email footers:', err);
    }
  };

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
            header_id: selectedHeaderId || null,
            footer_id: selectedFooterId || null,
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
            header_id: selectedHeaderId || null,
            footer_id: selectedFooterId || null,
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
      setSelectedHeaderId(template.header_id || '');
      setSelectedFooterId(template.footer_id || '');
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

      // Get header and footer HTML from selected templates
      const selectedHeader = emailHeaders.find(h => h.id === selectedHeaderId);
      const selectedFooter = emailFooters.find(f => f.id === selectedFooterId);

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
            header: selectedHeader?.html_content || header,
            body,
            footer: selectedFooter?.html_content || footer,
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
                <InputLabel shrink>Vorlage laden</InputLabel>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    handleLoadTemplate(e.target.value);
                  }}
                  label="Vorlage laden"
                  disabled={generating || sending}
                  displayEmpty
                  notched
                  renderValue={(value) => {
                    if (!value) {
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <FileText size={16} />
                          <span>Vorlage wählen</span>
                        </Box>
                      );
                    }
                    const template = templates.find(t => t.id === value);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileText size={16} />
                        <span>{template?.name}</span>
                      </Box>
                    );
                  }}
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
          size="small"
          label="Betreff"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="z.B. Neue Features bei HabDaWas"
          sx={{ mb: 3 }}
          disabled={sending || generating}
          inputRef={subjectRef}
          onFocus={() => setLastFocusedField('subject')}
        />

        {/* Header Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Email-Header
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Wiederverwendbaren Header wählen</InputLabel>
            <Select
              value={selectedHeaderId}
              onChange={(e) => setSelectedHeaderId(e.target.value)}
              label="Wiederverwendbaren Header wählen"
              disabled={sending || generating}
            >
              <MenuItem value="">
                <em>Kein Header</em>
              </MenuItem>
              {emailHeaders.map((h) => (
                <MenuItem key={h.id} value={h.id}>
                  {h.name} {h.is_default && '(Standard)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            Wähle einen wiederverwendbaren Header oder verwalte Header in "Email-Templates"
          </Typography>
        </Box>

        {/* Body with CKEditor */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Newsletter-Inhalt *
          </Typography>
          <Box sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            '& .ck-editor__editable': {
              minHeight: '250px !important',
            },
            '& .ck-powered-by, & .ck.ck-powered-by, & .ck-balloon-panel .ck-powered-by': {
              display: 'none !important',
              visibility: 'hidden !important',
              opacity: '0 !important',
              height: '0 !important',
              overflow: 'hidden !important',
            },
            '& .ck-source-editing-area': {
              fontSize: '11px !important',
              lineHeight: '1.4 !important',
              fontFamily: '"Courier New", Courier, monospace !important',
            }
          }}>
            <CKEditor
              editor={ClassicEditor}
              config={{
                licenseKey: 'GPL',
                plugins: [
                  Essentials,
                  Bold,
                  Italic,
                  Paragraph,
                  Undo,
                  Heading,
                  Link,
                  CKList,
                  ListProperties,
                  Alignment,
                  Font,
                  SourceEditing,
                ],
                toolbar: [
                  'sourceEditing',
                  '|',
                  'undo',
                  'redo',
                  '|',
                  'heading',
                  '|',
                  'bold',
                  'italic',
                  '|',
                  'link',
                  '|',
                  'bulletedList',
                  'numberedList',
                  '|',
                  'alignment',
                  '|',
                  'fontSize',
                  'fontColor',
                  'fontBackgroundColor',
                ],
              }}
              data={body}
              onChange={(_, editor) => {
                setBody(editor.getData());
              }}
              disabled={sending || generating}
              onReady={(editor) => {
                // Editor is ready - add custom styling if needed
                const editorElement = editor.ui.view.editable.element;
                if (editorElement) {
                  editorElement.style.minHeight = '250px';
                }
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Hauptinhalt des Newsletters. Du kannst Platzhalter wie {'{{user_name}}'} verwenden.
          </Typography>
        </Box>

        {/* Placeholders Section - Compact inline chips with tooltips */}
        <Card sx={{ mb: 3, bgcolor: 'action.hover', p: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', mb: 1 }}>
            Verfügbare Platzhalter
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
              <Tooltip
                key={placeholder.key}
                title={placeholder.description}
                arrow
                placement="top"
              >
                <Chip
                  label={placeholder.key}
                  size="small"
                  onClick={() => insertPlaceholder(placeholder.key)}
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Card>

        {/* Footer Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Email-Footer
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Wiederverwendbaren Footer wählen</InputLabel>
            <Select
              value={selectedFooterId}
              onChange={(e) => setSelectedFooterId(e.target.value)}
              label="Wiederverwendbaren Footer wählen"
              disabled={sending || generating}
            >
              <MenuItem value="">
                <em>Kein Footer</em>
              </MenuItem>
              {emailFooters.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name} {f.is_default && '(Standard)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            Wähle einen wiederverwendbaren Footer mit Abmelde-Link und Impressum
          </Typography>
        </Box>

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
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {/* Header */}
            {selectedHeaderId && (() => {
              const selectedHeader = emailHeaders.find(h => h.id === selectedHeaderId);
              if (selectedHeader) {
                return (
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: replacePlaceholdersForPreview(selectedHeader.html_content),
                    }}
                  />
                );
              }
              return null;
            })()}

            {/* Content Area */}
            <Box sx={{ p: 3 }}>
              {/* Subject */}
              <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', fontWeight: 700 }}>
                {replacePlaceholdersForPreview(subject)}
              </Typography>

              {/* Body */}
              <Box
                sx={{ mb: 3 }}
                dangerouslySetInnerHTML={{
                  __html: replacePlaceholdersForPreview(body),
                }}
              />
            </Box>

            {/* Footer */}
            {selectedFooterId && (() => {
              const selectedFooter = emailFooters.find(f => f.id === selectedFooterId);
              if (selectedFooter) {
                return (
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: replacePlaceholdersForPreview(selectedFooter.html_content),
                    }}
                  />
                );
              }
              return null;
            })()}
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
