/**
 * usePushNotifications Hook für Bazar iOS App
 *
 * Integration mit Capacitor Push Notifications und Supabase
 *
 * Usage:
 * ```typescript
 * import { usePushNotifications } from './hooks/usePushNotifications';
 *
 * function MyComponent() {
 *   const { initPushNotifications, removePushToken } = usePushNotifications();
 *
 *   // Nach Login:
 *   useEffect(() => {
 *     if (user) {
 *       initPushNotifications(user.id);
 *     }
 *   }, [user]);
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

interface PushNotificationData {
  type?: 'new_listing' | 'new_message' | 'new_favorite' | 'listing_sold';
  listing_id?: string;
  message_id?: string;
  user_id?: string;
  [key: string]: any;
}

export function usePushNotifications() {
  const isInitializedRef = useRef(false);
  const currentTokenRef = useRef<string | null>(null);

  /**
   * Initialize Push Notifications
   * Rufen Sie dies nach erfolgreichem Login auf
   */
  const initPushNotifications = async (userId: string) => {
    // Nur auf nativen Plattformen (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      console.log('[Push] Not on native platform, skipping initialization');
      return;
    }

    // Verhindere mehrfache Initialisierung
    if (isInitializedRef.current) {
      console.log('[Push] Already initialized');
      return;
    }

    try {
      console.log('[Push] Requesting permissions...');

      // 1. Request Permission
      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive !== 'granted') {
        console.log('[Push] Permission denied');
        return;
      }

      console.log('[Push] Permission granted, registering...');

      // 2. Register with APNs
      await PushNotifications.register();

      // 3. Listen for registration success
      await PushNotifications.addListener('registration', async (token: Token) => {
        console.log('[Push] Registration success, token:', token.value.substring(0, 20) + '...');
        currentTokenRef.current = token.value;

        try {
          // 4. Save to Supabase
          const { error } = await supabase
            .from('device_tokens')
            .upsert({
              user_id: userId,
              device_token: token.value,
              platform: 'ios',
              last_active: new Date().toISOString(),
              app_version: '1.0.0', // TODO: Get from package.json
            }, {
              onConflict: 'device_token'
            });

          if (error) {
            console.error('[Push] Error saving token:', error);
          } else {
            console.log('[Push] Token saved to Supabase');
          }
        } catch (err) {
          console.error('[Push] Failed to save token:', err);
        }
      });

      // 4. Listen for registration errors
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Registration error:', error);
      });

      // 5. Listen for incoming notifications
      await PushNotifications.addListener(
        'pushNotificationReceived',
        async (notification: PushNotificationSchema) => {
          console.log('[Push] Notification received:', notification);

          const data = notification.data as PushNotificationData;

          // Log to Supabase
          await supabase.from('notification_logs').insert({
            user_id: userId,
            title: notification.title || '',
            body: notification.body || '',
            data: data,
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          });

          // Custom handling basierend auf notification type
          switch (data.type) {
            case 'new_listing':
              // TODO: Navigate to listing details
              console.log('[Push] New listing:', data.listing_id);
              break;
            case 'new_message':
              // TODO: Navigate to messages
              console.log('[Push] New message:', data.message_id);
              break;
            case 'new_favorite':
              // TODO: Show notification
              console.log('[Push] New favorite on your listing');
              break;
            case 'listing_sold':
              // TODO: Navigate to sold listing
              console.log('[Push] Your listing was sold!');
              break;
          }
        }
      );

      // 6. Listen for notification tap
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        async (action: ActionPerformed) => {
          console.log('[Push] Notification tapped:', action);

          const data = action.notification.data as PushNotificationData;

          // Log tap to Supabase
          await supabase
            .from('notification_logs')
            .update({
              status: 'opened',
              opened_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('title', action.notification.title || '')
            .order('created_at', { ascending: false })
            .limit(1);

          // Navigate based on type
          switch (data.type) {
            case 'new_listing':
              if (data.listing_id) {
                // TODO: Navigate to listing
                window.location.href = `/listing/${data.listing_id}`;
              }
              break;
            case 'new_message':
              if (data.message_id) {
                // TODO: Navigate to messages
                window.location.href = `/messages`;
              }
              break;
            case 'new_favorite':
              // Navigate to own listings
              window.location.href = `/profile/listings`;
              break;
            case 'listing_sold':
              if (data.listing_id) {
                window.location.href = `/listing/${data.listing_id}`;
              }
              break;
          }
        }
      );

      isInitializedRef.current = true;
      console.log('[Push] Initialization complete');

    } catch (error) {
      console.error('[Push] Initialization error:', error);
    }
  };

  /**
   * Remove Push Token
   * Rufen Sie dies beim Logout auf
   */
  const removePushToken = async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const token = currentTokenRef.current;
    if (!token) {
      console.log('[Push] No token to remove');
      return;
    }

    try {
      console.log('[Push] Removing token from Supabase...');

      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('device_token', token);

      if (error) {
        console.error('[Push] Error removing token:', error);
      } else {
        console.log('[Push] Token removed successfully');
        currentTokenRef.current = null;
      }

      // Remove all listeners
      await PushNotifications.removeAllListeners();
      isInitializedRef.current = false;

    } catch (error) {
      console.error('[Push] Error during cleanup:', error);
    }
  };

  /**
   * Update last active timestamp
   * Rufen Sie dies regelmäßig auf (z.B. bei App-Foreground)
   */
  const updateLastActive = async () => {
    const token = currentTokenRef.current;
    if (!token || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await supabase
        .from('device_tokens')
        .update({ last_active: new Date().toISOString() })
        .eq('device_token', token);
    } catch (error) {
      console.error('[Push] Error updating last active:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  return {
    initPushNotifications,
    removePushToken,
    updateLastActive,
  };
}
