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
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Send, X, Mail, Users, History, Eye, RefreshCw, Sparkles, Save, FileText, Trash2, Clock, TestTube, Settings, BarChart, TrendingUp, CheckCircle, XCircle, AlertCircle, Check } from 'lucide-react';
import { useNewsletters } from '../../hooks/useNewsletters';
import { useNewsletterSettings } from '../../hooks/useNewsletterSettings';
import { useNewsletterSettingsAutoSave } from '../../hooks/useNewsletterSettingsAutoSave';
import { useNewsletterLogs } from '../../hooks/useNewsletterLogs';
import { Box as MuiBox } from '@mui/material';
import { NewsletterList } from './NewsletterList';
import { AutoSaveTextField } from '../Common/AutoSaveTextField';
import Grid from '@mui/material/Grid';
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
import { Newsletter } from './NewsletterList';

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
  // Use hooks
  const { newsletters, loading: newslettersLoading, error: newslettersError, refresh: refreshNewsletters, createDraft, scheduleNewsletter, sendNewsletter: sendNewsletterHook, sendTestEmail, updateNewsletter, deleteNewsletter } = useNewsletters();
  const { settings, loading: settingsLoading, updateSetting } = useNewsletterSettings();
  const { logs, loading: logsLoading, stats, refresh: refreshLogs } = useNewsletterLogs({ limit: 1000 });
  const { status: autoSaveStatus, lastSaved, saveSetting } = useNewsletterSettingsAutoSave({ enabled: true, debounceMs: 1000 });

  // Theme and responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscribersCount, setSubscribersCount] = useState(0);
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
  const [currentNewsletterId, setCurrentNewsletterId] = useState<string | null>(null);

  // New features state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmailAddresses, setTestEmailAddresses] = useState<string[]>([]);
  const [testEmailInput, setTestEmailInput] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

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

  // Local settings state for immediate UI updates
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    fetchSubscribersCount();
    fetchTemplates();
    fetchEmailHeaders();
    fetchEmailFooters();
  }, []);

  // Sync local settings with DB settings
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Load test email addresses from settings
  useEffect(() => {
    if (settings) {
      setTestEmailAddresses(settings.testEmailAddresses || []);
    }
  }, [settings]);

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

  const handleSaveDraft = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Betreff und Nachricht dürfen nicht leer sein');
      return;
    }

    try {
      setSending(true);
      setError(null);

      if (currentNewsletterId) {
        // Update existing draft
        await updateNewsletter(currentNewsletterId, {
          subject,
          body,
          status: 'draft',
        });
        setSuccess('✅ Entwurf erfolgreich aktualisiert!');
      } else {
        // Create new draft
        const result = await createDraft(subject, body);
        setCurrentNewsletterId(result?.newsletterId || null);
        setSuccess('✅ Entwurf erfolgreich gespeichert!');
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern des Entwurfs');
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      setError('Bitte wähle Datum und Uhrzeit für den geplanten Versand');
      return;
    }

    const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;

    try {
      setSending(true);
      setError(null);

      if (currentNewsletterId) {
        await scheduleNewsletter(currentNewsletterId, scheduledAt);
      } else {
        // Create draft first, then schedule
        const result = await createDraft(subject, body);
        if (result?.newsletterId) {
          await scheduleNewsletter(result.newsletterId, scheduledAt);
        }
      }

      setSuccess(`📅 Newsletter erfolgreich für ${scheduledDate} um ${scheduledTime} Uhr geplant!`);
      setScheduleDialogOpen(false);

      // Clear form
      setSubject('');
      setBody('');
      setCurrentNewsletterId(null);
      setScheduledDate('');
      setScheduledTime('');
    } catch (err) {
      console.error('Error scheduling newsletter:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Planen des Newsletters');
    } finally {
      setSending(false);
    }
  };

  const handleSendNow = async () => {
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

      if (currentNewsletterId) {
        await sendNewsletterHook(currentNewsletterId);
      } else {
        // Create draft first, then send
        const result = await createDraft(subject, body);
        if (result?.newsletterId) {
          await sendNewsletterHook(result.newsletterId);
        }
      }

      setSuccess(`✅ Newsletter wird an ${subscribersCount} Abonnenten gesendet!`);

      // Clear form
      setSubject('');
      setBody('');
      setCurrentNewsletterId(null);
    } catch (err) {
      console.error('Error sending newsletter:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Versenden');
    } finally {
      setSending(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmailAddresses.length) {
      setError('Bitte füge mindestens eine Test-E-Mail-Adresse hinzu');
      return;
    }

    try {
      setSendingTest(true);
      setError(null);

      // Save as draft first if not already saved
      let newsletterId = currentNewsletterId;
      if (!newsletterId) {
        const result = await createDraft(subject, body);
        newsletterId = result?.newsletterId;
        setCurrentNewsletterId(newsletterId);
      }

      if (newsletterId) {
        await sendTestEmail(newsletterId, testEmailAddresses);
        setSuccess(`✅ Test-E-Mail erfolgreich an ${testEmailAddresses.length} Adresse(n) gesendet!`);
        setTestEmailDialogOpen(false);
      }
    } catch (err) {
      console.error('Error sending test email:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Versenden der Test-E-Mail');
    } finally {
      setSendingTest(false);
    }
  };

  const addTestEmail = () => {
    const email = testEmailInput.trim();
    if (!email) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    if (testEmailAddresses.includes(email)) {
      setError('Diese E-Mail-Adresse wurde bereits hinzugefügt');
      return;
    }

    setTestEmailAddresses([...testEmailAddresses, email]);
    setTestEmailInput('');
  };

  const removeTestEmail = (email: string) => {
    setTestEmailAddresses(testEmailAddresses.filter(e => e !== email));
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


  const renderComposeTab = () => {
    const ContentWrapper = isMobile ? Box : Paper;
    const wrapperProps = isMobile ? {} : { sx: { p: 3 } };

    return (
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
          Newsletter erstellen
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 3 }, display: { xs: 'none', md: 'block' } }}>
          Erstelle und versende personalisierte Newsletter an deine Abonnenten
        </Typography>

        {/* Subscriber Count Card */}
        <Card sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} style={{ color: '#1565c0' }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {subscribersCount} Abonnenten
              </Typography>
              <Typography variant="caption" color="text.secondary">
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

        <ContentWrapper {...wrapperProps}>
          {/* Toolbar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
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

          {/* Form Fields */}
          <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12 }}>
            <AutoSaveTextField
              fieldName="subject"
              fullWidth
              label="Betreff"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z.B. Neue Features bei HabDaWas"
              disabled={sending || generating}
              inputRef={subjectRef}
              onFocus={() => setLastFocusedField('subject')}
              helperText="Der Betreff wird in der E-Mail-Vorschau angezeigt"
            />
          </Grid>

          {/* Header Selection */}
          <Grid size={{ xs: 12, md: 6 }}>
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
              Wähle einen wiederverwendbaren Header
            </Typography>
          </Grid>

          {/* Body with CKEditor */}
          <Grid size={{ xs: 12 }}>
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
          </Grid>

          {/* Footer Selection */}
          <Grid size={{ xs: 12, md: 6 }}>
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
              Wähle einen wiederverwendbaren Footer
            </Typography>
          </Grid>

          {/* Placeholders Section */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ bgcolor: 'action.hover', p: 1.5 }}>
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
          </Grid>
          </Grid>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mt: 3 }}>
              {success}
            </Alert>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', mt: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Eye size={16} />}
                onClick={() => setPreviewOpen(true)}
                disabled={!subject || !body || sending || generating}
              >
                Vorschau
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileText size={16} />}
                onClick={() => setSaveTemplateOpen(true)}
                disabled={!subject || !body || sending || generating}
              >
                Als Vorlage
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Save size={18} />}
                onClick={handleSaveDraft}
                disabled={!subject || !body || sending || generating}
              >
                {currentNewsletterId ? 'Entwurf aktualisieren' : 'Als Entwurf speichern'}
              </Button>
              <Button
                variant="outlined"
                color="info"
                startIcon={<TestTube size={18} />}
                onClick={() => setTestEmailDialogOpen(true)}
                disabled={!subject || !body || sending || generating}
              >
                Test senden
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Clock size={18} />}
                onClick={() => setScheduleDialogOpen(true)}
                disabled={!subject || !body || sending || generating}
              >
                Planen
              </Button>
              <Button
                variant="contained"
                startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
                onClick={handleSendNow}
                disabled={!subject || !body || sending || subscribersCount === 0 || generating}
              >
                {sending ? 'Wird gesendet...' : 'Jetzt senden'}
              </Button>
            </Box>
          </Box>
        </ContentWrapper>

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

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={20} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Newsletter planen
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setScheduleDialogOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Lege fest, wann der Newsletter automatisch versendet werden soll. Der Versand erfolgt im Hintergrund zur geplanten Zeit.
          </Alert>

          <Stack spacing={3}>
            <TextField
              fullWidth
              type="date"
              label="Datum"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
            />
            <TextField
              fullWidth
              type="time"
              label="Uhrzeit"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setScheduleDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Clock size={18} />}
            onClick={handleSchedule}
            disabled={!scheduledDate || !scheduledTime || sending}
          >
            {sending ? 'Wird geplant...' : 'Newsletter planen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onClose={() => setTestEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TestTube size={20} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Test-E-Mail senden
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setTestEmailDialogOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Sende eine Test-E-Mail an die unten aufgeführten Adressen, um das Layout und den Inhalt zu überprüfen.
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="E-Mail-Adresse"
                value={testEmailInput}
                onChange={(e) => setTestEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTestEmail();
                  }
                }}
                placeholder="test@example.com"
              />
              <Button
                variant="outlined"
                onClick={addTestEmail}
                disabled={!testEmailInput.trim()}
              >
                Hinzufügen
              </Button>
            </Box>

            {testEmailAddresses.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Test-Empfänger ({testEmailAddresses.length}):
                </Typography>
                <Stack spacing={1}>
                  {testEmailAddresses.map((email) => (
                    <Box
                      key={email}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">{email}</Typography>
                      <IconButton size="small" onClick={() => removeTestEmail(email)}>
                        <X size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setTestEmailDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={sendingTest ? <CircularProgress size={18} color="inherit" /> : <TestTube size={18} />}
            onClick={handleSendTest}
            disabled={testEmailAddresses.length === 0 || sendingTest}
          >
            {sendingTest ? 'Wird gesendet...' : `Test an ${testEmailAddresses.length} senden`}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    );
  };

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return 'gerade eben';
    if (seconds < 60) return `vor ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `vor ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `vor ${hours}h`;
  };

  const renderSettingsTab = () => {
    const ContentWrapper = isMobile ? Box : Paper;
    const wrapperProps = isMobile ? {} : { sx: { p: 2.5 } };

    return (
      <Box sx={{ position: 'relative' }}>
        {/* Auto-Save Status Indicator - Fixed position top right */}
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 16, md: 80 },
            right: { xs: 16, md: 24 },
            zIndex: 1000,
          }}
        >
          {autoSaveStatus === 'saving' && (
            <Chip
              icon={<CircularProgress size={14} color="inherit" />}
              label="Speichert..."
              size="small"
              sx={{ height: 28 }}
            />
          )}
          {autoSaveStatus === 'saved' && lastSaved && (
            <Chip
              icon={<Check size={14} />}
              label={`Gespeichert ${getRelativeTime(lastSaved)}`}
              size="small"
              color="success"
              sx={{ height: 28 }}
            />
          )}
        </Box>

        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
          Newsletter-Einstellungen
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 3 }, display: { xs: 'none', md: 'block' } }}>
          Konfiguriere die Einstellungen für den Newsletter-Versand
        </Typography>

        {settingsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !settings ? (
          <Alert severity="error">
            Fehler beim Laden der Einstellungen
          </Alert>
        ) : (
          <ContentWrapper {...wrapperProps}>
            <Grid container spacing={{ xs: 1.5, md: 2 }}>
              {/* Versand-Einstellungen */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Versand-Einstellungen
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Batch-Größe"
                  value={localSettings?.batchSize ?? ''}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setLocalSettings(prev => prev ? { ...prev, batchSize: value } : prev);
                    saveSetting('batch_size', value);
                  }}
                  helperText="Anzahl Emails pro Batch"
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Batch-Verzögerung (ms)"
                  value={localSettings?.batchDelayMs ?? ''}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setLocalSettings(prev => prev ? { ...prev, batchDelayMs: value } : prev);
                    saveSetting('batch_delay_ms', value);
                  }}
                  helperText="Wartezeit zwischen Batches"
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Max. Wiederholungen"
                  value={localSettings?.maxRetries ?? ''}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setLocalSettings(prev => prev ? { ...prev, maxRetries: value } : prev);
                    saveSetting('max_retries', value);
                  }}
                  helperText="Anzahl Retry-Versuche"
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Grid>

              {/* Absender-Einstellungen */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Absender-Einstellungen
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Absender-Name"
                  value={localSettings?.fromName ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalSettings(prev => prev ? { ...prev, fromName: value } : prev);
                    saveSetting('from_name', value);
                  }}
                  helperText="Name, der als Absender angezeigt wird"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Absender-E-Mail"
                  value={localSettings?.fromEmail ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalSettings(prev => prev ? { ...prev, fromEmail: value } : prev);
                    saveSetting('from_email', value);
                  }}
                  helperText="E-Mail-Adresse des Absenders"
                  inputProps={{ inputMode: 'email' }}
                />
              </Grid>

              {/* Tracking-Einstellungen */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      E-Mail-Tracking
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Erfasse Öffnungen und Klicks in versendeten Newslettern
                    </Typography>
                  </Box>
                  <Button
                    variant={localSettings?.enableTracking ? 'contained' : 'outlined'}
                    color={localSettings?.enableTracking ? 'success' : 'inherit'}
                    onClick={() => {
                      const newValue = !localSettings?.enableTracking;
                      setLocalSettings(prev => prev ? { ...prev, enableTracking: newValue } : prev);
                      saveSetting('enable_tracking', newValue);
                    }}
                  >
                    {localSettings?.enableTracking ? 'Aktiviert' : 'Deaktiviert'}
                  </Button>
                </Box>
              </Grid>

              {/* Test-E-Mail-Adressen */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Test-E-Mail-Adressen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Standardadressen für Test-E-Mails
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <TextField
                    fullWidth
                    label="E-Mail-Adresse hinzufügen"
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const email = testEmailInput.trim();
                        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          try {
                            const newAddresses = [...(localSettings?.testEmailAddresses || []), email];
                            setLocalSettings(prev => prev ? { ...prev, testEmailAddresses: newAddresses } : prev);
                            await saveSetting('test_email_addresses', newAddresses);
                            setTestEmailInput('');
                            setSuccess('Test-E-Mail-Adresse hinzugefügt');
                          } catch (err) {
                            setError('Fehler beim Hinzufügen der E-Mail-Adresse');
                          }
                        } else {
                          setError('Bitte gib eine gültige E-Mail-Adresse ein');
                        }
                      }
                    }}
                    placeholder="test@example.com"
                  />
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      const email = testEmailInput.trim();
                      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        try {
                          const newAddresses = [...(localSettings?.testEmailAddresses || []), email];
                          setLocalSettings(prev => prev ? { ...prev, testEmailAddresses: newAddresses } : prev);
                          await saveSetting('test_email_addresses', newAddresses);
                          setTestEmailInput('');
                          setSuccess('Test-E-Mail-Adresse hinzugefügt');
                        } catch (err) {
                          setError('Fehler beim Hinzufügen der E-Mail-Adresse');
                        }
                      } else {
                        setError('Bitte gib eine gültige E-Mail-Adresse ein');
                      }
                    }}
                    disabled={!testEmailInput.trim()}
                  >
                    Hinzufügen
                  </Button>
                </Box>

                {localSettings?.testEmailAddresses && localSettings.testEmailAddresses.length > 0 && (
                  <Stack spacing={1}>
                    {localSettings.testEmailAddresses.map((email, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2">{email}</Typography>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            try {
                              const newAddresses = localSettings.testEmailAddresses.filter((_, i) => i !== index);
                              setLocalSettings(prev => prev ? { ...prev, testEmailAddresses: newAddresses } : prev);
                              await saveSetting('test_email_addresses', newAddresses);
                              setSuccess('Test-E-Mail-Adresse entfernt');
                            } catch (err) {
                              setError('Fehler beim Entfernen der E-Mail-Adresse');
                            }
                          }}
                        >
                          <X size={16} />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Grid>

              {/* Messages */}
              {success && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                </Grid>
              )}

              {error && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </ContentWrapper>
        )}
      </Box>
    );
  };

  const renderAnalyticsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Newsletter-Analytics
        </Typography>
        <IconButton onClick={refreshLogs} disabled={logsLoading}>
          <RefreshCw size={20} />
        </IconButton>
      </Box>

      {logsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Statistik-Karten */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {/* Gesamt versendet */}
            <Card sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Send size={20} style={{ color: '#1565c0' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.sent}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Versendet
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Zugestellt */}
            <Card sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={20} style={{ color: '#2e7d32' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.delivered}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Zugestellt
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Geöffnet */}
            <Card sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Eye size={20} style={{ color: '#0277bd' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.opened}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Geöffnet ({stats.openRate}%)
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Geklickt */}
            <Card sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'warning.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={20} style={{ color: '#ed6c02' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.clicked}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Geklickt ({stats.clickRate}%)
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>

          {/* Weitere Statistiken */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {/* Fehlgeschlagen & Bounces */}
            <Card sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <XCircle size={20} style={{ color: '#d32f2f' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.failed + stats.bounced}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fehler & Bounces
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Fehlgeschlagen:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {stats.failed}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Bounces:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {stats.bounced}
                </Typography>
              </Box>
            </Card>

            {/* Performance-Metriken */}
            <Card sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'secondary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BarChart size={20} style={{ color: '#7b1fa2' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Performance
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Gesamt: {stats.total} E-Mails
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Öffnungsrate:
                </Typography>
                <Chip
                  label={`${stats.openRate}%`}
                  size="small"
                  color={Number(stats.openRate) > 20 ? 'success' : 'default'}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Klickrate:
                </Typography>
                <Chip
                  label={`${stats.clickRate}%`}
                  size="small"
                  color={Number(stats.clickRate) > 5 ? 'success' : 'default'}
                />
              </Box>
            </Card>
          </Box>

          {/* Letzte Newsletter-Logs */}
          {logs.length > 0 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Letzte E-Mail-Aktivitäten
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Empfänger</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Versendet</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Geöffnet</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Geklickt</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {log.recipient_name || log.recipient_email}
                          </Typography>
                          {log.recipient_name && (
                            <Typography variant="caption" color="text.secondary">
                              {log.recipient_email}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            size="small"
                            color={
                              log.status === 'delivered' ? 'success' :
                              log.status === 'bounced' || log.status === 'failed' ? 'error' :
                              'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {log.sent_at ? (
                            <Typography variant="body2">
                              {format(new Date(log.sent_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                            </Typography>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {log.opened_at ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CheckCircle size={14} style={{ color: '#2e7d32' }} />
                              <Typography variant="body2">
                                {format(new Date(log.opened_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                              </Typography>
                            </Box>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {log.clicked_at ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TrendingUp size={14} style={{ color: '#ed6c02' }} />
                              <Typography variant="body2">
                                {format(new Date(log.clicked_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                              </Typography>
                            </Box>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {logs.length === 0 && (
            <Alert severity="info">
              Noch keine E-Mail-Aktivitäten vorhanden. Newsletter-Logs werden hier angezeigt, sobald Newsletter versendet wurden.
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );

  const handleEditNewsletter = (newsletter: Newsletter) => {
    // Load newsletter into editor
    setSubject(newsletter.subject);
    setBody(newsletter.body);
    setCurrentNewsletterId(newsletter.id);
    setSelectedTab(0); // Switch to compose tab
  };

  const handleDeleteNewsletter = async (newsletterId: string) => {
    try {
      await deleteNewsletter(newsletterId);
      setSuccess('Newsletter erfolgreich gelöscht');
      refreshNewsletters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  const handleSendNewsletter = async (newsletterId: string) => {
    try {
      await sendNewsletterHook(newsletterId);
      setSuccess('Newsletter wird versendet');
      refreshNewsletters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Versenden');
    }
  };

  const renderHistoryTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Newsletter-Übersicht
        </Typography>
        <IconButton onClick={refreshNewsletters} disabled={newslettersLoading}>
          <RefreshCw size={20} />
        </IconButton>
      </Box>

      {newslettersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : newsletters.length === 0 ? (
        <Alert severity="info">
          Noch keine Newsletter erstellt. Erstelle deinen ersten Newsletter im "Erstellen"-Tab.
        </Alert>
      ) : (
        <NewsletterList
          newsletters={newsletters}
          onEdit={handleEditNewsletter}
          onDelete={handleDeleteNewsletter}
          onSend={handleSendNewsletter}
          loading={newslettersLoading}
        />
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
            Erstelle, plane und versende personalisierte Newsletter
          </Typography>
        </Box>
        <IconButton onClick={() => { refreshNewsletters(); fetchSubscribersCount(); }} disabled={newslettersLoading}>
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
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart size={16} />
              Analytics
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings size={16} />
              Einstellungen
            </Box>
          }
        />
      </Tabs>

      {selectedTab === 0 && renderComposeTab()}
      {selectedTab === 1 && renderHistoryTab()}
      {selectedTab === 2 && renderAnalyticsTab()}
      {selectedTab === 3 && renderSettingsTab()}
    </Box>
  );
};
