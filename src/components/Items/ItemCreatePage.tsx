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
import { ChevronDown, ChevronUp, Sparkles, Info, Package, Save, Coins, X, Lightbulb, Smartphone, Car, FileText, Camera } from 'lucide-react';
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
  const [showAiTips, setShowAiTips] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(''); // String category for BasicInfoSection
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

          // ⚡ MERGE VEHICLE ATTRIBUTES from all analyses
          // Prefer non-empty values from any analysis (especially documents like Zulassungsschein)
          if (analysis.vehicle_brand && !mergedAnalysis.vehicle_brand) {
            mergedAnalysis.vehicle_brand = analysis.vehicle_brand;
          }
          if (analysis.vehicle_year && !mergedAnalysis.vehicle_year) {
            mergedAnalysis.vehicle_year = analysis.vehicle_year;
          }
          if (analysis.vehicle_mileage && !mergedAnalysis.vehicle_mileage) {
            mergedAnalysis.vehicle_mileage = analysis.vehicle_mileage;
          }
          if (analysis.vehicle_fuel_type && !mergedAnalysis.vehicle_fuel_type) {
            mergedAnalysis.vehicle_fuel_type = analysis.vehicle_fuel_type;
          }
          if (analysis.vehicle_color && !mergedAnalysis.vehicle_color) {
            mergedAnalysis.vehicle_color = analysis.vehicle_color;
          }
          if (analysis.vehicle_power_kw && !mergedAnalysis.vehicle_power_kw) {
            mergedAnalysis.vehicle_power_kw = analysis.vehicle_power_kw;
          }
          if (analysis.vehicle_first_registration && !mergedAnalysis.vehicle_first_registration) {
            mergedAnalysis.vehicle_first_registration = analysis.vehicle_first_registration;
          }
          if (analysis.vehicle_tuv_until && !mergedAnalysis.vehicle_tuv_until) {
            mergedAnalysis.vehicle_tuv_until = analysis.vehicle_tuv_until;
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

    // Build complete data object combining AI data and manual form data
    const manualFormData: Partial<AnalysisResult> = analysisData ? {} : {
      condition,
      brand,
      size,
      weight,
      material,
      colors,
      style,
      serialNumber,
      dimensions: {
        length: dimensionsLength,
        width: dimensionsWidth,
        height: dimensionsHeight,
      }
    };

    const completeDataToUse = analysisData || (Object.keys(manualFormData).length > 0 ? manualFormData as AnalysisResult : null);

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

      // IMPORTANT: Extract Gemini tokens BEFORE insert
      const geminiInputTokens = completeDataToUse?.tokenUsage?.inputTokens || 0;
      const geminiOutputTokens = completeDataToUse?.tokenUsage?.outputTokens || 0;
      const totalGeminiTokens = geminiInputTokens + geminiOutputTokens;

      console.log('[Item Insert] Gemini Tokens:', {
        input: geminiInputTokens,
        output: geminiOutputTokens,
        total: totalGeminiTokens,
        hasTokenUsage: !!completeDataToUse?.tokenUsage
      });

      // Determine category_id: from AI analysis or from manual selection
      let categoryId = completeDataToUse?.category_id || categorySelection?.level3?.id || categorySelection?.level2?.id || categorySelection?.level1?.id;

      // If no categoryId but we have a category string from BasicInfoSection, look it up
      if (!categoryId && category) {
        console.log('Looking up category ID from string:', category);
        const { data: categoryData, error: catLookupError } = await supabase
          .from('categories')
          .select('id')
          .ilike('translations->de->>name', `%${category}%`)
          .order('level', { ascending: true })
          .limit(1)
          .single();

        if (!catLookupError && categoryData) {
          categoryId = categoryData.id;
          console.log('✅ Found category ID:', categoryId);
        } else {
          console.log('❌ Category lookup failed:', catLookupError);
        }
      }

      // If AI returned text categories instead of category_id, map them to the hierarchical system
      if (!categoryId && completeDataToUse?.category) {
        console.log('Mapping AI text categories to hierarchical system:', {
          category: completeDataToUse.category,
          subcategory: completeDataToUse.subcategory
        });

        // Fetch all categories to find matches
        const { data: allCategories, error: categoriesError } = await supabase
          .from('categories')
          .select('*');

        if (categoriesError) throw categoriesError;

        // Find level 1 category by matching translated name
        const level1 = allCategories?.find(c =>
          c.level === 1 && (
            c.translations?.de?.name?.toLowerCase().includes(completeDataToUse.category.toLowerCase()) ||
            c.translations?.en?.name?.toLowerCase().includes(completeDataToUse.category.toLowerCase()) ||
            c.slug.toLowerCase().includes(completeDataToUse.category.toLowerCase())
          )
        );

        console.log('Found level 1 category:', level1);

        let level2 = null;

        // Try to find level 2 subcategory if AI provided one
        if (level1 && completeDataToUse.subcategory) {
          level2 = allCategories?.find(c =>
            c.level === 2 &&
            c.parent_id === level1.id && (
              c.translations?.de?.name?.toLowerCase().includes(completeDataToUse.subcategory.toLowerCase()) ||
              c.translations?.en?.name?.toLowerCase().includes(completeDataToUse.subcategory.toLowerCase()) ||
              c.slug.toLowerCase().includes(completeDataToUse.subcategory.toLowerCase())
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
          ai_generated: analysisData !== undefined || analysis !== null,
          category_id: categoryId,
          condition: completeDataToUse?.condition,
          brand: completeDataToUse?.brand,
          size: completeDataToUse?.size,
          weight: completeDataToUse?.weight,
          dimensions_length: completeDataToUse?.dimensions?.length,
          dimensions_width: completeDataToUse?.dimensions?.width,
          dimensions_height: completeDataToUse?.dimensions?.height,
          material: completeDataToUse?.material,
          colors: completeDataToUse?.colors,
          style: completeDataToUse?.style,
          serial_number: completeDataToUse?.serialNumber,
          features: completeDataToUse?.features,
          accessories: completeDataToUse?.accessories,
          tags: completeDataToUse?.tags,
          postal_code: selectedAddress?.postal_code,
          location: selectedAddress?.city,
          estimated_weight_kg: completeDataToUse?.estimated_weight_kg,
          package_dimensions: completeDataToUse?.package_dimensions,
          ai_shipping_domestic: completeDataToUse?.ai_shipping_domestic,
          ai_shipping_international: completeDataToUse?.ai_shipping_international,
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
      if (itemData && completeDataToUse && categoryId === 'f5fb69d5-e054-47e8-a72e-dc05fc3620bf') {  // Autos category ID
        console.log('[Vehicle Attributes] Saving vehicle attributes...');
        const { data: categoryAttributes } = await supabase
          .from('category_attributes')
          .select('id, attribute_key')
          .eq('category_id', categoryId);

        if (categoryAttributes && categoryAttributes.length > 0) {
          const attributeMap = new Map(categoryAttributes.map(attr => [attr.attribute_key, attr.id]));
          const itemAttributes = [];

          // Map vehicle_* fields to item_attributes
          if (completeDataToUse.vehicle_brand && attributeMap.has('brand')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('brand'),
              value_text: completeDataToUse.vehicle_brand
            });
          }
          if (completeDataToUse.vehicle_year && attributeMap.has('year')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('year'),
              value_number: completeDataToUse.vehicle_year
            });
          }
          if (completeDataToUse.vehicle_mileage && attributeMap.has('mileage')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('mileage'),
              value_number: completeDataToUse.vehicle_mileage
            });
          }
          if (completeDataToUse.vehicle_fuel_type && attributeMap.has('fuel_type')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('fuel_type'),
              value_text: completeDataToUse.vehicle_fuel_type
            });
          }
          if (completeDataToUse.vehicle_color && attributeMap.has('color')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('color'),
              value_text: completeDataToUse.vehicle_color
            });
          }
          if (completeDataToUse.vehicle_power_kw && attributeMap.has('power_kw')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('power_kw'),
              value_number: completeDataToUse.vehicle_power_kw
            });
          }
          if (completeDataToUse.vehicle_first_registration && attributeMap.has('first_registration')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('first_registration'),
              value_date: completeDataToUse.vehicle_first_registration
            });
          }
          if (completeDataToUse.vehicle_tuv_until && attributeMap.has('tuv_until')) {
            itemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('tuv_until'),
              value_date: completeDataToUse.vehicle_tuv_until
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

      // 🔥 CRITICAL: Save general attributes to item_attributes for ALL categories (so they appear in filters!)
      if (itemData && completeDataToUse && categoryId) {
        console.log('[General Attributes] Saving general attributes for filters...');

        // Fetch both category-specific AND global filterable attributes
        const { data: allCategoryAttributes } = await supabase
          .from('category_attributes')
          .select('id, attribute_key, is_global')
          .or(`category_id.eq.${categoryId},is_global.eq.true`)
          .eq('is_filterable', true);

        if (allCategoryAttributes && allCategoryAttributes.length > 0) {
          const attributeMap = new Map(allCategoryAttributes.map(attr => [attr.attribute_key, attr.id]));
          const generalItemAttributes = [];

          console.log('[General Attributes] Available filterable attributes:', Array.from(attributeMap.keys()));

          // Map general fields to item_attributes
          if (completeDataToUse.condition && attributeMap.has('condition')) {
            generalItemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('condition'),
              value_text: completeDataToUse.condition
            });
            console.log('[General Attributes] Adding condition:', completeDataToUse.condition);
          }

          if (completeDataToUse.brand && (attributeMap.has('brand') || attributeMap.has('brand_global'))) {
            const brandAttributeId = attributeMap.get('brand') || attributeMap.get('brand_global');
            generalItemAttributes.push({
              item_id: itemData.id,
              attribute_id: brandAttributeId,
              value_text: completeDataToUse.brand
            });
            console.log('[General Attributes] Adding brand:', completeDataToUse.brand);
          }

          if (completeDataToUse.material && attributeMap.has('material')) {
            generalItemAttributes.push({
              item_id: itemData.id,
              attribute_id: attributeMap.get('material'),
              value_text: completeDataToUse.material
            });
            console.log('[General Attributes] Adding material:', completeDataToUse.material);
          }

          // Colors - handle array
          if (completeDataToUse.colors && Array.isArray(completeDataToUse.colors) && attributeMap.has('color')) {
            // Save first color (or could save all separately)
            const colorValue = completeDataToUse.colors[0];
            if (colorValue) {
              generalItemAttributes.push({
                item_id: itemData.id,
                attribute_id: attributeMap.get('color'),
                value_text: colorValue
              });
              console.log('[General Attributes] Adding color:', colorValue);
            }
          }

          if (generalItemAttributes.length > 0) {
            const { error: generalAttributesError } = await supabase
              .from('item_attributes')
              .insert(generalItemAttributes);

            if (generalAttributesError) {
              console.error('[General Attributes] Error saving attributes:', generalAttributesError);
            } else {
              console.log('[General Attributes] ✅ Saved', generalItemAttributes.length, 'attributes to item_attributes');
            }
          } else {
            console.log('[General Attributes] ⚠️ No matching attributes found to save');
          }
        } else {
          console.log('[General Attributes] ⚠️ No filterable category attributes found for category:', categoryId);
        }
      }

      // Handle credit deduction based on listing type
      console.log('[Credit Check] Processing credit deduction...', {
        creditSource: creditCheck.source,
        geminiTokens: totalGeminiTokens,
        aiGenerated: analysisData !== undefined || analysis !== null
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
    <Container maxWidth="md" sx={{ py: 3, pb: 10 }}>
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
          onRegenerate={async () => {
            // Close preview and regenerate analysis
            setShowPreview(false);
            setPreviewData(null);
            setAnalysis(null);
            // Trigger AI generation again
            await handleAIGenerate();
          }}
        />
      )}

      {!showPreview && (
        <>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: { xs: '1.75rem', md: '2.125rem' },
                letterSpacing: '-0.02em',
                mb: 0.75
              }}
            >
              Artikel erstellen
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.9rem',
                maxWidth: '500px',
                mx: 'auto'
              }}
            >
              Lade deine Bilder hoch und lass die KI die Arbeit machen
            </Typography>
          </Box>

          {/* Compact Listing Availability Banner */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: personalCredits > 0 ? 'success.light' : 'info.light',
              bgcolor: personalCredits > 0 ? 'rgba(46, 125, 50, 0.04)' : 'rgba(25, 118, 210, 0.04)',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sparkles size={20} style={{ color: personalCredits > 0 ? '#2e7d32' : '#1976d2' }} />
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: personalCredits > 0 ? 'success.main' : 'info.main'
                  }}
                >
                  {personalCredits > 0
                    ? `${personalCredits} ${personalCredits === 1 ? 'KI-Inserat' : 'KI-Inserate'} verfügbar`
                    : 'Keine KI-Inserate verfügbar'
                  }
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }}
              >
                Manuelle Inserate sind immer kostenlos möglich
              </Typography>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

      {showAiHint && isFirstItem && (
        <Collapse in={showAiHint}>
          <Alert
            severity="info"
            icon={<Sparkles size={18} />}
            action={
              <IconButton
                size="small"
                onClick={() => setShowAiHint(false)}
                sx={{ color: 'inherit' }}
              >
                <X size={16} />
              </IconButton>
            }
            sx={{
              mb: 2.5,
              py: 1.5,
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderColor: '#10b981',
              border: '1px solid',
              '& .MuiAlert-icon': {
                color: '#10b981'
              }
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#047857', fontSize: '0.9rem' }}>
                💡 Willkommen! Dein erster Artikel
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 0.75, lineHeight: 1.5 }}>
                Lade einfach Fotos hoch - der KI-Assistent analysiert die Bilder und schlägt Titel, Beschreibung, Preis und Details vor.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem' }}>
                KI-Einstellungen unter <strong>Profil → Einstellungen → KI-Assistent</strong>
              </Typography>
            </Box>
          </Alert>
        </Collapse>
      )}

      {images.length === 0 ? (
        <MultiImageUpload images={images} onImagesChange={setImages} />
      ) : (
        <Paper sx={{ p: { xs: 1.75, md: 2.25 }, borderRadius: 2.5, mb: 2.5 }}>
          <MultiImageUpload images={images} onImagesChange={setImages} />

        {images.length > 0 && (
          <>
            <Box sx={{ mt: 2.5, p: 2, border: '1.5px solid', borderColor: 'primary.main', borderRadius: 1.5, bgcolor: 'rgba(25, 118, 210, 0.02)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Sparkles size={16} style={{ color: '#1976d2' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.875rem' }}>
                    KI-Unterstützung
                  </Typography>
                </Box>
                {analysis && estimatedCost > 0 && (
                  <Chip
                    icon={<Coins size={12} />}
                    label={`≈${estimatedCost} Credits`}
                    size="small"
                    variant="outlined"
                    color="warning"
                    sx={{ fontWeight: 600, height: '24px', fontSize: '0.75rem' }}
                  />
                )}
              </Box>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Zusätzliche Informationen für die KI (optional)"
                placeholder="z.B. Erbstück, Notverkauf, versteckte Mängel, besondere Merkmale..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                helperText="Hilft der KI für bessere Beschreibung und realistischeren Preis"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem',
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.7rem',
                  }
                }}
              />

              {/* AI Tips Section */}
              <Collapse in={showAiTips}>
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'rgba(255, 152, 0, 0.04)', borderRadius: 1, border: '1px solid', borderColor: 'rgba(255, 152, 0, 0.3)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Lightbulb size={16} style={{ color: '#ed6c02' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main', fontSize: '0.8rem' }}>
                        Tipp: So verbessern Sie das KI-Ergebnis deutlich
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => setShowAiTips(false)}
                      sx={{ p: 0.25 }}
                    >
                      <X size={14} />
                    </IconButton>
                  </Box>

                  <Typography variant="caption" sx={{ display: 'block', mb: 1.25, color: 'text.secondary', fontSize: '0.75rem', lineHeight: 1.4 }}>
                    Die KI kann nur sehen, was auf den Bildern zu erkennen ist. Geben Sie zusätzliche Infos an, die schwer zu erkennen sind:
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Smartphone size={14} style={{ marginTop: '2px', flexShrink: 0, color: '#666' }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.primary' }}>
                          Elektronik:
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block' }}>
                          "iPhone 17 Pro, 256GB, Space Gray, OVP vorhanden"
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Car size={14} style={{ marginTop: '2px', flexShrink: 0, color: '#666' }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.primary' }}>
                          Fahrzeuge:
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block' }}>
                          "VW Golf 8, Baujahr 2021, 45.000 km, TÜV bis 08/2025"
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Camera size={14} style={{ marginTop: '2px', flexShrink: 0, color: '#666' }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.primary' }}>
                          Zusätzliche Fotos:
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block' }}>
                          Laden Sie Zulassungsschein, Rechnung, Planette oder technische Daten hoch
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <FileText size={14} style={{ marginTop: '2px', flexShrink: 0, color: '#666' }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.primary' }}>
                          Wichtige Details:
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block' }}>
                          Modellbezeichnung, Seriennummer, Garantie, versteckte Mängel
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
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
            <Box sx={{ mt: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setWorkflowStep('manual')}
                  sx={{
                    py: 1.25,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    borderRadius: 1.5,
                  }}
                >
                  Manuell weitermachen
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAIGenerate}
                  disabled={analyzing || personalCredits < 1}
                  startIcon={analyzing ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />}
                  sx={{
                    py: 1.25,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: 1.5,
                    boxShadow: 2,
                  }}
                >
                  {analyzing ? 'Generiere mit KI...' : 'Mit KI erzeugen'}
                </Button>
              </Box>
              <Box sx={{ mt: 1.5, p: 1.15, bgcolor: 'rgba(25, 118, 210, 0.04)', borderRadius: 1, border: '1px solid', borderColor: 'rgba(25, 118, 210, 0.2)' }}>
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
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        Gleich veröffentlichen
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
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
        <Paper sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2.5, fontSize: '1.125rem' }}>
              Artikelinformationen
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
                <AccordionSummary
                  expandIcon={<ChevronDown size={18} />}
                  sx={{
                    minHeight: '48px',
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Info size={18} color="#1976d2" />
                    <Typography fontWeight={600} sx={{ fontSize: '0.95rem' }}>Grundinformationen</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2.5 }}>
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
                  expandIcon={<ChevronDown size={18} />}
                  sx={{
                    minHeight: '48px',
                    bgcolor: 'rgba(156, 39, 176, 0.04)',
                    '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.08)' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Package size={18} color="#9c27b0" />
                    <Typography fontWeight={600} sx={{ fontSize: '0.95rem' }}>Details (Optional)</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2.5 }}>
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

          <Box sx={{ p: 2.5, pt: 0 }}>
            <Box sx={{ mb: 1.5, p: 1.25, bgcolor: 'rgba(25, 118, 210, 0.04)', borderRadius: 1, border: '1px solid', borderColor: 'rgba(25, 118, 210, 0.2)' }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                      Gleich veröffentlichen
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Inserat direkt online stellen (sonst als Entwurf speichern)
                    </Typography>
                  </Box>
                }
                sx={{ m: 0 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleAIGenerate}
                disabled={analyzing}
                startIcon={analyzing ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />}
                sx={{
                  py: 1.25,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  borderRadius: 1.5,
                }}
              >
                {analyzing ? 'Generiere mit KI...' : 'Mit KI erzeugen'}
              </Button>

              <Button
                fullWidth
                variant="contained"
                onClick={() => publishItem()}
                disabled={uploading || !title || !description || !price}
                startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                sx={{
                  py: 1.25,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: 1.5,
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
