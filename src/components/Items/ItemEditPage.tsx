import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  TextField,
} from '@mui/material';
import { ArrowLeft, Save, X, Trash2, List } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Item } from '../../lib/supabase';
import { BasicInfoSection } from '../ItemForm/BasicInfoSection';
import { DetailedInfoSection } from '../ItemForm/DetailedInfoSection';
import { ShippingPickupSection } from '../ItemForm/ShippingPickupSection';
import { MultiImageUpload } from '../Upload/MultiImageUpload';
import { CategorySelection } from '../../types/categories';

interface ImageFile {
  file?: File;
  preview: string;
  id: string;
  isPrimary: boolean;
  existingUrl?: string;
}

export const ItemEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [item, setItem] = useState<Item | null>(null);
  const [images, setImages] = useState<ImageFile[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<CategorySelection>({});
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published' | 'sold'>('published');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [size, setSize] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensionsLength, setDimensionsLength] = useState('');
  const [dimensionsWidth, setDimensionsWidth] = useState('');
  const [dimensionsHeight, setDimensionsHeight] = useState('');
  const [material, setMaterial] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [style, setStyle] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [shippingCostType, setShippingCostType] = useState<'free' | 'fixed' | 'ai_calculated'>('fixed');
  const [shippingCost, setShippingCost] = useState(5);
  const [shippingDescription, setShippingDescription] = useState('');
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showLocationPublicly, setShowLocationPublicly] = useState(false);
  const [locationDescription, setLocationDescription] = useState('');

  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadItem();
    loadAddresses();
  }, [id, user]);

  const loadItem = async () => {
    if (!id || !user) return;

    try {
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (itemError) throw itemError;
      if (!itemData) {
        setError('Artikel nicht gefunden');
        setLoading(false);
        return;
      }

      if (itemData.user_id !== user.id) {
        setError('Keine Berechtigung zum Bearbeiten dieses Artikels');
        setLoading(false);
        return;
      }

      setItem(itemData);

      setTitle(itemData.title || '');
      setDescription(itemData.description || '');
      setPrice(itemData.price?.toString() || '');

      // Load category hierarchy from category_id
      if (itemData.category_id) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', itemData.category_id)
          .single();

        if (categoryData) {
          const categorySelection: CategorySelection = {};

          if (categoryData.level === 1) {
            categorySelection.level1 = categoryData;
          } else if (categoryData.level === 2) {
            categorySelection.level2 = categoryData;
            // Load parent level 1
            const { data: level1 } = await supabase
              .from('categories')
              .select('*')
              .eq('id', categoryData.parent_id)
              .single();
            if (level1) categorySelection.level1 = level1;
          } else if (categoryData.level === 3) {
            categorySelection.level3 = categoryData;
            // Load parent level 2
            const { data: level2 } = await supabase
              .from('categories')
              .select('*')
              .eq('id', categoryData.parent_id)
              .single();
            if (level2) {
              categorySelection.level2 = level2;
              // Load grandparent level 1
              const { data: level1 } = await supabase
                .from('categories')
                .select('*')
                .eq('id', level2.parent_id)
                .single();
              if (level1) categorySelection.level1 = level1;
            }
          } else if (categoryData.level === 4) {
            categorySelection.level4 = categoryData;
            // Load parent level 3
            const { data: level3 } = await supabase
              .from('categories')
              .select('*')
              .eq('id', categoryData.parent_id)
              .single();
            if (level3) {
              categorySelection.level3 = level3;
              // Load grandparent level 2
              const { data: level2 } = await supabase
                .from('categories')
                .select('*')
                .eq('id', level3.parent_id)
                .single();
              if (level2) {
                categorySelection.level2 = level2;
                // Load great-grandparent level 1
                const { data: level1 } = await supabase
                  .from('categories')
                  .select('*')
                  .eq('id', level2.parent_id)
                  .single();
                if (level1) categorySelection.level1 = level1;
              }
            }
          }

          setCategory(categorySelection);
        }
      }

      setBrand(itemData.brand || '');
      setCondition(itemData.condition || '');
      setTags(itemData.tags || []);
      setStatus(itemData.status || 'published');

      setSize(itemData.size || '');
      setWeight(itemData.weight || '');
      setDimensionsLength(itemData.dimensions_length || '');
      setDimensionsWidth(itemData.dimensions_width || '');
      setDimensionsHeight(itemData.dimensions_height || '');
      setMaterial(itemData.material || '');
      setColors(itemData.colors || []);
      setStyle(itemData.style || '');
      setSerialNumber(itemData.serial_number || '');

      setShippingEnabled(itemData.snapshot_shipping_enabled || false);
      setShippingCostType(itemData.snapshot_shipping_cost_type || 'fixed');
      setShippingCost(itemData.snapshot_shipping_cost || 5);
      setShippingDescription(itemData.snapshot_shipping_description || '');
      setPickupEnabled(itemData.snapshot_pickup_enabled || false);
      setSelectedAddressId(itemData.selected_address_id || '');
      setShowLocationPublicly(itemData.snapshot_show_location_publicly || false);
      setLocationDescription(itemData.snapshot_location_description || '');

      const { data: imagesData } = await supabase
        .from('item_images')
        .select('*')
        .eq('item_id', id)
        .order('display_order', { ascending: true });

      if (imagesData && imagesData.length > 0) {
        setImages(
          imagesData.map((img) => ({
            id: img.id,
            preview: img.image_url,
            existingUrl: img.image_url,
            isPrimary: img.is_primary,
          }))
        );
      } else if (itemData.image_url) {
        setImages([
          {
            id: 'primary',
            preview: itemData.image_url,
            existingUrl: itemData.image_url,
            isPrimary: true,
          },
        ]);
      }
    } catch (err) {
      console.error('Error loading item:', err);
      setError('Fehler beim Laden des Artikels');
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .in('address_type', ['pickup_only', 'both'])
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error loading addresses:', err);
    }
  };

  const handleDelete = async () => {
    if (!user || !item) return;

    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);

      if (deleteError) throw deleteError;

      navigate('/');
    } catch (err: any) {
      console.error('Error deleting item:', err);
      setError(err.message || 'Fehler beim Löschen');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSave = async () => {
    if (!user || !item) return;

    if (!title.trim() || !description.trim() || !price) {
      setError('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const priceValue = parseFloat(price.replace(',', '.'));
      if (isNaN(priceValue)) {
        throw new Error('Ungültiger Preis');
      }

      let primaryImageUrl = item.image_url;
      await supabase
        .from('item_images')
        .delete()
        .eq('item_id', item.id);

      const finalImageUrls: string[] = [];

      for (const img of images) {
        let imageUrl: string;

        if (img.file) {
          const fileExt = img.file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(fileName, img.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('item-images')
            .getPublicUrl(fileName);

          imageUrl = publicUrl;
        } else if (img.existingUrl) {
          imageUrl = img.existingUrl;
        } else {
          continue;
        }

        finalImageUrls.push(imageUrl);

        if (img.isPrimary) {
          primaryImageUrl = imageUrl;
        }
      }

      for (let i = 0; i < finalImageUrls.length; i++) {
        await supabase.from('item_images').insert({
          item_id: item.id,
          image_url: finalImageUrls[i],
          display_order: i,
          is_primary: finalImageUrls[i] === primaryImageUrl,
        });
      }

      let pickupAddress = null;
      if (pickupEnabled && selectedAddressId) {
        const { data: addrData } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', selectedAddressId)
          .maybeSingle();
        pickupAddress = addrData;
      }

      // Extract final category_id from CategorySelection (deepest level selected)
      const finalCategoryId = category.level4?.id || category.level3?.id || category.level2?.id || category.level1?.id || null;

      const updateData: any = {
        title: title.trim(),
        description: description.trim(),
        price: priceValue,
        category_id: finalCategoryId,
        brand: brand || null,
        condition: condition || null,
        tags: tags.length > 0 ? tags : null,
        status: status,
        size: size || null,
        weight: weight || null,
        dimensions_length: dimensionsLength || null,
        dimensions_width: dimensionsWidth || null,
        dimensions_height: dimensionsHeight || null,
        material: material || null,
        colors: colors.length > 0 ? colors : null,
        style: style || null,
        serial_number: serialNumber || null,
        image_url: primaryImageUrl,
        selected_address_id: pickupEnabled && selectedAddressId ? selectedAddressId : null,
        snapshot_shipping_enabled: shippingEnabled,
        snapshot_shipping_cost_type: shippingCostType,
        snapshot_shipping_cost: shippingCostType === 'fixed' ? shippingCost : 0,
        snapshot_shipping_description: shippingDescription || null,
        snapshot_pickup_enabled: pickupEnabled,
        snapshot_show_location_publicly: showLocationPublicly,
        snapshot_location_description: locationDescription || null,
        updated_at: new Date().toISOString(),
      };

      if (pickupAddress) {
        updateData.snapshot_pickup_address = pickupAddress.address;
        updateData.snapshot_pickup_postal_code = pickupAddress.postal_code;
        updateData.snapshot_pickup_city = pickupAddress.city;
        updateData.snapshot_pickup_country = pickupAddress.country;
      }

      const { error: updateError } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', item.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate(`/item/${item.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error saving item:', err);
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !item) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Container maxWidth="md" sx={{ py: 8, flex: 1 }}>
          <Alert severity="error">{error}</Alert>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
            startIcon={<ArrowLeft size={20} />}
          >
            Zurück zur Startseite
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
      <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4, flex: 1, maxWidth: '1200px !important' }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <IconButton onClick={() => navigate(`/item/${id}`)} size={isMobile ? 'small' : 'medium'}>
              <ArrowLeft size={isMobile ? 20 : 24} />
            </IconButton>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={600}>
              Artikel bearbeiten
            </Typography>
          </Box>
          {!isMobile && (
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              startIcon={<List size={20} />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Zurück zur Liste
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Artikel erfolgreich aktualisiert! Du wirst weitergeleitet...
          </Alert>
        )}

        <Paper elevation={isMobile ? 0 : 1} sx={{ p: isMobile ? 2 : 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Bilder
              </Typography>
              <MultiImageUpload images={images} onImagesChange={setImages} />
            </Box>

            <Divider />

            <BasicInfoSection
              title={title}
              description={description}
              price={price}
              category={category}
              brand={brand}
              condition={condition}
              tags={tags}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onPriceChange={setPrice}
              onCategoryChange={setCategory}
              onBrandChange={setBrand}
              onConditionChange={setCondition}
              onTagsChange={setTags}
              isMobile={isMobile}
            />

            <Divider />

            <DetailedInfoSection
              size={size}
              weight={weight}
              dimensionsLength={dimensionsLength}
              dimensionsWidth={dimensionsWidth}
              dimensionsHeight={dimensionsHeight}
              material={material}
              colors={colors}
              style={style}
              serialNumber={serialNumber}
              onSizeChange={setSize}
              onWeightChange={setWeight}
              onDimensionsChange={(l, w, h) => {
                setDimensionsLength(l);
                setDimensionsWidth(w);
                setDimensionsHeight(h);
              }}
              onMaterialChange={setMaterial}
              onColorsChange={setColors}
              onStyleChange={setStyle}
              onSerialNumberChange={setSerialNumber}
              isMobile={isMobile}
            />

            <Divider />

            <ShippingPickupSection
              shippingEnabled={shippingEnabled}
              shippingCostType={shippingCostType}
              shippingCost={shippingCost}
              shippingDescription={shippingDescription}
              pickupEnabled={pickupEnabled}
              selectedAddressId={selectedAddressId}
              showLocationPublicly={showLocationPublicly}
              locationDescription={locationDescription}
              addresses={addresses}
              onShippingEnabledChange={setShippingEnabled}
              onShippingCostTypeChange={setShippingCostType}
              onShippingCostChange={setShippingCost}
              onShippingDescriptionChange={setShippingDescription}
              onPickupEnabledChange={setPickupEnabled}
              onSelectedAddressChange={setSelectedAddressId}
              onShowLocationPubliclyChange={setShowLocationPublicly}
              onLocationDescriptionChange={setLocationDescription}
              isMobile={isMobile}
            />

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Status & Verwaltung
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Artikelstatus"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'sold')}
                  select
                  fullWidth
                  helperText="Entwürfe sind nur für dich sichtbar"
                >
                  <MenuItem value="draft">Entwurf</MenuItem>
                  <MenuItem value="published">Veröffentlicht</MenuItem>
                  <MenuItem value="sold">Verkauft</MenuItem>
                </TextField>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                  startIcon={<Trash2 size={20} />}
                  fullWidth={isMobile}
                  sx={{ alignSelf: isMobile ? 'stretch' : 'flex-start' }}
                >
                  Artikel löschen
                </Button>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/item/${id}`)}
              startIcon={<X size={20} />}
              disabled={saving}
              fullWidth={isMobile}
            >
              Abbrechen
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !title.trim() || !description.trim() || !price}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
              fullWidth={isMobile}
            >
              {saving ? 'Speichern...' : 'Änderungen speichern'}
            </Button>
          </Box>
        </Paper>
      </Container>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Artikel löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchtest du diesen Artikel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <Trash2 size={20} />}
          >
            {deleting ? 'Lösche...' : 'Löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
