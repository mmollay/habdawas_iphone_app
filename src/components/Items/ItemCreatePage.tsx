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
import { CategorySelection } from '../../types/categories';
import { AIAnalysisPreview } from './AIAnalysisPreview';

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
  category_id?: string;
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
  // Vehicle-specific attributes
  vehicle_brand?: string;
  vehicle_year?: number;
  vehicle_mileage?: number;
  vehicle_fuel_type?: string;
  vehicle_color?: string;
  vehicle_power_kw?: number;
  vehicle_first_registration?: string;
  vehicle_tuv_until?: string;
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
  const [categorySelection, setCategorySelection] = useState<CategorySelection | undefined>(undefined);
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // AI Analysis Preview States
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
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
      const documentDescriptions: string[] = [];

      if (analyses.length > 1) {
        analyses.forEach(analysis => {
          if (analysis === bestAnalysis) return; // Skip the base analysis

          // Merge features
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

          // Collect document descriptions (Zulassungsschein, etc.)
          const isDocument = documentKeywords.some(kw => analysis.title.toLowerCase().includes(kw));
          if (isDocument && analysis.description) {
            // Extract key facts from document description
            const lines = analysis.description.split('\n').filter(line => line.trim());
            const keyFacts = lines.filter(line =>
              line.includes(':') || // Lines with colons likely contain data
              line.match(/\d{4}/) || // Years
              line.match(/\d+\s*km/) || // Kilometers
              line.toLowerCase().includes('tüv') ||
              line.toLowerCase().includes('erstzulassung') ||
              line.toLowerCase().includes('baujahr')
            );
            if (keyFacts.length > 0) {
              documentDescriptions.push(...keyFacts);
            }
          }
        });
      }

      // Append document facts to description
      if (documentDescriptions.length > 0) {
        const factsSection = '\n\n📋 Technische Daten:\n' + documentDescriptions.map(fact => `• ${fact.trim()}`).join('\n');
        mergedAnalysis.description += factsSection;
      }

      setAnalysis(mergedAnalysis);
      setTitle(mergedAnalysis.title);
      setDescription(mergedAnalysis.description);
      setPrice(mergedAnalysis.price.toString());

      // Map AI text categories to hierarchical system FIRST
      let mappedCategoryId = mergedAnalysis.category_id;
      let mappedCategorySelection: CategorySelection = {};

      if (!mappedCategoryId && mergedAnalysis.category) {
        console.log('🔍 Mapping AI text categories to hierarchical system:', {
          category: mergedAnalysis.category,
          subcategory: mergedAnalysis.subcategory
        });

        // Fetch all categories to find matches
        const { data: allCategories, error: categoriesError } = await supabase
          .from('categories')
          .select('*');

        if (!categoriesError && allCategories) {
          // Find level 1 category by matching translated name
          const level1 = allCategories.find(c =>
            c.level === 1 && (
              c.translations?.de?.name?.toLowerCase().includes(mergedAnalysis.category.toLowerCase()) ||
              c.translations?.en?.name?.toLowerCase().includes(mergedAnalysis.category.toLowerCase()) ||
              c.slug.toLowerCase().includes(mergedAnalysis.category.toLowerCase())
            )
          );

          console.log('✅ Found level 1 category:', level1?.translations?.de?.name || level1?.slug);

          if (level1) {
            mappedCategorySelection.level1 = level1;

            // Try to find level 2 subcategory if AI provided one
            if (mergedAnalysis.subcategory) {
              const level2 = allCategories.find(c =>
                c.level === 2 &&
                c.parent_id === level1.id && (
                  c.translations?.de?.name?.toLowerCase().includes(mergedAnalysis.subcategory.toLowerCase()) ||
                  c.translations?.en?.name?.toLowerCase().includes(mergedAnalysis.subcategory.toLowerCase()) ||
                  c.slug.toLowerCase().includes(mergedAnalysis.subcategory.toLowerCase())
                )
              );

              if (level2) {
                mappedCategorySelection.level2 = level2;
                mappedCategoryId = level2.id;
                console.log('✅ Found level 2 category:', level2.translations?.de?.name || level2.slug);
              }
            }

            // If no level 2 found from subcategory, try to infer from title/description
            if (!mappedCategorySelection.level2) {
              const titleAndDesc = `${mergedAnalysis.title} ${mergedAnalysis.description}`.toLowerCase();
              const level2Options = allCategories.filter(c =>
                c.level === 2 &&
                c.parent_id === level1.id
              );

              const level2 = level2Options.find(c => {
                const categoryName = c.translations?.de?.name?.toLowerCase() || '';
                const categorySlug = c.slug.toLowerCase();
                return titleAndDesc.includes(categoryName) ||
                       titleAndDesc.includes(categorySlug) ||
                       (categorySlug.includes('auto') && (titleAndDesc.includes('auto') || titleAndDesc.includes('vw') || titleAndDesc.includes('bmw') || titleAndDesc.includes('mercedes')));
              });

              if (level2) {
                mappedCategorySelection.level2 = level2;
                mappedCategoryId = level2.id;
                console.log('✅ Inferred level 2 from title/description:', level2.translations?.de?.name || level2.slug);
              }
            }

            // Set final category ID
            if (!mappedCategoryId) {
              mappedCategoryId = level1.id;
              console.log('⚠️ Using Level 1 category (no Level 2 found)');
            }
          } else {
            console.warn('❌ No matching category found for:', mergedAnalysis.category);
          }
        }
      }

      // Store mapped category_id in mergedAnalysis for publish
      mergedAnalysis.category_id = mappedCategoryId;

      // NOTE: We stop at Level 2 categories. Further classification happens via attributes/filters
      console.log('📂 Category mapping complete - stopping at Level 2 (attributes will be used for filtering)');

      // Load category hierarchy for preview display
      if (mappedCategoryId) {
        try {
          const { data: selectedCategory } = await supabase
            .from('categories')
            .select('*')
            .eq('id', mappedCategoryId)
            .single();

          if (selectedCategory) {
            if (selectedCategory.level === 3) {
              mappedCategorySelection.level3 = selectedCategory;
              // Load level 2 parent
              const { data: level2 } = await supabase
                .from('categories')
                .select('*')
                .eq('id', selectedCategory.parent_id)
                .single();
              if (level2) {
                mappedCategorySelection.level2 = level2;
                // Load level 1 grandparent
                const { data: level1 } = await supabase
                  .from('categories')
                  .select('*')
                  .eq('id', level2.parent_id)
                  .single();
                if (level1) mappedCategorySelection.level1 = level1;
              }
            } else if (selectedCategory.level === 2) {
              mappedCategorySelection.level2 = selectedCategory;
              // Load level 1 parent
              const { data: level1 } = await supabase
                .from('categories')
                .select('*')
                .eq('id', selectedCategory.parent_id)
                .single();
              if (level1) mappedCategorySelection.level1 = level1;
            } else if (selectedCategory.level === 1) {
              mappedCategorySelection.level1 = selectedCategory;
            }

            setCategorySelection(mappedCategorySelection);
            console.log('📂 Category loaded into UI:', mappedCategorySelection);
          }
        } catch (catErr) {
          console.error('Failed to load category for UI:', catErr);
        }
      }

      // Show Preview with category info
      setPreviewData({
        analyses,
        scoredAnalyses,
        mergedAnalysis,
        categoryInfo: {
          level1: mappedCategorySelection.level1?.translations?.de?.name || mappedCategorySelection.level1?.slug,
          level2: mappedCategorySelection.level2?.translations?.de?.name || mappedCategorySelection.level2?.slug,
          level3: mappedCategorySelection.level3?.translations?.de?.name || mappedCategorySelection.level3?.slug,
        }
      });
      setShowPreview(true);
      console.log('🎨 Preview shown with category:', {
        level1: mappedCategorySelection.level1?.translations?.de?.name,
        level2: mappedCategorySelection.level2?.translations?.de?.name,
        level3: mappedCategorySelection.level3?.translations?.de?.name
      });
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

      // Determine category_id: from AI analysis or from manual selection
      let categoryId = dataToUse?.category_id || categorySelection?.level3?.id || categorySelection?.level2?.id || categorySelection?.level1?.id;

      // If AI returned text categories instead of category_id, map them to the hierarchical system
      if (!categoryId && dataToUse?.category) {
        console.log('Mapping AI text categories to hierarchical system:', {
          category: dataToUse.category,
          subcategory: dataToUse.subcategory
        });

        // Fetch all categories to find matches
        const { data: allCategories, error: categoriesError } = await supabase
          .from('categories')
          .select('*');

        if (categoriesError) throw categoriesError;

        // Find level 1 category by matching translated name
        const level1 = allCategories?.find(c =>
          c.level === 1 && (
            c.translations?.de?.name?.toLowerCase().includes(dataToUse.category.toLowerCase()) ||
            c.translations?.en?.name?.toLowerCase().includes(dataToUse.category.toLowerCase()) ||
            c.slug.toLowerCase().includes(dataToUse.category.toLowerCase())
          )
        );

        console.log('Found level 1 category:', level1);

        let level2 = null;

        // Try to find level 2 subcategory if AI provided one
        if (level1 && dataToUse.subcategory) {
          level2 = allCategories?.find(c =>
            c.level === 2 &&
            c.parent_id === level1.id && (
              c.translations?.de?.name?.toLowerCase().includes(dataToUse.subcategory.toLowerCase()) ||
              c.translations?.en?.name?.toLowerCase().includes(dataToUse.subcategory.toLowerCase()) ||
              c.slug.toLowerCase().includes(dataToUse.subcategory.toLowerCase())
            )
          );

          console.log('Found level 2 category from subcategory:', level2);
        }

        // If no level 2 found from subcategory, try to infer from title/description
        if (level1 && !level2) {
          const titleAndDesc = `${itemTitle} ${itemDescription}`.toLowerCase();

          // Get all level 2 categories under this parent
          const level2Options = allCategories?.filter(c =>
            c.level === 2 &&
            c.parent_id === level1.id
          ) || [];

          // Find level 2 by matching keywords from title/description
          level2 = level2Options.find(c => {
            const categoryName = c.translations?.de?.name?.toLowerCase() || '';
            const categorySlug = c.slug.toLowerCase();

            // Check if category name or slug appears in title/description
            return titleAndDesc.includes(categoryName) ||
                   titleAndDesc.includes(categorySlug) ||
                   // Special matching for common keywords
                   (categorySlug.includes('auto') && (titleAndDesc.includes('auto') || titleAndDesc.includes('vw') || titleAndDesc.includes('bmw') || titleAndDesc.includes('mercedes')));
          });

          if (level2) {
            console.log('Inferred level 2 category from title/description:', level2);
          }
        }

        // Set category_id with preference: Level 2 > Level 1
        if (level2) {
          categoryId = level2.id;
          console.log('✅ Using Level 2 category:', categoryId);
        } else if (level1) {
          categoryId = level1.id;
          console.log('⚠️ Using Level 1 category (no Level 2 found):', categoryId);
        }
      }

      // Validate category_id exists and is valid
      if (!categoryId) {
        throw new Error('Bitte wähle eine Kategorie aus, bevor du das Inserat erstellst.');
      }

      // Verify the category exists in database
      const { data: categoryExists, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', categoryId)
        .maybeSingle();

      if (categoryError || !categoryExists) {
        console.error('Category validation failed:', { categoryId, categoryError, categoryExists });
        throw new Error('Die ausgewählte Kategorie ist ungültig. Bitte wähle eine andere Kategorie.');
      }

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
          category_id: categoryId,
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

      if (insertError) {
        console.error('Item insert error:', insertError);
        console.error('Insert data:', {
          category_id: categoryId,
          title: itemTitle,
          price: itemPrice,
          status: publishImmediately ? 'published' : 'draft'
        });
        throw new Error(`Fehler beim Erstellen des Inserats: ${insertError.message}`);
      }

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

      // Save vehicle attributes if present
      if (itemData && dataToUse && categoryId === 'f5fb69d5-e054-47e8-a72e-dc05fc3620bf') {  // Autos category ID
        console.log('[Vehicle Attributes] Saving vehicle attributes...');
        const { data: categoryAttributes } = await supabase
          .from('category_attributes')
          .select('id, attribute_key')
          .eq('category_id', categoryId);

        if (categoryAttributes && categoryAttributes.length > 0) {
          const attributeMap = new Map(categoryAttributes.map(attr => [attr.attribute_key, attr.id]));
          const itemAttributes = [];

          // Map vehicle_* fields to item_attributes
          if (dataToUse.vehicle_brand && attributeMap.has('brand')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('brand'),
              value_text: dataToUse.vehicle_brand
            });
          }
          if (dataToUse.vehicle_year && attributeMap.has('year')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('year'),
              value_number: dataToUse.vehicle_year
            });
          }
          if (dataToUse.vehicle_mileage && attributeMap.has('mileage')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('mileage'),
              value_number: dataToUse.vehicle_mileage
            });
          }
          if (dataToUse.vehicle_fuel_type && attributeMap.has('fuel_type')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('fuel_type'),
              value_text: dataToUse.vehicle_fuel_type
            });
          }
          if (dataToUse.vehicle_color && attributeMap.has('color')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('color'),
              value_text: dataToUse.vehicle_color
            });
          }
          if (dataToUse.vehicle_power_kw && attributeMap.has('power_kw')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('power_kw'),
              value_number: dataToUse.vehicle_power_kw
            });
          }
          if (dataToUse.vehicle_first_registration && attributeMap.has('first_registration')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('first_registration'),
              value_date: dataToUse.vehicle_first_registration
            });
          }
          if (dataToUse.vehicle_tuv_until && attributeMap.has('tuv_until')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('tuv_until'),
              value_date: dataToUse.vehicle_tuv_until
            });
          }

          if (itemAttributes.length > 0) {
            const { error: attributesError } = await supabase
              .from('item_attributes')
              .insert(itemAttributes);

            if (attributesError) {
              console.error('[Vehicle Attributes] Error saving attributes:', attributesError);
            } else {
              console.log('[Vehicle Attributes] Saved', itemAttributes.length, 'attributes');
            }
          }
        }
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
      {/* AI Analysis Preview Modal */}
      {showPreview && previewData && (
        <AIAnalysisPreview
          analyses={previewData.analyses}
          scoredAnalyses={previewData.scoredAnalyses}
          mergedAnalysis={previewData.mergedAnalysis}
          categoryInfo={previewData.categoryInfo}
          onConfirm={async () => {
            setShowPreview(false);
            await publishItem(previewData.mergedAnalysis);
          }}
          onCancel={() => {
            setShowPreview(false);
            setPreviewData(null);
          }}
        />
      )}

      {!showPreview && (
        <>
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
                    category={categorySelection}
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
                    onCategoryChange={setCategorySelection}
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
        </>
      )}

    </Container>
  );
};
