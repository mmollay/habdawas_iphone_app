/**
 * useItemAttributes Hook
 *
 * @description React hook for loading and managing item attributes
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ItemAttribute {
  id: string;
  item_id: string;
  attribute_id: string;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  value_array: string[] | null;
  attribute_key: string;
  attribute_type: string;
  translations: {
    [lang: string]: {
      name: string;
      description?: string;
    };
  };
}

interface UseItemAttributesReturn {
  attributes: ItemAttribute[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useItemAttributes = (itemId: string | undefined): UseItemAttributesReturn => {
  const [attributes, setAttributes] = useState<ItemAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttributes = async () => {
    if (!itemId) {
      setAttributes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('item_attributes')
        .select(`
          id,
          item_id,
          attribute_id,
          value_text,
          value_number,
          value_boolean,
          value_array,
          category_attributes!inner (
            attribute_key,
            attribute_type,
            translations
          )
        `)
        .eq('item_id', itemId);

      if (fetchError) throw fetchError;

      // Flatten the nested structure
      const flattenedAttributes = (data || []).map((attr: any) => ({
        id: attr.id,
        item_id: attr.item_id,
        attribute_id: attr.attribute_id,
        value_text: attr.value_text,
        value_number: attr.value_number,
        value_boolean: attr.value_boolean,
        value_array: attr.value_array,
        attribute_key: attr.category_attributes.attribute_key,
        attribute_type: attr.category_attributes.attribute_type,
        translations: attr.category_attributes.translations,
      }));

      setAttributes(flattenedAttributes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attributes';
      setError(errorMessage);
      console.error('Error fetching item attributes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, [itemId]);

  return {
    attributes,
    loading,
    error,
    refresh: loadAttributes,
  };
};

/**
 * Helper function to get attribute value regardless of type
 */
export const getAttributeValue = (attribute: ItemAttribute): any => {
  if (attribute.value_text !== null) return attribute.value_text;
  if (attribute.value_number !== null) return attribute.value_number;
  if (attribute.value_boolean !== null) return attribute.value_boolean;
  if (attribute.value_array !== null) return attribute.value_array;
  return null;
};

/**
 * Helper function to get attribute label in specific language
 */
export const getAttributeLabel = (attribute: ItemAttribute, lang: string = 'de'): string => {
  return attribute.translations?.[lang]?.name || attribute.attribute_key;
};
