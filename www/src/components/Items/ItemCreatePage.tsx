import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Alert,
  Typography,
  Checkbox,
  FormControlLabel,
  Paper,
  Chip,
  Collapse,
  IconButton,
  CircularProgress,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ChevronDown, ChevronUp, Sparkles, Info, Package, Save, Coins, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCreditsStats } from '../../hooks/useCreditsStats';
import { useCreditCheck } from '../../hooks/useCreditCheck';
import { useTokenBasedCredits } from '../../hooks/useTokenBasedCredits';
import { supabase } from '../../lib/supabase';
import { getDefaultCountry } from '../../utils/countryUtils';
import { MultiImageUpload } from '../Upload/MultiImageUpload';
import { ItemSettingsPreview } from './ItemSettingsPreview';
import { BasicInfoSection } from '../ItemForm/BasicInfoSection';
import { DetailedInfoSection } from '../ItemForm/DetailedInfoSection';

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
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costTokens: number;
  };
}

type WorkflowStep = 'upload' | 'choose' | 'manual';

export const ItemCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { personalCredits } = useCreditsStats();
  const { checkCredit, consumeCredit } = useCreditCheck();
  const { calculateCreditsFromTokens, deductCreditsForAI, settings } = useTokenBasedCredits();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [images, setImages] = useState<ImageFile[]>([]);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [duration, setDuration] = useState(30);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);

  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>('');
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [showAiHint, setShowAiHint] = useState(false);
  const [isFirstItem, setIsFirstItem] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [tags, setTags] = useState<string[]>([]);
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
  const [shippingCostType, setShippingCostType] = useState<'free' | 'fixed' | 'ai_calculated'>('free');
  const [shippingCostFixed, setShippingCostFixed] = useState(0);
  const [shippingDescription, setShippingDescription] = useState('');
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [showLocationPublicly, setShowLocationPublicly] = useState(false);
  const [locationDescription, setLocationDescription] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        const [addressesRes, profileRes, itemsCountRes] = await Promise.all([
          supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default_shipping', { ascending: false }),
          supabase
            .from('profiles')
            .select('shipping_enabled, shipping_cost, shipping_cost_type, shipping_description, pickup_enabled, show_location_publicly, location_description, ai_analyze_all_images')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('items')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
        ]);

        if (addressesRes.data) {
          setShippingAddresses(addressesRes.data);

          // Find default pickup address (for pickup_only or both)
          const pickupAddresses = addressesRes.data.filter(
            a => a.address_type === 'pickup_only' || a.address_type === 'both'
          );
          const defaultPickupAddr = pickupAddresses.find(a => a.is_default_shipping) || pickupAddresses[0];

          if (defaultPickupAddr) {
            setSelectedShippingAddress(defaultPickupAddr.id);
          }
        }

        if (profileRes.data) {
          setSellerProfile(profileRes.data);
          // Set default values from profile
          if (profileRes.data.shipping_enabled) {
            setShippingEnabled(profileRes.data.shipping_enabled);
          }
          if (profileRes.data.shipping_cost_type) {
            setShippingCostType(profileRes.data.shipping_cost_type);
          }
          if (profileRes.data.shipping_cost) {
            setShippingCostFixed(profileRes.data.shipping_cost);
          }
          if (profileRes.data.shipping_description) {
            setShippingDescription(profileRes.data.shipping_description);
          }
          if (profileRes.data.pickup_enabled) {
            setPickupEnabled(profileRes.data.pickup_enabled);
          }
          if (profileRes.data.show_location_publicly !== undefined) {
            setShowLocationPublicly(profileRes.data.show_location_publicly);
          }
          if (profileRes.data.location_description) {
            setLocationDescription(profileRes.data.location_description);
          }
        }

        const itemCount = itemsCountRes.count || 0;
        const hasNoItems = itemCount === 0;
        setIsFirstItem(hasNoItems);
        setShowAiHint(hasNoItems);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, [user, navigate]);

  useEffect(() => {
    if (images.length > 0 && workflowStep === 'upload') {
      setWorkflowStep('choose');
    }
  }, [images, workflowStep]);

  // Update estimated cost based on Gemini token usage
  useEffect(() => {
    if (settings && analysis) {
      // AI was used - get token count from analysis
      const geminiTokens = analysis.tokenUsage?.totalTokens || 0;
      const estimate = calculateCreditsFromTokens(geminiTokens);
      setEstimatedCost(estimate.estimatedCredits);
    } else {
      // Manual listing - free
      setEstimatedCost(0);
    }
  }, [analysis, settings, calculateCreditsFromTokens]);

  const analyzeImage = async (imageData: string, shippingCountry: string, notes?: string): Promise<AnalysisResult> => {
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
          shippingCountry: countryCode,
          additionalNotes: notes
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      if (result.insufficientTokens) {
        throw new Error(`Nicht genügend Tokens. Du hast ${result.currentBalance} Tokens, benötigt wird ${result.required}.`);
      }
      throw new Error(result.error || 'Analyse fehlgeschlagen');
    }

    return result;
  };

  const handleAIGenerate = async () => {
    if (images.length === 0 || !user) return;

    setAnalyzing(true);
    setError('');

    try {
      console.log('Starting AI analysis...');
      const selectedAddress = shippingAddresses.find(addr => addr.id === selectedShippingAddress);
      const shippingCountry = selectedAddress?.country || getDefaultCountry();

      const analyzeAllImages = sellerProfile?.ai_analyze_all_images ?? false;
      const imagesToAnalyze = analyzeAllImages ? images : [images.find(img => img.isPrimary) || images[0]];

      console.log('Analyzing images:', imagesToAnalyze.length);
      const analyses = await Promise.all(
        imagesToAnalyze.map(img => analyzeImage(img.preview, shippingCountry, additionalNotes))
      );

      console.log('Analysis complete:', analyses);
      const mergedAnalysis = analyses[0];
      if (analyses.length > 1) {
        analyses.slice(1).forEach(analysis => {
          if (analysis.features) {
            mergedAnalysis.features = [...(mergedAnalysis.features || []), ...analysis.features];
          }
          if (analysis.colors) {
            mergedAnalysis.colors = [...new Set([...(mergedAnalysis.colors || []), ...analysis.colors])];
          }
          if (analysis.accessories) {
            mergedAnalysis.accessories = [...(mergedAnalysis.accessories || []), ...analysis.accessories];
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

      console.log('Publishing item with data:', mergedAnalysis);
      // Direkt nach KI-Generierung speichern und zur Detail-Seite
      await publishItem(mergedAnalysis);
      console.log('Item published successfully');
    } catch (err) {
      console.error('Error in handleAIGenerate:', err);
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen');
    } finally {
      setAnalyzing(false);
    }
  };

  const publishItem = async (analysisData?: AnalysisResult) => {
    if (!user) return;

    const itemTitle = analysisData?.title || title;
    const itemDescription = analysisData?.description || description;
    const itemPrice = analysisData?.price || parseFloat(price);

    if (!itemTitle || !itemDescription || !itemPrice) return;

    if (!user.email_confirmed_at) {
      setError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.');
      return;
    }

    // Check if user has credits to create listing
    console.log('[Credit Check] Checking credits before listing creation...');
    const creditCheck = await checkCredit();
    console.log('[Credit Check] Result:', creditCheck);

    if (!creditCheck.canCreate) {
      setError(creditCheck.message || 'Du kannst derzeit kein Inserat erstellen. Bitte spende oder kaufe Credits.');
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
      const dataToUse = analysisData || analysis;

      // IMPORTANT: Extract Gemini tokens BEFORE insert
      const geminiInputTokens = dataToUse?.tokenUsage?.inputTokens || 0;
      const geminiOutputTokens = dataToUse?.tokenUsage?.outputTokens || 0;
      const totalGeminiTokens = geminiInputTokens + geminiOutputTokens;

      console.log('[Item Insert] Gemini Tokens:', {
        input: geminiInputTokens,
        output: geminiOutputTokens,
        total: totalGeminiTokens,
        hasTokenUsage: !!dataToUse?.tokenUsage
      });

      const { data: itemData, error: insertError } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          title: itemTitle,
          description: itemDescription,
          price: itemPrice,
          image_url: primaryImageUrl,
          status: publishImmediately ? 'published' : 'draft',
          ai_generated: dataToUse !== null,
          category: dataToUse?.category,
          subcategory: dataToUse?.subcategory,
          condition: dataToUse?.condition,
          brand: dataToUse?.brand,
          size: dataToUse?.size,
          weight: dataToUse?.weight,
          dimensions_length: dataToUse?.dimensions?.length,
          dimensions_width: dataToUse?.dimensions?.width,
          dimensions_height: dataToUse?.dimensions?.height,
          material: dataToUse?.material,
          colors: dataToUse?.colors,
          style: dataToUse?.style,
          serial_number: dataToUse?.serialNumber,
          features: dataToUse?.features,
          accessories: dataToUse?.accessories,
          tags: dataToUse?.tags,
          postal_code: selectedAddress?.postal_code,
          location: selectedAddress?.city,
          estimated_weight_kg: dataToUse?.estimated_weight_kg,
          package_dimensions: dataToUse?.package_dimensions,
          ai_shipping_domestic: dataToUse?.ai_shipping_domestic,
          ai_shipping_international: dataToUse?.ai_shipping_international,
          selected_address_id: selectedShippingAddress || null,
          shipping_from_country: countryCode,
          snapshot_shipping_enabled: shippingEnabled,
          snapshot_shipping_cost: shippingCostFixed,
          snapshot_shipping_cost_type: shippingCostType,
          snapshot_shipping_description: shippingDescription || null,
          snapshot_pickup_enabled: pickupEnabled,
          snapshot_show_location_publicly: showLocationPublicly,
          price_negotiable: priceNegotiable,
          is_free: isFree,
          price_on_request: priceOnRequest,
          duration_days: duration,
          snapshot_pickup_address: selectedAddress?.address,
          snapshot_pickup_postal_code: selectedAddress?.postal_code,
          snapshot_pickup_city: selectedAddress?.city,
          snapshot_pickup_country: selectedAddress?.country,
          snapshot_location_description: sellerProfile?.location_description || null,
          // CRITICAL FIX: Store Gemini tokens at insert time (will be updated by deduct_credits_for_ai if needed)
          gemini_input_tokens: geminiInputTokens,
          gemini_output_tokens: geminiOutputTokens,
          gemini_tokens_used: totalGeminiTokens,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('Item created:', itemData);

      if (uploadedImageUrls.length > 0 && itemData) {
        const itemImages = uploadedImageUrls.map((url, index) => ({
          item_id: itemData.id,
          image_url: url,
          display_order: index,
          is_primary: images[index]?.isPrimary || index === 0,
        }));

        console.log('Inserting item images:', itemImages.length);
        const { error: imagesError } = await supabase
          .from('item_images')
          .insert(itemImages);

        if (imagesError) throw imagesError;
        console.log('Images inserted successfully');
      }

      // Handle credit deduction based on listing type
      console.log('[Credit Check] Processing credit deduction...', {
        creditSource: creditCheck.source,
        geminiTokens: totalGeminiTokens,
        aiGenerated: dataToUse !== null
      });

      // CRITICAL FIX: Deduct credits for AI usage REGARDLESS of credit source
      if (totalGeminiTokens > 0) {
        // AI listing - ALWAYS deduct based on Gemini tokens
        console.log('[Credit Check] AI listing detected - deducting credits based on Gemini tokens...');
        const deductResult = await deductCreditsForAI(
          user.id,
          itemData.id,
          geminiInputTokens,
          geminiOutputTokens,
          `AI listing creation: ${itemTitle}`
        );

        if (!deductResult.success) {
          console.error('[Credit Check] Failed to deduct credits:', deductResult.error);
          setError(deductResult.error || 'Fehler beim Abziehen der Credits');
          return;
        }

        console.log('[Credit Check] Credits deducted successfully:', {
          creditsUsed: deductResult.creditsUsed,
          newBalance: deductResult.newBalance,
          geminiInputTokens,
          geminiOutputTokens,
          totalTokens: totalGeminiTokens
        });
      } else if (creditCheck.source === 'community_pot') {
        // Manual listing using community pot
        console.log('[Credit Check] Manual listing using community pot (free listing)');
        const creditConsumed = await consumeCredit(creditCheck.source, itemData.id);
        if (!creditConsumed) {
          console.error('[Credit Check] Failed to consume community pot credit');
        }
      } else {
        // Manual listing with personal credits - FREE!
        console.log('[Credit Check] Manual listing with personal credits - FREE (0 credits)');
      }

      console.log('Navigating to:', `/item/${itemData.id}`);
      navigate(`/item/${itemData.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, pb: 12 }}>
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            letterSpacing: '-0.02em',
            mb: 1
          }}
        >
          Artikel erstellen
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.95rem',
            maxWidth: '500px',
            mx: 'auto'
          }}
        >
          Lade deine Bilder hoch und lass die KI die Arbeit machen
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {showAiHint && isFirstItem && (
        <Collapse in={showAiHint}>
          <Alert
            severity="info"
            icon={<Sparkles size={20} />}
            action={
              <IconButton
                size="small"
                onClick={() => setShowAiHint(false)}
                sx={{ color: 'inherit' }}
              >
                <X size={18} />
              </IconButton>
            }
            sx={{
              mb: 3,
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderColor: '#10b981',
              border: '1px solid',
              '& .MuiAlert-icon': {
                color: '#10b981'
              }
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#047857' }}>
                💡 Willkommen! Ihr erster Artikel
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Laden Sie einfach Fotos hoch - unser KI-Assistent analysiert die Bilder automatisch und schlägt Titel, Beschreibung, Preis und weitere Details vor.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Sie können die KI-Einstellungen jederzeit unter <strong>Profil → Einstellungen → KI-Assistent</strong> anpassen.
              </Typography>
            </Box>
          </Alert>
        </Collapse>
      )}

      {images.length === 0 ? (
        <MultiImageUpload images={images} onImagesChange={setImages} />
      ) : (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3 }}>
          <MultiImageUpload images={images} onImagesChange={setImages} />

        {images.length > 0 && (
          <>
            <Box sx={{ mt: 3, p: 2.5, border: '2px solid', borderColor: 'primary.main', borderRadius: 2, bgcolor: 'rgba(25, 118, 210, 0.02)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Sparkles size={18} style={{ color: '#1976d2' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    KI-Unterstützung
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {analysis && (
                    <Chip
                      icon={<Info size={14} />}
                      label={`${analysis.tokenUsage?.totalTokens || 0} Gemini Tokens`}
                      size="small"
                      variant="outlined"
                      color="info"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                  {estimatedCost > 0 ? (
                    <Chip
                      icon={<Coins size={14} />}
                      label={`≈${estimatedCost} Credits`}
                      size="small"
                      variant="outlined"
                      color="warning"
                      sx={{ fontWeight: 600 }}
                    />
                  ) : (
                    <Chip
                      label="Manuell = KOSTENLOS"
                      size="small"
                      color="success"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                  <Chip
                    icon={<Coins size={16} />}
                    label={`${personalCredits} Credits verfügbar`}
                    size="small"
                    color={personalCredits >= estimatedCost ? "primary" : "error"}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Zusätzliche Informationen für die KI (optional)"
                placeholder="z.B. Erbstück, Notverkauf, versteckte Mängel, besondere Merkmale, die auf dem Bild nicht sichtbar sind..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                helperText="Diese Informationen helfen der KI, eine bessere Beschreibung und einen realistischeren Preis zu erstellen"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                  }
                }}
              />
            </Box>

            <ItemSettingsPreview
              pickupAddress={(() => {
                const selectedAddr = shippingAddresses.find(a => a.id === selectedShippingAddress);
                if (!selectedAddr) return '';
                const parts = [
                  selectedAddr.address,
                  selectedAddr.postal_code,
                  selectedAddr.city
                ].filter(Boolean);
                return parts.join(', ');
              })()}
              shippingEnabled={shippingEnabled}
              shippingCostType={shippingCostType}
              shippingCostFixed={shippingCostFixed}
              shippingDescription={shippingDescription}
              priceNegotiable={priceNegotiable}
              isFree={isFree}
              duration={duration}
              onShippingEnabledChange={setShippingEnabled}
              onShippingCostTypeChange={setShippingCostType}
              onShippingCostFixedChange={setShippingCostFixed}
              onShippingDescriptionChange={setShippingDescription}
              onPriceNegotiableChange={setPriceNegotiable}
              onIsFreeChange={setIsFree}
              onDurationChange={setDuration}
              pickupEnabled={pickupEnabled}
              onPickupEnabledChange={setPickupEnabled}
              phoneVisible={(() => {
                const selectedAddr = shippingAddresses.find(a => a.id === selectedShippingAddress);
                return selectedAddr?.show_phone_publicly || false;
              })()}
            />
          </>
        )}

          {workflowStep === 'choose' && images.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => setWorkflowStep('manual')}
                  sx={{
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    borderRadius: 2,
                  }}
                >
                  Manuell weitermachen
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleAIGenerate}
                  disabled={analyzing || personalCredits < 1}
                  startIcon={analyzing ? <CircularProgress size={18} color="inherit" /> : <Sparkles size={18} />}
                  sx={{
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                >
                  {analyzing ? 'Generiere mit KI...' : 'Mit KI erzeugen'}
                </Button>
              </Box>
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(25, 118, 210, 0.04)', borderRadius: 1, border: '1px solid', borderColor: 'rgba(25, 118, 210, 0.2)' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={publishImmediately}
                      onChange={(e) => setPublishImmediately(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Gleich veröffentlichen
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Nach KI-Generierung direkt veröffentlichen
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {workflowStep === 'manual' && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              Artikelinformationen
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ChevronDown size={20} />}
                  sx={{
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Info size={20} color="#1976d2" />
                    <Typography fontWeight={600}>Grundinformationen</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <BasicInfoSection
                    title={title}
                    description={description}
                    price={price}
                    category={category}
                    brand={brand}
                    condition={condition}
                    tags={tags}
                    priceNegotiable={priceNegotiable}
                    isFree={isFree}
                    priceOnRequest={priceOnRequest}
                    duration={duration}
                    onTitleChange={setTitle}
                    onDescriptionChange={setDescription}
                    onPriceChange={setPrice}
                    onCategoryChange={setCategory}
                    onBrandChange={setBrand}
                    onConditionChange={setCondition}
                    onTagsChange={setTags}
                    onPriceNegotiableChange={setPriceNegotiable}
                    onIsFreeChange={setIsFree}
                    onPriceOnRequestChange={setPriceOnRequest}
                    onDurationChange={setDuration}
                    isMobile={isMobile}
                    hideExtendedSettings={true}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ChevronDown size={20} />}
                  sx={{
                    bgcolor: 'rgba(156, 39, 176, 0.04)',
                    '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.08)' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Package size={20} color="#9c27b0" />
                    <Typography fontWeight={600}>Details (Optional)</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
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
                </AccordionDetails>
              </Accordion>
            </Box>
          </Box>

          <Box sx={{ p: 3, pt: 0 }}>
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(25, 118, 210, 0.04)', borderRadius: 1, border: '1px solid', borderColor: 'rgba(25, 118, 210, 0.2)' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Gleich veröffentlichen
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Inserat direkt online stellen (sonst als Entwurf speichern)
                    </Typography>
                  </Box>
                }
                sx={{ m: 0 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleAIGenerate}
                disabled={analyzing}
                startIcon={analyzing ? <CircularProgress size={18} color="inherit" /> : <Sparkles size={18} />}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  borderRadius: 2,
                }}
              >
                {analyzing ? 'Generiere mit KI...' : 'Mit KI erzeugen'}
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => publishItem()}
                disabled={uploading || !title || !description || !price}
                startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                {uploading ? 'Speichere...' : (publishImmediately ? 'Veröffentlichen' : 'Als Entwurf speichern')}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

    </Container>
  );
};
