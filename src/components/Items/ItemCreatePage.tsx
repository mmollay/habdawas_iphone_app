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
import { useDeveloperMode } from '../../contexts/DeveloperModeContext';
import { useCreditsStats } from '../../hooks/useCreditsStats';
import { useCreditCheck } from '../../hooks/useCreditCheck';
import { useTokenBasedCredits } from '../../hooks/useTokenBasedCredits';
import { supabase } from '../../lib/supabase';
import { getDefaultCountry } from '../../utils/countryUtils';
import { MultiImageUpload } from '../Upload/MultiImageUpload';
import { ItemSettingsPreview } from './ItemSettingsPreview';
import { BasicInfoSection } from '../ItemForm/BasicInfoSection';
import { DetailedInfoSection } from '../ItemForm/DetailedInfoSection';
import { CategorySelection, getFinalCategoryId } from '../../types/categories';
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
  const { isDeveloperMode } = useDeveloperMode();
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
  const [categorySelection, setCategorySelection] = useState<CategorySelection | undefined>(undefined);
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [metaCategories, setMetaCategories] = useState<{
    sustainability?: string[];
    condition?: string[];
    seller_type?: string[];
  }>({
    sustainability: [],
    condition: [],
    seller_type: [],
  });

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

        // 🎯 MASSIVELY EXPANDED Semantic mapping dictionary for AI terms → Database categories
        // Covers all 298 Level 3 categories with common German terms
        const semanticMappingL2: Record<string, string[]> = {
          // === HAUSHALT & MÖBEL ===
          'geschirr': ['küche', 'esszimmer'],
          'teller': ['küche', 'esszimmer'],
          'besteck': ['küche', 'esszimmer'],
          'messer': ['küche', 'esszimmer'],
          'gabel': ['küche', 'esszimmer'],
          'tassen': ['küche', 'esszimmer'],
          'gläser': ['küche', 'esszimmer'],
          'kochgeschirr': ['küche', 'esszimmer'],
          'töpfe': ['küche', 'esszimmer'],
          'pfannen': ['küche', 'esszimmer'],
          'küchengeräte': ['küche', 'elektronik'],
          'mixer': ['küche', 'elektronik'],
          'kaffeemaschine': ['küche', 'elektronik'],
          'toaster': ['küche', 'elektronik'],
          'mikrowelle': ['küche', 'elektronik'],
          'sofa': ['wohnzimmer', 'wohnen', 'möbel'],
          'couch': ['wohnzimmer', 'wohnen', 'möbel'],
          'sessel': ['wohnzimmer', 'wohnen', 'möbel'],
          'tisch': ['wohnzimmer', 'esszimmer', 'möbel'],
          'stuhl': ['wohnzimmer', 'esszimmer', 'möbel'],
          'regal': ['wohnzimmer', 'büro', 'möbel'],
          'schrank': ['schlafzimmer', 'möbel'],
          'kleiderschrank': ['schlafzimmer', 'möbel'],
          'bett': ['schlafzimmer', 'möbel'],
          'matratze': ['schlafzimmer', 'möbel'],
          'kommode': ['schlafzimmer', 'möbel'],
          'lampe': ['beleuchtung', 'deko'],
          'deckenlampe': ['beleuchtung', 'deko'],
          'stehlampe': ['beleuchtung', 'deko'],
          'tischlampe': ['beleuchtung', 'deko'],
          'vase': ['deko', 'wohnen'],
          'bilderrahmen': ['deko', 'wohnen'],
          'kerze': ['deko', 'wohnen'],
          'teppich': ['teppiche', 'wohnen'],
          'vorhang': ['gardinen', 'wohnen'],
          'gardine': ['gardinen', 'wohnen'],

          // === FAHRZEUGE ===
          'auto': ['autos', 'fahrzeuge'],
          'pkw': ['autos', 'fahrzeuge'],
          'kleinwagen': ['autos', 'fahrzeuge'],
          'limousine': ['autos', 'fahrzeuge'],
          'kombi': ['autos', 'fahrzeuge'],
          'suv': ['autos', 'fahrzeuge'],
          'geländewagen': ['autos', 'fahrzeuge'],
          'sportwagen': ['autos', 'fahrzeuge'],
          'cabrio': ['autos', 'fahrzeuge'],
          'van': ['autos', 'fahrzeuge'],
          'motorrad': ['motorräder', 'roller', 'fahrzeuge'],
          'motorbike': ['motorräder', 'roller', 'fahrzeuge'],
          'roller': ['motorräder', 'roller', 'fahrzeuge'],
          'moped': ['motorräder', 'roller', 'fahrzeuge'],
          'quad': ['motorräder', 'roller', 'fahrzeuge'],
          'transporter': ['nutzfahrzeuge', 'fahrzeuge'],
          'lkw': ['nutzfahrzeuge', 'fahrzeuge'],
          'anhänger': ['nutzfahrzeuge', 'fahrzeuge'],
          'reifen': ['ersatzteile', 'zubehör', 'fahrzeuge'],
          'felgen': ['ersatzteile', 'zubehör', 'fahrzeuge'],
          'autoteile': ['ersatzteile', 'zubehör', 'fahrzeuge'],
          'tuning': ['ersatzteile', 'zubehör', 'fahrzeuge'],
          'boot': ['boote', 'wasserfahrzeuge', 'fahrzeuge'],
          'motorboot': ['boote', 'wasserfahrzeuge', 'fahrzeuge'],
          'segelboot': ['boote', 'wasserfahrzeuge', 'fahrzeuge'],
          'fahrrad': ['fahrräder', 'e-bikes', 'fahrzeuge'],
          'bike': ['fahrräder', 'e-bikes', 'fahrzeuge'],
          'mountainbike': ['fahrräder', 'e-bikes', 'fahrzeuge'],
          'rennrad': ['fahrräder', 'e-bikes', 'fahrzeuge'],
          'ebike': ['fahrräder', 'e-bikes', 'fahrzeuge'],
          'e-bike': ['fahrräder', 'e-bikes', 'fahrzeuge'],

          // === ELEKTRONIK ===
          'laptop': ['computer', 'laptops', 'elektronik'],
          'notebook': ['computer', 'laptops', 'elektronik'],
          'pc': ['computer', 'laptops', 'elektronik'],
          'desktop': ['computer', 'laptops', 'elektronik'],
          'monitor': ['computer', 'laptops', 'elektronik'],
          'bildschirm': ['computer', 'laptops', 'elektronik'],
          'tastatur': ['computer', 'elektronik'],
          'maus': ['computer', 'elektronik'],
          'drucker': ['computer', 'elektronik'],
          'scanner': ['computer', 'elektronik'],
          'smartphone': ['smartphones', 'tablets', 'elektronik'],
          'handy': ['smartphones', 'tablets', 'elektronik'],
          'iphone': ['smartphones', 'tablets', 'elektronik'],
          'android': ['smartphones', 'tablets', 'elektronik'],
          'tablet': ['smartphones', 'tablets', 'elektronik'],
          'ipad': ['smartphones', 'tablets', 'elektronik'],
          'fernseher': ['tv', 'audio', 'video', 'elektronik'],
          'tv': ['tv', 'audio', 'video', 'elektronik'],
          'smart-tv': ['tv', 'audio', 'video', 'elektronik'],
          'heimkino': ['tv', 'audio', 'video', 'elektronik'],
          'soundbar': ['tv', 'audio', 'video', 'elektronik'],
          'lautsprecher': ['tv', 'audio', 'video', 'elektronik'],
          'kopfhörer': ['tv', 'audio', 'video', 'elektronik'],
          'headset': ['tv', 'audio', 'video', 'elektronik'],
          'kamera': ['kameras', 'drohnen', 'elektronik'],
          'digitalkamera': ['kameras', 'drohnen', 'elektronik'],
          'spiegelreflex': ['kameras', 'drohnen', 'elektronik'],
          'dslr': ['kameras', 'drohnen', 'elektronik'],
          'objektiv': ['kameras', 'drohnen', 'elektronik'],
          'drohne': ['kameras', 'drohnen', 'elektronik'],
          'action-cam': ['kameras', 'drohnen', 'elektronik'],
          'gopro': ['kameras', 'drohnen', 'elektronik'],
          'konsole': ['konsolen', 'games', 'elektronik'],
          'playstation': ['konsolen', 'games', 'elektronik'],
          'ps4': ['konsolen', 'games', 'elektronik'],
          'ps5': ['konsolen', 'games', 'elektronik'],
          'xbox': ['konsolen', 'games', 'elektronik'],
          'nintendo': ['konsolen', 'games', 'elektronik'],
          'switch': ['konsolen', 'games', 'elektronik'],
          'videospiele': ['konsolen', 'games', 'elektronik'],
          'smart-home': ['smart-home', 'gadgets', 'elektronik'],
          'alexa': ['smart-home', 'gadgets', 'elektronik'],
          'google-home': ['smart-home', 'gadgets', 'elektronik'],
          'fitness-tracker': ['smart-home', 'gadgets', 'elektronik'],
          'staubsauger': ['haushalts-elektronik', 'elektronik'],
          'roboter-staubsauger': ['haushalts-elektronik', 'elektronik'],
          'bügeleisen': ['haushalts-elektronik', 'elektronik'],

          // === MODE ===
          'kleidung': ['damenmode', 'herrenmode', 'mode'],
          'bekleidung': ['damenmode', 'herrenmode', 'mode'],
          'hose': ['damenmode', 'herrenmode', 'mode'],
          'jeans': ['damenmode', 'herrenmode', 'mode'],
          'shirt': ['damenmode', 'herrenmode', 'mode'],
          't-shirt': ['damenmode', 'herrenmode', 'mode'],
          'pullover': ['damenmode', 'herrenmode', 'mode'],
          'jacke': ['damenmode', 'herrenmode', 'mode'],
          'mantel': ['damenmode', 'herrenmode', 'mode'],
          'kleid': ['damenmode', 'mode'],
          'rock': ['damenmode', 'mode'],
          'bluse': ['damenmode', 'mode'],
          'anzug': ['herrenmode', 'mode'],
          'hemd': ['herrenmode', 'mode'],
          'sakko': ['herrenmode', 'mode'],
          'schuhe': ['schuhe', 'mode'],
          'sneaker': ['schuhe', 'mode'],
          'boots': ['schuhe', 'mode'],
          'stiefel': ['schuhe', 'mode'],
          'sandalen': ['schuhe', 'mode'],
          'damenschuhe': ['schuhe', 'mode'],
          'herrenschuhe': ['schuhe', 'mode'],
          'schmuck': ['schmuck', 'uhren', 'mode'],
          'uhr': ['schmuck', 'uhren', 'mode'],
          'armbanduhr': ['schmuck', 'uhren', 'mode'],
          'ring': ['schmuck', 'uhren', 'mode'],
          'kette': ['schmuck', 'uhren', 'mode'],
          'armband': ['schmuck', 'uhren', 'mode'],
          'ohrringe': ['schmuck', 'uhren', 'mode'],
          'tasche': ['taschen', 'accessoires', 'mode'],
          'handtasche': ['taschen', 'accessoires', 'mode'],
          'koffer': ['taschen', 'accessoires', 'mode'],
          'gürtel': ['taschen', 'accessoires', 'mode'],
          'sonnenbrille': ['taschen', 'accessoires', 'mode'],
          'beauty': ['beauty', 'pflege', 'mode'],
          'kosmetik': ['beauty', 'pflege', 'mode'],
          'parfum': ['beauty', 'pflege', 'mode'],
          'make-up': ['beauty', 'pflege', 'mode'],

          // === KINDER ===
          'spielzeug': ['spielzeug', 'kinder'],
          'lego': ['spielzeug', 'kinder'],
          'puppe': ['spielzeug', 'kinder'],
          'kuscheltier': ['spielzeug', 'kinder'],
          'puzzle': ['spielzeug', 'kinder'],
          'brettspiel': ['spielzeug', 'kinder'],
          'babyartikel': ['babyartikel', 'kinder'],
          'babybett': ['babyartikel', 'kinder'],
          'kinderwagen': ['kinderfahrzeuge', 'kinder'],
          'buggy': ['kinderfahrzeuge', 'kinder'],
          'autositz': ['kinderfahrzeuge', 'kinder'],
          'kindersitz': ['kinderfahrzeuge', 'kinder'],
          'laufrad': ['kinderfahrzeuge', 'kinder'],
          'kinderkleidung': ['kinderbekleidung', 'kinder'],
          'babykleidung': ['kinderbekleidung', 'kinder'],
          'schulranzen': ['schulbedarf', 'kinder'],
          'schultasche': ['schulbedarf', 'kinder'],
          'kinderbuch': ['kinderbücher', 'kinder'],
          'bilderbuch': ['kinderbücher', 'kinder'],

          // === TIERE ===
          'hund': ['hunde', 'tiere'],
          'welpe': ['hunde', 'tiere'],
          'hundefutter': ['hunde', 'tiere'],
          'hundezubehör': ['hunde', 'tiere'],
          'leine': ['hunde', 'tiere'],
          'hundespielzeug': ['hunde', 'tiere'],
          'katze': ['katzen', 'tiere'],
          'kätzchen': ['katzen', 'tiere'],
          'kitten': ['katzen', 'tiere'],
          'katzenfutter': ['katzen', 'tiere'],
          'katzenzubehör': ['katzen', 'tiere'],
          'kratzbaum': ['katzen', 'tiere'],
          'pferd': ['pferde', 'tiere'],
          'pony': ['pferde', 'tiere'],
          'reitzubehör': ['pferde', 'tiere'],
          'sattel': ['pferde', 'tiere'],
          'reitbekleidung': ['pferde', 'tiere'],
          'kaninchen': ['kleintiere', 'tiere'],
          'meerschweinchen': ['kleintiere', 'tiere'],
          'hamster': ['kleintiere', 'tiere'],
          'vogel': ['kleintiere', 'tiere'],
          'käfig': ['kleintiere', 'tiere'],
          'aquarium': ['aquaristik', 'terraristik', 'tiere'],
          'fisch': ['aquaristik', 'terraristik', 'tiere'],
          'terrarium': ['aquaristik', 'terraristik', 'tiere'],

          // === FREIZEIT & SPORT ===
          'camping': ['camping', 'outdoor', 'freizeit'],
          'zelt': ['camping', 'outdoor', 'freizeit'],
          'schlafsack': ['camping', 'outdoor', 'freizeit'],
          'isomatte': ['camping', 'outdoor', 'freizeit'],
          'wandern': ['camping', 'outdoor', 'freizeit'],
          'rucksack': ['camping', 'outdoor', 'freizeit'],
          'fitness': ['fitness', 'training', 'sport'],
          'fitnessgerät': ['fitness', 'training', 'sport'],
          'hantel': ['fitness', 'training', 'sport'],
          'laufband': ['fitness', 'training', 'sport'],
          'hometrainer': ['fitness', 'training', 'sport'],
          'yoga': ['fitness', 'training', 'sport'],
          'yogamatte': ['fitness', 'training', 'sport'],
          'sportbekleidung': ['fitness', 'training', 'sport'],
          'musikinstrument': ['musikinstrumente', 'freizeit'],
          'gitarre': ['musikinstrumente', 'freizeit'],
          'e-gitarre': ['musikinstrumente', 'freizeit'],
          'keyboard': ['musikinstrumente', 'freizeit'],
          'klavier': ['musikinstrumente', 'freizeit'],
          'schlagzeug': ['musikinstrumente', 'freizeit'],
          'dj': ['musikinstrumente', 'freizeit'],
          'modellbau': ['modellbau', 'freizeit'],
          'rc-modell': ['modellbau', 'freizeit'],
          'modellbahn': ['modellbau', 'freizeit'],
          'buch': ['bücher', 'comics', 'freizeit'],
          'roman': ['bücher', 'comics', 'freizeit'],
          'sachbuch': ['bücher', 'comics', 'freizeit'],
          'kochbuch': ['bücher', 'comics', 'freizeit'],
          'comic': ['bücher', 'comics', 'freizeit'],
          'manga': ['bücher', 'comics', 'freizeit'],
          'hörbuch': ['bücher', 'comics', 'freizeit'],
          'sammeln': ['sammeln', 'raritäten', 'freizeit'],
          'münzen': ['sammeln', 'raritäten', 'freizeit'],
          'briefmarken': ['sammeln', 'raritäten', 'freizeit'],
          'sammelkarten': ['sammeln', 'raritäten', 'freizeit'],

          // === IMMOBILIEN ===
          'haus': ['häuser', 'immobilien'],
          'einfamilienhaus': ['häuser', 'immobilien'],
          'doppelhaus': ['häuser', 'immobilien'],
          'reihenhaus': ['häuser', 'immobilien'],
          'villa': ['häuser', 'immobilien'],
          'wohnung': ['wohnungen', 'immobilien'],
          'eigentumswohnung': ['wohnungen', 'immobilien'],
          'mietwohnung': ['miete', 'vermietung', 'immobilien'],
          'zimmer': ['miete', 'vermietung', 'immobilien'],
          'grundstück': ['grundstücke', 'immobilien'],
          'baugrundstück': ['grundstücke', 'immobilien'],
          'ackerland': ['grundstücke', 'immobilien'],
          'gewerbe': ['gewerbeimmobilien', 'immobilien'],
          'büro': ['gewerbeimmobilien', 'immobilien'],
          'lager': ['gewerbeimmobilien', 'immobilien'],

          // === LANDWIRTSCHAFT ===
          'traktor': ['traktoren', 'landmaschinen', 'landwirtschaft'],
          'mähdrescher': ['traktoren', 'landmaschinen', 'landwirtschaft'],
          'landmaschine': ['traktoren', 'landmaschinen', 'landwirtschaft'],
          'gabelstapler': ['traktoren', 'landmaschinen', 'landwirtschaft'],
          'motorsäge': ['forst', 'gartenbedarf', 'landwirtschaft'],
          'rasenmäher': ['forst', 'gartenbedarf', 'landwirtschaft'],
          'häcksler': ['forst', 'gartenbedarf', 'landwirtschaft'],
          'gewächshaus': ['forst', 'gartenbedarf', 'landwirtschaft'],
          'rinder': ['nutztiere', 'landwirtschaft'],
          'schweine': ['nutztiere', 'landwirtschaft'],
          'schafe': ['nutztiere', 'landwirtschaft'],
          'geflügel': ['nutztiere', 'landwirtschaft'],
          'bienen': ['nutztiere', 'landwirtschaft'],
          'saatgut': ['saatgut', 'pflanzen', 'landwirtschaft'],
          'pflanzen': ['saatgut', 'pflanzen', 'landwirtschaft'],
          'obstbaum': ['saatgut', 'pflanzen', 'landwirtschaft'],
          'zimmerpflanze': ['saatgut', 'pflanzen', 'landwirtschaft'],
          'brennholz': ['brennholz', 'rohstoffe', 'landwirtschaft'],
          'pellets': ['brennholz', 'rohstoffe', 'landwirtschaft'],
          'holz': ['brennholz', 'rohstoffe', 'landwirtschaft'],

          // === INDUSTRIE & GEWERBE ===
          'werkzeug': ['maschinen', 'werkzeuge', 'industrie'],
          'werkzeugmaschine': ['maschinen', 'werkzeuge', 'industrie'],
          'bohrmaschine': ['maschinen', 'werkzeuge', 'industrie'],
          'säge': ['maschinen', 'werkzeuge', 'industrie'],
          'kompressor': ['maschinen', 'werkzeuge', 'industrie'],
          'generator': ['maschinen', 'werkzeuge', 'industrie'],
          'büromöbel': ['büroeinrichtung', 'industrie'],
          'schreibtisch': ['büroeinrichtung', 'industrie'],
          'bürostuhl': ['büroeinrichtung', 'industrie'],
          'aktenschrank': ['büroeinrichtung', 'industrie'],
          'gastronomie': ['gastronomiebedarf', 'industrie'],
          'kühlschrank': ['gastronomiebedarf', 'industrie'],
          'gastro': ['gastronomiebedarf', 'industrie'],
          'baumaterial': ['baumaterial', 'industrie'],
          'ziegel': ['baumaterial', 'industrie'],
          'zement': ['baumaterial', 'industrie'],
          'dämmstoffe': ['baumaterial', 'industrie'],
          'fenster': ['baumaterial', 'industrie'],
          'tür': ['baumaterial', 'industrie'],
          'kabel': ['elektrotechnik', 'industrie'],
          'leitungen': ['elektrotechnik', 'industrie'],
          'lagerregal': ['lager', 'transport', 'industrie'],
          'palette': ['lager', 'transport', 'industrie'],
          'europalette': ['lager', 'transport', 'industrie'],

          // === DIGITALE PRODUKTE ===
          'software': ['software', 'apps', 'digital'],
          'windows': ['software', 'apps', 'digital'],
          'office': ['software', 'apps', 'digital'],
          'photoshop': ['software', 'apps', 'digital'],
          'app': ['software', 'apps', 'digital'],
          'antivirus': ['software', 'apps', 'digital'],
          'domain': ['domains', 'webseiten', 'digital'],
          'webseite': ['domains', 'webseiten', 'digital'],
          'website': ['domains', 'webseiten', 'digital'],
          'template': ['domains', 'webseiten', 'digital'],
          'nft': ['nfts', 'digitale-kunst', 'digital'],
          'digitale-kunst': ['nfts', 'digitale-kunst', 'digital'],
          '3d-modell': ['nfts', 'digitale-kunst', 'digital'],
          'stockfoto': ['nfts', 'digitale-kunst', 'digital'],
          'online-kurs': ['online-kurse', 'digital'],
          'kurs': ['online-kurse', 'digital'],
          'webinar': ['online-kurse', 'digital'],
          'chatgpt': ['ai-prompts', 'datenmodelle', 'digital'],
          'midjourney': ['ai-prompts', 'datenmodelle', 'digital'],
          'ai-prompt': ['ai-prompts', 'datenmodelle', 'digital'],
          'webentwicklung': ['remote-dienstleistungen', 'digital'],
          'grafikdesign': ['remote-dienstleistungen', 'digital'],
          'texterstellung': ['remote-dienstleistungen', 'digital'],
          'seo': ['remote-dienstleistungen', 'digital'],
        };

        const semanticMappingL3: Record<string, string[]> = {
          // === HAUSHALT LEVEL 3 ===
          'geschirr': ['geschirr-besteck', 'geschirr'],
          'teller': ['geschirr-besteck', 'teller'],
          'besteck': ['geschirr-besteck', 'besteck'],
          'messer': ['geschirr-besteck', 'besteck'],
          'gabel': ['geschirr-besteck', 'besteck'],
          'löffel': ['geschirr-besteck', 'besteck'],
          'tassen': ['tassen-glaeser', 'tasse'],
          'becher': ['tassen-glaeser', 'tasse'],
          'gläser': ['tassen-glaeser', 'glas'],
          'weinglas': ['tassen-glaeser', 'glas'],
          'töpfe': ['toepfe-pfannen', 'topf'],
          'pfannen': ['toepfe-pfannen', 'pfanne'],

          // === FAHRZEUGE LEVEL 3 ===
          'kleinwagen': ['kleinwagen', 'city'],
          'city-car': ['kleinwagen', 'city'],
          'limousine': ['limousinen-kombis', 'limousine'],
          'kombi': ['limousinen-kombis', 'kombi'],
          'suv': ['suv-gelaendewagen', 'suv'],
          'geländewagen': ['suv-gelaendewagen', 'jeep'],
          'sportwagen': ['sportwagen-cabrios', 'sport'],
          'cabrio': ['sportwagen-cabrios', 'cabrio'],
          'van': ['vans-kleinbusse', 'van'],
          'minivan': ['vans-kleinbusse', 'klein'],
          'motorrad': ['motorraeder', 'bike'],
          'chopper': ['motorraeder', 'chopper'],
          'roller': ['roller-mopeds', 'roller'],
          'moped': ['roller-mopeds', 'moped'],
          'quad': ['quads-atvs', 'quad'],
          'atv': ['quads-atvs', 'atv'],
          'lkw': ['lkw', 'truck'],
          'truck': ['lkw', 'truck'],
          'reifen': ['reifen-felgen', 'reifen'],
          'felgen': ['reifen-felgen', 'felgen'],
          'motorboot': ['motorboote', 'motor'],
          'segelboot': ['segelboote', 'segel'],
          'schlauchboot': ['schlauchboote', 'schlauch'],
          'citybike': ['citybikes', 'city'],
          'mountainbike': ['mountainbikes', 'mtb'],
          'rennrad': ['rennraeder', 'renn'],
          'ebike': ['e-bikes', 'elektro'],
          'kinderfahrrad': ['kinderfahrraeder', 'kinder'],

          // === ELEKTRONIK LEVEL 3 ===
          'notebook': ['notebooks', 'laptop'],
          'laptop': ['notebooks', 'laptop'],
          'ultrabook': ['notebooks', 'ultra'],
          'desktop': ['desktop-pcs', 'pc'],
          'gaming-pc': ['desktop-pcs', 'gaming'],
          'workstation': ['desktop-pcs', 'work'],
          'monitor': ['monitore', 'display'],
          'bildschirm': ['monitore', 'screen'],
          'gaming-monitor': ['monitore', 'gaming'],
          'grafikkarte': ['pc-komponenten', 'grafik'],
          'prozessor': ['pc-komponenten', 'cpu'],
          'mainboard': ['pc-komponenten', 'main'],
          'ram': ['pc-komponenten', 'ram'],
          'ssd': ['pc-komponenten', 'ssd'],
          'drucker': ['drucker-scanner', 'druck'],
          'scanner': ['drucker-scanner', 'scan'],
          'iphone': ['smartphones', 'iphone'],
          'samsung': ['smartphones', 'samsung'],
          'android': ['smartphones', 'android'],
          'ipad': ['tablets', 'ipad'],
          'android-tablet': ['tablets', 'android'],
          'smart-tv': ['fernseher', 'smart'],
          'oled': ['fernseher', 'oled'],
          'qled': ['fernseher', 'qled'],
          'soundbar': ['heimkino-soundsysteme', 'sound'],
          'heimkino': ['heimkino-soundsysteme', 'heimkino'],
          'receiver': ['heimkino-soundsysteme', 'receiver'],
          'bluetooth-kopfhörer': ['kopfhoerer', 'bluetooth'],
          'in-ear': ['kopfhoerer', 'in-ear'],
          'over-ear': ['kopfhoerer', 'over-ear'],
          'bluetooth-lautsprecher': ['lautsprecher', 'bluetooth'],
          'boxen': ['lautsprecher', 'box'],
          'spiegelreflex': ['digitalkameras', 'dslr'],
          'systemkamera': ['digitalkameras', 'system'],
          'objektiv': ['objektive', 'objektiv'],
          'tele': ['objektive', 'tele'],
          'weitwinkel': ['objektive', 'weit'],
          'drohne': ['drohnen', 'quadcopter'],
          'quadcopter': ['drohnen', 'quadcopter'],
          'gopro': ['action-cams', 'action'],
          'action-cam': ['action-cams', 'action'],
          'playstation': ['spielekonsolen', 'ps'],
          'ps4': ['spielekonsolen', 'ps4'],
          'ps5': ['spielekonsolen', 'ps5'],
          'xbox': ['spielekonsolen', 'xbox'],
          'nintendo': ['spielekonsolen', 'switch'],
          'switch': ['spielekonsolen', 'switch'],
          'videospiele': ['videospiele', 'game'],
          'ps5-spiele': ['videospiele', 'ps5'],
          'alexa': ['smart-home-systeme', 'alexa'],
          'google-home': ['smart-home-systeme', 'google'],
          'smart-home': ['smart-home-systeme', 'smart'],
          'überwachungskamera': ['sicherheit-ueberwachung', 'kamera'],
          'alarmanlage': ['sicherheit-ueberwachung', 'alarm'],
          'fitness-tracker': ['wearables', 'fitness'],
          'staubsauger': ['staubsauger', 'saug'],
          'saugroboter': ['staubsauger', 'roboter'],

          // === MODE LEVEL 3 ===
          'damenschuhe': ['damenschuhe', 'damen'],
          'pumps': ['damenschuhe', 'pumps'],
          'herrenschuhe': ['herrenschuhe', 'herren'],
          'business-schuhe': ['herrenschuhe', 'business'],
          'sneaker': ['sportschuhe', 'sneaker'],
          'laufschuhe': ['sportschuhe', 'lauf'],
          'kinderschuhe': ['kinderschuhe', 'kinder'],
          'armbanduhr': ['armbanduhren', 'uhr'],
          'smartwatch': ['armbanduhren', 'smart'],
          'ring': ['ringe', 'ring'],
          'verlobungsring': ['ringe', 'verlobung'],
          'kette': ['ketten', 'hals'],
          'halskette': ['ketten', 'hals'],
          'armband': ['armbaender', 'arm'],
          'ohrringe': ['ohrringe', 'ohr'],
          'handtasche': ['handtaschen', 'hand'],
          'clutch': ['handtaschen', 'clutch'],
          'wanderrucksack': ['rucksaecke', 'wander'],
          'koffer': ['koffer-reisegepaeck', 'koffer'],
          'trolley': ['koffer-reisegepaeck', 'trolley'],
          'gürtel': ['guertel', 'gürtel'],
          'ledergürtel': ['guertel', 'leder'],
          'sonnenbrille': ['sonnenbrillen', 'sonnen'],
          'hautpflege': ['hautpflege', 'haut'],
          'creme': ['hautpflege', 'creme'],
          'make-up': ['make-up', 'makeup'],
          'lippenstift': ['make-up', 'lippe'],
          'parfum': ['parfum', 'duft'],
          'eau-de-toilette': ['parfum', 'eau'],

          // === KINDER LEVEL 3 ===
          'babybett': ['babybetten-wiegen', 'bett'],
          'wiege': ['babybetten-wiegen', 'wiege'],
          'wickelkommode': ['wickelkommoden', 'wickel'],
          'babyphone': ['babyphones', 'phone'],
          'stillkissen': ['stillen-fuettern', 'still'],
          'flasche': ['stillen-fuettern', 'flasche'],
          'babykleidung': ['babykleidung', 'baby'],
          'strampler': ['babykleidung', 'strampler'],
          'mädchenkleidung': ['maedchenkleidung', 'mädchen'],
          'jungenkleidung': ['jungenkleidung', 'jungen'],
          'kinderwagen': ['kinderwagen-buggys', 'wagen'],
          'buggy': ['kinderwagen-buggys', 'buggy'],
          'autositz': ['autositze', 'sitz'],
          'kindersitz': ['autositze', 'kinder'],
          'laufrad': ['laufraeder', 'lauf'],
          'kinderroller': ['kinderroller', 'roller'],
          'schulranzen': ['schulranzen', 'ranzen'],
          'federmäppchen': ['schreibwaren', 'mäppchen'],
          'bilderbuch': ['bilderbuecher', 'bild'],
          'vorlesebuch': ['vorlesebuecher', 'vorlese'],

          // === TIERE LEVEL 3 ===
          'welpe': ['hunde-welpen', 'welpe'],
          'hund': ['hunde-welpen', 'hund'],
          'leine': ['hundezubehoer', 'leine'],
          'halsband': ['hundezubehoer', 'hals'],
          'hundefutter': ['hundefutter', 'futter'],
          'trockenfutter': ['hundefutter', 'trocken'],
          'hundespielzeug': ['hundespielzeug', 'spiel'],
          'ball': ['hundespielzeug', 'ball'],
          'kätzchen': ['katzen-kitten', 'kitten'],
          'katze': ['katzen-kitten', 'katze'],
          'kratzbaum': ['katzenzubehoer', 'kratz'],
          'katzenklo': ['katzenzubehoer', 'klo'],
          'katzenfutter': ['katzenfutter', 'futter'],
          'nassfutter': ['katzenfutter', 'nass'],
          'pferd': ['pferde-ponys', 'pferd'],
          'pony': ['pferde-ponys', 'pony'],
          'sattel': ['reitzubehoer', 'sattel'],
          'trense': ['reitzubehoer', 'trense'],
          'reithelm': ['reitbekleidung', 'helm'],
          'reitstiefel': ['reitbekleidung', 'stiefel'],
          'kaninchen': ['kaninchen-meerschweinchen', 'kaninchen'],
          'meerschweinchen': ['kaninchen-meerschweinchen', 'meer'],
          'hamster': ['hamster-maeuse', 'hamster'],
          'maus': ['hamster-maeuse', 'maus'],
          'wellensittich': ['voegel', 'wellen'],
          'papagei': ['voegel', 'papagei'],
          'käfig': ['kaefige-gehege', 'käfig'],
          'voliere': ['kaefige-gehege', 'voliere'],
          'aquarium': ['aquarien', 'aquarium'],
          'zierfisch': ['fische', 'zier'],
          'terrarium': ['terrarien', 'terra'],
          'schlange': ['reptilien', 'schlange'],

          // === FREIZEIT LEVEL 3 ===
          'zelt': ['zelte', 'zelt'],
          'campingzelt': ['zelte', 'camping'],
          'schlafsack': ['schlafsaecke', 'schlaf'],
          'isomatte': ['wandern-trekking', 'iso'],
          'rucksack': ['wandern-trekking', 'ruck'],
          'campingtisch': ['campingmoebel', 'tisch'],
          'campingstuhl': ['campingmoebel', 'stuhl'],
          'hantel': ['fitnessgeraete', 'hantel'],
          'kurzhantel': ['fitnessgeraete', 'kurz'],
          'laufband': ['fitnessgeraete', 'lauf'],
          'crosstrainer': ['fitnessgeraete', 'cross'],
          'yogamatte': ['yoga-pilates', 'yoga'],
          'pilates-ball': ['yoga-pilates', 'pilates'],
          'e-gitarre': ['gitarren', 'gitarre'],
          'akustikgitarre': ['gitarren', 'akustik'],
          'keyboard': ['keyboards-pianos', 'keyboard'],
          'e-piano': ['keyboards-pianos', 'piano'],
          'schlagzeug': ['schlagzeug', 'drum'],
          'e-drum': ['schlagzeug', 'elektronik'],
          'dj-controller': ['dj-equipment', 'controller'],
          'plattenspieler': ['dj-equipment', 'platten'],
          'rc-auto': ['rc-modelle', 'auto'],
          'rc-helikopter': ['rc-modelle', 'heli'],
          'modellbahn': ['modellbahn', 'bahn'],
          'h0': ['modellbahn', 'h0'],
          'roman': ['romane', 'roman'],
          'krimi': ['romane', 'krimi'],
          'sachbuch': ['sachbuecher', 'sach'],
          'biografie': ['sachbuecher', 'bio'],
          'kochbuch': ['kochbuecher', 'koch'],
          'rezepte': ['kochbuecher', 'rezept'],
          'comic': ['comics-manga', 'comic'],
          'manga': ['comics-manga', 'manga'],
          'münzen': ['muenzen', 'münze'],
          'euromünzen': ['muenzen', 'euro'],
          'briefmarken': ['briefmarken', 'marke'],
          'sammelkarten': ['sammelkarten', 'karte'],
          'pokemon': ['sammelkarten', 'pokemon'],

          // === INDUSTRIE LEVEL 3 ===
          'bohrmaschine': ['elektrowerkzeuge', 'bohr'],
          'akkuschrauber': ['elektrowerkzeuge', 'akku'],
          'winkelschleifer': ['elektrowerkzeuge', 'winkel'],
          'schraubendreher': ['handwerkzeuge', 'schraub'],
          'zange': ['handwerkzeuge', 'zange'],
          'kompressor': ['kompressoren', 'kompressor'],
          'druckluftkompressor': ['kompressoren', 'druck'],
          'schreibtisch': ['schreibtische-buero', 'schreib'],
          'höhenverstellbar': ['schreibtische-buero', 'höhen'],
          'bürostuhl': ['buerostuehle', 'stuhl'],
          'chefsessel': ['buerostuehle', 'chef'],
          'europalette': ['paletten', 'palette'],
          'gitterbox': ['paletten', 'gitter'],

          // === DIGITALE PRODUKTE LEVEL 3 ===
          'windows': ['betriebssysteme', 'windows'],
          'macos': ['betriebssysteme', 'mac'],
          'linux': ['betriebssysteme', 'linux'],
          'office': ['office-software', 'office'],
          'word': ['office-software', 'word'],
          'excel': ['office-software', 'excel'],
          'photoshop': ['grafik-software', 'photo'],
          'illustrator': ['grafik-software', 'illustrator'],
          'premiere': ['video-audio-software', 'premiere'],
          'final-cut': ['video-audio-software', 'final'],
          'antivirus': ['sicherheitssoftware', 'anti'],
          'firewall': ['sicherheitssoftware', 'fire'],
          'ios-app': ['mobile-apps', 'ios'],
          'android-app': ['mobile-apps', 'android'],
          'domain': ['domains', 'domain'],
          'de-domain': ['domains', 'de'],
          'wordpress': ['webseiten-templates', 'wordpress'],
          'shopify': ['webseiten-templates', 'shop'],
          'nft': ['nft-kunst', 'nft'],
          'crypto-art': ['nft-kunst', 'crypto'],
          '3d-modell': ['3d-modelle', '3d'],
          'blender': ['3d-modelle', 'blender'],
          'stockfoto': ['stockfotos', 'stock'],
          'foto': ['stockfotos', 'foto'],
          'chatgpt': ['chatgpt-prompts', 'gpt'],
          'gpt-4': ['chatgpt-prompts', 'gpt-4'],
          'midjourney': ['midjourney-prompts', 'mid'],
          'stable-diffusion': ['ai-modelle', 'stable'],
        };

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
              const subcategoryLower = mergedAnalysis.subcategory.toLowerCase();

              // STEP 1: Try direct match
              let level2 = allCategories.find(c =>
                c.level === 2 &&
                c.parent_id === level1.id && (
                  c.translations?.de?.name?.toLowerCase().includes(subcategoryLower) ||
                  c.translations?.en?.name?.toLowerCase().includes(subcategoryLower) ||
                  c.slug.toLowerCase().includes(subcategoryLower)
                )
              );

              // STEP 2: If direct match fails, try semantic mapping
              if (!level2 && semanticMappingL2[subcategoryLower]) {
                console.log('🔄 Trying semantic mapping for subcategory:', subcategoryLower, '→', semanticMappingL2[subcategoryLower]);

                const semanticTerms = semanticMappingL2[subcategoryLower];
                level2 = allCategories.find(c =>
                  c.level === 2 &&
                  c.parent_id === level1.id &&
                  semanticTerms.some(term =>
                    c.translations?.de?.name?.toLowerCase().includes(term) ||
                    c.slug.toLowerCase().includes(term)
                  )
                );
              }

              if (level2) {
                mappedCategorySelection.level2 = level2;
                mappedCategoryId = level2.id;
                console.log('✅ Found level 2 category:', level2.translations?.de?.name || level2.slug);

                // 🎯 NEW: Try to find Level 3 based on subcategory
                if (semanticMappingL3[subcategoryLower]) {
                  console.log('🔄 Trying semantic mapping for level 3:', subcategoryLower, '→', semanticMappingL3[subcategoryLower]);

                  const level3SemanticTerms = semanticMappingL3[subcategoryLower];
                  const level3 = allCategories.find(c =>
                    c.level === 3 &&
                    c.parent_id === level2.id &&
                    level3SemanticTerms.some(term =>
                      c.translations?.de?.name?.toLowerCase().includes(term) ||
                      c.slug.toLowerCase().includes(term)
                    )
                  );

                  if (level3) {
                    mappedCategorySelection.level3 = level3;
                    mappedCategoryId = level3.id;
                    console.log('✅ Found level 3 category via semantic mapping:', level3.translations?.de?.name || level3.slug);
                  }
                }
              } else {
                console.log('⚠️ No level 2 match found for subcategory:', subcategoryLower);
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

            // Try to find Level 3 category from title/description
            if (mappedCategorySelection.level2) {
              const titleAndDesc = `${mergedAnalysis.title} ${mergedAnalysis.description}`.toLowerCase();
              const level3Options = allCategories.filter(c =>
                c.level === 3 &&
                c.parent_id === mappedCategorySelection.level2.id
              );

              // Try to find best matching level 3 category
              const level3 = level3Options.find(c => {
                const categoryName = c.translations?.de?.name?.toLowerCase() || '';
                const categorySlug = c.slug.toLowerCase();

                // Check for matches in title/description
                return titleAndDesc.includes(categoryName) ||
                       titleAndDesc.includes(categorySlug) ||
                       // Special keywords for common categories
                       (categorySlug.includes('geschirr') && titleAndDesc.includes('geschirr')) ||
                       (categorySlug.includes('besteck') && titleAndDesc.includes('besteck')) ||
                       (categorySlug.includes('teller') && titleAndDesc.includes('teller')) ||
                       (categorySlug.includes('tassen') && titleAndDesc.includes('tasse')) ||
                       (categorySlug.includes('glaeser') && titleAndDesc.includes('glas'));
              });

              if (level3) {
                mappedCategorySelection.level3 = level3;
                mappedCategoryId = level3.id;
                console.log('✅ Inferred level 3 from title/description:', level3.translations?.de?.name || level3.slug);
              }
            }

            // Set final category ID
            if (!mappedCategoryId) {
              mappedCategoryId = mappedCategorySelection.level2?.id || level1.id;
              console.log('⚠️ Using Level', mappedCategorySelection.level2 ? '2' : '1', 'category (no deeper level found)');
            }
          } else {
            console.warn('❌ No matching category found for:', mergedAnalysis.category);
          }
        }
      }

      // Store mapped category_id in mergedAnalysis for publish
      mergedAnalysis.category_id = mappedCategoryId;

      console.log('📂 Category mapping complete:', {
        level1: mappedCategorySelection.level1?.translations?.de?.name,
        level2: mappedCategorySelection.level2?.translations?.de?.name,
        level3: mappedCategorySelection.level3?.translations?.de?.name,
        finalCategoryId: mappedCategoryId
      });

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

      // Developer Mode: Show Preview | Production: Publish directly
      if (isDeveloperMode) {
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
        console.log('🎨 [Developer Mode] Preview shown with category:', {
          level1: mappedCategorySelection.level1?.translations?.de?.name,
          level2: mappedCategorySelection.level2?.translations?.de?.name,
          level3: mappedCategorySelection.level3?.translations?.de?.name
        });
      } else {
        // Production mode: Skip preview and publish directly
        console.log('🚀 [Production Mode] Skipping preview, publishing directly...');
        await publishItem(mergedAnalysis);
      }
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
      let categoryId = dataToUse?.category_id || getFinalCategoryId(categorySelection);

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

        // Try to find Level 3 category from title/description
        let level3 = null;
        if (level2) {
          const titleAndDesc = `${itemTitle} ${itemDescription}`.toLowerCase();
          const level3Options = allCategories?.filter(c =>
            c.level === 3 &&
            c.parent_id === level2.id
          ) || [];

          level3 = level3Options.find(c => {
            const categoryName = c.translations?.de?.name?.toLowerCase() || '';
            const categorySlug = c.slug.toLowerCase();

            // Check for matches in title/description
            return titleAndDesc.includes(categoryName) ||
                   titleAndDesc.includes(categorySlug) ||
                   // Special keywords for common categories
                   (categorySlug.includes('geschirr') && titleAndDesc.includes('geschirr')) ||
                   (categorySlug.includes('besteck') && titleAndDesc.includes('besteck')) ||
                   (categorySlug.includes('teller') && titleAndDesc.includes('teller')) ||
                   (categorySlug.includes('tassen') && titleAndDesc.includes('tasse')) ||
                   (categorySlug.includes('glaeser') && titleAndDesc.includes('glas'));
          });

          if (level3) {
            console.log('✅ Inferred level 3 category from title/description:', level3);
          }
        }

        // Set category_id with preference: Level 3 > Level 2 > Level 1
        if (level3) {
          categoryId = level3.id;
          console.log('✅ Using Level 3 category:', categoryId);
        } else if (level2) {
          categoryId = level2.id;
          console.log('✅ Using Level 2 category:', categoryId);
        } else if (level1) {
          categoryId = level1.id;
          console.log('⚠️ Using Level 1 category (no Level 2/3 found):', categoryId);
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

      // 🚗 DEBUG: Log vehicle attributes before insert
      if (dataToUse?.vehicle_brand || dataToUse?.vehicle_year || dataToUse?.vehicle_mileage) {
        console.log('[Vehicle Attributes] Preparing to insert:', {
          vehicle_brand: dataToUse?.vehicle_brand,
          vehicle_year: dataToUse?.vehicle_year,
          vehicle_mileage: dataToUse?.vehicle_mileage,
          vehicle_fuel_type: dataToUse?.vehicle_fuel_type,
          vehicle_color: dataToUse?.vehicle_color,
          vehicle_power_kw: dataToUse?.vehicle_power_kw,
          vehicle_first_registration: dataToUse?.vehicle_first_registration,
          vehicle_tuv_until: dataToUse?.vehicle_tuv_until,
        });
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
          category_id: dataToUse?.category_id || categoryId,
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
          // 🚗 Vehicle attributes
          vehicle_brand: dataToUse?.vehicle_brand,
          vehicle_year: dataToUse?.vehicle_year,
          vehicle_mileage: dataToUse?.vehicle_mileage,
          vehicle_fuel_type: dataToUse?.vehicle_fuel_type,
          vehicle_color: dataToUse?.vehicle_color,
          vehicle_power_kw: dataToUse?.vehicle_power_kw,
          vehicle_first_registration: dataToUse?.vehicle_first_registration,
          vehicle_tuv_until: dataToUse?.vehicle_tuv_until,
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
          category_id: dataToUse?.category_id || categoryId,
          title: itemTitle,
          price: itemPrice,
          status: publishImmediately ? 'published' : 'draft'
        });
        throw new Error(`Fehler beim Erstellen des Inserats: ${insertError.message}`);
      }

      console.log('Item created:', itemData);

      // 🚗 DEBUG: Log vehicle attributes after insert
      if (itemData && (itemData.vehicle_brand || itemData.vehicle_year || itemData.vehicle_mileage)) {
        console.log('[Vehicle Attributes] Successfully inserted:', {
          vehicle_brand: itemData.vehicle_brand,
          vehicle_year: itemData.vehicle_year,
          vehicle_mileage: itemData.vehicle_mileage,
          vehicle_fuel_type: itemData.vehicle_fuel_type,
          vehicle_color: itemData.vehicle_color,
          vehicle_power_kw: itemData.vehicle_power_kw,
          vehicle_first_registration: itemData.vehicle_first_registration,
          vehicle_tuv_until: itemData.vehicle_tuv_until,
        });
      } else if (itemData) {
        console.log('[Vehicle Attributes] No vehicle attributes in returned item data');
      }

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

      // Save meta-categories if present
      if (itemData && metaCategories) {
        console.log('[Meta-Categories] Saving meta-categories...', metaCategories);
        const metaCategoryInserts = [];

        // Add all selected meta-categories from all types
        Object.values(metaCategories).forEach(categoryIds => {
          if (Array.isArray(categoryIds)) {
            categoryIds.forEach(catId => {
              if (catId) {
                metaCategoryInserts.push({
                  item_id: itemData.id,
                  meta_category_id: catId,
                });
              }
            });
          }
        });

        if (metaCategoryInserts.length > 0) {
          const { error: metaCategoriesError } = await supabase
            .from('item_meta_categories')
            .insert(metaCategoryInserts);

          if (metaCategoriesError) {
            console.error('[Meta-Categories] Error saving meta-categories:', metaCategoriesError);
          } else {
            console.log('[Meta-Categories] Saved', metaCategoryInserts.length, 'meta-categories');
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
              {showAiTips ? (
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
              ) : (
                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
                  <IconButton
                    onClick={() => setShowAiTips(true)}
                    sx={{
                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                      color: 'warning.main',
                      width: 36,
                      height: 36,
                      '&:hover': {
                        bgcolor: 'rgba(255, 152, 0, 0.2)',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <Lightbulb size={20} />
                  </IconButton>
                </Box>
              )}
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
                    metaCategories={metaCategories}
                    onMetaCategoriesChange={(type, value) => {
                      setMetaCategories(prev => ({
                        ...prev,
                        [type]: value,
                      }));
                    }}
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
