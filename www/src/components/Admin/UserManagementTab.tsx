import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { MoreVertical, Ban, Trash2, Check, CreditCard as Edit, Shield, Search, Filter } from 'lucide-react';
import { useAdmin, AdminUser, UserRole } from '../../hooks/useAdmin';

const UserManagementTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { getAllUsers, suspendUser, unsuspendUser, deleteUser, getUserRoles, assignRole, removeRole, getAllRoles } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [suspendDialog, setSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const [deleteDialog, setDeleteDialog] = useState(false);

  const [roleDialog, setRoleDialog] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      const usersWithRoles = await Promise.all(
        data.map(async (user) => {
          const roles = await getUserRoles(user.id);
          return { ...user, roles };
        })
      );
      setUsers(usersWithRoles);
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: AdminUser) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;

    try {
      await suspendUser(selectedUser.id, suspendReason);
      setSnackbar({
        open: true,
        message: 'Benutzer erfolgreich gesperrt',
        severity: 'success',
      });
      setSuspendDialog(false);
      setSuspendReason('');
      await loadUsers();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler: ${error.message}`,
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleUnsuspend = async () => {
    if (!selectedUser) return;

    try {
      await unsuspendUser(selectedUser.id);
      setSnackbar({
        open: true,
        message: 'Sperrung erfolgreich aufgehoben',
        severity: 'success',
      });
      await loadUsers();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler: ${error.message}`,
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      setSnackbar({
        open: true,
        message: 'Benutzer erfolgreich gelöscht',
        severity: 'success',
      });
      setDeleteDialog(false);
      await loadUsers();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler: ${error.message}`,
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          (user.full_name && user.full_name.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((user) => !user.is_suspended);
    } else if (statusFilter === 'suspended') {
      filtered = filtered.filter((user) => user.is_suspended);
    }

    // Role filter
    if (roleFilter === 'admin') {
      filtered = filtered.filter((user) => user.is_admin);
    } else if (roleFilter === 'user') {
      filtered = filtered.filter((user) => !user.is_admin);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        // name
        const nameA = a.full_name || a.email;
        const nameB = b.full_name || b.email;
        return nameA.localeCompare(nameB);
      }
    });

    return filtered;
  }, [users, searchQuery, statusFilter, roleFilter, sortBy]);

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        {/* Search and Filter Toolbar */}
        <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: 1, borderColor: 'divider' }}>
          <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
            {/* Search */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Nach E-Mail oder Name suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <MenuItem value="all">Alle</MenuItem>
                  <MenuItem value="active">Aktiv</MenuItem>
                  <MenuItem value="suspended">Gesperrt</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Role Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Rolle</InputLabel>
                <Select
                  value={roleFilter}
                  label="Rolle"
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                >
                  <MenuItem value="all">Alle</MenuItem>
                  <MenuItem value="admin">Admins</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sort By */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sortierung</InputLabel>
                <Select
                  value={sortBy}
                  label="Sortierung"
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <MenuItem value="newest">Neueste zuerst</MenuItem>
                  <MenuItem value="oldest">Älteste zuerst</MenuItem>
                  <MenuItem value="name">Nach Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Results Count */}
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Filter size={16} color={theme.palette.text.secondary} />
            <Typography variant="body2" color="text.secondary">
              {filteredUsers.length} von {users.length} Benutzer{filteredUsers.length !== users.length && ' (gefiltert)'}
            </Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>E-Mail</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Rollen</TableCell>
                <TableCell>Registriert</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Items</TableCell>
                <TableCell align="center">Nachrichten</TableCell>
                <TableCell align="center">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Keine Benutzer gefunden
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    {user.email}
                    {user.is_admin && (
                      <Chip label="Super Admin" size="small" color="error" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Chip
                            key={role.role_id}
                            label={role.display_name}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell align="center">
                    {user.is_suspended ? (
                      <Tooltip title={user.suspended_reason || 'Gesperrt'}>
                        <Chip label="Gesperrt" size="small" color="error" />
                      </Tooltip>
                    ) : (
                      <Chip label="Aktiv" size="small" color="success" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={user.item_count}
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/?seller=${user.id}`)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell align="center">{user.message_count}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, user)}
                      disabled={user.is_admin}
                    >
                      <MoreVertical size={20} />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={async () => {
            if (selectedUser) {
              const roles = await getUserRoles(selectedUser.id);
              const allRoles = await getAllRoles();
              setUserRoles(roles);
              setAvailableRoles(allRoles);
              setRoleDialog(true);
            }
          }}
        >
          <Shield size={18} style={{ marginRight: 8 }} />
          Rollen verwalten
        </MenuItem>
        <MenuItem
          onClick={() => selectedUser && navigate(`/?seller=${selectedUser.id}`)}
        >
          <Edit size={18} style={{ marginRight: 8 }} />
          Items anzeigen
        </MenuItem>
        {selectedUser?.is_suspended ? (
          <MenuItem onClick={handleUnsuspend}>
            <Check size={18} style={{ marginRight: 8 }} />
            Entsperren
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => setSuspendDialog(true)}
            sx={{ color: 'warning.main' }}
          >
            <Ban size={18} style={{ marginRight: 8 }} />
            Sperren
          </MenuItem>
        )}
        <MenuItem
          onClick={() => setDeleteDialog(true)}
          sx={{ color: 'error.main' }}
        >
          <Trash2 size={18} style={{ marginRight: 8 }} />
          Löschen
        </MenuItem>
      </Menu>

      <Dialog open={suspendDialog} onClose={() => setSuspendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Benutzer sperren</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Der Benutzer kann sich nicht mehr anmelden und keine Items erstellen oder bearbeiten.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Benutzer: <strong>{selectedUser?.email}</strong>
          </Typography>
          <TextField
            label="Grund für Sperrung"
            fullWidth
            multiline
            rows={3}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Z.B.: Verstoß gegen Nutzungsbedingungen"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendDialog(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSuspend}
            disabled={!suspendReason.trim()}
          >
            Sperren
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Benutzer löschen</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Diese Aktion kann nicht rückgängig gemacht werden! Alle Daten des Benutzers werden unwiderruflich gelöscht.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Benutzer: <strong>{selectedUser?.email}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Items: <strong>{selectedUser?.item_count}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nachrichten: <strong>{selectedUser?.message_count}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Abbrechen</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Unwiderruflich löschen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rollen verwalten</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Benutzer: <strong>{selectedUser?.email}</strong>
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Aktuelle Rollen:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {userRoles.length > 0 ? (
              userRoles.map((role) => (
                <Chip
                  key={role.role_id}
                  label={role.display_name}
                  onDelete={async () => {
                    if (selectedUser) {
                      try {
                        await removeRole(selectedUser.id, role.role_id);
                        const updatedRoles = await getUserRoles(selectedUser.id);
                        setUserRoles(updatedRoles);
                        setSnackbar({ open: true, message: 'Rolle erfolgreich entfernt', severity: 'success' });
                        await loadUsers();
                      } catch (error: any) {
                        setSnackbar({ open: true, message: `Fehler: ${error.message}`, severity: 'error' });
                      }
                    }
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">Keine Rollen zugewiesen</Typography>
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            Rolle hinzufügen:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {availableRoles
              .filter((role) => !userRoles.some((ur) => ur.role_id === role.role_id))
              .map((role) => (
                <Chip
                  key={role.role_id}
                  label={role.display_name}
                  onClick={async () => {
                    if (selectedUser) {
                      try {
                        await assignRole(selectedUser.id, role.role_id);
                        const updatedRoles = await getUserRoles(selectedUser.id);
                        setUserRoles(updatedRoles);
                        setSnackbar({ open: true, message: 'Rolle erfolgreich zugewiesen', severity: 'success' });
                        await loadUsers();
                      } catch (error: any) {
                        setSnackbar({ open: true, message: `Fehler: ${error.message}`, severity: 'error' });
                      }
                    }
                  }}
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
              ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog(false)}>Schließen</Button>
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

export default UserManagementTab;
