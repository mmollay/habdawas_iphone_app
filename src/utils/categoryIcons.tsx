import { Car, Home, Sofa, Apple, Dumbbell, Shirt, Baby, PawPrint, Briefcase, Store, Sprout, Factory, Cloud, Globe } from 'lucide-react';

export const getCategoryIconBySlug = (categorySlug: string, size: number = 16) => {
  const iconMap: Record<string, JSX.Element> = {
    'fahrzeuge': <Car size={size} />,
    'immobilien': <Home size={size} />,
    'haushalt-moebel': <Sofa size={size} />,
    'elektronik': <Apple size={size} />,
    'freizeit-sport': <Dumbbell size={size} />,
    'mode-lifestyle': <Shirt size={size} />,
    'kinder-familie': <Baby size={size} />,
    'tiere': <PawPrint size={size} />,
    'arbeit': <Briefcase size={size} />,
    'marktplatz': <Store size={size} />,
    'landwirtschaft': <Sprout size={size} />,
    'industrie': <Factory size={size} />,
    'digitale-produkte': <Cloud size={size} />,
  };
  return iconMap[categorySlug] || <Globe size={size} />;
};
