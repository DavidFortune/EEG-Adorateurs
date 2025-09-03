import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { createPinia } from 'pinia';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode - DISABLED
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
/* @import '@ionic/vue/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

/* Push notifications */
import { pushNotificationService } from './services/pushNotificationService';

/* FCM Service */
import { fcmService } from './services/fcmService';

/* Update service */
import { updateService } from './services/updateService';

const pinia = createPinia();

const app = createApp(App)
  .use(IonicVue, {
    mode: 'ios', // Force iOS styling across all platforms
    animated: true // Enable iOS animations
  })
  .use(router)
  .use(pinia);

router.isReady().then(async () => {
  app.mount('#app');
  
  // Initialize push notifications
  await pushNotificationService.initialize();
  
  // Initialize FCM service
  await fcmService.initialize();
  
  // Request notification permission and get FCM token
  if ('Notification' in window) {
    await fcmService.getToken();
    
    // Listen for foreground messages
    fcmService.onMessage((payload) => {
      console.log('Foreground message received:', payload);
      // Handle foreground notification (show toast, update UI, etc.)
      if (payload.notification) {
        pushNotificationService.showLocalNotification({
          title: payload.notification.title || 'Nouvelle notification',
          body: payload.notification.body || '',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: payload.data
        });
      }
    });
  }
  
  // Register Firebase Messaging Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope'
      });
      console.log('Firebase Messaging SW registered:', registration);
    } catch (error) {
      console.error('Firebase Messaging SW registration failed:', error);
    }
  }
  
  // Initialize update service
  await updateService.initialize();
});
