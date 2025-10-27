import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  MetaCategory,
  MetaCategoryType,
  getMetaCategoriesByType,
  groupMetaCategoriesByType,
} from '../types/metaCategories';

/**
 * Hook to fetch and manage meta-categories
 */
export const useMetaCategories = () => {
  const [metaCategories, setMetaCategories] = useState<MetaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetaCategories();
  }, []);

  const fetchMetaCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('meta_categories')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      setMetaCategories(data || []);
    } catch (err) {
      console.error('Error fetching meta-categories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get meta-categories by type
   */
  const getByType = (type: MetaCategoryType): MetaCategory[] => {
    return getMetaCategoriesByType(metaCategories, type);
  };

  /**
   * Get meta-category by ID
   */
  const getById = (id: string): MetaCategory | undefined => {
    return metaCategories.find(mc => mc.id === id);
  };

  /**
   * Get meta-category by slug
   */
  const getBySlug = (slug: string): MetaCategory | undefined => {
    return metaCategories.find(mc => mc.slug === slug);
  };

  /**
   * Get grouped meta-categories by type
   */
  const grouped = groupMetaCategoriesByType(metaCategories);

  return {
    metaCategories,
    loading,
    error,
    getByType,
    getById,
    getBySlug,
    grouped,
    refetch: fetchMetaCategories,
  };
};

/**
 * Hook to manage item meta-categories
 */
export const useItemMetaCategories = (itemId?: string) => {
  const [itemMetaCategories, setItemMetaCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemId) {
      fetchItemMetaCategories();
    } else {
      setLoading(false);
    }
  }, [itemId]);

  const fetchItemMetaCategories = async () => {
    if (!itemId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('item_meta_categories')
        .select('meta_category_id')
        .eq('item_id', itemId);

      if (fetchError) throw fetchError;

      setItemMetaCategories(data?.map(imc => imc.meta_category_id) || []);
    } catch (err) {
      console.error('Error fetching item meta-categories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add meta-category to item
   */
  const addMetaCategory = async (metaCategoryId: string): Promise<boolean> => {
    if (!itemId) return false;

    try {
      const { error: insertError } = await supabase
        .from('item_meta_categories')
        .insert({
          item_id: itemId,
          meta_category_id: metaCategoryId,
        });

      if (insertError) throw insertError;

      setItemMetaCategories(prev => [...prev, metaCategoryId]);
      return true;
    } catch (err) {
      console.error('Error adding meta-category:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  /**
   * Remove meta-category from item
   */
  const removeMetaCategory = async (metaCategoryId: string): Promise<boolean> => {
    if (!itemId) return false;

    try {
      const { error: deleteError } = await supabase
        .from('item_meta_categories')
        .delete()
        .eq('item_id', itemId)
        .eq('meta_category_id', metaCategoryId);

      if (deleteError) throw deleteError;

      setItemMetaCategories(prev => prev.filter(id => id !== metaCategoryId));
      return true;
    } catch (err) {
      console.error('Error removing meta-category:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  /**
   * Set meta-categories for item (replaces all existing)
   */
  const setMetaCategories = async (metaCategoryIds: string[]): Promise<boolean> => {
    if (!itemId) return false;

    try {
      // Delete all existing
      const { error: deleteError } = await supabase
        .from('item_meta_categories')
        .delete()
        .eq('item_id', itemId);

      if (deleteError) throw deleteError;

      // Insert new ones
      if (metaCategoryIds.length > 0) {
        const { error: insertError } = await supabase
          .from('item_meta_categories')
          .insert(
            metaCategoryIds.map(metaCategoryId => ({
              item_id: itemId,
              meta_category_id: metaCategoryId,
            }))
          );

        if (insertError) throw insertError;
      }

      setItemMetaCategories(metaCategoryIds);
      return true;
    } catch (err) {
      console.error('Error setting meta-categories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  /**
   * Check if item has specific meta-category
   */
  const hasMetaCategory = (metaCategoryId: string): boolean => {
    return itemMetaCategories.includes(metaCategoryId);
  };

  return {
    itemMetaCategories,
    loading,
    error,
    addMetaCategory,
    removeMetaCategory,
    setMetaCategories,
    hasMetaCategory,
    refetch: fetchItemMetaCategories,
  };
};
