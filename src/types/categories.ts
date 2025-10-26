/**
 * TypeScript Types for Hierarchical Multi-Language Category System
 *
 * @module categories
 * @description Type definitions for the recursive category system with multi-language support
 */

// =====================================================
// DATABASE TYPES
// =====================================================

/**
 * Translation structure for category names
 */
export interface CategoryTranslation {
  name: string;
  description?: string;
  tags?: string[];  // For AI search/matching
}

/**
 * Multi-language translations object
 */
export interface CategoryTranslations {
  de: CategoryTranslation;
  en?: CategoryTranslation;
  fr?: CategoryTranslation;
  [langCode: string]: CategoryTranslation | undefined;
}

/**
 * Category database record
 */
export interface Category {
  id: string;
  parent_id: string | null;
  slug: string;
  translations: CategoryTranslations;
  level: number;
  sort_order: number;
  is_dynamic: boolean;
  created_by_ai: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Category with loaded children (for hierarchical display)
 */
export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

/**
 * Category path item (for breadcrumbs)
 */
export interface CategoryPathItem {
  id: string;
  slug: string;
  name: string;
  level: number;
}

// =====================================================
// API / HOOK TYPES
// =====================================================

/**
 * Parameters for category filtering/fetching
 */
export interface CategoryFilterParams {
  parent_id?: string | null;
  level?: number;
  is_dynamic?: boolean;
  created_by_ai?: boolean;
  min_usage_count?: number;
  lang?: string;
}

/**
 * Category tree loading options
 */
export interface CategoryTreeOptions {
  max_level?: number;  // Load only up to this level
  include_usage_count?: boolean;
  lang?: string;       // Language for translations
  only_active?: boolean; // Only categories with usage_count > 0
}

/**
 * Category suggestion from AI
 */
export interface AICategorySuggestion {
  parent_id: string;
  slug: string;
  translations: CategoryTranslations;
  confidence: number;  // 0-1 confidence score from AI
  reasoning?: string;  // Optional AI reasoning
}

/**
 * Category creation request
 */
export interface CreateCategoryRequest {
  parent_id?: string;
  slug: string;
  translations: CategoryTranslations;
  level: number;
  sort_order?: number;
  is_dynamic?: boolean;
  created_by_ai?: boolean;
}

// =====================================================
// UI / COMPONENT TYPES
// =====================================================

/**
 * Category dropdown option
 */
export interface CategoryDropdownOption {
  id: string;
  label: string;
  value: string;
  level: number;
  parent_id: string | null;
  disabled?: boolean;
  icon?: React.ReactNode;
}

/**
 * Category selection state
 * IMPORTANT: IDs are strings (UUIDs), not full Category objects
 */
export interface CategorySelection {
  level1?: string;  // Main category ID
  level2?: string;  // Subcategory ID
  level3?: string;  // Sub-subcategory ID
  level4?: string;  // Detailed category ID (most specific)
  full_path?: CategoryPathItem[];
}

/**
 * Helper function to get the final (most specific) category ID from a CategorySelection
 * Returns the deepest level category ID that exists.
 * Priority: level4 > level3 > level2 > level1
 */
export function getFinalCategoryId(selection?: CategorySelection): string | null {
  if (!selection) return null;

  // Return the deepest level available
  if (selection.level4) return selection.level4;
  if (selection.level3) return selection.level3;
  if (selection.level2) return selection.level2;
  if (selection.level1) return selection.level1;

  return null;
}

/**
 * Category dropdown component props
 */
export interface CategoryDropdownProps {
  value?: CategorySelection;
  onChange: (selection: CategorySelection) => void;
  lang?: string;
  maxLevel?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showBreadcrumbs?: boolean;
  allowDynamicCreate?: boolean;  // Allow AI to create new level 3 categories
}

/**
 * Category breadcrumb component props
 */
export interface CategoryBreadcrumbProps {
  category_id: string;
  lang?: string;
  separator?: string;
  onCategoryClick?: (category: Category) => void;
  maxItems?: number;  // Truncate if too many levels
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Language code type
 */
export type LanguageCode = 'de' | 'en' | 'fr';

/**
 * Category level type
 */
export type CategoryLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Helper to get localized category name
 */
export type GetCategoryName = (category: Category, lang?: LanguageCode) => string;

/**
 * Helper to build category tree
 */
export type BuildCategoryTree = (categories: Category[]) => CategoryWithChildren[];

/**
 * Helper to get category path
 */
export type GetCategoryPath = (categoryId: string, allCategories: Category[]) => CategoryPathItem[];

/**
 * Helper to find category by slug
 */
export type FindCategoryBySlug = (slug: string, categories: Category[]) => Category | undefined;

// =====================================================
// CONSTANTS
// =====================================================

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES: LanguageCode[] = ['de', 'en', 'fr'];

/**
 * Default language
 */
export const DEFAULT_LANGUAGE: LanguageCode = 'de';

/**
 * Max category depth
 */
export const MAX_CATEGORY_DEPTH = 5;

/**
 * Level names
 */
export const LEVEL_NAMES: Record<CategoryLevel, string> = {
  1: 'Hauptkategorie',
  2: 'Unterkategorie',
  3: 'Detailkategorie',
  4: 'Spezifikation',
  5: 'Feinabstimmung',
};
