import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FilterValue {
  value: string | number;
  count: number;
}

interface Filter {
  label: string;
  type?: string;
  values: FilterValue[];
}

interface FilterCountsData {
  category_id: string;
  filters: {
    [key: string]: Filter;
  };
  total_items: number;
  price_range?: {
    min: number;
    max: number;
  };
  subcategory_counts?: {
    [key: string]: number;
  };
}

export interface SelectedFilters {
  [key: string]: (string | number)[];
  priceRange?: [number, number];
}

export const useFilterCounts = (
  categoryId?: string,
  enabled: boolean = true,
  activeFilters?: SelectedFilters
) => {
  const [data, setData] = useState<FilterCountsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchFilterCounts = async () => {
      // Only show loading skeleton on initial load (when data is null)
      // For subsequent updates, use isRefreshing to keep UI visible
      if (data === null) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const url = new URL(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-filter-counts`
        );

        // Add category_id if provided, otherwise get all filters
        if (categoryId) {
          url.searchParams.set('category_id', categoryId);
        }

        // Add active filters as query params
        if (activeFilters) {
          // Price range
          if (activeFilters.priceRange) {
            const [min, max] = activeFilters.priceRange;
            if (min > 0) url.searchParams.set('price_min', min.toString());
            if (max < 999999) url.searchParams.set('price_max', max.toString());
          }

          // Other filters (subcategories, condition, brand, color, material, etc.)
          Object.entries(activeFilters).forEach(([key, values]) => {
            if (key !== 'priceRange' && Array.isArray(values) && values.length > 0) {
              url.searchParams.set(key, values.join(','));
            }
          });
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch filter counts');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching filter counts:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchFilterCounts();
  }, [categoryId, enabled, JSON.stringify(activeFilters)]);

  return { data, loading, isRefreshing, error };
};
