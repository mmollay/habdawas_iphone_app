import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FilterCount {
  attribute_key: string;
  attribute_label: string;
  attribute_type?: string;
  value_text?: string;
  value_number?: number;
  item_count: number;
}

interface FilterResponse {
  category_id: string;
  filters: {
    [key: string]: {
      label: string;
      type?: string;
      values: Array<{
        value: string | number;
        count: number;
      }>;
    };
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("category_id");

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all subcategories recursively
    const { data: allCategories } = await supabase
      .from("categories")
      .select("id, parent_id");

    // Build category tree and find all descendants
    const findAllDescendants = (parentId: string): string[] => {
      const children = allCategories?.filter(c => c.parent_id === parentId) || [];
      const descendants = children.map(c => c.id);
      children.forEach(child => {
        descendants.push(...findAllDescendants(child.id));
      });
      return descendants;
    };

    // If no categoryId provided, use all categories
    const allCategoryIds = categoryId
      ? [categoryId, ...findAllDescendants(categoryId)]
      : (allCategories?.map(c => c.id) || []);

    // Parallel queries for better performance
    const [categorySpecificResult, generalResult, priceResult, totalResult, subcategoryCountsResult] = await Promise.all([
      // 1. Category-specific attributes (from item_attributes)
      supabase
        .from("mv_filter_counts")
        .select("*")
        .in("category_id", allCategoryIds),

      // 2. General attributes (from items table)
      supabase
        .from("mv_general_filter_counts")
        .select("*")
        .in("category_id", allCategoryIds),

      // 3. Price range
      supabase
        .from("items")
        .select("price")
        .in("category_id", allCategoryIds)
        .eq("status", "published")
        .or("expires_at.is.null,expires_at.gt." + new Date().toISOString()),

      // 4. Total item count
      supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .in("category_id", allCategoryIds)
        .eq("status", "published")
        .or("expires_at.is.null,expires_at.gt." + new Date().toISOString()),

      // 5. Subcategory counts
      supabase
        .from("items")
        .select("category_id")
        .in("category_id", allCategoryIds)
        .eq("status", "published")
        .or("expires_at.is.null,expires_at.gt." + new Date().toISOString()),
    ]);

    // Check for errors
    if (categorySpecificResult.error) throw categorySpecificResult.error;
    if (generalResult.error) throw generalResult.error;
    if (priceResult.error) throw priceResult.error;
    if (totalResult.error) throw totalResult.error;
    if (subcategoryCountsResult.error) throw subcategoryCountsResult.error;

    // Combine results
    const allFilters: FilterCount[] = [
      ...(categorySpecificResult.data || []),
      ...(generalResult.data || []),
    ];

    // Calculate price range
    const prices = (priceResult.data || []).map((item) => item.price).filter(Boolean);
    const priceRange = prices.length > 0
      ? {
          min: Math.min(...prices),
          max: Math.max(...prices),
        }
      : undefined;

    // Group by attribute_key and merge duplicate values
    const groupedFilters: FilterResponse["filters"] = {};

    for (const filter of allFilters) {
      const key = filter.attribute_key;
      const value = filter.value_text || filter.value_number!;

      // Initialize filter group if it doesn't exist
      if (!groupedFilters[key]) {
        groupedFilters[key] = {
          label: filter.attribute_label,
          type: filter.attribute_type,
          values: [],
        };
      }

      // Check if this value already exists in the group
      const existingValue = groupedFilters[key].values.find(v => v.value === value);

      if (existingValue) {
        // Merge counts if value already exists
        existingValue.count += filter.item_count;
      } else {
        // Add new value
        groupedFilters[key].values.push({
          value: value,
          count: filter.item_count,
        });
      }
    }

    // Sort values by count (descending)
    for (const key in groupedFilters) {
      groupedFilters[key].values.sort((a, b) => b.count - a.count);
    }

    // Calculate subcategory counts
    const subcategoryCounts: { [key: string]: number } = {};
    const itemsByCategoryId = subcategoryCountsResult.data || [];

    for (const item of itemsByCategoryId) {
      const catId = item.category_id;
      if (catId && (!categoryId || catId !== categoryId)) { // Exclude parent category itself
        subcategoryCounts[catId] = (subcategoryCounts[catId] || 0) + 1;
      }
    }

    const response: FilterResponse = {
      category_id: categoryId || "all",
      filters: groupedFilters,
      total_items: totalResult.count || 0,
      price_range: priceRange,
      subcategory_counts: subcategoryCounts,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching filter counts:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
