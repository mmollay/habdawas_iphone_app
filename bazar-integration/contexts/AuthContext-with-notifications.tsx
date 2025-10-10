/**
 * Updated AuthContext mit Push Notification Support
 *
 * Integration Points:
 * - Nach Login → initPushNotifications(user.id)
 * - Nach Signup → initPushNotifications(user.id)
 * - Bei Logout → removePushToken()
 * - Bei Auth State Change → initPushNotifications(user.id)
 *
 * Installation:
 * 1. Ersetzen Sie src/contexts/AuthContext.tsx mit diesem File
 * 2. Kopieren Sie usePushNotifications.ts nach src/hooks/
 * 3. Installieren Sie Dependencies: npm install @capacitor/push-notifications
 *
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { mockUser, IS_MOCK_MODE } from '../lib/mockData';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Push Notifications Hook
  const { initPushNotifications, removePushToken } = usePushNotifications();

  useEffect(() => {
    if (IS_MOCK_MODE) {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser as unknown as User,
      };
      setSession(mockSession as Session);
      setUser(mockUser as unknown as User);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // ✅ Initialize Push Notifications if user is logged in
      if (session?.user) {
        console.log('[Auth] User session found, initializing push notifications');
        initPushNotifications(session.user.id);
      }

      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // ✅ Handle Push Notifications on auth state change
      if (session?.user) {
        console.log('[Auth] Auth state changed, user logged in');
        initPushNotifications(session.user.id);
      } else {
        console.log('[Auth] Auth state changed, user logged out');
        await removePushToken();
      }
    });

    return () => subscription.unsubscribe();
  }, [initPushNotifications, removePushToken]);

  const signIn = async (email: string, password: string) => {
    if (IS_MOCK_MODE) {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser as unknown as User,
      };
      setSession(mockSession as Session);
      setUser(mockUser as unknown as User);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // ✅ Initialize Push Notifications after successful login
    if (!error && data.user) {
      console.log('[Auth] Login successful, initializing push notifications');
      await initPushNotifications(data.user.id);
    }

    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (IS_MOCK_MODE) {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser as unknown as User,
      };
      setSession(mockSession as Session);
      setUser(mockUser as unknown as User);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName || email.split('@')[0],
      });

      // Create user settings
      await supabase.from('user_settings').insert({
        user_id: data.user.id,
      });

      // ✅ Initialize Push Notifications after successful signup
      console.log('[Auth] Signup successful, initializing push notifications');
      await initPushNotifications(data.user.id);
    }

    return { error };
  };

  const signOut = async () => {
    if (IS_MOCK_MODE) {
      setSession(null);
      setUser(null);
      return;
    }

    // ✅ Remove Push Token before logout
    console.log('[Auth] Signing out, removing push token');
    await removePushToken();

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
