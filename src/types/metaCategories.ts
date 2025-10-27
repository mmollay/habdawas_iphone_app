/**
 * TypeScript Types for Meta-Categories System
 *
 * @module metaCategories
 * @description Type definitions for meta-categories (sustainability, condition, seller_type)
 */

// =====================================================
// DATABASE TYPES
// =====================================================

/**
 * Meta-Category Types
 */
export type MetaCategoryType = 'sustainability' | 'condition' | 'seller_type';

/**
 * Translation structure for meta-category names
 */
export interface MetaCategoryTranslation {
  name: string;
  description?: string;
}

/**
 * Multi-language translations object
 */
export interface MetaCategoryTranslations {
  de: MetaCategoryTranslation;
  en?: MetaCategoryTranslation;
  fr?: MetaCategoryTranslation;
  [langCode: string]: MetaCategoryTranslation | undefined;
}

/**
 * Meta-Category database record
 */
export interface MetaCategory {
  id: string;
  slug: string;
  type: MetaCategoryType;
  translations: MetaCategoryTranslations;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Item-Meta-Category junction table record
 */
export interface ItemMetaCategory {
  id: string;
  item_id: string;
  meta_category_id: string;
  created_at: string;
}

// =====================================================
// UI / COMPONENT TYPES
// =====================================================

/**
 * Meta-Category filter state
 */
export interface MetaCategoryFilter {
  sustainability?: string[];  // Array of sustainability meta-category IDs
  condition?: string[];        // Array of condition meta-category IDs
  seller_type?: string[];      // Array of seller_type meta-category IDs
}

/**
 * Meta-Category chip/badge component props
 */
export interface MetaCategoryChipProps {
  metaCategory: MetaCategory;
  size?: 'small' | 'medium';
  onDelete?: () => void;
  onClick?: () => void;
  variant?: 'filled' | 'outlined';
}

/**
 * Meta-Category selector component props
 */
export interface MetaCategorySelectorProps {
  type: MetaCategoryType;
  value: string[];  // Selected meta-category IDs
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

/**
 * Meta-Category filter panel props
 */
export interface MetaCategoryFilterPanelProps {
  value: MetaCategoryFilter;
  onChange: (filter: MetaCategoryFilter) => void;
  showSustainability?: boolean;
  showCondition?: boolean;
  showSellerType?: boolean;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Helper to get localized meta-category name
 */
export type GetMetaCategoryName = (metaCategory: MetaCategory, lang?: string) => string;

/**
 * Helper to get meta-categories by type
 */
export type GetMetaCategoriesByType = (
  metaCategories: MetaCategory[],
  type: MetaCategoryType
) => MetaCategory[];

/**
 * Helper to check if item has meta-category
 */
export type HasMetaCategory = (
  itemMetaCategories: ItemMetaCategory[],
  metaCategoryId: string
) => boolean;

// =====================================================
// CONSTANTS
// =====================================================

/**
 * Meta-Category Type Labels (German)
 */
export const META_CATEGORY_TYPE_LABELS: Record<MetaCategoryType, string> = {
  sustainability: 'Nachhaltigkeit',
  condition: 'Zustand',
  seller_type: 'Verkäufer-Typ',
};

/**
 * Meta-Category Type Icons
 */
export const META_CATEGORY_TYPE_ICONS: Record<MetaCategoryType, string> = {
  sustainability: 'leaf',
  condition: 'package',
  seller_type: 'user',
};

/**
 * Default colors for meta-category types
 */
export const META_CATEGORY_TYPE_COLORS: Record<MetaCategoryType, string> = {
  sustainability: '#4caf50',
  condition: '#2196f3',
  seller_type: '#ff9800',
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get localized name from meta-category
 */
export const getMetaCategoryName = (
  metaCategory: MetaCategory,
  lang: string = 'de'
): string => {
  return metaCategory.translations?.[lang]?.name || metaCategory.slug;
};

/**
 * Get localized description from meta-category
 */
export const getMetaCategoryDescription = (
  metaCategory: MetaCategory,
  lang: string = 'de'
): string | undefined => {
  return metaCategory.translations?.[lang]?.description;
};

/**
 * Filter meta-categories by type
 */
export const getMetaCategoriesByType = (
  metaCategories: MetaCategory[],
  type: MetaCategoryType
): MetaCategory[] => {
  return metaCategories
    .filter(mc => mc.type === type && mc.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
};

/**
 * Check if item has specific meta-category
 */
export const hasMetaCategory = (
  itemMetaCategories: ItemMetaCategory[],
  metaCategoryId: string
): boolean => {
  return itemMetaCategories.some(imc => imc.meta_category_id === metaCategoryId);
};

/**
 * Get all meta-category IDs for an item
 */
export const getItemMetaCategoryIds = (
  itemMetaCategories: ItemMetaCategory[]
): string[] => {
  return itemMetaCategories.map(imc => imc.meta_category_id);
};

/**
 * Group meta-categories by type
 */
export const groupMetaCategoriesByType = (
  metaCategories: MetaCategory[]
): Record<MetaCategoryType, MetaCategory[]> => {
  return {
    sustainability: getMetaCategoriesByType(metaCategories, 'sustainability'),
    condition: getMetaCategoriesByType(metaCategories, 'condition'),
    seller_type: getMetaCategoriesByType(metaCategories, 'seller_type'),
  };
};
