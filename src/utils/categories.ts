/**
 * Category Utility Functions
 *
 * @module category-utils
 * @description Helper functions for working with hierarchical categories
 */

import {
  Category,
  CategoryWithChildren,
  CategoryPathItem,
  CategoryTranslations,
  LanguageCode,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from '../types/categories';

// =====================================================
// TRANSLATION HELPERS
// =====================================================

/**
 * Get category name in specified language with fallback
 */
export function getCategoryName(category: Category, lang: LanguageCode = DEFAULT_LANGUAGE): string {
  // Try specified language
  if (category.translations[lang]?.name) {
    return category.translations[lang]!.name;
  }

  // Fallback to default language (German)
  if (lang !== DEFAULT_LANGUAGE && category.translations[DEFAULT_LANGUAGE]?.name) {
    return category.translations[DEFAULT_LANGUAGE].name;
  }

  // Last resort: use slug
  return category.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get category description in specified language with fallback
 */
export function getCategoryDescription(category: Category, lang: LanguageCode = DEFAULT_LANGUAGE): string | undefined {
  return (
    category.translations[lang]?.description ||
    category.translations[DEFAULT_LANGUAGE]?.description
  );
}

/**
 * Get category tags for AI matching
 */
export function getCategoryTags(category: Category, lang: LanguageCode = DEFAULT_LANGUAGE): string[] {
  return (
    category.translations[lang]?.tags ||
    category.translations[DEFAULT_LANGUAGE]?.tags ||
    []
  );
}

// =====================================================
// TREE BUILDING
// =====================================================

/**
 * Build hierarchical tree from flat category list
 */
export function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const categoryMap = new Map<string, CategoryWithChildren>();
  const rootCategories: CategoryWithChildren[] = [];

  // Create map of all categories
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Build tree by linking children to parents
  categories.forEach(cat => {
    const categoryWithChildren = categoryMap.get(cat.id)!;

    if (cat.parent_id === null) {
      // Root category (level 1)
      rootCategories.push(categoryWithChildren);
    } else {
      // Child category - add to parent's children
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(categoryWithChildren);
      }
    }
  });

  // Sort children by sort_order
  const sortChildren = (node: CategoryWithChildren) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => a.sort_order - b.sort_order);
      node.children.forEach(sortChildren);
    }
  };

  rootCategories.forEach(sortChildren);
  rootCategories.sort((a, b) => a.sort_order - b.sort_order);

  return rootCategories;
}

/**
 * Get all descendant category IDs (for filtering)
 */
export function getDescendantIds(categoryId: string, categories: Category[]): string[] {
  const descendants: string[] = [categoryId];
  const children = categories.filter(c => c.parent_id === categoryId);

  children.forEach(child => {
    descendants.push(...getDescendantIds(child.id, categories));
  });

  return descendants;
}

// =====================================================
// PATH / BREADCRUMB HELPERS
// =====================================================

/**
 * Get category path from root to specified category
 */
export function getCategoryPath(
  categoryId: string,
  categories: Category[],
  lang: LanguageCode = DEFAULT_LANGUAGE
): CategoryPathItem[] {
  const path: CategoryPathItem[] = [];
  let currentId: string | null = categoryId;

  while (currentId !== null) {
    const category = categories.find(c => c.id === currentId);
    if (!category) break;

    path.unshift({
      id: category.id,
      slug: category.slug,
      name: getCategoryName(category, lang),
      level: category.level,
    });

    currentId = category.parent_id;
  }

  return path;
}

/**
 * Get category path as string (for display)
 */
export function getCategoryPathString(
  categoryId: string,
  categories: Category[],
  lang: LanguageCode = DEFAULT_LANGUAGE,
  separator: string = ' › '
): string {
  const path = getCategoryPath(categoryId, categories, lang);
  return path.map(p => p.name).join(separator);
}

// =====================================================
// SEARCH / FILTER HELPERS
// =====================================================

/**
 * Find category by ID
 */
export function findCategoryById(id: string, categories: Category[]): Category | undefined {
  return categories.find(c => c.id === id);
}

/**
 * Find category by slug
 */
export function findCategoryBySlug(slug: string, categories: Category[]): Category | undefined {
  return categories.find(c => c.slug === slug);
}

/**
 * Find categories by parent ID
 */
export function findChildCategories(parentId: string | null, categories: Category[]): Category[] {
  return categories
    .filter(c => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Find categories by level
 */
export function findCategoriesByLevel(level: number, categories: Category[]): Category[] {
  return categories
    .filter(c => c.level === level)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Search categories by name (fuzzy search across all languages)
 */
export function searchCategories(
  query: string,
  categories: Category[],
  lang?: LanguageCode
): Category[] {
  const lowerQuery = query.toLowerCase();

  return categories.filter(category => {
    // Search in specified language or all languages
    const langsToSearch = lang ? [lang] : SUPPORTED_LANGUAGES;

    return langsToSearch.some(l => {
      const translation = category.translations[l];
      if (!translation) return false;

      return (
        translation.name.toLowerCase().includes(lowerQuery) ||
        translation.description?.toLowerCase().includes(lowerQuery) ||
        translation.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  });
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Validate category slug format
 */
export function isValidCategorySlug(slug: string): boolean {
  // Only lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Generate slug from name
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50); // Max 50 chars
}

/**
 * Check if category has children
 */
export function hasChildren(categoryId: string, categories: Category[]): boolean {
  return categories.some(c => c.parent_id === categoryId);
}

/**
 * Get category level (1-5)
 */
export function getCategoryLevel(categoryId: string, categories: Category[]): number | null {
  const category = findCategoryById(categoryId, categories);
  return category ? category.level : null;
}

// =====================================================
// SORTING HELPERS
// =====================================================

/**
 * Sort categories by usage count (descending)
 */
export function sortByPopularity(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => b.usage_count - a.usage_count);
}

/**
 * Sort categories by name (alphabetically)
 */
export function sortByName(categories: Category[], lang: LanguageCode = DEFAULT_LANGUAGE): Category[] {
  return [...categories].sort((a, b) => {
    const nameA = getCategoryName(a, lang);
    const nameB = getCategoryName(b, lang);
    return nameA.localeCompare(nameB, lang);
  });
}

// =====================================================
// STATISTICS HELPERS
// =====================================================

/**
 * Get total usage count for category and all descendants
 */
export function getTotalUsageCount(categoryId: string, categories: Category[]): number {
  const descendantIds = getDescendantIds(categoryId, categories);
  return categories
    .filter(c => descendantIds.includes(c.id))
    .reduce((sum, c) => sum + c.usage_count, 0);
}

/**
 * Get category statistics
 */
export function getCategoryStats(categories: Category[]) {
  return {
    total: categories.length,
    byLevel: {
      level1: categories.filter(c => c.level === 1).length,
      level2: categories.filter(c => c.level === 2).length,
      level3: categories.filter(c => c.level === 3).length,
    },
    dynamic: categories.filter(c => c.is_dynamic).length,
    aiCreated: categories.filter(c => c.created_by_ai).length,
    totalUsage: categories.reduce((sum, c) => sum + c.usage_count, 0),
  };
}
