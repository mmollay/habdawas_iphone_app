/**
 * CategoryDropdown Component
 *
 * @description Hierarchical category selection with 3 levels
 * Level 1 & 2: Predefined
 * Level 3: Dynamically created by AI
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import {
  ChevronRight,
  Category as CategoryIcon,
  FolderOpen,
  AutoAwesome,
  // Level 1 Icons
  DirectionsCar,
  Home,
  Weekend,
  Laptop,
  SportsBasketball,
  Checkroom,
  ChildCare,
  Pets,
  Work,
  Storefront,
  Agriculture,
  Factory,
  CloudDownload,
  // Level 2 Icons - Fahrzeuge
  TwoWheeler,
  LocalShipping,
  TimeToLeave,
  Build,
  RvHookup,
  DirectionsBoat,
  DirectionsBike,
  // Level 2 Icons - Immobilien
  House,
  Apartment,
  Key,
  Landscape,
  Business,
  Group,
  Garage,
  BeachAccess,
  // Level 2 Icons - Haushalt
  Kitchen,
  Lightbulb,
  Yard,
  Microwave,
  WbSunny,
  Construction,
  // Level 2 Icons - Elektronik
  Smartphone,
  Computer,
  Tv,
  CameraAlt,
  SportsEsports,
  Hub,
  // Level 2 Icons - Freizeit & Sport
  Hiking,
  FitnessCenter,
  PedalBike,
  MusicNote,
  Handyman,
  MenuBook,
  Stars,
  ConfirmationNumber,
  // Level 2 Icons - Mode
  Woman,
  Man,
  Watch,
  ShoppingBag,
  Spa,
  Recycling,
  // Level 2 Icons - Kinder
  ChildFriendly,
  Toys,
  School,
  AutoStories,
  BabyChangingStation,
  DirectionsRun,
  // Level 2 Icons - Tiere
  Pets as PetsIcon,
  FilterVintage,
  SetMeal,
  // Level 2 Icons - Arbeit
  WorkOutline,
  BusinessCenter,
  LocalHospital,
  Support,
  Palette,
  LocalShippingOutlined,
  Brush,
  // Level 2 Icons - Marktplatz
  CardGiftcard,
  SwapHoriz,
  Search,
  Museum,
  Inventory,
  Collections,
  // Level 2 Icons - Landwirtschaft
  Grass,
  LocalFlorist,
  Park,
  Agriculture as AgricultureIcon,
  Whatshot,
  // Level 2 Icons - Industrie
  ChairAlt,
  Restaurant,
  Carpenter,
  ElectricalServices,
  Warehouse,
  Plumbing,
  // Level 2 Icons - Digitale Produkte
  Apps,
  Language,
  OndemandVideo,
  SmartToy,
  HomeWork,
  Psychology,
} from '@mui/icons-material';
import { useCategories } from '../hooks/useCategories';
import {
  Category,
  CategorySelection,
  LanguageCode,
  DEFAULT_LANGUAGE,
} from '../types/categories';
import { getCategoryName } from '../utils/categories';

interface CategoryDropdownProps {
  value?: CategorySelection;
  onChange: (selection: CategorySelection) => void;
  lang?: LanguageCode;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  showBreadcrumbs?: boolean;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  onChange,
  lang = DEFAULT_LANGUAGE,
  required = false,
  disabled = false,
  error,
  showBreadcrumbs = true,
}) => {
  const { categories, categoryTree, loading, getChildrenOf } = useCategories({ lang });

  const [level1, setLevel1] = useState<string>('');
  const [level2, setLevel2] = useState<string>('');
  const [level2Options, setLevel2Options] = useState<Category[]>([]);

  // Get icon by category slug (Level 1)
  const getCategoryIcon = (slug: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'fahrzeuge': <DirectionsCar sx={{ fontSize: 20 }} />,
      'immobilien': <Home sx={{ fontSize: 20 }} />,
      'haushalt-moebel': <Weekend sx={{ fontSize: 20 }} />,
      'elektronik': <Laptop sx={{ fontSize: 20 }} />,
      'freizeit-sport': <SportsBasketball sx={{ fontSize: 20 }} />,
      'mode-lifestyle': <Checkroom sx={{ fontSize: 20 }} />,
      'kinder-familie': <ChildCare sx={{ fontSize: 20 }} />,
      'tiere-tierbedarf': <Pets sx={{ fontSize: 20 }} />,
      'arbeit-dienstleistungen': <Work sx={{ fontSize: 20 }} />,
      'marktplatz-kleinanzeigen': <Storefront sx={{ fontSize: 20 }} />,
      'landwirtschaft-natur': <Agriculture sx={{ fontSize: 20 }} />,
      'industrie-gewerbe': <Factory sx={{ fontSize: 20 }} />,
      'digitale-produkte': <CloudDownload sx={{ fontSize: 20 }} />,
    };
    return iconMap[slug] || <CategoryIcon sx={{ fontSize: 20 }} />;
  };

  // Get icon by subcategory slug (Level 2)
  const getSubcategoryIcon = (slug: string) => {
    const iconMap: Record<string, JSX.Element> = {
      // Fahrzeuge & Mobilität (8 subcategories)
      'autos': <TimeToLeave sx={{ fontSize: 20 }} />,
      'motorraeder-roller': <TwoWheeler sx={{ fontSize: 20 }} />,
      'nutzfahrzeuge': <LocalShipping sx={{ fontSize: 20 }} />,
      'oldtimer': <TimeToLeave sx={{ fontSize: 20 }} />,
      'ersatzteile-zubehoer': <Build sx={{ fontSize: 20 }} />,
      'wohnmobile-wohnwagen': <RvHookup sx={{ fontSize: 20 }} />,
      'boote-wasserfahrzeuge': <DirectionsBoat sx={{ fontSize: 20 }} />,
      'fahrraeder-ebikes': <DirectionsBike sx={{ fontSize: 20 }} />,

      // Immobilien & Wohnen (8 subcategories)
      'haeuser-kaufen': <House sx={{ fontSize: 20 }} />,
      'wohnungen-kaufen': <Apartment sx={{ fontSize: 20 }} />,
      'miete-vermietung': <Key sx={{ fontSize: 20 }} />,
      'grundstuecke': <Landscape sx={{ fontSize: 20 }} />,
      'gewerbeimmobilien': <Business sx={{ fontSize: 20 }} />,
      'wohngemeinschaften': <Group sx={{ fontSize: 20 }} />,
      'garagen-stellplaetze': <Garage sx={{ fontSize: 20 }} />,
      'ferienimmobilien': <BeachAccess sx={{ fontSize: 20 }} />,

      // Haushalt & Möbel (7 subcategories)
      'moebel': <Weekend sx={{ fontSize: 20 }} />,
      'kueche-esszimmer': <Kitchen sx={{ fontSize: 20 }} />,
      'wohnaccessoires': <Lightbulb sx={{ fontSize: 20 }} />,
      'garten-balkon': <Yard sx={{ fontSize: 20 }} />,
      'haushaltsgeraete': <Microwave sx={{ fontSize: 20 }} />,
      'beleuchtung': <WbSunny sx={{ fontSize: 20 }} />,
      'heimwerken-bau': <Construction sx={{ fontSize: 20 }} />,

      // Elektronik & Technik (7 subcategories)
      'smartphones-tablets': <Smartphone sx={{ fontSize: 20 }} />,
      'computer-laptops': <Computer sx={{ fontSize: 20 }} />,
      'tv-audio-video': <Tv sx={{ fontSize: 20 }} />,
      'kameras-drohnen': <CameraAlt sx={{ fontSize: 20 }} />,
      'konsolen-games': <SportsEsports sx={{ fontSize: 20 }} />,
      'smart-home-gadgets': <Hub sx={{ fontSize: 20 }} />,
      'haushalts-elektronik': <Microwave sx={{ fontSize: 20 }} />,

      // Freizeit, Hobby & Sport (8 subcategories)
      'camping-outdoor': <Hiking sx={{ fontSize: 20 }} />,
      'fitness-training': <FitnessCenter sx={{ fontSize: 20 }} />,
      'fahrraeder-zubehoer': <PedalBike sx={{ fontSize: 20 }} />,
      'musikinstrumente': <MusicNote sx={{ fontSize: 20 }} />,
      'modellbau': <Handyman sx={{ fontSize: 20 }} />,
      'buecher-comics': <MenuBook sx={{ fontSize: 20 }} />,
      'sammeln-raritaeten': <Stars sx={{ fontSize: 20 }} />,
      'tickets-veranstaltungen': <ConfirmationNumber sx={{ fontSize: 20 }} />,

      // Mode & Lifestyle (7 subcategories)
      'damenmode': <Woman sx={{ fontSize: 20 }} />,
      'herrenmode': <Man sx={{ fontSize: 20 }} />,
      'schuhe': <DirectionsRun sx={{ fontSize: 20 }} />,
      'schmuck-uhren': <Watch sx={{ fontSize: 20 }} />,
      'taschen-accessoires': <ShoppingBag sx={{ fontSize: 20 }} />,
      'beauty-pflege': <Spa sx={{ fontSize: 20 }} />,
      'vintage-secondhand': <Recycling sx={{ fontSize: 20 }} />,

      // Kinder & Familie (6 subcategories)
      'babyartikel': <BabyChangingStation sx={{ fontSize: 20 }} />,
      'kinderbekleidung': <ChildFriendly sx={{ fontSize: 20 }} />,
      'spielzeug': <Toys sx={{ fontSize: 20 }} />,
      'kinderfahrzeuge': <DirectionsBike sx={{ fontSize: 20 }} />,
      'schulbedarf': <School sx={{ fontSize: 20 }} />,
      'kinderbuecher': <AutoStories sx={{ fontSize: 20 }} />,

      // Tiere & Tierbedarf (6 subcategories)
      'hunde': <PetsIcon sx={{ fontSize: 20 }} />,
      'katzen': <PetsIcon sx={{ fontSize: 20 }} />,
      'pferde': <PetsIcon sx={{ fontSize: 20 }} />,
      'kleintiere': <FilterVintage sx={{ fontSize: 20 }} />,
      'aquaristik-terraristik': <PetsIcon sx={{ fontSize: 20 }} />,
      'zubehoer-futter': <SetMeal sx={{ fontSize: 20 }} />,

      // Arbeit & Dienstleistungen (8 subcategories)
      'jobs-stellenangebote': <WorkOutline sx={{ fontSize: 20 }} />,
      'handwerk-bau': <Carpenter sx={{ fontSize: 20 }} />,
      'buero-verwaltung': <BusinessCenter sx={{ fontSize: 20 }} />,
      'gesundheit-pflege': <LocalHospital sx={{ fontSize: 20 }} />,
      'unterricht-nachhilfe': <Support sx={{ fontSize: 20 }} />,
      'transport-umzug': <LocalShippingOutlined sx={{ fontSize: 20 }} />,
      'coaching-beratung': <Support sx={{ fontSize: 20 }} />,
      'kuenstlerische-leistungen': <Palette sx={{ fontSize: 20 }} />,

      // Marktplatz & Kleinanzeigen (6 subcategories)
      'zu-verschenken': <CardGiftcard sx={{ fontSize: 20 }} />,
      'tauschangebote': <SwapHoriz sx={{ fontSize: 20 }} />,
      'gesuche': <Search sx={{ fontSize: 20 }} />,
      'flohmarktartikel': <Inventory sx={{ fontSize: 20 }} />,
      'antiquitaeten': <Collections sx={{ fontSize: 20 }} />,
      'restposten': <Inventory sx={{ fontSize: 20 }} />,

      // Landwirtschaft & Natur (5 subcategories)
      'traktoren-landmaschinen': <AgricultureIcon sx={{ fontSize: 20 }} />,
      'forst-gartenbedarf': <Park sx={{ fontSize: 20 }} />,
      'nutztiere': <Pets sx={{ fontSize: 20 }} />,
      'saatgut-pflanzen': <LocalFlorist sx={{ fontSize: 20 }} />,
      'brennholz-rohstoffe': <Whatshot sx={{ fontSize: 20 }} />,

      // Industrie & Gewerbe (6 subcategories)
      'maschinen-werkzeuge': <Carpenter sx={{ fontSize: 20 }} />,
      'bueroeinrichtung': <ChairAlt sx={{ fontSize: 20 }} />,
      'gastronomiebedarf': <Restaurant sx={{ fontSize: 20 }} />,
      'baumaterial': <Plumbing sx={{ fontSize: 20 }} />,
      'elektrotechnik': <ElectricalServices sx={{ fontSize: 20 }} />,
      'lager-transport': <Warehouse sx={{ fontSize: 20 }} />,

      // Digitale Produkte & Services (6 subcategories)
      'software-apps': <Apps sx={{ fontSize: 20 }} />,
      'domains-webseiten': <Language sx={{ fontSize: 20 }} />,
      'nfts-digitale-kunst': <Palette sx={{ fontSize: 20 }} />,
      'online-kurse': <OndemandVideo sx={{ fontSize: 20 }} />,
      'ai-prompts-datenmodelle': <Psychology sx={{ fontSize: 20 }} />,
      'remote-dienstleistungen': <HomeWork sx={{ fontSize: 20 }} />,
    };
    return iconMap[slug] || <FolderOpen sx={{ fontSize: 20 }} />;
  };

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      if (value.level1) setLevel1(value.level1);
      if (value.level2) setLevel2(value.level2);
    }
  }, [value]);

  // Load level 2 options when level 1 changes
  useEffect(() => {
    if (level1) {
      const children = getChildrenOf(level1);
      setLevel2Options(children);
    } else {
      setLevel2Options([]);
      setLevel2('');
    }
  }, [level1, categories]);

  // Handle level 1 selection
  const handleLevel1Change = (event: SelectChangeEvent) => {
    const selectedId = event.target.value;
    setLevel1(selectedId);
    setLevel2(''); // Reset level 2

    const selectedCategory = categories.find(c => c.id === selectedId);
    if (selectedCategory) {
      onChange({
        level1: selectedId,
        level2: undefined,
        level3: undefined,
        level4: undefined,
        full_path: [
          {
            id: selectedCategory.id,
            slug: selectedCategory.slug,
            name: getCategoryName(selectedCategory, lang),
            level: selectedCategory.level,
          },
        ],
      });
    }
  };

  // Handle level 2 selection
  const handleLevel2Change = (event: SelectChangeEvent) => {
    const selectedId = event.target.value;
    setLevel2(selectedId);

    const level1Category = categories.find(c => c.id === level1);
    const level2Category = categories.find(c => c.id === selectedId);

    if (level1Category && level2Category) {
      onChange({
        level1: level1,
        level2: selectedId,
        level3: undefined,
        level4: undefined,
        full_path: [
          {
            id: level1Category.id,
            slug: level1Category.slug,
            name: getCategoryName(level1Category, lang),
            level: level1Category.level,
          },
          {
            id: level2Category.id,
            slug: level2Category.slug,
            name: getCategoryName(level2Category, lang),
            level: level2Category.level,
          },
        ],
      });
    }
  };

  // Render breadcrumb path
  const renderBreadcrumbs = () => {
    if (!showBreadcrumbs || !value?.full_path || value.full_path.length === 0) {
      return null;
    }

    return (
      <Box sx={{
        mt: 2,
        p: 2,
        display: 'flex',
        gap: 0.75,
        flexWrap: 'wrap',
        alignItems: 'center',
        bgcolor: 'rgba(99, 102, 241, 0.04)',
        borderRadius: 2,
        border: '1px solid rgba(99, 102, 241, 0.1)',
      }}>
        {value.full_path.map((item, index) => {
          // Get the actual category to access its slug
          const category = categories.find(c => c.id === item.id);
          const icon = item.level === 1 && category
            ? getCategoryIcon(category.slug)
            : item.level === 2 && category
              ? React.cloneElement(getSubcategoryIcon(category.slug), { sx: { fontSize: 18 } })
              : <AutoAwesome sx={{ fontSize: 18 }} />;

          return (
            <React.Fragment key={item.id}>
              <Chip
                label={item.name}
                size="medium"
                icon={icon}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  height: 32,
                  ...(item.level === 1 && {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' },
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                  }),
                  ...(item.level === 2 && {
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: '#fff',
                    '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' },
                    boxShadow: '0 2px 8px rgba(240, 147, 251, 0.25)',
                  }),
                  ...(item.level === 3 && {
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: '#fff',
                    '& .MuiChip-icon': { color: 'rgba(255,255,255,0.9)' },
                    boxShadow: '0 2px 8px rgba(79, 172, 254, 0.25)',
                  }),
                }}
              />
              {index < value.full_path.length - 1 && (
                <ChevronRight sx={{ color: 'rgba(99, 102, 241, 0.4)', fontSize: 20 }} />
              )}
            </React.Fragment>
          );
        })}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        Kategorien werden geladen...
      </Box>
    );
  }

  return (
    <Box>
      {/* Level 1: Main Category */}
      <FormControl fullWidth required={required} error={!!error} disabled={disabled}>
        <InputLabel>Hauptkategorie</InputLabel>
        <Select
          value={level1}
          onChange={handleLevel1Change}
          label="Hauptkategorie"
        >
          <MenuItem value="">
            <em>Bitte wählen</em>
          </MenuItem>
          {categoryTree.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {React.cloneElement(getCategoryIcon(category.slug), { sx: { fontSize: 20, color: 'primary.main' } })}
                {getCategoryName(category, lang)}
                {category.usage_count > 0 && (
                  <Chip
                    label={category.usage_count}
                    size="small"
                    sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>

      {/* Level 2: Subcategory */}
      {level1 && level2Options.length > 0 && (
        <FormControl fullWidth required={required} disabled={disabled} sx={{ mt: 2 }}>
          <InputLabel>Unterkategorie</InputLabel>
          <Select
            value={level2}
            onChange={handleLevel2Change}
            label="Unterkategorie"
          >
            <MenuItem value="">
              <em>Bitte wählen</em>
            </MenuItem>
            {level2Options.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  {React.cloneElement(getSubcategoryIcon(category.slug), { sx: { fontSize: 20, color: 'secondary.main' } })}
                  {getCategoryName(category, lang)}
                  {category.usage_count > 0 && (
                    <Chip
                      label={category.usage_count}
                      size="small"
                      sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Breadcrumb Display */}
      {renderBreadcrumbs()}

      {/* Info about Level 3 */}
      {level2 && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
            borderRadius: 2,
            border: '1px solid rgba(79, 172, 254, 0.2)',
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-start',
            boxShadow: '0 2px 8px rgba(79, 172, 254, 0.08)',
          }}
        >
          <AutoAwesome
            sx={{
              color: '#4facfe',
              fontSize: 24,
              mt: 0.25,
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.6 },
              },
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af', mb: 0.5 }}>
              ✨ KI-gestützte Kategorisierung
            </Box>
            <Box sx={{ fontSize: '0.8125rem', color: '#3b82f6', lineHeight: 1.5 }}>
              Die spezifische Detailkategorie (Ebene 3) wird automatisch von der KI
              basierend auf Titel und Beschreibung vorgeschlagen.
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CategoryDropdown;
