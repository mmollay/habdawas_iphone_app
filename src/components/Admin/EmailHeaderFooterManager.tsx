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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
} from '@mui/material';
import { Plus, Edit, Trash2, Eye, X, Star, StarOff } from 'lucide-react';
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
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  LinkImage,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

import { supabase } from '../../lib/supabase';
import { EmailHeader, EmailFooter, EmailHeaderInsert, EmailFooterInsert } from '../../types/email-templates';

type TabValue = 'headers' | 'footers';

export const EmailHeaderFooterManager = () => {
  const [currentTab, setCurrentTab] = useState<TabValue>('headers');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Headers State
  const [headers, setHeaders] = useState<EmailHeader[]>([]);
  const [selectedHeader, setSelectedHeader] = useState<EmailHeader | null>(null);

  // Footers State
  const [footers, setFooters] = useState<EmailFooter[]>([]);
  const [selectedFooter, setSelectedFooter] = useState<EmailFooter | null>(null);

  // Dialog State
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EmailHeader | EmailFooter | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHtmlContent, setFormHtmlContent] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);

  useEffect(() => {
    fetchHeaders();
    fetchFooters();
  }, []);

  const fetchHeaders = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('email_headers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setHeaders(data || []);
    } catch (err) {
      console.error('Error fetching headers:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Header');
    } finally {
      setLoading(false);
    }
  };

  const fetchFooters = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('email_footers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFooters(data || []);
    } catch (err) {
      console.error('Error fetching footers:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Footer');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedHeader(null);
    setSelectedFooter(null);
    setFormName('');
    setFormDescription('');
    setFormHtmlContent('');
    setFormIsDefault(false);
    setEditorOpen(true);
  };

  const handleEdit = (item: EmailHeader | EmailFooter) => {
    if (currentTab === 'headers') {
      setSelectedHeader(item as EmailHeader);
    } else {
      setSelectedFooter(item as EmailFooter);
    }
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormHtmlContent(item.html_content);
    setFormIsDefault(item.is_default);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formHtmlContent.trim()) {
      setError('Name und HTML-Inhalt sind Pflichtfelder');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht authentifiziert');

      if (currentTab === 'headers') {
        if (selectedHeader) {
          // Update existing header
          const { error: updateError } = await supabase
            .from('email_headers')
            .update({
              name: formName,
              description: formDescription || null,
              html_content: formHtmlContent,
              is_default: formIsDefault,
            })
            .eq('id', selectedHeader.id);

          if (updateError) throw updateError;
          setSuccess('Header erfolgreich aktualisiert!');
        } else {
          // Create new header
          const newHeader: EmailHeaderInsert = {
            name: formName,
            description: formDescription || null,
            html_content: formHtmlContent,
            is_default: formIsDefault,
            created_by: user.id,
          };

          const { error: insertError } = await supabase
            .from('email_headers')
            .insert(newHeader);

          if (insertError) throw insertError;
          setSuccess('Header erfolgreich erstellt!');
        }
        fetchHeaders();
      } else {
        if (selectedFooter) {
          // Update existing footer
          const { error: updateError } = await supabase
            .from('email_footers')
            .update({
              name: formName,
              description: formDescription || null,
              html_content: formHtmlContent,
              is_default: formIsDefault,
            })
            .eq('id', selectedFooter.id);

          if (updateError) throw updateError;
          setSuccess('Footer erfolgreich aktualisiert!');
        } else {
          // Create new footer
          const newFooter: EmailFooterInsert = {
            name: formName,
            description: formDescription || null,
            html_content: formHtmlContent,
            is_default: formIsDefault,
            created_by: user.id,
          };

          const { error: insertError } = await supabase
            .from('email_footers')
            .insert(newFooter);

          if (insertError) throw insertError;
          setSuccess('Footer erfolgreich erstellt!');
        }
        fetchFooters();
      }

      setEditorOpen(false);
    } catch (err) {
      console.error('Error saving:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      if ('name' in itemToDelete && currentTab === 'headers') {
        const { error: deleteError } = await supabase
          .from('email_headers')
          .delete()
          .eq('id', itemToDelete.id);

        if (deleteError) throw deleteError;
        setSuccess('Header erfolgreich gelöscht!');
        fetchHeaders();
      } else {
        const { error: deleteError } = await supabase
          .from('email_footers')
          .delete()
          .eq('id', itemToDelete.id);

        if (deleteError) throw deleteError;
        setSuccess('Footer erfolgreich gelöscht!');
        fetchFooters();
      }

      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  const handleToggleDefault = async (item: EmailHeader | EmailFooter) => {
    try {
      if (currentTab === 'headers') {
        // First, unset all default headers
        await supabase
          .from('email_headers')
          .update({ is_default: false })
          .neq('id', item.id);

        // Then set this one as default
        const { error: updateError } = await supabase
          .from('email_headers')
          .update({ is_default: !item.is_default })
          .eq('id', item.id);

        if (updateError) throw updateError;
        setSuccess('Standard-Header aktualisiert!');
        fetchHeaders();
      } else {
        // First, unset all default footers
        await supabase
          .from('email_footers')
          .update({ is_default: false })
          .neq('id', item.id);

        // Then set this one as default
        const { error: updateError } = await supabase
          .from('email_footers')
          .update({ is_default: !item.is_default })
          .eq('id', item.id);

        if (updateError) throw updateError;
        setSuccess('Standard-Footer aktualisiert!');
        fetchFooters();
      }
    } catch (err) {
      console.error('Error toggling default:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Ändern des Standards');
    }
  };

  const renderList = () => {
    const items = currentTab === 'headers' ? headers : footers;

    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (items.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Noch keine {currentTab === 'headers' ? 'Header' : 'Footer'} vorhanden. Erstelle deinen ersten!
        </Alert>
      );
    }

    return (
      <List>
        {items.map((item) => (
          <Box key={item.id}>
            <ListItem sx={{ py: 2 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                    {item.is_default && (
                      <Chip
                        label="Standard"
                        size="small"
                        color="primary"
                        icon={<Star size={14} />}
                        sx={{ height: 20 }}
                      />
                    )}
                  </Box>
                }
                secondary={item.description || 'Keine Beschreibung'}
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleDefault(item)}
                    title={item.is_default ? 'Standard entfernen' : 'Als Standard festlegen'}
                  >
                    {item.is_default ? <StarOff size={18} /> : <Star size={18} />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (currentTab === 'headers') {
                        setSelectedHeader(item as EmailHeader);
                      } else {
                        setSelectedFooter(item as EmailFooter);
                      }
                      setPreviewOpen(true);
                    }}
                    title="Vorschau"
                  >
                    <Eye size={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(item)}
                    title="Bearbeiten"
                  >
                    <Edit size={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setItemToDelete(item);
                      setDeleteConfirmOpen(true);
                    }}
                    title="Löschen"
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </Box>
        ))}
      </List>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Email Header & Footer Verwaltung
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Erstelle wiederverwendbare Header und Footer für alle E-Mail-Templates
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleCreate}
        >
          {currentTab === 'headers' ? 'Neuer Header' : 'Neuer Footer'}
        </Button>
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
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label={`Header (${headers.length})`} value="headers" />
          <Tab label={`Footer (${footers.length})`} value="footers" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {renderList()}
        </Box>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedHeader || selectedFooter ? 'Bearbeiten' : 'Neu erstellen'} -{' '}
              {currentTab === 'headers' ? 'Header' : 'Footer'}
            </Typography>
            <IconButton size="small" onClick={() => setEditorOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder={currentTab === 'headers' ? 'z.B. Standard Header' : 'z.B. Standard Footer'}
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            fullWidth
            label="Beschreibung (optional)"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Kurze Beschreibung des Templates"
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            HTML-Inhalt
          </Typography>

          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <CKEditor
              editor={ClassicEditor}
              config={{
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
            />
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              Du kannst Platzhalter wie <code>{'{{unsubscribe_link}}'}</code> verwenden, die beim Versand ersetzt werden.
            </Typography>
          </Alert>
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
              Vorschau
            </Typography>
            <IconButton size="small" onClick={() => setPreviewOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}
            dangerouslySetInnerHTML={{
              __html: (selectedHeader || selectedFooter)?.html_content || '',
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPreviewOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Trash2 size={20} color="#d32f2f" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {currentTab === 'headers' ? 'Header' : 'Footer'} löschen?
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bist du sicher, dass du "<strong>{itemToDelete?.name}</strong>" löschen möchtest?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Diese Aktion kann nicht rückgängig gemacht werden. Templates, die diesen {currentTab === 'headers' ? 'Header' : 'Footer'} verwenden, werden nicht mehr korrekt angezeigt.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => {
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
          }}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Trash2 size={18} />}
            onClick={handleDelete}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
