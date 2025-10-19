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
  Checkbox,
  Toolbar,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack,
} from '@mui/material';
import { MoreVertical, Ban, Trash2, Check, Package, Shield, Search, Filter, Trash, RefreshCw } from 'lucide-react';
import { useAdmin, AdminUser, UserRole } from '../../hooks/useAdmin';
import { Modal } from '../Common/Modal';

const UserManagementTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { getAllUsers, suspendUser, unsuspendUser, deleteUser, getUserRoles, assignRole, removeRole, getAllRoles } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

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

  const getUserInitials = (user: AdminUser) => {
    if (user.full_name) {
      const names = user.full_name.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  // Multi-select handlers
  const handleSelectAll = () => {
    if (selectedUserIds.length === selectableUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map(u => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      // Delete all selected users
      await Promise.all(selectedUserIds.map(id => deleteUser(id)));

      setSnackbar({
        open: true,
        message: `${selectedUserIds.length} Benutzer erfolgreich gelöscht`,
        severity: 'success',
      });

      setDeleteDialog(false);
      setSelectedUserIds([]);
      await loadUsers();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Fehler: ${error.message}`,
        severity: 'error',
      });
    }
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

  // Get users that can be selected (non-admin users)
  const selectableUsers = useMemo(() => {
    return filteredUsers.filter(user => !user.is_admin);
  }, [filteredUsers]);

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Benutzerverwaltung
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verwalte Benutzer, Rollen und Berechtigungen
          </Typography>
        </Box>
        <IconButton onClick={loadUsers} disabled={loading}>
          <RefreshCw size={20} />
        </IconButton>
      </Box>

      {/* Bulk Action Toolbar */}
      {selectedUserIds.length > 0 && (
        <Paper sx={{ mb: 2, bgcolor: 'primary.50' }}>
          <Toolbar>
            <Typography variant="subtitle1" sx={{ flex: 1 }}>
              {selectedUserIds.length} {selectedUserIds.length === 1 ? 'Benutzer' : 'Benutzer'} ausgewählt
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<Trash size={18} />}
              onClick={() => setDeleteDialog(true)}
            >
              Löschen
            </Button>
          </Toolbar>
        </Paper>
      )}

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

        {/* Mobile Card View */}
        {isMobile ? (
          <Box sx={{ p: 1.5 }}>
            {filteredUsers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Keine Benutzer gefunden
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {filteredUsers.map((user) => (
                  <Card key={user.id} variant="outlined" sx={{ boxShadow: 'none' }}>
                    <CardContent sx={{ p: 1.5, pb: 0.5, '&:last-child': { pb: 1 } }}>
                      {/* Header mit Avatar und Checkbox */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          disabled={user.is_admin}
                          size="small"
                          sx={{ p: 0 }}
                        />
                        <Avatar
                          src={user.avatar_url || undefined}
                          alt={user.full_name || user.email}
                          sx={{ width: 44, height: 44 }}
                        >
                          {getUserInitials(user)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word', lineHeight: 1.3 }}>
                            {user.full_name || user.email}
                          </Typography>
                          {user.full_name && (
                            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', display: 'block', mt: 0.25 }}>
                              {user.email}
                            </Typography>
                          )}
                        </Box>
                        {user.is_admin && (
                          <Chip label="Admin" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                      </Box>

                      {/* Kompakte Info-Zeilen */}
                      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                        {/* Status & Rollen in einer Zeile */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          {user.is_suspended ? (
                            <Tooltip title={user.suspended_reason || 'Gesperrt'}>
                              <Chip label="Gesperrt" size="small" color="error" sx={{ height: 22 }} />
                            </Tooltip>
                          ) : (
                            <Chip label="Aktiv" size="small" color="success" sx={{ height: 22 }} />
                          )}
                          {user.roles && user.roles.length > 0 && (
                            <>
                              {user.roles.map((role) => (
                                <Chip
                                  key={role.role_id}
                                  label={role.display_name}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 22, fontSize: '0.7rem' }}
                                />
                              ))}
                            </>
                          )}
                        </Box>

                        {/* Statistiken kompakt */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Items:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {user.item_count}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Msg:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {user.message_count}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Credits:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {user.token_balance}
                            </Typography>
                          </Box>
                          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/?seller=${user.id}`)}
                              sx={{ p: 0.5 }}
                            >
                              <Package size={16} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, user)}
                              disabled={user.is_admin}
                              sx={{ p: 0.5 }}
                            >
                              <MoreVertical size={16} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        ) : (
          /* Desktop Table View */
          <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedUserIds.length > 0 &&
                      selectedUserIds.length < selectableUsers.length
                    }
                    checked={
                      selectableUsers.length > 0 &&
                      selectedUserIds.length === selectableUsers.length
                    }
                    onChange={handleSelectAll}
                    disabled={selectableUsers.length === 0}
                  />
                </TableCell>
                <TableCell>Avatar</TableCell>
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
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Keine Benutzer gefunden
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      disabled={user.is_admin}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar
                      src={user.avatar_url || undefined}
                      alt={user.full_name || user.email}
                      sx={{ width: 40, height: 40 }}
                    >
                      {getUserInitials(user)}
                    </Avatar>
                  </TableCell>
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
        )}
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
          <Package size={18} style={{ marginRight: 8 }} />
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

      <Modal
        open={suspendDialog}
        onClose={() => setSuspendDialog(false)}
        title="Benutzer sperren"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setSuspendDialog(false)}>Abbrechen</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleSuspend}
              disabled={!suspendReason.trim()}
            >
              Sperren
            </Button>
          </>
        }
      >
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
      </Modal>

      <Modal
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        title={selectedUserIds.length > 0 ? `${selectedUserIds.length} Benutzer löschen` : 'Benutzer löschen'}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setDeleteDialog(false)}>Abbrechen</Button>
            <Button
              variant="contained"
              color="error"
              onClick={selectedUserIds.length > 0 ? handleBulkDelete : handleDelete}
            >
              Unwiderruflich löschen
            </Button>
          </>
        }
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Diese Aktion kann nicht rückgängig gemacht werden! Alle Daten {selectedUserIds.length > 0 ? 'der Benutzer werden' : 'des Benutzers werden'} unwiderruflich gelöscht.
        </Alert>

        {selectedUserIds.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Folgende Benutzer werden gelöscht:
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
              {users
                .filter(u => selectedUserIds.includes(u.id))
                .map(user => (
                  <Typography key={user.id} variant="body2" sx={{ py: 0.5 }}>
                    • <strong>{user.email}</strong> ({user.item_count} Items, {user.message_count} Nachrichten)
                  </Typography>
                ))
              }
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Benutzer: <strong>{selectedUser?.email}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Items: <strong>{selectedUser?.item_count}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nachrichten: <strong>{selectedUser?.message_count}</strong>
            </Typography>
          </>
        )}
      </Modal>

      <Modal
        open={roleDialog}
        onClose={() => setRoleDialog(false)}
        title="Rollen verwalten"
        maxWidth="sm"
        actions={
          <Button onClick={() => setRoleDialog(false)}>Schließen</Button>
        }
      >
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
      </Modal>

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
