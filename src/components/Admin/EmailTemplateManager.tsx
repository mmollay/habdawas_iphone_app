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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Edit, Eye, X, RefreshCw, Code, Mail, Check } from 'lucide-react';
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
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

import { supabase } from '../../lib/supabase';
import {
  EmailTemplate,
  EmailHeader,
  EmailFooter,
  COMMON_TEMPLATE_VARIABLES,
} from '../../types/email-templates';
import { useNewsletterSettingsAutoSave } from '../../hooks/useNewsletterSettingsAutoSave';

export const EmailTemplateManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [headers, setHeaders] = useState<EmailHeader[]>([]);
  const [footers, setFooters] = useState<EmailFooter[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Dialog State
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(false);

  // Form State
  const [formSubject, setFormSubject] = useState('');
  const [formHtmlContent, setFormHtmlContent] = useState('');
  const [formHeaderId, setFormHeaderId] = useState<string>('');
  const [formFooterId, setFormFooterId] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState(true);

  // System Email Settings State
  const [systemFromName, setSystemFromName] = useState('HabDaWas');
  const [systemFromEmail, setSystemFromEmail] = useState('auth@habdawas.at');
  const { status: autoSaveStatus, lastSaved, saveSetting } = useNewsletterSettingsAutoSave({ enabled: true, debounceMs: 1000 });

  useEffect(() => {
    fetchTemplates();
    fetchHeaders();
    fetchFooters();
    fetchSystemEmailSettings();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('email_templates')
        .select(`
          *,
          header:email_headers!header_id(*),
          footer:email_footers!footer_id(*)
        `)
        .order('type');

      if (fetchError) throw fetchError;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeaders = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('email_headers')
        .select('*')
        .order('is_default', { ascending: false });

      if (fetchError) throw fetchError;
      setHeaders(data || []);
    } catch (err) {
      console.error('Error fetching headers:', err);
    }
  };

  const fetchFooters = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('email_footers')
        .select('*')
        .order('is_default', { ascending: false });

      if (fetchError) throw fetchError;
      setFooters(data || []);
    } catch (err) {
      console.error('Error fetching footers:', err);
    }
  };

  const fetchSystemEmailSettings = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('newsletter_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['system_email_from_name', 'system_email_from_email']);

      if (fetchError) throw fetchError;

      data?.forEach(setting => {
        // setting_value is JSONB, so it's already parsed by Supabase client
        const value = setting.setting_value;

        if (setting.setting_key === 'system_email_from_name') {
          setSystemFromName(value);
        } else if (setting.setting_key === 'system_email_from_email') {
          setSystemFromEmail(value);
        }
      });
    } catch (err) {
      console.error('Error fetching system email settings:', err);
    }
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

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormSubject(template.subject);
    setFormHtmlContent(template.html_content);
    setFormHeaderId(template.header_id || '');
    setFormFooterId(template.footer_id || '');
    setFormIsActive(template.is_active);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    if (!formSubject.trim() || !formHtmlContent.trim()) {
      setError('Betreff und HTML-Inhalt sind Pflichtfelder');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('email_templates')
        .update({
          subject: formSubject,
          html_content: formHtmlContent,
          header_id: formHeaderId || null,
          footer_id: formFooterId || null,
          is_active: formIsActive,
        })
        .eq('id', selectedTemplate.id);

      if (updateError) throw updateError;

      setSuccess('Template erfolgreich aktualisiert!');
      setEditorOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const getFullPreviewHtml = (template: EmailTemplate): string => {
    const header = template.header || headers.find(h => h.id === template.header_id);
    const footer = template.footer || footers.find(f => f.id === template.footer_id);

    let fullHtml = '';

    if (header) {
      fullHtml += header.html_content;
    }

    fullHtml += template.html_content;

    if (footer) {
      fullHtml += footer.html_content;
    }

    // Replace placeholders with example data
    return fullHtml
      .replace(/\{\{user_name\}\}/g, 'Max Mustermann')
      .replace(/\{\{first_name\}\}/g, 'Max')
      .replace(/\{\{email\}\}/g, 'max@example.com')
      .replace(/\{\{verification_link\}\}/g, 'https://habdawas.at/verify?token=example')
      .replace(/\{\{reset_link\}\}/g, 'https://habdawas.at/reset?token=example')
      .replace(/\{\{unsubscribe_link\}\}/g, 'https://habdawas.at/settings')
      .replace(/\{\{item_title\}\}/g, 'iPhone 13 Pro')
      .replace(/\{\{item_price\}\}/g, '€ 599,00')
      .replace(/\{\{order_number\}\}/g, '#12345');
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      password_reset: 'Passwort zurücksetzen',
      email_verification: 'E-Mail-Verifizierung',
      welcome: 'Willkommens-Email',
      order_confirmation: 'Bestellbestätigung',
      order_shipped: 'Versandbestätigung',
      order_delivered: 'Zustellungsbestätigung',
      message_notification: 'Nachrichtenbenachrichtigung',
      item_sold: 'Artikel verkauft',
      item_purchased: 'Artikel gekauft',
      account_suspended: 'Konto gesperrt',
      account_deleted: 'Konto gelöscht',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    if (type.includes('password') || type.includes('verification')) return 'primary';
    if (type.includes('welcome')) return 'success';
    if (type.includes('order')) return 'info';
    if (type.includes('suspended') || type.includes('deleted')) return 'error';
    if (type.includes('message')) return 'secondary';
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            System-Email-Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verwalte Templates für automatische System-E-Mails (Passwort-Reset, Verifizierung, etc.)
          </Typography>
        </Box>
        <IconButton onClick={fetchTemplates} disabled={loading}>
          <RefreshCw size={20} />
        </IconButton>
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

      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : templates.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            Keine Email-Templates vorhanden. Bitte prüfe die Datenbank-Migration.
          </Alert>
        ) : (
          <List>
            {templates.map((template, index) => (
              <Box key={template.id}>
                <ListItem sx={{ py: 2 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {template.name}
                        </Typography>
                        <Chip
                          label={getTypeLabel(template.type)}
                          size="small"
                          color={getTypeColor(template.type)}
                          sx={{ height: 20 }}
                        />
                        {!template.is_active && (
                          <Chip label="Inaktiv" size="small" color="default" sx={{ height: 20 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="caption" color="text.secondary" component="span">
                          Betreff: {template.subject}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary" component="span">
                          Variablen: {Array.isArray(template.variables) ? template.variables.join(', ') : 'Keine'}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setVariablesOpen(true);
                        }}
                        title="Verfügbare Variablen"
                      >
                        <Code size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handlePreview(template)}
                        title="Vorschau"
                      >
                        <Eye size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(template)}
                        title="Bearbeiten"
                      >
                        <Edit size={18} />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < templates.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>

      {/* System Email Sender Settings */}
      <Card sx={{ mt: 3, position: 'relative' }}>
        {/* Auto-Save Status Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
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

        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={20} style={{ color: '#1565c0' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Absender-Einstellungen für System-Emails
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Name und E-Mail-Adresse für Passwort-Reset, Verifizierung, etc.
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Absender-Name"
                value={systemFromName}
                onChange={(e) => {
                  const value = e.target.value;
                  setSystemFromName(value);
                  saveSetting('system_email_from_name', value);
                }}
                helperText="Name, der in System-Emails als Absender angezeigt wird"
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Absender-E-Mail"
                value={systemFromEmail}
                onChange={(e) => {
                  const value = e.target.value;
                  setSystemFromEmail(value);
                  saveSetting('system_email_from_email', value);
                }}
                helperText="E-Mail-Adresse für System-Emails (muss in Resend verifiziert sein)"
                size="small"
                inputProps={{ inputMode: 'email' }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2" component="div">
                  <strong>Wichtig:</strong> Die E-Mail-Adresse muss in deinem Resend-Account verifiziert sein.
                  Standardmäßig verwendet Supabase Auth diese Einstellungen für alle System-Emails.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedTemplate?.name} bearbeiten
            </Typography>
            <IconButton size="small" onClick={() => setEditorOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Row 1: Betreff (full width) */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Betreff"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="E-Mail-Betreff"
                size="small"
              />
            </Grid>

            {/* Row 2: Header + Footer + Template aktiv Toggle */}
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Header</InputLabel>
                <Select
                  value={formHeaderId}
                  onChange={(e) => setFormHeaderId(e.target.value)}
                  label="Header"
                >
                  <MenuItem value="">
                    <em>Kein Header</em>
                  </MenuItem>
                  {headers.map((header) => (
                    <MenuItem key={header.id} value={header.id}>
                      {header.name} {header.is_default && '(Standard)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Footer</InputLabel>
                <Select
                  value={formFooterId}
                  onChange={(e) => setFormFooterId(e.target.value)}
                  label="Footer"
                >
                  <MenuItem value="">
                    <em>Kein Footer</em>
                  </MenuItem>
                  {footers.map((footer) => (
                    <MenuItem key={footer.id} value={footer.id}>
                      {footer.name} {footer.is_default && '(Standard)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                justifyContent: { xs: 'flex-start', md: 'flex-end' }
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                    />
                  }
                  label="Template aktiv"
                />
              </Box>
            </Grid>

            {/* Row 3: Verfügbare Variablen Info */}
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ py: 0.5 }}>
                <Typography variant="caption" component="span">
                  Verfügbare Variablen: {selectedTemplate?.variables && Array.isArray(selectedTemplate.variables)
                    ? selectedTemplate.variables.map(v => `{{${v}}}`).join(', ')
                    : 'Keine'}
                </Typography>
              </Alert>
            </Grid>

            {/* Row 4: E-Mail-Inhalt Editor */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                E-Mail-Inhalt (HTML)
              </Typography>

              <Box sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                '& .ck-editor__editable': {
                  minHeight: '250px !important',
                  fontSize: '13px !important',
                },
                '& .ck-powered-by': {
                  display: 'none !important',
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
                    ],
                    toolbar: [
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
                  data={formHtmlContent}
                  onChange={(_, editor) => {
                    setFormHtmlContent(editor.getData());
                  }}
                  onReady={(editor) => {
                    const editorElement = editor.ui.view.editable.element;
                    if (editorElement) {
                      editorElement.style.minHeight = '250px';
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditorOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Vorschau: {selectedTemplate?.name}
            </Typography>
            <IconButton size="small" onClick={() => setPreviewOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Diese Vorschau zeigt Beispieldaten für Platzhalter.
          </Alert>

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Betreff: {selectedTemplate?.subject}
          </Typography>

          <Box
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
            dangerouslySetInnerHTML={{
              __html: selectedTemplate ? getFullPreviewHtml(selectedTemplate) : '',
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPreviewOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Variables Dialog */}
      <Dialog open={variablesOpen} onClose={() => setVariablesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Verfügbare Variablen
            </Typography>
            <IconButton size="small" onClick={() => setVariablesOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Diese Variablen werden beim Versand automatisch mit echten Daten ersetzt.
          </Alert>
          <List>
            {COMMON_TEMPLATE_VARIABLES.map((variable, index) => (
              <Box key={variable.key}>
                <ListItem>
                  <ListItemText
                    primary={
                      <code style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {variable.key}
                      </code>
                    }
                    secondary={variable.description}
                  />
                </ListItem>
                {index < COMMON_TEMPLATE_VARIABLES.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setVariablesOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
