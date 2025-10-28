export interface SpecialCategory {
  id: string;
  slug: string;
  type: 'vehicle' | 'property' | 'job';
  route: string;
  icon: string; // lucide icon name
  labelKey: string; // For i18n later
  label: string; // German label for now
}

export const SPECIAL_CATEGORIES: SpecialCategory[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'fahrzeuge',
    type: 'vehicle',
    route: '/fahrzeuge',
    icon: 'Car',
    labelKey: 'nav.vehicles',
    label: 'Fahrzeuge'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    slug: 'immobilien',
    type: 'property',
    route: '/immobilien',
    icon: 'Home',
    labelKey: 'nav.properties',
    label: 'Immobilien'
  },
  {
    id: '00000000-0000-0000-0000-000000000009',
    slug: 'arbeit-dienstleistungen',
    type: 'job',
    route: '/jobs',
    icon: 'Briefcase',
    labelKey: 'nav.jobs',
    label: 'Jobs'
  }
];

export const isSpecialCategory = (categoryId: string): boolean => {
  return SPECIAL_CATEGORIES.some(sc => sc.id === categoryId);
};

export const getSpecialCategoryBySlug = (slug: string): SpecialCategory | undefined => {
  return SPECIAL_CATEGORIES.find(sc => sc.slug === slug);
};

export const getSpecialCategoryById = (id: string): SpecialCategory | undefined => {
  return SPECIAL_CATEGORIES.find(sc => sc.id === id);
};
