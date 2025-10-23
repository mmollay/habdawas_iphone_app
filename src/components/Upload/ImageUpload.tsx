import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  IconButton,
  Chip,
  Typography,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  Grid,
} from '@mui/material';
import { Camera, X, Truck, MapPin, Package, ChevronDown, ChevronUp, Image as ImageIcon, Images, Settings, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MultiImageUpload } from './MultiImageUpload';
import { getDefaultCountry } from '../../utils/countryUtils';

interface ImageUploadProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImageFile {
  file: File;
  preview: string;
  id: string;
  isPrimary: boolean;
}

interface AnalysisResult {
  title: string;
  description: string;
  price: number;
  category?: string;
  subcategory?: string;
  condition?: string;
  brand?: string;
  size?: string;
  weight?: string;
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };
  material?: string;
  colors?: string[];
  style?: string;
  serialNumber?: string;
  features?: string[];
  accessories?: string[];
  tags?: string[];
  estimated_weight_kg?: number;
  package_dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  ai_shipping_domestic?: number;
  ai_shipping_international?: number;
}

interface BulkItem {
  id: string;
  image: ImageFile;
  analysis: AnalysisResult | null;
  title: string;
  description: string;
  price: string;
  analyzing: boolean;
  error: string;
}

type UploadMode = 'single' | 'bulk';

export const ImageUpload = ({ open, onClose, onSuccess }: ImageUploadProps) => {
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');

  const [images, setImages] = useState<ImageFile[]>([]);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>('');
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [shippingCostType, setShippingCostType] = useState<'free' | 'fixed' | 'ai_calculated'>('fixed');
  const [shippingCost, setShippingCost] = useState(5);
  const [shippingDescription, setShippingDescription] = useState<string>('');
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [showLocationPublicly, setShowLocationPublicly] = useState(false);
  const [locationDescription, setLocationDescription] = useState<string>('');
  const [shippingExpanded, setShippingExpanded] = useState(false);
  const [pickupExpanded, setPickupExpanded] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const loadShippingAddresses = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .in('address_type', ['shipping_only', 'both'])
          .order('is_default_shipping', { ascending: false });

        if (error) throw error;

        setShippingAddresses(data || []);

        const defaultShipping = data?.find(addr => addr.is_default_shipping);
        if (defaultShipping) {
          setSelectedShippingAddress(defaultShipping.id);
        } else if (data && data.length > 0) {
          setSelectedShippingAddress(data[0].id);
        }
      } catch (err) {
        console.error('Error loading shipping addresses:', err);
      }
    };

    const loadSellerProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('shipping_enabled, shipping_cost, shipping_cost_type, shipping_description, pickup_enabled, show_location_publicly, location_description, ai_analyze_all_images, ai_text_style, ai_text_length')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        setSellerProfile(data);
      } catch (err) {
        console.error('Error loading seller profile:', err);
      }
    };

    if (open) {
      loadShippingAddresses();
      loadSellerProfile();
    }
  }, [user, open]);

  useEffect(() => {
    if (sellerProfile) {
      setShippingEnabled(sellerProfile.shipping_enabled ?? false);
      setShippingCostType(sellerProfile.shipping_cost_type || 'fixed');
      setShippingCost(sellerProfile.shipping_cost ?? 5);
      setShippingDescription(sellerProfile.shipping_description || '');
      setPickupEnabled(sellerProfile.pickup_enabled ?? true);
      setShowLocationPublicly(sellerProfile.show_location_publicly ?? false);
      setLocationDescription(sellerProfile.location_description || '');
    }
  }, [sellerProfile]);

  useEffect(() => {
    if (uploadMode === 'bulk' && images.length > 0 && bulkItems.length === 0) {
      const items: BulkItem[] = images.map(img => ({
        id: img.id,
        image: img,
        analysis: null,
        title: '',
        description: '',
        price: '',
        analyzing: false,
        error: '',
      }));
      setBulkItems(items);
    }
  }, [uploadMode, images, bulkItems.length]);

  const analyzeImage = async (imageData: string, shippingCountry: string): Promise<AnalysisResult> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Keine Authentifizierung vorhanden');
    }

    const countryCodeMap: Record<string, string> = {
      'Deutschland': 'DE',
      'Österreich': 'AT',
      'Schweiz': 'CH',
      'Frankreich': 'FR',
      'Italien': 'IT',
      'Spanien': 'ES',
      'Niederlande': 'NL',
      'Belgien': 'BE',
      'Polen': 'PL',
      'Tschechien': 'CZ',
    };

    const countryCode = countryCodeMap[shippingCountry] || 'DE';

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          shippingCountry: countryCode
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      if (result.needsConfig) {
        throw new Error('KI-Dienst ist noch nicht konfiguriert. Bitte Gemini API Key hinzufügen.');
      }
      throw new Error(result.error || 'Analyse fehlgeschlagen');
    }

    return result;
  };

  const handleAnalyzeSingle = async () => {
    if (images.length === 0 || !user) return;

    setAnalyzing(true);
    setError('');

    try {
      const selectedAddress = shippingAddresses.find(addr => addr.id === selectedShippingAddress);
      const shippingCountry = selectedAddress?.country || getDefaultCountry();

      const analyzeAllImages = sellerProfile?.ai_analyze_all_images ?? false;
      const imagesToAnalyze = analyzeAllImages ? images : [images.find(img => img.isPrimary) || images[0]];

      const analyses = await Promise.all(
        imagesToAnalyze.map(img => analyzeImage(img.preview, shippingCountry))
      );

      // Intelligent selection of primary analysis
      // Prefer actual items over documents/papers
      const documentKeywords = ['schein', 'dokument', 'papier', 'zertifikat', 'urkunde', 'bescheinigung', 'brief'];

      const scoredAnalyses = analyses.map((analysis, index) => {
        let score = 0;

        // Penalize document-like items heavily
        const titleLower = analysis.title.toLowerCase();
        const hasDocumentKeyword = documentKeywords.some(keyword => titleLower.includes(keyword));
        if (hasDocumentKeyword) {
          score -= 1000; // Very strong penalty
        }

        // Prefer higher prices (documents usually cost little)
        score += analysis.price;

        // Prefer longer descriptions (more detailed analysis)
        score += (analysis.description?.length || 0) / 10;

        // Prefer items with brand (documents usually don't have brands)
        if (analysis.brand && analysis.brand.length > 0) {
          score += 100;
        }

        // Prefer items with more features
        score += (analysis.features?.length || 0) * 10;

        // Slight preference for primary image if scores are equal
        if (index === 0) {
          score += 1;
        }

        return { analysis, score, index };
      });

      // Sort by score (highest first) and take the best one
      scoredAnalyses.sort((a, b) => b.score - a.score);
      const bestAnalysis = scoredAnalyses[0].analysis;

      console.log('🎯 Multi-image analysis scores:', scoredAnalyses.map(s => ({
        title: s.analysis.title.substring(0, 40),
        score: s.score,
        price: s.analysis.price,
        isDocument: documentKeywords.some(kw => s.analysis.title.toLowerCase().includes(kw))
      })));

      // Merge all analyses with the best one as base
      const mergedAnalysis = { ...bestAnalysis };
      if (analyses.length > 1) {
        analyses.forEach(analysis => {
          if (analysis === bestAnalysis) return; // Skip the base analysis

          if (analysis.features) {
            mergedAnalysis.features = [...new Set([...(mergedAnalysis.features || []), ...analysis.features])];
          }
          if (analysis.colors) {
            mergedAnalysis.colors = [...new Set([...(mergedAnalysis.colors || []), ...analysis.colors])];
          }
          if (analysis.accessories) {
            mergedAnalysis.accessories = [...new Set([...(mergedAnalysis.accessories || []), ...analysis.accessories])];
          }
          if (analysis.tags) {
            mergedAnalysis.tags = [...new Set([...(mergedAnalysis.tags || []), ...analysis.tags])];
          }
        });
      }

      setAnalysis(mergedAnalysis);
      setTitle(mergedAnalysis.title);
      setDescription(mergedAnalysis.description);
      setPrice(mergedAnalysis.price.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeBulk = async () => {
    if (bulkItems.length === 0 || !user) return;

    setAnalyzing(true);
    setError('');

    const selectedAddress = shippingAddresses.find(addr => addr.id === selectedShippingAddress);
    const shippingCountry = selectedAddress?.country || 'Deutschland';

    const updatedItems = [...bulkItems];

    for (let i = 0; i < updatedItems.length; i++) {
      updatedItems[i].analyzing = true;
      setBulkItems([...updatedItems]);

      try {
        const result = await analyzeImage(updatedItems[i].image.preview, shippingCountry);
        updatedItems[i].analysis = result;
        updatedItems[i].title = result.title;
        updatedItems[i].description = result.description;
        updatedItems[i].price = result.price.toString();
        updatedItems[i].error = '';
      } catch (err) {
        updatedItems[i].error = err instanceof Error ? err.message : 'Analyse fehlgeschlagen';
      } finally {
        updatedItems[i].analyzing = false;
        setBulkItems([...updatedItems]);
      }
    }

    setAnalyzing(false);
  };

  const handleUploadSingle = async () => {
    if (images.length === 0 || !user || !title || !description || !price) return;

    if (!user.email_confirmed_at) {
      setError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse, bevor Sie Inserate erstellen können.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadedImageUrls: string[] = [];

      for (const image of images) {
        const fileExt = image.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${image.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, image.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        uploadedImageUrls.push(publicUrl);
      }

      const selectedAddress = shippingAddresses.find(addr => addr.id === selectedShippingAddress);

      const countryCodeMap: Record<string, string> = {
        'Deutschland': 'DE',
        'Österreich': 'AT',
        'Schweiz': 'CH',
        'Frankreich': 'FR',
        'Italien': 'IT',
        'Spanien': 'ES',
        'Niederlande': 'NL',
        'Belgien': 'BE',
        'Polen': 'PL',
        'Tschechien': 'CZ',
      };

      const countryCode = countryCodeMap[selectedAddress?.country || getDefaultCountry()] || 'DE';
      const primaryImageUrl = uploadedImageUrls[images.findIndex(img => img.isPrimary)] || uploadedImageUrls[0];

      const { data: itemData, error: insertError } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          title,
          description,
          price: parseFloat(price),
          image_url: primaryImageUrl,
          status: 'published',
          ai_generated: analysis !== null,
          category: analysis?.category,
          subcategory: analysis?.subcategory,
          condition: analysis?.condition,
          brand: analysis?.brand,
          size: analysis?.size,
          weight: analysis?.weight,
          dimensions_length: analysis?.dimensions?.length,
          dimensions_width: analysis?.dimensions?.width,
          dimensions_height: analysis?.dimensions?.height,
          material: analysis?.material,
          colors: analysis?.colors,
          style: analysis?.style,
          serial_number: analysis?.serialNumber,
          features: analysis?.features,
          accessories: analysis?.accessories,
          tags: analysis?.tags,
          postal_code: selectedAddress?.postal_code,
          location: selectedAddress?.city,
          estimated_weight_kg: analysis?.estimated_weight_kg,
          package_dimensions: analysis?.package_dimensions,
          ai_shipping_domestic: analysis?.ai_shipping_domestic,
          ai_shipping_international: analysis?.ai_shipping_international,
          selected_address_id: selectedShippingAddress || null,
          shipping_from_country: countryCode,
          snapshot_shipping_enabled: shippingEnabled,
          snapshot_shipping_cost: shippingCost,
          snapshot_shipping_cost_type: shippingCostType,
          snapshot_shipping_description: shippingDescription || null,
          snapshot_pickup_enabled: pickupEnabled,
          snapshot_show_location_publicly: showLocationPublicly,
          snapshot_pickup_address: selectedAddress?.address,
          snapshot_pickup_postal_code: selectedAddress?.postal_code,
          snapshot_pickup_city: selectedAddress?.city,
          snapshot_pickup_country: selectedAddress?.country,
          snapshot_location_description: locationDescription || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (uploadedImageUrls.length > 0 && itemData) {
        const itemImages = uploadedImageUrls.map((url, index) => ({
          item_id: itemData.id,
          image_url: url,
          display_order: index,
          is_primary: images[index]?.isPrimary || index === 0,
        }));

        const { error: imagesError } = await supabase
          .from('item_images')
          .insert(itemImages);

        if (imagesError) throw imagesError;
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadBulk = async () => {
    if (bulkItems.length === 0 || !user) return;

    const validItems = bulkItems.filter(item => item.title && item.description && item.price);
    if (validItems.length === 0) {
      setError('Mindestens ein Artikel muss vollständig ausgefüllt sein.');
      return;
    }

    if (!user.email_confirmed_at) {
      setError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse, bevor Sie Inserate erstellen können.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const selectedAddress = shippingAddresses.find(addr => addr.id === selectedShippingAddress);
      const countryCodeMap: Record<string, string> = {
        'Deutschland': 'DE',
        'Österreich': 'AT',
        'Schweiz': 'CH',
        'Frankreich': 'FR',
        'Italien': 'IT',
        'Spanien': 'ES',
        'Niederlande': 'NL',
        'Belgien': 'BE',
        'Polen': 'PL',
        'Tschechien': 'CZ',
      };
      const countryCode = countryCodeMap[selectedAddress?.country || getDefaultCountry()] || 'DE';

      for (const item of validItems) {
        const fileExt = item.image.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${item.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, item.image.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        const { data: itemData, error: insertError } = await supabase
          .from('items')
          .insert({
            user_id: user.id,
            title: item.title,
            description: item.description,
            price: parseFloat(item.price),
            image_url: publicUrl,
            status: 'published',
            ai_generated: item.analysis !== null,
            category: item.analysis?.category,
            subcategory: item.analysis?.subcategory,
            condition: item.analysis?.condition,
            brand: item.analysis?.brand,
            size: item.analysis?.size,
            weight: item.analysis?.weight,
            dimensions_length: item.analysis?.dimensions?.length,
            dimensions_width: item.analysis?.dimensions?.width,
            dimensions_height: item.analysis?.dimensions?.height,
            material: item.analysis?.material,
            colors: item.analysis?.colors,
            style: item.analysis?.style,
            serial_number: item.analysis?.serialNumber,
            features: item.analysis?.features,
            accessories: item.analysis?.accessories,
            tags: item.analysis?.tags,
            postal_code: selectedAddress?.postal_code,
            location: selectedAddress?.city,
            estimated_weight_kg: item.analysis?.estimated_weight_kg,
            package_dimensions: item.analysis?.package_dimensions,
            ai_shipping_domestic: item.analysis?.ai_shipping_domestic,
            ai_shipping_international: item.analysis?.ai_shipping_international,
            selected_address_id: selectedShippingAddress || null,
            shipping_from_country: countryCode,
            snapshot_shipping_enabled: shippingEnabled,
            snapshot_shipping_cost: shippingCost,
            snapshot_shipping_cost_type: shippingCostType,
            snapshot_shipping_description: shippingDescription || null,
            snapshot_pickup_enabled: pickupEnabled,
            snapshot_show_location_publicly: showLocationPublicly,
            snapshot_pickup_address: selectedAddress?.address,
            snapshot_pickup_postal_code: selectedAddress?.postal_code,
            snapshot_pickup_city: selectedAddress?.city,
            snapshot_pickup_country: selectedAddress?.country,
            snapshot_location_description: locationDescription || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (itemData) {
          const { error: imageError } = await supabase
            .from('item_images')
            .insert({
              item_id: itemData.id,
              image_url: publicUrl,
              display_order: 0,
              is_primary: true,
            });

          if (imageError) throw imageError;
        }
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setImages([]);
    setBulkItems([]);
    setAnalysis(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setError('');
    setUploadMode('single');
    onClose();
  };

  const handleModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: UploadMode | null) => {
    if (newMode !== null) {
      setUploadMode(newMode);
      setImages([]);
      setBulkItems([]);
      setAnalysis(null);
      setTitle('');
      setDescription('');
      setPrice('');
      setError('');
    }
  };

  const renderSingleItemMode = () => (
    <>
      <MultiImageUpload images={images} onImagesChange={setImages} />

      {images.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {!analysis && (
            <Box sx={{ mb: 3 }}>
              {shippingAddresses.length > 0 && (
                <TextField
                  fullWidth
                  select
                  label="Versandadresse"
                  value={selectedShippingAddress}
                  onChange={(e) => setSelectedShippingAddress(e.target.value)}
                  sx={{ mb: 2 }}
                  helperText="Wähle die Adresse von der aus versendet wird (für Versandkosten-Berechnung)"
                >
                  {shippingAddresses.map((addr) => (
                    <MenuItem key={addr.id} value={addr.id}>
                      {addr.name ? `${addr.name} (${addr.city}, ${addr.country})` : `${addr.city}, ${addr.country}`}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              {/* AI Settings Info Banner */}
              {sellerProfile && (
                <Alert
                  severity="info"
                  icon={<Info size={20} />}
                  sx={{ mb: 2 }}
                  action={
                    <Button
                      size="small"
                      startIcon={<Settings size={16} />}
                      onClick={() => {
                        onClose();
                        window.location.href = '/settings?tab=ai';
                      }}
                    >
                      Einstellungen
                    </Button>
                  }
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Aktive KI-Einstellungen
                    </Typography>
                    <Typography variant="caption" component="div">
                      📸 Bildanalyse: {sellerProfile.ai_analyze_all_images ?
                        `Alle ${images.length} Bilder werden analysiert` :
                        'Nur Hauptbild wird analysiert'}
                    </Typography>
                    <Typography variant="caption" component="div">
                      ✍️ Schreibstil: {sellerProfile.ai_text_style || 'balanced'}
                    </Typography>
                    <Typography variant="caption" component="div">
                      📝 Textlänge: {sellerProfile.ai_text_length || 'medium'}
                    </Typography>
                    {!sellerProfile.ai_analyze_all_images && images.length > 1 && (
                      <Typography variant="caption" component="div" sx={{ mt: 0.5, color: 'warning.main', fontWeight: 600 }}>
                        💡 Tipp: Aktiviere "Alle Bilder analysieren" für detailliertere Ergebnisse (z.B. bei Dokumenten wie Zulassungsschein)
                      </Typography>
                    )}
                  </Box>
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleAnalyzeSingle}
                disabled={analyzing || (shippingAddresses.length > 0 && !selectedShippingAddress)}
              >
                {analyzing ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Analysiere {sellerProfile?.ai_analyze_all_images ? 'alle Bilder' : 'Hauptbild'} mit KI...
                  </>
                ) : (
                  `Mit KI analysieren ${sellerProfile?.ai_analyze_all_images ? `(${images.length} ${images.length === 1 ? 'Bild' : 'Bilder'})` : '(Hauptbild)'}`
                )}
              </Button>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beschreibung"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preis (EUR)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
          </Grid>

          {analysis && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                KI-Analyse Ergebnisse:
              </Typography>

              {analysis.category && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Kategorie:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Chip label={analysis.category} size="small" color="default" />
                    {analysis.subcategory && <Chip label={analysis.subcategory} size="small" color="default" />}
                  </Box>
                </Box>
              )}

              {analysis.brand && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Marke / Logo:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Chip label={analysis.brand} size="small" color="primary" variant="outlined" />
                  </Box>
                </Box>
              )}

              {analysis.condition && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Zustand:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Chip label={analysis.condition} size="small" color="info" />
                  </Box>
                </Box>
              )}

              {(analysis.size || analysis.weight || analysis.dimensions?.length) && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Größe & Maße:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {analysis.size && <Chip label={`Größe: ${analysis.size}`} size="small" variant="outlined" />}
                    {analysis.weight && <Chip label={`Gewicht: ${analysis.weight}`} size="small" variant="outlined" />}
                  </Box>
                </Box>
              )}

              {analysis.colors && analysis.colors.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Farbe(n):</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {analysis.colors.map((color, idx) => (
                      <Chip key={idx} label={color} size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {analysis.features && analysis.features.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Eigenschaften:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {analysis.features.map((feature, idx) => (
                      <Chip key={idx} label={feature} size="small" variant="outlined" color="primary" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }} />
            <Paper sx={{ mb: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  cursor: 'pointer',
                  bgcolor: shippingExpanded || pickupExpanded ? 'grey.50' : 'grey.50',
                  '&:hover': { bgcolor: 'grey.100' },
                  transition: 'background-color 0.2s'
                }}
                onClick={() => {
                  const newState = !(shippingExpanded || pickupExpanded);
                  setShippingExpanded(newState);
                  setPickupExpanded(newState);
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Package size={20} color="#666" />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Versand & Abholung
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {shippingEnabled && pickupEnabled ? 'Versand & Abholung aktiviert' :
                       shippingEnabled ? 'Nur Versand aktiviert' :
                       pickupEnabled ? 'Nur Abholung aktiviert' :
                       'Keine Optionen aktiviert'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small">
                  {(shippingExpanded || pickupExpanded) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </IconButton>
              </Box>

              {(shippingExpanded || pickupExpanded) && (
                <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Diese Einstellungen sind aus deinem Profil übernommen. Du kannst sie für diesen Artikel anpassen.
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shippingEnabled}
                          onChange={(e) => setShippingEnabled(e.target.checked)}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Truck size={16} />
                          <Typography variant="body2">Versand</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={pickupEnabled}
                          onChange={(e) => setPickupEnabled(e.target.checked)}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPin size={16} />
                          <Typography variant="body2">Abholung</Typography>
                        </Box>
                      }
                    />
                  </Box>

                  {shippingEnabled && (
                    <Box sx={{ mb: 2, pl: 2, borderLeft: 3, borderColor: 'primary.main' }}>
                      <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
                        <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1 }}>
                          Versandkostenberechnung
                        </FormLabel>
                        <RadioGroup
                          value={shippingCostType}
                          onChange={(e) => setShippingCostType(e.target.value as 'free' | 'fixed' | 'ai_calculated')}
                        >
                          <FormControlLabel
                            value="free"
                            control={<Radio size="small" />}
                            label={<Typography variant="body2">Kostenloser Versand</Typography>}
                          />
                          <FormControlLabel
                            value="fixed"
                            control={<Radio size="small" />}
                            label={<Typography variant="body2">Feste Versandkosten</Typography>}
                          />
                          <FormControlLabel
                            value="ai_calculated"
                            control={<Radio size="small" />}
                            label={<Typography variant="body2">KI-berechnete Versandkosten</Typography>}
                          />
                        </RadioGroup>
                      </FormControl>

                      {shippingCostType === 'fixed' && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Versandkosten"
                          type="number"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">€</InputAdornment>,
                          }}
                          inputProps={{ step: '0.01', min: '0' }}
                          sx={{ mb: 1.5 }}
                        />
                      )}

                      {shippingCostType === 'ai_calculated' && (
                        <Alert severity="info" sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                          Die KI berechnet die Versandkosten basierend auf Artikelgröße und Gewicht bei der Analyse.
                        </Alert>
                      )}

                      <TextField
                        fullWidth
                        size="small"
                        label="Versandinfo (optional)"
                        value={shippingDescription}
                        onChange={(e) => setShippingDescription(e.target.value)}
                        placeholder="z.B. DHL, Hermes, versichert..."
                        multiline
                        rows={2}
                      />
                    </Box>
                  )}

                  {pickupEnabled && (
                    <Box sx={{ pl: 2, borderLeft: 3, borderColor: 'success.main' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showLocationPublicly}
                            onChange={(e) => setShowLocationPublicly(e.target.checked)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2">Standort öffentlich zeigen</Typography>}
                        sx={{ mb: 1 }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Abholhinweise (optional)"
                        value={locationDescription}
                        onChange={(e) => setLocationDescription(e.target.value)}
                        placeholder="z.B. Hinterhof, 2. Stock..."
                        multiline
                        rows={2}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      )}
    </>
  );

  const renderBulkMode = () => (
    <>
      {bulkItems.length === 0 ? (
        <MultiImageUpload images={images} onImagesChange={setImages} />
      ) : (
        <Box>
          {/* Shipping & Pickup Settings */}
          <Paper sx={{ mb: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                cursor: 'pointer',
                bgcolor: 'grey.50',
                '&:hover': { bgcolor: 'grey.100' },
                transition: 'background-color 0.2s'
              }}
              onClick={() => {
                const newState = !(shippingExpanded || pickupExpanded);
                setShippingExpanded(newState);
                setPickupExpanded(newState);
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Package size={20} color="#666" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Versand & Abholung für alle Artikel
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {shippingEnabled && pickupEnabled ? 'Versand & Abholung aktiviert' :
                     shippingEnabled ? 'Nur Versand aktiviert' :
                     pickupEnabled ? 'Nur Abholung aktiviert' :
                     'Keine Optionen aktiviert'}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small">
                {(shippingExpanded || pickupExpanded) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </IconButton>
            </Box>

            {(shippingExpanded || pickupExpanded) && (
              <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                {shippingAddresses.length > 0 && (
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Adresse"
                    value={selectedShippingAddress}
                    onChange={(e) => setSelectedShippingAddress(e.target.value)}
                    sx={{ mb: 2 }}
                  >
                    {shippingAddresses.map((addr) => (
                      <MenuItem key={addr.id} value={addr.id}>
                        {addr.name ? `${addr.name} (${addr.city}, ${addr.country})` : `${addr.city}, ${addr.country}`}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={shippingEnabled}
                        onChange={(e) => setShippingEnabled(e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Truck size={16} />
                        <Typography variant="body2">Versand</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pickupEnabled}
                        onChange={(e) => setPickupEnabled(e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MapPin size={16} />
                        <Typography variant="body2">Abholung</Typography>
                      </Box>
                    }
                  />
                </Box>

                {shippingEnabled && (
                  <Box sx={{ mb: 2, pl: 2, borderLeft: 3, borderColor: 'primary.main' }}>
                    <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
                      <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1 }}>
                        Versandkostenberechnung
                      </FormLabel>
                      <RadioGroup
                        value={shippingCostType}
                        onChange={(e) => setShippingCostType(e.target.value as 'free' | 'fixed' | 'ai_calculated')}
                      >
                        <FormControlLabel
                          value="free"
                          control={<Radio size="small" />}
                          label={<Typography variant="body2">Kostenloser Versand</Typography>}
                        />
                        <FormControlLabel
                          value="fixed"
                          control={<Radio size="small" />}
                          label={<Typography variant="body2">Feste Versandkosten</Typography>}
                        />
                        <FormControlLabel
                          value="ai_calculated"
                          control={<Radio size="small" />}
                          label={<Typography variant="body2">KI-berechnete Versandkosten</Typography>}
                        />
                      </RadioGroup>
                    </FormControl>

                    {shippingCostType === 'fixed' && (
                      <TextField
                        fullWidth
                        size="small"
                        label="Versandkosten"
                        type="number"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">€</InputAdornment>,
                        }}
                        inputProps={{ step: '0.01', min: '0' }}
                        sx={{ mb: 1.5 }}
                      />
                    )}

                    {shippingCostType === 'ai_calculated' && (
                      <Alert severity="info" sx={{ mb: 1.5, fontSize: '0.875rem' }}>
                        Die KI berechnet die Versandkosten basierend auf Artikelgröße und Gewicht bei der Analyse.
                      </Alert>
                    )}

                    <TextField
                      fullWidth
                      size="small"
                      label="Versandinfo (optional)"
                      value={shippingDescription}
                      onChange={(e) => setShippingDescription(e.target.value)}
                      placeholder="z.B. DHL, Hermes, versichert..."
                      multiline
                      rows={2}
                    />
                  </Box>
                )}

                {pickupEnabled && (
                  <Box sx={{ pl: 2, borderLeft: 3, borderColor: 'success.main' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showLocationPublicly}
                          onChange={(e) => setShowLocationPublicly(e.target.checked)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">Standort öffentlich zeigen</Typography>}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Abholhinweise (optional)"
                      value={locationDescription}
                      onChange={(e) => setLocationDescription(e.target.value)}
                      placeholder="z.B. Hinterhof, 2. Stock..."
                      multiline
                      rows={2}
                    />
                  </Box>
                )}
              </Box>
            )}
          </Paper>

          {/* AI Analysis Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleAnalyzeBulk}
            disabled={analyzing || (shippingAddresses.length > 0 && !selectedShippingAddress)}
            sx={{ mb: 3 }}
          >
            {analyzing ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Analysiere Artikel...
              </>
            ) : (
              `Alle ${bulkItems.length} Artikel mit KI analysieren`
            )}
          </Button>

          {analyzing && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Analysiere {bulkItems.filter(item => item.analyzing).length} von {bulkItems.length} Artikeln...
              </Typography>
            </Box>
          )}

          {/* Items List - Optimized for Mobile */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {bulkItems.length} ARTIKEL
            </Typography>
          </Box>

          <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {bulkItems.map((item, index) => (
              <Paper
                key={item.id}
                sx={{
                  mb: 2,
                  overflow: 'hidden',
                  border: 1,
                  borderColor: item.analyzing ? 'primary.main' : 'divider',
                }}
              >
                {/* Header with Image and Number */}
                <Box
                  sx={{
                    display: 'flex',
                    bgcolor: item.error ? 'error.light' : (item.analyzing ? 'primary.light' : 'grey.50'),
                    p: 1,
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box
                    component="img"
                    src={item.image.preview}
                    alt={`Artikel ${index + 1}`}
                    sx={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{
                        color: item.error ? 'error.dark' : (item.analyzing ? 'primary.dark' : 'text.primary')
                      }}
                    >
                      Artikel {index + 1}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {item.title || 'Noch kein Titel'}
                    </Typography>
                  </Box>
                  {item.analyzing && <CircularProgress size={24} />}
                  {!item.analyzing && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        const updated = bulkItems.filter((_, i) => i !== index);
                        setBulkItems(updated);
                        if (updated.length === 0) {
                          setImages([]);
                        }
                      }}
                      sx={{
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'error.light', color: 'white' },
                      }}
                    >
                      <X size={16} />
                    </IconButton>
                  )}
                </Box>

                {/* Error Alert */}
                {item.error && (
                  <Alert severity="error" sx={{ m: 1.5, mb: 0, fontSize: '0.75rem', py: 0.5 }}>
                    {item.error}
                  </Alert>
                )}

                {/* Fields */}
                <Box sx={{ p: 1.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Titel"
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...bulkItems];
                      updated[index].title = e.target.value;
                      setBulkItems(updated);
                    }}
                    disabled={item.analyzing}
                    sx={{ mb: 1.5 }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Beschreibung"
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...bulkItems];
                      updated[index].description = e.target.value;
                      setBulkItems(updated);
                    }}
                    multiline
                    rows={3}
                    disabled={item.analyzing}
                    sx={{ mb: 1.5 }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Preis"
                    type="number"
                    value={item.price}
                    onChange={(e) => {
                      const updated = [...bulkItems];
                      updated[index].price = e.target.value;
                      setBulkItems(updated);
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                    inputProps={{ step: '0.01', min: '0' }}
                    disabled={item.analyzing}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth fullScreen>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>Artikel hinzufügen</Typography>
        <IconButton onClick={handleClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 10 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4, mt: 2, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={uploadMode}
            exclusive
            onChange={handleModeChange}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              p: 0.75,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: 1,
              borderColor: 'divider',
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1.5,
                gap: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  transform: 'scale(1.02)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                  },
                  '& .icon': {
                    transform: 'scale(1.1)',
                  }
                },
                '&:not(.Mui-selected)': {
                  color: 'text.secondary',
                  bgcolor: 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                  }
                }
              }
            }}
          >
            <ToggleButton value="single">
              <Box className="icon" sx={{ display: 'flex', transition: 'transform 0.2s' }}>
                <ImageIcon size={18} />
              </Box>
              Einzelner Artikel
            </ToggleButton>
            <ToggleButton value="bulk">
              <Box className="icon" sx={{ display: 'flex', transition: 'transform 0.2s' }}>
                <Images size={18} />
              </Box>
              Bulk-Upload
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {uploadMode === 'single' ? renderSingleItemMode() : renderBulkMode()}
      </DialogContent>
      <DialogActions sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
        gap: 1,
        zIndex: 1
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            flex: 1,
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 2,
            py: 1.25
          }}
        >
          Abbrechen
        </Button>
        <Button
          onClick={uploadMode === 'single' ? handleUploadSingle : handleUploadBulk}
          disabled={
            uploading ||
            (uploadMode === 'single' && (!title || !description || !price || images.length === 0)) ||
            (uploadMode === 'bulk' && bulkItems.filter(item => item.title && item.description && item.price).length === 0)
          }
          variant="contained"
          sx={{
            flex: 2,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: 1.25,
            boxShadow: 2
          }}
        >
          {uploading ? 'Lädt hoch...' : uploadMode === 'single' ? 'Veröffentlichen' : `${bulkItems.filter(item => item.title && item.description && item.price).length} Artikel veröffentlichen`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
