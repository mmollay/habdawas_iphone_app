// Push Notifications Setup
// Import this in your app to enable push notifications

import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Initialize Push Notifications
 * Call this function when your app starts
 */
export async function initPushNotifications() {
  try {
    // Request permission to use push notifications
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive === 'granted') {
      // Register with Apple Push Notification service
      await PushNotifications.register();
      console.log('Push notifications registered');
    } else {
      console.log('Push notification permission denied');
    }

    // Handle registration success
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Send this token to your backend server
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Handle push notification received
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
      // You can show a local notification or update the UI
    });

    // Handle notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
      // Handle the user tapping on the notification
    });

  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}

/**
 * Schedule a local notification (example)
 */
export async function scheduleLocalNotification(title, body) {
  try {
    const permStatus = await LocalNotifications.requestPermissions();

    if (permStatus.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000 * 5) }, // 5 seconds from now
            sound: null,
            attachments: null,
            actionTypeId: '',
            extra: null
          }
        ]
      });
      console.log('Local notification scheduled');
    }
  } catch (error) {
    console.error('Error scheduling local notification:', error);
  }
}

// Example usage:
// import { initPushNotifications, scheduleLocalNotification } from './notifications.js';
//
// document.addEventListener('DOMContentLoaded', () => {
//   initPushNotifications();
//
//   // Test local notification
//   scheduleLocalNotification('Test', 'This is a test notification');
// });
