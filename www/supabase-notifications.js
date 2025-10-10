// Supabase Push Notifications Integration
// Import this in your beta.habdawas.at app

import { PushNotifications } from '@capacitor/push-notifications';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
// ✅ Automatisch konfiguriert mit Ihren Supabase Credentials
const SUPABASE_URL = 'https://hsbjflixgavjqxvnkivi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYmpmbGl4Z2F2anF4dm5raXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTAzOTYsImV4cCI6MjA3NDk4NjM5Nn0.voTOMgBYk_ePD4QhYJoFNmNgyewOoWDJeK1avau5UKE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Initialize Push Notifications with Supabase
 * @param {number} userId - Die User-ID des eingeloggten Users
 */
export async function initSupabasePushNotifications(userId) {
  try {
    // 1. Request Permission
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }

    // 2. Register with APNs
    await PushNotifications.register();
    console.log('Push notifications registration started');

    // 3. Listen for successful registration
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);

      try {
        // 4. Save Device Token to Supabase
        const { data, error } = await supabase
          .from('device_tokens')
          .upsert({
            user_id: userId,
            device_token: token.value,
            platform: 'ios',
            last_active: new Date().toISOString(),
            app_version: '1.0.0', // Optional: Version tracken
          }, {
            onConflict: 'device_token' // Update wenn Token bereits existiert
          });

        if (error) {
          console.error('Error saving device token:', error);
        } else {
          console.log('Device token saved to Supabase:', data);
        }
      } catch (err) {
        console.error('Failed to save device token:', err);
      }
    });

    // 5. Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // 6. Handle incoming push notifications
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push notification received:', notification);

      // Optional: Log notification in Supabase
      await supabase.from('notification_logs').insert({
        user_id: userId,
        title: notification.title,
        body: notification.body,
        received_at: new Date().toISOString(),
        data: notification.data
      });

      // Show notification in UI (optional)
      // You can trigger a custom event here for your frontend
      window.dispatchEvent(new CustomEvent('pushNotificationReceived', {
        detail: notification
      }));
    });

    // 7. Handle notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
      console.log('Push notification action performed:', action);

      const notification = action.notification;

      // Optional: Navigate to specific page based on notification data
      if (notification.data && notification.data.productId) {
        // Navigate to product page
        window.location.href = `/product/${notification.data.productId}`;
      }

      // Log tap in Supabase
      await supabase.from('notification_logs').insert({
        user_id: userId,
        action: 'tap',
        notification_id: notification.data?.id,
        tapped_at: new Date().toISOString()
      });
    });

  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}

/**
 * Remove device token when user logs out
 * @param {string} deviceToken - Das Device Token zum Löschen
 */
export async function removeDeviceToken(deviceToken) {
  try {
    const { error } = await supabase
      .from('device_tokens')
      .delete()
      .eq('device_token', deviceToken);

    if (error) {
      console.error('Error removing device token:', error);
    } else {
      console.log('Device token removed from Supabase');
    }
  } catch (err) {
    console.error('Failed to remove device token:', err);
  }
}

/**
 * Update last active timestamp for device
 * @param {string} deviceToken - Das Device Token
 */
export async function updateLastActive(deviceToken) {
  try {
    const { error } = await supabase
      .from('device_tokens')
      .update({ last_active: new Date().toISOString() })
      .eq('device_token', deviceToken);

    if (error) {
      console.error('Error updating last active:', error);
    }
  } catch (err) {
    console.error('Failed to update last active:', err);
  }
}

// Example usage:
//
// // In your app's main.js or index.js:
// import { initSupabasePushNotifications } from './supabase-notifications.js';
//
// // After user logs in:
// const userId = 123; // Your logged-in user ID
// initSupabasePushNotifications(userId);
//
// // When user logs out:
// import { removeDeviceToken } from './supabase-notifications.js';
// const token = '...'; // Get from localStorage or state
// removeDeviceToken(token);
