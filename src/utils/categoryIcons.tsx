import {
  Car, Home, Sofa, Apple, Dumbbell, Shirt, Baby, PawPrint, Briefcase, Store, Sprout, Factory, Cloud, Globe,
  Building, Smartphone, Wrench, Gift, Tractor, Search, Utensils, Dog, ShoppingBag, Tent, Cat, Monitor, Link,
  Trees, Repeat, HeartPulse, Settings, Hammer, Bike, Warehouse, Package, BookOpen, ShoppingCart, Scale,
  Lamp, Anchor, Truck, Sparkles, UtensilsCrossed, Palette, Gamepad2, Users, Stethoscope, Music, Watch,
  Heart, Leaf, GraduationCap, FileCode, Flower2, Image, TestTube, School, PiggyBank, Zap, DollarSign,
  Coins, BadgePercent, CircleDollarSign, MapPin, Lightbulb, Ticket, PaintBucket
} from 'lucide-react';

export const getCategoryIconBySlug = (categorySlug: string, size: number = 16) => {
  const iconMap: Record<string, JSX.Element> = {
    // Level 1 - Hauptkategorien
    'fahrzeuge': <Car size={size} />,
    'immobilien': <Home size={size} />,
    'haushalt-moebel': <Sofa size={size} />,
    'elektronik': <Apple size={size} />,
    'freizeit-sport': <Dumbbell size={size} />,
    'mode-lifestyle': <Shirt size={size} />,
    'kinder-familie': <Baby size={size} />,
    'tiere': <PawPrint size={size} />,
    'arbeit-dienstleistungen': <Briefcase size={size} />,
    'marktplatz': <Store size={size} />,
    'landwirtschaft': <Sprout size={size} />,
    'industrie-gewerbe': <Factory size={size} />,
    'digitale-produkte': <Cloud size={size} />,

    // Level 2 - Immobilien
    'haeuser-kaufen': <Building size={size} />,
    'wohnungen-kaufen': <Home size={size} />,
    'grundstuecke': <MapPin size={size} />,
    'gewerbeimmobilien': <Factory size={size} />,
    'miete-vermietung': <Building size={size} />,
    'wohngemeinschaften': <Users size={size} />,
    'garagen-stellplaetze': <Warehouse size={size} />,
    'ferienimmobilien': <Home size={size} />,

    // Level 2 - Fahrzeuge
    'autos': <Car size={size} />,
    'motorraeder-roller': <Bike size={size} />,
    'nutzfahrzeuge': <Truck size={size} />,
    'oldtimer': <Car size={size} />,
    'kinderfahrzeuge': <Bike size={size} />,
    'fahrraeder-zubehoer': <Bike size={size} />,
    'wohnmobile-wohnwagen': <Truck size={size} />,
    'boote-wasserfahrzeuge': <Anchor size={size} />,
    'ersatzteile-zubehoer': <Wrench size={size} />,

    // Level 2 - Elektronik
    'smartphones-tablets': <Smartphone size={size} />,
    'computer-laptops': <Monitor size={size} />,
    'tv-audio-video': <Monitor size={size} />,
    'kameras-drohnen': <Apple size={size} />,
    'smart-home-gadgets': <Zap size={size} />,
    'konsolen-games': <Gamepad2 size={size} />,
    'haushalts-elektronik': <Zap size={size} />,

    // Level 2 - Haushalt & Möbel
    'moebel': <Sofa size={size} />,
    'kueche-esszimmer': <Utensils size={size} />,
    'wohnaccessoires': <Sparkles size={size} />,
    'garten-balkon': <Flower2 size={size} />,
    'haushaltsgeraete': <Settings size={size} />,
    'beleuchtung': <Lamp size={size} />,
    'heimwerken-bau': <Hammer size={size} />,

    // Level 2 - Tiere
    'hunde': <Dog size={size} />,
    'katzen': <Cat size={size} />,
    'pferde': <PawPrint size={size} />,
    'kleintiere': <PawPrint size={size} />,
    'nutztiere': <PawPrint size={size} />,
    'aquaristik-terraristik': <TestTube size={size} />,
    'zubehoer-futter': <ShoppingBag size={size} />,

    // Level 2 - Kinder & Familie
    'babyartikel': <Baby size={size} />,
    'kinderbekleidung': <Shirt size={size} />,
    'spielzeug': <Gamepad2 size={size} />,
    'schulbedarf': <School size={size} />,
    'kinderbuecher': <BookOpen size={size} />,

    // Level 2 - Mode & Lifestyle
    'damenmode': <Shirt size={size} />,
    'herrenmode': <Shirt size={size} />,
    'schuhe': <Shirt size={size} />,
    'schmuck-uhren': <Watch size={size} />,
    'taschen-accessoires': <ShoppingBag size={size} />,
    'beauty-pflege': <Heart size={size} />,
    'vintage-secondhand': <Sparkles size={size} />,

    // Level 2 - Freizeit & Sport
    'camping-outdoor': <Tent size={size} />,
    'fitness-training': <Dumbbell size={size} />,
    'musikinstrumente': <Music size={size} />,
    'buecher-comics': <BookOpen size={size} />,
    'modellbau': <Wrench size={size} />,
    'sammeln-raritaeten': <Package size={size} />,
    'tickets-veranstaltungen': <Ticket size={size} />,

    // Level 2 - Arbeit & Dienstleistungen
    'jobs-stellenangebote': <Briefcase size={size} />,
    'buero-verwaltung': <Briefcase size={size} />,
    'handwerk-bau': <Hammer size={size} />,
    'transport-umzug': <Truck size={size} />,
    'unterricht-nachhilfe': <GraduationCap size={size} />,
    'coaching-beratung': <HeartPulse size={size} />,
    'kuenstlerische-leistungen': <Palette size={size} />,
    'remote-dienstleistungen': <Monitor size={size} />,
    'gesundheit-pflege': <Stethoscope size={size} />,

    // Level 2 - Marktplatz
    'zu-verschenken': <Gift size={size} />,
    'tauschangebote': <Repeat size={size} />,
    'gesuche': <Search size={size} />,
    'flohmarktartikel': <ShoppingCart size={size} />,
    'antiquitaeten': <Package size={size} />,
    'restposten': <BadgePercent size={size} />,

    // Level 2 - Landwirtschaft
    'traktoren-landmaschinen': <Tractor size={size} />,
    'forst-gartenbedarf': <Trees size={size} />,
    'saatgut-pflanzen': <Sprout size={size} />,
    'brennholz-rohstoffe': <Trees size={size} />,

    // Level 2 - Industrie
    'maschinen-werkzeuge': <Wrench size={size} />,
    'bueroeinrichtung': <Briefcase size={size} />,
    'gastronomiebedarf': <UtensilsCrossed size={size} />,
    'baumaterial': <Factory size={size} />,
    'elektrotechnik': <Zap size={size} />,
    'lager-transport': <Warehouse size={size} />,

    // Level 2 - Digitale Produkte
    'software-apps': <Cloud size={size} />,
    'domains-webseiten': <Link size={size} />,
    'nfts-digitale-kunst': <Image size={size} />,
    'online-kurse': <GraduationCap size={size} />,
    'ai-prompts-datenmodelle': <FileCode size={size} />,
  };
  return iconMap[categorySlug] || <Globe size={size} />;
};
