import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: Set<string>;
  loading: boolean;
  toggleFavorite: (itemId: string) => Promise<boolean>;
  isFavorite: (itemId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Deduplication refs
  const loadingRef = useRef(false);
  const loadedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites(new Set());
      setLoading(false);
      loadedForUserRef.current = null;
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    // Skip if already loading or already loaded for this user
    if (loadingRef.current || loadedForUserRef.current === user.id) {
      return;
    }

    loadingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('item_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const favoriteIds = new Set(data?.map(f => f.item_id) || []);
      setFavorites(favoriteIds);
      loadedForUserRef.current = user.id;
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const toggleFavorite = async (itemId: string) => {
    if (!user) {
      alert('Bitte melde dich an, um Artikel zu merken.');
      return false;
    }

    const isFavorite = favorites.has(itemId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId);

        if (error) throw error;

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            item_id: itemId,
          });

        if (error && error.code !== '23505') throw error;

        setFavorites(prev => new Set([...prev, itemId]));
      }

      return true;
    } catch (err: any) {
      if (err?.code !== '23505') {
        console.error('Error toggling favorite:', err);
      }
      return false;
    }
  };

  const isFavorite = (itemId: string) => favorites.has(itemId);

  return (
    <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
};
