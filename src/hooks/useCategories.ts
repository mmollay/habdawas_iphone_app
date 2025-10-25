/**
 * useCategories Hook
 *
 * @description React hook for loading and managing hierarchical categories
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Category,
  CategoryWithChildren,
  CategoryTreeOptions,
  LanguageCode,
  DEFAULT_LANGUAGE,
} from '../types/categories';
import {
  buildCategoryTree,
  findCategoryById,
  getCategoryPath,
  findChildCategories,
} from '../utils/categories';

interface UseCategoriesOptions {
  autoLoad?: boolean;
  maxLevel?: number;
  lang?: LanguageCode;
}

interface UseCategoriesReturn {
  categories: Category[];
  categoryTree: CategoryWithChildren[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryBySlug: (slug: string) => Category | undefined;
  getChildrenOf: (parentId: string | null) => Category[];
  getPathFor: (categoryId: string) => Category[];
}

export const useCategories = (options: UseCategoriesOptions = {}): UseCategoriesReturn => {
  const { autoLoad = true, maxLevel, lang = DEFAULT_LANGUAGE } = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories from Supabase
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      // Optional: filter by max level
      if (maxLevel) {
        query = query.lte('level', maxLevel);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCategories(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [maxLevel]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadCategories();
    }
  }, [autoLoad, maxLevel]);

  // Build category tree (memoized)
  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  // Get category by ID
  const getCategoryById = useCallback((id: string): Category | undefined => {
    return findCategoryById(id, categories);
  }, [categories]);

  // Get category by slug
  const getCategoryBySlug = useCallback((slug: string): Category | undefined => {
    return categories.find(cat => cat.slug === slug);
  }, [categories]);

  // Get children of a category
  const getChildrenOf = useCallback((parentId: string | null): Category[] => {
    return findChildCategories(parentId, categories);
  }, [categories]);

  // Get full path for a category
  const getPathFor = useCallback((categoryId: string): Category[] => {
    const pathItems = getCategoryPath(categoryId, categories, lang);
    return pathItems
      .map(item => findCategoryById(item.id, categories))
      .filter((cat): cat is Category => cat !== undefined);
  }, [categories, lang]);

  return useMemo(() => ({
    categories,
    categoryTree,
    loading,
    error,
    refresh: loadCategories,
    getCategoryById,
    getCategoryBySlug,
    getChildrenOf,
    getPathFor,
  }), [categories, categoryTree, loading, error, loadCategories, getCategoryById, getCategoryBySlug, getChildrenOf, getPathFor]);
};

/**
 * Hook to load a single category with its path
 */
export const useCategory = (categoryId: string | null | undefined) => {
  const { categories, loading, error, getCategoryById, getPathFor } = useCategories();

  const category = useMemo(() => {
    return categoryId ? getCategoryById(categoryId) : undefined;
  }, [categoryId, categories]);

  const path = useMemo(() => {
    return categoryId ? getPathFor(categoryId) : [];
  }, [categoryId, categories]);

  return {
    category,
    path,
    loading,
    error,
  };
};

/**
 * Hook to create or find dynamic level-3 category
 */
export const useDynamicCategory = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrFindCategory = async (
    parentId: string,
    slug: string,
    translations: Category['translations']
  ): Promise<Category | null> => {
    try {
      setCreating(true);
      setError(null);

      // First, check if category already exists
      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .eq('slug', slug)
        .single();

      if (existing) {
        return existing;
      }

      // Get parent to determine level
      const { data: parent } = await supabase
        .from('categories')
        .select('level')
        .eq('id', parentId)
        .single();

      if (!parent) {
        throw new Error('Parent category not found');
      }

      // Get max sort_order for siblings
      const { data: siblings } = await supabase
        .from('categories')
        .select('sort_order')
        .eq('parent_id', parentId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const sortOrder = siblings && siblings.length > 0 ? siblings[0].sort_order + 1 : 0;

      // Create new dynamic category
      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({
          parent_id: parentId,
          slug,
          translations,
          level: parent.level + 1,
          sort_order: sortOrder,
          is_dynamic: true,
          created_by_ai: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMessage);
      console.error('Error creating dynamic category:', err);
      return null;
    } finally {
      setCreating(false);
    }
  };

  return {
    createOrFindCategory,
    creating,
    error,
  };
};
