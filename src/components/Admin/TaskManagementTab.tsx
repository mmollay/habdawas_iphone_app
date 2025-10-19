import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Menu,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText as MuiListItemText,
  Checkbox,
  Divider,
} from '@mui/material';
import { Plus, CreditCard as Edit, Trash2, Check, X, Clock, AlertCircle, MoreVertical, Calendar, ChevronDown, CheckCircle, Circle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: 'moderation' | 'feature' | 'bug' | 'improvement' | 'documentation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  estimated_hours: number | null;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TodoSection {
  title: string;
  emoji: string;
  priority?: string;
  estimatedHours?: string;
  items: {
    text: string;
    checked: boolean;
    indent: number;
  }[];
  notes?: string[];
}

const TaskManagementTab = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todoSections, setTodoSections] = useState<TodoSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as Task['category'],
    priority: 'medium' as Task['priority'],
    status: 'todo' as Task['status'],
    estimated_hours: '',
    due_date: '',
  });

  useEffect(() => {
    loadTasks();
    loadTodoFile();
  }, []);

  const loadTodoFile = async () => {
    try {
      const response = await fetch('/TODO.md');
      const text = await response.text();
      parseTodoMarkdown(text);
    } catch (error) {
      console.error('Error loading TODO.md:', error);
    }
  };

  const parseTodoMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    const sections: TodoSection[] = [];
    let currentSection: TodoSection | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const sectionMatch = line.match(/^## (.+)$/);
      if (sectionMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        const titleWithEmoji = sectionMatch[1].trim();
        const emojiMatch = titleWithEmoji.match(/^([^\w\s]+)\s+(.+)$/);
        currentSection = {
          title: emojiMatch ? emojiMatch[2] : titleWithEmoji,
          emoji: emojiMatch ? emojiMatch[1] : '📋',
          items: [],
          notes: [],
        };
        continue;
      }

      if (currentSection) {
        const todoMatch = line.match(/^(\s*)- \[([ x])\] (.+)$/);
        if (todoMatch) {
          const indent = Math.floor(todoMatch[1].length / 2);
          currentSection.items.push({
            text: todoMatch[3],
            checked: todoMatch[2] === 'x',
            indent,
          });
          continue;
        }

        const priorityMatch = line.match(/\*\*Priorität:\*\*\s*(.+)$/);
        if (priorityMatch) {
          currentSection.priority = priorityMatch[1];
          continue;
        }

        const hoursMatch = line.match(/\*\*Geschätzter Aufwand:\*\*\s*(.+)$/);
        if (hoursMatch) {
          currentSection.estimatedHours = hoursMatch[1];
          continue;
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    setTodoSections(sections.filter(s => s.items.length > 0));
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler beim Laden: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        status: task.status,
        estimated_hours: task.estimated_hours?.toString() || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        status: 'todo',
        estimated_hours: '',
        due_date: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = async () => {
    if (!formData.title.trim()) {
      setSnackbar({
        open: true,
        message: 'Bitte gib einen Titel ein',
        severity: 'error',
      });
      return;
    }

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        due_date: formData.due_date || null,
      };

      if (editingTask) {
        const { error } = await supabase
          .from('admin_tasks')
          .update(taskData)
          .eq('id', editingTask.id);

        if (error) throw error;
        setSnackbar({
          open: true,
          message: 'Task erfolgreich aktualisiert',
          severity: 'success',
        });
      } else {
        const { error } = await supabase
          .from('admin_tasks')
          .insert([{ ...taskData, created_by: user?.id }]);

        if (error) throw error;
        setSnackbar({
          open: true,
          message: 'Task erfolgreich erstellt',
          severity: 'success',
        });
      }

      handleCloseDialog();
      loadTasks();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Möchtest du diese Aufgabe wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('admin_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: 'Task erfolgreich gelöscht',
        severity: 'success',
      });
      loadTasks();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { error } = await supabase
        .from('admin_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      moderation: 'Moderation',
      feature: 'Feature',
      bug: 'Bug',
      improvement: 'Verbesserung',
      documentation: 'Dokumentation',
      other: 'Sonstiges',
    };
    return labels[category] || category;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'error',
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'info' | 'success' | 'error'> = {
      todo: 'default',
      in_progress: 'info',
      done: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: 'Offen',
      in_progress: 'In Arbeit',
      done: 'Erledigt',
      cancelled: 'Abgebrochen',
    };
    return labels[status] || status;
  };

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter(task => task.status === filterStatus);

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const totalTodoItems = todoSections.reduce((sum, section) => sum + section.items.length, 0);
  const completedTodoItems = todoSections.reduce(
    (sum, section) => sum + section.items.filter(item => item.checked).length,
    0
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Task Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verwalte und überwache System-Aufgaben
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={loadTasks} disabled={loading}>
            <RefreshCw size={20} />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => handleOpenDialog()}
          >
            Neue Aufgabe
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label={`TODO-Liste (${completedTodoItems}/${totalTodoItems})`} />
          <Tab label={`Datenbank Tasks (${taskStats.total})`} />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        <Box>
          {todoSections.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                TODO.md wird geladen...
              </Typography>
            </Paper>
          ) : (
            <Box>
              {todoSections.map((section, index) => (
                <Accordion key={index} defaultExpanded={index < 3}>
                  <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <Typography sx={{ fontSize: '1.5rem' }}>{section.emoji}</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {section.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {section.items.filter(i => i.checked).length} / {section.items.length} erledigt
                          </Typography>
                          {section.priority && (
                            <Chip
                              label={section.priority}
                              size="small"
                              color={
                                section.priority.toLowerCase().includes('high') || section.priority.toLowerCase().includes('urgent')
                                  ? 'error'
                                  : section.priority.toLowerCase().includes('medium')
                                  ? 'warning'
                                  : 'default'
                              }
                              sx={{ height: 20 }}
                            />
                          )}
                          {section.estimatedHours && (
                            <Chip
                              label={section.estimatedHours}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {section.items.map((item, itemIndex) => (
                        <ListItem
                          key={itemIndex}
                          sx={{
                            pl: 2 + item.indent * 3,
                            py: 0.5,
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {item.checked ? (
                              <CheckCircle size={18} color="#4caf50" />
                            ) : (
                              <Circle size={18} color="#9e9e9e" />
                            )}
                          </ListItemIcon>
                          <MuiListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              sx: {
                                textDecoration: item.checked ? 'line-through' : 'none',
                                color: item.checked ? 'text.secondary' : 'text.primary',
                                fontSize: '0.9rem',
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      ) : (
        <Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Gesamt
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {taskStats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Offen
              </Typography>
              <Typography variant="h4" fontWeight={600} color="text.primary">
                {taskStats.todo}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                In Arbeit
              </Typography>
              <Typography variant="h4" fontWeight={600} color="info.main">
                {taskStats.in_progress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Erledigt
              </Typography>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {taskStats.done}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={filterStatus}
          onChange={(_, value) => setFilterStatus(value)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Alle (${taskStats.total})`} value="all" />
          <Tab label={`Offen (${taskStats.todo})`} value="todo" />
          <Tab label={`In Arbeit (${taskStats.in_progress})`} value="in_progress" />
          <Tab label={`Erledigt (${taskStats.done})`} value="done" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titel</TableCell>
              <TableCell>Kategorie</TableCell>
              <TableCell>Priorität</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aufwand</TableCell>
              <TableCell>Fällig am</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Lädt...
                </TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Keine Aufgaben gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {task.title}
                      </Typography>
                      {task.description && (
                        <Typography variant="caption" color="text.secondary">
                          {task.description.substring(0, 60)}
                          {task.description.length > 60 ? '...' : ''}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getCategoryLabel(task.category)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      size="small"
                      color={getPriorityColor(task.priority)}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={task.status}
                        onChange={(e) => handleQuickStatusChange(task.id, e.target.value as Task['status'])}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        <MenuItem value="todo">Offen</MenuItem>
                        <MenuItem value="in_progress">In Arbeit</MenuItem>
                        <MenuItem value="done">Erledigt</MenuItem>
                        <MenuItem value="cancelled">Abgebrochen</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {task.estimated_hours ? `${task.estimated_hours}h` : '-'}
                  </TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={14} />
                        <Typography variant="body2">
                          {new Date(task.due_date).toLocaleDateString('de-DE')}
                        </Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedTask(task);
                      }}
                    >
                      <MoreVertical size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedTask(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedTask) handleOpenDialog(selectedTask);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Edit size={18} />
          </ListItemIcon>
          <ListItemText>Bearbeiten</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedTask) handleDeleteTask(selectedTask.id);
            setAnchorEl(null);
            setSelectedTask(null);
          }}
        >
          <ListItemIcon>
            <Trash2 size={18} />
          </ListItemIcon>
          <ListItemText>Löschen</ListItemText>
        </MenuItem>
      </Menu>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Titel"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={formData.category}
                label="Kategorie"
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Task['category'] })}
              >
                <MenuItem value="moderation">Moderation</MenuItem>
                <MenuItem value="feature">Feature</MenuItem>
                <MenuItem value="bug">Bug</MenuItem>
                <MenuItem value="improvement">Verbesserung</MenuItem>
                <MenuItem value="documentation">Dokumentation</MenuItem>
                <MenuItem value="other">Sonstiges</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priorität</InputLabel>
              <Select
                value={formData.priority}
                label="Priorität"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              >
                <MenuItem value="low">Niedrig</MenuItem>
                <MenuItem value="medium">Mittel</MenuItem>
                <MenuItem value="high">Hoch</MenuItem>
                <MenuItem value="urgent">Dringend</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
              >
                <MenuItem value="todo">Offen</MenuItem>
                <MenuItem value="in_progress">In Arbeit</MenuItem>
                <MenuItem value="done">Erledigt</MenuItem>
                <MenuItem value="cancelled">Abgebrochen</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Geschätzter Aufwand (Stunden)"
              type="number"
              fullWidth
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
            />

            <TextField
              label="Fällig am"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSaveTask} variant="contained">
            {editingTask ? 'Speichern' : 'Erstellen'}
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
    </Box>
  );
};

export default TaskManagementTab;
