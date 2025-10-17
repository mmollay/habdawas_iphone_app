import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';

export interface UseCapacitorPushOptions {
  userId?: string | null;
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationAction?: (action: ActionPerformed) => void;
}

export const useCapacitorPush = (options: UseCapacitorPushOptions = {}) => {
  const { userId, onNotificationReceived, onNotificationAction } = options;

  const registerDeviceToken = useCallback(async (token: string, userId: string) => {
    try {
      const platform = Capacitor.getPlatform();

      // Save or update device token in Supabase
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: userId,
          token: token,
          platform: platform === 'ios' ? 'ios' : 'android',
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('Error saving device token:', error);
        throw error;
      }

      console.log('✅ Device token registered successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to register device token:', error);
      return false;
    }
  }, []);

  const unregisterDeviceToken = useCallback(async (userId: string) => {
    try {
      // Mark all tokens for this user as inactive
      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        console.error('Error unregistering device tokens:', error);
        throw error;
      }

      console.log('✅ Device tokens unregistered');
      return true;
    } catch (error) {
      console.error('❌ Failed to unregister device tokens:', error);
      return false;
    }
  }, []);

  const initializePushNotifications = useCallback(async () => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('ℹ️ Not a native platform, skipping push notification setup');
      return { success: false, reason: 'not_native' };
    }

    if (!userId) {
      console.log('ℹ️ No user logged in, skipping push notification setup');
      return { success: false, reason: 'no_user' };
    }

    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === 'denied') {
        console.log('❌ Push notification permission denied');
        return { success: false, reason: 'permission_denied' };
      }

      console.log('✅ Push notification permission granted');

      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();

      // Set up listeners
      await PushNotifications.addListener('registration', async (token: Token) => {
        console.log('📱 Push registration success, token:', token.value);
        await registerDeviceToken(token.value, userId);
      });

      await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('❌ Push registration error:', error);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('🔔 Push notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('👆 Push notification action performed:', action);
        if (onNotificationAction) {
          onNotificationAction(action);
        }
      });

      console.log('✅ Push notifications initialized');
      return { success: true };
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return { success: false, reason: 'initialization_error', error };
    }
  }, [userId, registerDeviceToken, onNotificationReceived, onNotificationAction]);

  const cleanup = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !userId) {
      return;
    }

    try {
      // Unregister device tokens
      await unregisterDeviceToken(userId);

      // Remove all listeners
      await PushNotifications.removeAllListeners();

      console.log('✅ Push notifications cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up push notifications:', error);
    }
  }, [userId, unregisterDeviceToken]);

  // Initialize on mount when user is available
  useEffect(() => {
    if (userId) {
      initializePushNotifications();
    }

    // Cleanup on unmount or when user changes
    return () => {
      cleanup();
    };
  }, [userId, initializePushNotifications, cleanup]);

  return {
    initializePushNotifications,
    registerDeviceToken,
    unregisterDeviceToken,
    cleanup
  };
};
