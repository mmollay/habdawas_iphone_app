import { createContext, useContext, useEffect, useState, useRef, ReactNode, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

type HandPreference = 'left' | 'right';

interface HandPreferenceContextType {
  handPreference: HandPreference;
  setHandPreference: (preference: HandPreference) => Promise<void>;
  loading: boolean;
}

const HandPreferenceContext = createContext<HandPreferenceContextType | undefined>(undefined);

export const useHandPreference = () => {
  const context = useContext(HandPreferenceContext);
  if (!context) {
    throw new Error('useHandPreference must be used within a HandPreferenceProvider');
  }
  return context;
};

export const HandPreferenceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [handPreference, setHandPreferenceState] = useState<HandPreference>('right');
  const [loading, setLoading] = useState(true);

  // Deduplication refs
  const loadingRef = useRef(false);
  const loadedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    const loadHandPreference = async () => {
      if (!user) {
        setHandPreferenceState('right');
        setLoading(false);
        loadedForUserRef.current = null;
        return;
      }

      // Skip if already loading or already loaded for this user
      if (loadingRef.current || loadedForUserRef.current === user.id) {
        return;
      }

      loadingRef.current = true;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('hand_preference')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.hand_preference) {
          setHandPreferenceState(data.hand_preference as HandPreference);
        }
        loadedForUserRef.current = user.id;
      } catch (error) {
        console.error('Error loading hand preference:', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadHandPreference();
  }, [user]);

  const setHandPreference = useCallback(async (preference: HandPreference) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hand_preference: preference })
        .eq('id', user.id);

      if (error) throw error;

      setHandPreferenceState(preference);
    } catch (error) {
      console.error('Error updating hand preference:', error);
      throw error;
    }
  }, [user]);

  const value = useMemo(() => ({
    handPreference,
    setHandPreference,
    loading,
  }), [handPreference, setHandPreference, loading]);

  return <HandPreferenceContext.Provider value={value}>{children}</HandPreferenceContext.Provider>;
};
