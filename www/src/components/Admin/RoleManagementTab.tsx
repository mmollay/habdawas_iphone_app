import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Shield, Users, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAdmin, RoleWithStats } from '../../hooks/useAdmin';

const RoleManagementTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getAllRoles } = useAdmin();
  const [roles, setRoles] = useState<RoleWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await getAllRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
      setSnackbar({ open: true, message: 'Fehler beim Laden der Rollen', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'error';
      case 'moderator':
        return 'warning';
      case 'support':
        return 'info';
      case 'content_reviewer':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Role Cards Overview */}
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
        Rollen-Übersicht
      </Typography>

      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        {roles.map((role) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={role.role_id}>
            <Card
              elevation={1}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                '&:hover': {
                  elevation: 3,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  p: { xs: 2, md: 3 },
                }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <Shield size={24} color={theme.palette.primary.main} style={{ marginRight: 8 }} />
                  <Typography variant="h6" component="div" fontWeight={600}>
                    {role.display_name}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 'auto',
                    minHeight: 40,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {role.description}
                </Typography>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    pt: 2,
                    mt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Users size={16} color={theme.palette.text.secondary} />
                    <Typography variant="body2" fontWeight={500}>
                      {role.user_count}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Key size={16} color={theme.palette.text.secondary} />
                    <Typography variant="body2" fontWeight={500}>
                      {role.permission_count}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Detailed Table */}
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
        Rollen-Details
      </Typography>

      <Paper elevation={1} sx={{ mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rolle</TableCell>
                <TableCell>Beschreibung</TableCell>
                <TableCell align="center">Berechtigungen</TableCell>
                <TableCell align="center">Benutzer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.role_id} hover>
                  <TableCell>
                    <Chip
                      label={role.display_name}
                      color={getRoleColor(role.role_name)}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell align="center">
                    <Chip label={role.permission_count} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={role.user_count} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Information Sections */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Alert severity="info" icon={<AlertCircle size={20} />}>
            <Typography variant="body2" fontWeight={600} mb={1}>
              Verfügbare Rollen und Berechtigungen:
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
              <strong>Administrator:</strong> Vollzugriff auf alle Systemfunktionen inkl. Rollenverwaltung<br />
              <strong>Moderator:</strong> Kann Inserate prüfen, freigeben, sperren und bearbeiten<br />
              <strong>Support:</strong> Kann Benutzerdaten einsehen und bei Problemen helfen<br />
              <strong>Content Reviewer:</strong> Kann Inhalte prüfen und freigeben
            </Typography>
          </Alert>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Alert severity="success" icon={<CheckCircle2 size={20} />}>
            <Typography variant="body2" fontWeight={600} mb={1}>
              Funktionen bereits aktiv:
            </Typography>
            <Typography variant="body2" component="div">
              Rollen können Benutzern über die Benutzerverwaltung zugewiesen werden<br />
              Berechtigungen werden automatisch überprüft (items.view_all, items.edit_any, items.delete, etc.)<br />
              Datenbank-Funktionen: approve_item(), reject_item(), feature_item() für Moderatoren<br />
              RLS-Policies berücksichtigen Berechtigungen bei Items
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 2 }}>
              <strong>Noch zu implementieren:</strong><br />
              UI-Integration für Moderatoren (Approve/Reject Buttons in der Item-Ansicht)<br />
              Messages-Moderation UI<br />
              Analytics-Dashboard für Support-Rolle
            </Typography>
          </Alert>
        </Grid>
      </Grid>

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

export default RoleManagementTab;
