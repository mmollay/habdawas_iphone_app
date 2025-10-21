import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const getSupabaseUrl = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url || url === 'undefined') {
    console.error('VITE_SUPABASE_URL is not defined, using fallback');
    return 'https://hsbjflixgavjqxvnkivi.supabase.co';
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key || key === 'undefined') {
    console.error('VITE_SUPABASE_ANON_KEY is not defined, using fallback');
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYmpmbGl4Z2F2anF4dm5raXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTAzOTYsImV4cCI6MjA3NDk4NjM5Nn0.voTOMgBYk_ePD4QhYJoFNmNgyewOoWDJeK1avau5UKE';
  }
  return key;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Custom storage for Capacitor (persists tokens in iOS Keychain)
const capacitorStorage = {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  },
};

const isNative = Capacitor.isNativePlatform();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // On native: use Capacitor Preferences for secure storage (iOS Keychain)
    // On web: use default localStorage
    storage: isNative ? capacitorStorage : undefined,
    // detectSessionInUrl should be false on native (we handle OAuth manually)
    detectSessionInUrl: !isNative,
    // Use implicit flow for better localhost compatibility (tokens in URL hash)
    flowType: 'implicit',
  },
});

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  language: string | null;
  notifications_enabled: boolean;
  email_notifications: boolean;
  newsletter_subscribed: boolean;
  show_phone_publicly: boolean;
  default_pickup_address_id: string | null;
  ai_text_style: string;
  ai_text_length: string;
  ai_include_emoji: boolean;
  ai_allow_line_breaks: boolean;
  ai_auto_publish: boolean;
  ai_analyze_all_images: boolean;
  show_ai_shipping_costs: boolean;
  shipping_enabled: boolean;
  shipping_cost: number;
  shipping_cost_type: 'free' | 'fixed' | 'ai_calculated';
  shipping_description: string | null;
  pickup_enabled: boolean;
  show_location_publicly: boolean;
  location_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PickupAddress {
  id: string;
  user_id: string;
  name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string | null;
  show_phone_publicly: boolean;
  is_default: boolean;
  address_type: 'pickup_only' | 'shipping_only' | 'both';
  is_default_shipping: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  status: 'draft' | 'published' | 'sold';
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  category?: string | null;
  subcategory?: string | null;
  condition?: string | null;
  brand?: string | null;
  size?: string | null;
  weight?: string | null;
  dimensions_length?: string | null;
  dimensions_width?: string | null;
  dimensions_height?: string | null;
  material?: string | null;
  colors?: string[] | null;
  style?: string | null;
  serial_number?: string | null;
  features?: string[] | null;
  accessories?: string[] | null;
  tags?: string[] | null;
  postal_code?: string | null;
  location?: string | null;
  estimated_weight_kg?: number | null;
  package_dimensions?: {
    length: number;
    width: number;
    height: number;
  } | null;
  ai_shipping_domestic?: number | null;
  ai_shipping_international?: number | null;
  selected_address_id?: string | null;
  shipping_from_country?: string | null;
  snapshot_shipping_enabled?: boolean | null;
  snapshot_shipping_cost?: number | null;
  snapshot_shipping_cost_type?: 'free' | 'fixed' | 'ai_calculated' | null;
  snapshot_shipping_description?: string | null;
  snapshot_pickup_enabled?: boolean | null;
  snapshot_show_location_publicly?: boolean | null;
  snapshot_pickup_address?: string | null;
  snapshot_pickup_postal_code?: string | null;
  snapshot_pickup_city?: string | null;
  snapshot_pickup_country?: string | null;
  snapshot_location_description?: string | null;
  view_count?: number;
  price_negotiable?: boolean;
  is_free?: boolean;
  price_on_request?: boolean;
}

export interface Conversation {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}
