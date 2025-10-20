import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { Edit, Save, X, Zap, Heart, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSystemSettings } from '../../hooks/useSystemSettings';

interface CreditPackage {
  id: string;
  package_id: string;
  package_type: 'personal' | 'community';
  display_name: string;
  price: number;
  bonus_percent: number;
  stripe_product_name: string;
  stripe_product_description: string;
  icon_name?: string;
  icon_color?: string;
  is_popular: boolean;
  is_best_value: boolean;
  is_active: boolean;
  sort_order: number;
  features: string[];
}

export const ProductManagement = () => {
  const { settings, loading: settingsLoading } = useSystemSettings();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'personal' | 'community'>('personal');
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('credit_packages')
        .select('*')
        .order('sort_order');

      if (fetchError) throw fetchError;

      setPackages(data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Pakete');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (pkg: CreditPackage) => {
    setEditingPackage({ ...pkg });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPackage) return;

    try {
      setError(null);
      setSuccess(null);

      const { error: updateError } = await supabase
        .from('credit_packages')
        .update({
          display_name: editingPackage.display_name,
          price: editingPackage.price,
          bonus_percent: editingPackage.bonus_percent,
          stripe_product_name: editingPackage.stripe_product_name,
          stripe_product_description: editingPackage.stripe_product_description,
          is_popular: editingPackage.is_popular,
          is_best_value: editingPackage.is_best_value,
          is_active: editingPackage.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPackage.id);

      if (updateError) throw updateError;

      setSuccess('Paket erfolgreich aktualisiert!');
      setEditDialogOpen(false);
      setEditingPackage(null);
      fetchPackages();
    } catch (err) {
      console.error('Error updating package:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Pakets');
    }
  };

  const handleToggleActive = async (pkg: CreditPackage) => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('credit_packages')
        .update({
          is_active: !pkg.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pkg.id);

      if (updateError) throw updateError;

      setSuccess(`Paket ${!pkg.is_active ? 'aktiviert' : 'deaktiviert'}!`);
      fetchPackages();
    } catch (err) {
      console.error('Error toggling package:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Ändern des Status');
    }
  };

  const renderPackageCard = (pkg: CreditPackage) => {
    const powerUserPrice = settings?.powerUserCreditPrice || 0.20;
    const calculateInserate = (price: number) => Math.floor(price / powerUserPrice);
    const inserate = calculateInserate(pkg.price);
    const bonus = Math.floor(inserate * pkg.bonus_percent);
    const totalInserate = inserate + bonus;

    return (
      <Card
        key={pkg.id}
        sx={{
          p: 3,
          mb: 2,
          border: '1px solid',
          borderColor: pkg.is_active ? 'divider' : 'error.main',
          opacity: pkg.is_active ? 1 : 0.6,
          bgcolor: pkg.is_active ? 'white' : '#fafafa',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {pkg.display_name}
              </Typography>
              {pkg.is_popular && (
                <Chip label="Beliebt" size="small" color="primary" sx={{ height: 20 }} />
              )}
              {pkg.is_best_value && (
                <Chip label="Beste Wahl" size="small" sx={{ height: 20, bgcolor: '#ff9800', color: 'white' }} />
              )}
              {!pkg.is_active && (
                <Chip label="Inaktiv" size="small" color="error" sx={{ height: 20 }} />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              ID: {pkg.package_id}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={() => handleEditClick(pkg)} color="primary">
              <Edit size={18} />
            </IconButton>
            <FormControlLabel
              control={
                <Switch
                  checked={pkg.is_active}
                  onChange={() => handleToggleActive(pkg)}
                  size="small"
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Preis
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {pkg.price.toFixed(2)}€
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Bonus
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {(pkg.bonus_percent * 100).toFixed(0)}%
            </Typography>
          </Box>
          {pkg.package_type === 'personal' && (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Inserate
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {inserate} + {bonus} = {totalInserate}
                </Typography>
              </Box>
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
          Stripe Checkout Name (dynamisch)
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace', bgcolor: '#e3f2fd', p: 1, borderRadius: 1, color: '#1976d2' }}>
          {pkg.package_type === 'personal' ? `${totalInserate} Inserate` : `${pkg.price.toFixed(2)}€ Community-Spende`}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
          Stripe Checkout Beschreibung (dynamisch)
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#e3f2fd', p: 1, borderRadius: 1, color: '#1976d2' }}>
          {pkg.package_type === 'personal'
            ? `${totalInserate} Inserate für persönliche Nutzung (${inserate} + ${bonus} Bonus)`
            : `${pkg.price.toFixed(2)}€ Spende für den Community-Topf`}
        </Typography>
      </Card>
    );
  };

  const personalPackages = packages.filter(p => p.package_type === 'personal');
  const communityPackages = packages.filter(p => p.package_type === 'community');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Inserate-Pakete
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verwalte Inserate-Pakete und Spenden-Optionen
          </Typography>
        </Box>
        <IconButton onClick={fetchPackages} disabled={loading}>
          <RefreshCw size={20} />
        </IconButton>
      </Box>

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

      {(loading || settingsLoading) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 3 }}>
            <Tab
              value="personal"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Zap size={16} />
                  Personal Inserate ({personalPackages.length})
                </Box>
              }
            />
            <Tab
              value="community"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Heart size={16} />
                  Community Spenden ({communityPackages.length})
                </Box>
              }
            />
          </Tabs>

          {selectedTab === 'personal' && (
            <Box>
              {personalPackages.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Keine Personal Inserate-Pakete vorhanden
                </Typography>
              ) : (
                personalPackages.map(renderPackageCard)
              )}
            </Box>
          )}

          {selectedTab === 'community' && (
            <Box>
              {communityPackages.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Keine Community Spenden-Pakete vorhanden
                </Typography>
              ) : (
                communityPackages.map(renderPackageCard)
              )}
            </Box>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Paket bearbeiten
            </Typography>
            <IconButton size="small" onClick={() => setEditDialogOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingPackage && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Display Name"
                value={editingPackage.display_name}
                onChange={(e) => setEditingPackage({ ...editingPackage, display_name: e.target.value })}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField
                  label="Preis (€)"
                  type="number"
                  value={editingPackage.price}
                  onChange={(e) => setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) || 0 })}
                  inputProps={{ step: 0.01, min: 0 }}
                />
                <TextField
                  label="Bonus (%)"
                  type="number"
                  value={(editingPackage.bonus_percent * 100).toFixed(0)}
                  onChange={(e) => setEditingPackage({ ...editingPackage, bonus_percent: (parseFloat(e.target.value) || 0) / 100 })}
                  inputProps={{ step: 1, min: 0, max: 100 }}
                />
              </Box>

              <TextField
                fullWidth
                label="Stripe Product Name"
                value={editingPackage.stripe_product_name}
                onChange={(e) => setEditingPackage({ ...editingPackage, stripe_product_name: e.target.value })}
                helperText="Name, der im Stripe Checkout angezeigt wird"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Stripe Product Beschreibung"
                value={editingPackage.stripe_product_description}
                onChange={(e) => setEditingPackage({ ...editingPackage, stripe_product_description: e.target.value })}
                helperText="Beschreibung, die im Stripe Checkout angezeigt wird"
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingPackage.is_popular}
                      onChange={(e) => setEditingPackage({ ...editingPackage, is_popular: e.target.checked })}
                    />
                  }
                  label="Als 'Beliebt' markieren"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingPackage.is_best_value}
                      onChange={(e) => setEditingPackage({ ...editingPackage, is_best_value: e.target.checked })}
                    />
                  }
                  label="Als 'Beste Wahl' markieren"
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={editingPackage.is_active}
                    onChange={(e) => setEditingPackage({ ...editingPackage, is_active: e.target.checked })}
                  />
                }
                label="Paket aktiv"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">
            Abbrechen
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<Save size={18} />}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
