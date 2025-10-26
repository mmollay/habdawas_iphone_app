import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Typography,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { MapPin, Calendar, Package, Truck, Eye, Tag, Ruler, Weight, Box as BoxIcon, Palette, Sparkles, Grid3x3, Hash, Save, Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getConditionLabel } from '../../utils/translations';
import { InlineTextField } from './InlineEdit/InlineTextField';
import { InlineSelect } from './InlineEdit/InlineSelect';
import { InlineChipList } from './InlineEdit/InlineChipList';
import { InlineImageGallery } from './InlineEdit/InlineImageGallery';
import { CategoryDropdown } from '../CategoryDropdown';
import { CategorySelection, getFinalCategoryId } from '../../types/categories';

interface PreviewData {
  title: string;
  description: string;
  price: number;
  category: CategorySelection;
  brand: string;
  condition: string;
  tags: string[];
  size?: string;
  weight?: string;
  dimensions_length?: string;
  dimensions_width?: string;
  dimensions_height?: string;
  material?: string;
  colors?: string[];
  style?: string;
  serial_number?: string;
  shipping_enabled: boolean;
  shipping_cost_type: string;
  shipping_cost_fixed?: number;
  shipping_description?: string;
  pickup_enabled: boolean;
  pickup_address_id?: string;
  show_location_publicly: boolean;
  location_description?: string;
  price_negotiable: boolean;
  is_free: boolean;
  duration_days?: number;
  images: string[];
}

export const ItemPreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const previewData = location.state as PreviewData;

  const [isEditMode, setIsEditMode] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [publishDate, setPublishDate] = useState('');
  const [publishNow, setPublishNow] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(previewData?.title || '');
  const [description, setDescription] = useState(previewData?.description || '');
  const [price, setPrice] = useState(previewData?.price || 0);
  const [category, setCategory] = useState<CategorySelection>(previewData?.category || {});
  const [brand, setBrand] = useState(previewData?.brand || '');
  const [condition, setCondition] = useState(previewData?.condition || 'used_good');
  const [tags, setTags] = useState<string[]>(previewData?.tags || []);
  const [size, setSize] = useState(previewData?.size || '');
  const [weight, setWeight] = useState(previewData?.weight || '');
  const [dimensionsLength, setDimensionsLength] = useState(previewData?.dimensions_length || '');
  const [dimensionsWidth, setDimensionsWidth] = useState(previewData?.dimensions_width || '');
  const [dimensionsHeight, setDimensionsHeight] = useState(previewData?.dimensions_height || '');
  const [material, setMaterial] = useState(previewData?.material || '');
  const [colors, setColors] = useState<string[]>(previewData?.colors || []);
  const [style, setStyle] = useState(previewData?.style || '');
  const [serialNumber, setSerialNumber] = useState(previewData?.serial_number || '');
  const [images, setImages] = useState<string[]>(previewData?.images || []);

  useEffect(() => {
    if (!previewData) {
      navigate('/items/create');
    }
  }, [previewData, navigate]);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [title, description, price, category, brand, condition, tags, size, weight, dimensionsLength, dimensionsWidth, dimensionsHeight, material, colors, style, serialNumber]);

  const handleSaveAsDraft = async () => {
    if (!user) return;

    setIsPublishing(true);
    setError(null);

    try {
      const finalCategoryId = getFinalCategoryId(category);
      if (!finalCategoryId) {
        setError('Bitte wähle eine Kategorie aus');
        setIsPublishing(false);
        return;
      }

      const itemData = {
        user_id: user.id,
        title,
        description,
        price: previewData.is_free ? 0 : price,
        category_id: finalCategoryId,
        brand: brand || null,
        condition,
        tags: tags.length > 0 ? tags : null,
        size: size || null,
        weight: weight || null,
        dimensions_length: dimensionsLength || null,
        dimensions_width: dimensionsWidth || null,
        dimensions_height: dimensionsHeight || null,
        material: material || null,
        colors: colors.length > 0 ? colors : null,
        style: style || null,
        serial_number: serialNumber || null,
        shipping_enabled: previewData.shipping_enabled,
        shipping_cost_type: previewData.shipping_cost_type,
        shipping_cost_fixed: previewData.shipping_cost_fixed || null,
        shipping_description: previewData.shipping_description || null,
        pickup_enabled: previewData.pickup_enabled,
        pickup_address_id: previewData.pickup_address_id || null,
        show_location_publicly: previewData.show_location_publicly,
        location_description: previewData.location_description || null,
        price_negotiable: previewData.price_negotiable,
        is_free: previewData.is_free,
        status: 'draft',
        duration_days: previewData.duration_days || 30,
      };

      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert([itemData])
        .select()
        .single();

      if (itemError) throw itemError;

      if (images.length > 0) {
        const imageInserts = images.map((url, index) => ({
          item_id: item.id,
          image_url: url,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from('item_images')
          .insert(imageInserts);

        if (imagesError) throw imagesError;
      }

      navigate('/');
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern des Entwurfs');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublish = async () => {
    if (!user) return;

    setIsPublishing(true);
    setError(null);

    try {
      const finalCategoryId = getFinalCategoryId(category);
      if (!finalCategoryId) {
        setError('Bitte wähle eine Kategorie aus');
        setIsPublishing(false);
        return;
      }

      const now = new Date();
      const scheduledDate = publishNow ? null : new Date(publishDate);
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + (previewData.duration_days || 30));

      const itemData = {
        user_id: user.id,
        title,
        description,
        price: previewData.is_free ? 0 : price,
        category_id: finalCategoryId,
        brand: brand || null,
        condition,
        tags: tags.length > 0 ? tags : null,
        size: size || null,
        weight: weight || null,
        dimensions_length: dimensionsLength || null,
        dimensions_width: dimensionsWidth || null,
        dimensions_height: dimensionsHeight || null,
        material: material || null,
        colors: colors.length > 0 ? colors : null,
        style: style || null,
        serial_number: serialNumber || null,
        shipping_enabled: previewData.shipping_enabled,
        shipping_cost_type: previewData.shipping_cost_type,
        shipping_cost_fixed: previewData.shipping_cost_fixed || null,
        shipping_description: previewData.shipping_description || null,
        pickup_enabled: previewData.pickup_enabled,
        pickup_address_id: previewData.pickup_address_id || null,
        show_location_publicly: previewData.show_location_publicly,
        location_description: previewData.location_description || null,
        price_negotiable: previewData.price_negotiable,
        is_free: previewData.is_free,
        status: publishNow ? 'active' : 'scheduled',
        published_at: publishNow ? now.toISOString() : scheduledDate?.toISOString(),
        expires_at: expiresAt.toISOString(),
        duration_days: previewData.duration_days || 30,
      };

      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert([itemData])
        .select()
        .single();

      if (itemError) throw itemError;

      if (images.length > 0) {
        const imageInserts = images.map((url, index) => ({
          item_id: item.id,
          image_url: url,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from('item_images')
          .insert(imageInserts);

        if (imagesError) throw imagesError;
      }

      navigate(`/items/${item.id}`);
    } catch (err) {
      console.error('Error publishing item:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Veröffentlichen');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!previewData) {
    return null;
  }

  const conditionOptions = [
    { value: 'new', label: 'Neu' },
    { value: 'used_like_new', label: 'Gebraucht (wie neu)' },
    { value: 'used_good', label: 'Gebraucht (gut)' },
    { value: 'used_acceptable', label: 'Gebraucht (akzeptabel)' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Zurück
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Vorschau-Modus
          </Typography>
          <Typography variant="body2">
            Fahre mit der Maus über Titel, Beschreibung, Preis oder Details, um sie zu bearbeiten. Klicke auf "Veröffentlichen" wenn alles bereit ist, oder speichere als Entwurf.
          </Typography>
        </Alert>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 4
            }}>
              <Box>
                <InlineImageGallery
                  images={images}
                  onImagesChange={setImages}
                  isEditMode={isEditMode}
                  isMobile={isMobile}
                />
              </Box>

              <Box>
                <InlineTextField
                  value={title}
                  onChange={setTitle}
                  isEditMode={isEditMode}
                  variant="h4"
                  fontWeight={700}
                  placeholder="Titel"
                  multiline={false}
                />

                <InlineTextField
                  value={previewData.is_free ? '0' : price.toString()}
                  onChange={(val) => setPrice(Number(val))}
                  isEditMode={!previewData.is_free}
                  variant="h5"
                  fontWeight={600}
                  color="primary.main"
                  prefix="€ "
                  placeholder="0"
                  multiline={false}
                  sx={{ mt: 2 }}
                />

                {previewData.price_negotiable && (
                  <Chip label="VB" size="small" sx={{ mt: 1, fontWeight: 700, bgcolor: 'warning.main', color: 'white' }} />
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Beschreibung
                </Typography>
                <InlineTextField
                  value={description}
                  onChange={setDescription}
                  isEditMode={isEditMode}
                  variant="body1"
                  placeholder="Beschreibung"
                  multiline={true}
                  minRows={4}
                />

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Kategorie
                    </Typography>
                    {isEditMode ? (
                      <CategoryDropdown
                        value={category}
                        onChange={setCategory}
                        required
                        showBreadcrumbs
                      />
                    ) : (
                      <Typography variant="body2">
                        {category.level4 || category.level3 || category.level2 || category.level1 || 'Keine Kategorie'}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Zustand
                    </Typography>
                    <InlineSelect
                      value={condition}
                      onChange={setCondition}
                      options={conditionOptions}
                      isEditMode={isEditMode}
                    />
                  </Box>

                  {brand && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Marke
                      </Typography>
                      <InlineTextField
                        value={brand}
                        onChange={setBrand}
                        isEditMode={isEditMode}
                        variant="body2"
                        placeholder="Marke"
                      />
                    </Box>
                  )}

                  {tags.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tag size={16} /> Tags
                      </Typography>
                      <InlineChipList
                        values={tags}
                        onChange={setTags}
                        isEditMode={isEditMode}
                      />
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Versand & Abholung
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {previewData.shipping_enabled && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Truck size={20} color={theme.palette.success.main} />
                      <Typography variant="body2">
                        Versand: {
                          previewData.shipping_cost_type === 'free' ? 'Kostenlos' :
                          previewData.shipping_cost_type === 'ai_calculated' ? `€ ${previewData.shipping_cost_fixed?.toFixed(2) || '0.00'}` :
                          `€ ${previewData.shipping_cost_fixed?.toFixed(2) || '0.00'}`
                        }
                      </Typography>
                    </Box>
                  )}

                  {previewData.pickup_enabled && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapPin size={20} color={theme.palette.primary.main} />
                      <Typography variant="body2">Abholung möglich</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {(size || weight || dimensionsLength || material || colors.length > 0 || style || serialNumber) && (
              <>
                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Details
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {size && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Ruler size={16} /> Größe
                      </Typography>
                      <InlineTextField
                        value={size}
                        onChange={setSize}
                        isEditMode={isEditMode}
                        variant="body2"
                        placeholder="Größe"
                      />
                    </Box>
                  )}

                  {weight && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Weight size={16} /> Gewicht
                      </Typography>
                      <InlineTextField
                        value={weight}
                        onChange={setWeight}
                        isEditMode={isEditMode}
                        variant="body2"
                        placeholder="Gewicht"
                      />
                    </Box>
                  )}

                  {(dimensionsLength || dimensionsWidth || dimensionsHeight) && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BoxIcon size={16} /> Maße
                      </Typography>
                      <Typography variant="body2">
                        {dimensionsLength} × {dimensionsWidth} × {dimensionsHeight} cm
                      </Typography>
                    </Box>
                  )}

                  {material && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BoxIcon size={16} /> Material
                      </Typography>
                      <InlineTextField
                        value={material}
                        onChange={setMaterial}
                        isEditMode={isEditMode}
                        variant="body2"
                        placeholder="Material"
                      />
                    </Box>
                  )}

                  {colors.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Palette size={16} /> Farben
                      </Typography>
                      <InlineChipList
                        values={colors}
                        onChange={setColors}
                        isEditMode={isEditMode}
                      />
                    </Box>
                  )}

                  {style && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Sparkles size={16} /> Stil
                      </Typography>
                      <InlineTextField
                        value={style}
                        onChange={setStyle}
                        isEditMode={isEditMode}
                        variant="body2"
                        placeholder="Stil"
                      />
                    </Box>
                  )}

                  {serialNumber && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Hash size={16} /> Seriennummer
                      </Typography>
                      <InlineTextField
                        value={serialNumber}
                        onChange={setSerialNumber}
                        isEditMode={isEditMode}
                        variant="body2"
                        placeholder="Seriennummer"
                      />
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Paper>
      </Container>

      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 32 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '2px solid',
          borderColor: 'primary.main',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          minWidth: { xs: 'calc(100% - 32px)', sm: 'auto' },
        }}
      >
        <Button
          variant="outlined"
          onClick={handleSaveAsDraft}
          disabled={isPublishing}
          startIcon={<Save size={18} />}
          fullWidth={isMobile}
        >
          Als Entwurf speichern
        </Button>
        <Button
          variant="contained"
          onClick={() => setShowScheduleDialog(true)}
          disabled={isPublishing}
          startIcon={<Send size={18} />}
          fullWidth={isMobile}
        >
          {isPublishing ? 'Wird veröffentlicht...' : 'Veröffentlichen'}
        </Button>
      </Paper>

      <Dialog open={showScheduleDialog} onClose={() => setShowScheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Inserat veröffentlichen</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                />
              }
              label="Sofort veröffentlichen"
            />

            {!publishNow && (
              <TextField
                fullWidth
                type="datetime-local"
                label="Veröffentlichungsdatum"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().slice(0, 16)
                }}
              />
            )}

            <Alert severity="info">
              {publishNow
                ? 'Das Inserat wird sofort veröffentlicht und ist für alle sichtbar.'
                : 'Das Inserat wird zum gewählten Zeitpunkt automatisch veröffentlicht.'
              }
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScheduleDialog(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handlePublish}
            variant="contained"
            startIcon={<Send size={20} />}
            disabled={isPublishing || (!publishNow && !publishDate)}
          >
            {isPublishing ? 'Wird veröffentlicht...' : 'Veröffentlichen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
