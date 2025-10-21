import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useCapacitorPush } from '../hooks/useCapacitorPush';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  oauthLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Initialize Capacitor Push Notifications
  const { cleanup: cleanupPushNotifications } = useCapacitorPush({
    userId: user?.id,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (() => {
        setSession(session);
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('E-Mail oder Passwort ist falsch');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse');
        }
        throw new Error('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Diese E-Mail-Adresse ist bereits registriert');
        }
        if (error.message.includes('Password')) {
          throw new Error('Passwort muss mindestens 6 Zeichen lang sein');
        }
        throw new Error('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }

      if (data.user && fullName) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', data.user.id);

        if (profileError && !profileError.message.includes('JWT')) {
          console.error('Profil-Update Fehler:', profileError);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  const signOut = async () => {
    try {
      // Clean up push notifications before signing out
      await cleanupPushNotifications();
    } catch (err) {
      console.error('Error cleaning up push notifications:', err);
      // Continue with signout even if cleanup fails
    }

    // Check if we have a valid session before trying to sign out
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Only call signOut API if we have a valid session
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (err) {
        // Ignore errors during sign out - we'll clear local state anyway
        console.log('Session was already expired, clearing local state');
      }
    }

    // Always clear local state and storage
    setSession(null);
    setUser(null);

    // Also manually clear localStorage to be 100% sure
    localStorage.removeItem('sb-hsbjflixgavjqxvnkivi-auth-token');
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        // Check for rate limiting error (429)
        if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
          throw new Error('Zu viele Anfragen. Bitte warten Sie einige Minuten und versuchen Sie es erneut.');
        }
        // Check for email not found
        if (error.message?.toLowerCase().includes('user not found') || error.message?.toLowerCase().includes('email not found')) {
          throw new Error('Keine Benutzer mit dieser E-Mail-Adresse gefunden.');
        }
        // Generic error with the actual error message from Supabase
        throw new Error(error.message || 'Fehler beim Zurücksetzen des Passworts');
      }
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  const signInWithGoogle = async () => {
    try {
      setOauthLoading(true);
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        setOauthLoading(false);
        throw new Error('Google OAuth ist derzeit nur im Web-Browser verfügbar');
      }

      // Get current origin (localhost or production)
      const currentOrigin = window.location.origin;
      console.log('[AuthContext] Starting Google OAuth from:', currentOrigin);

      // Web OAuth flow with implicit flow (no PKCE) for better localhost compatibility
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${currentOrigin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        setOauthLoading(false);
        throw error;
      }
    } catch (err) {
      setOauthLoading(false);
      throw err;
    }
  };

  const value = {
    user,
    session,
    loading,
    oauthLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
