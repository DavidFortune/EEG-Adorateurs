import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from '@/firebase/config';

class FCMService {
  private messaging: Messaging | null = null;
  private token: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Firebase Messaging
      this.messaging = getMessaging(app);
      this.isInitialized = true;
      console.log('FCM Service initialized');
    } catch (error) {
      console.error('Error initializing FCM:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.messaging) {
      await this.initialize();
    }

    if (!this.messaging) {
      console.error('FCM not initialized');
      return null;
    }

    try {
      // Check if permission is granted
      if (Notification.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) return null;
      }

      // Get FCM token
      const currentToken = await getToken(this.messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        this.token = currentToken;
        // Save token to backend/firestore if needed
        await this.saveTokenToServer(currentToken);
        return currentToken;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async saveTokenToServer(token: string): Promise<void> {
    try {
      // Get current user ID from auth
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.log('No user ID found, skipping token save');
        return;
      }

      // Save token to Firestore
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/firebase/config');
      
      await setDoc(doc(db, 'fcmTokens', userId), {
        token: token,
        platform: 'web',
        updatedAt: serverTimestamp(),
        userId: userId
      }, { merge: true });

      console.log('FCM token saved to server');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  onMessage(callback: (payload: any) => void): void {
    if (!this.messaging) {
      console.error('FCM not initialized');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      callback(payload);
    });
  }

  async deleteToken(): Promise<void> {
    try {
      // Delete token from server
      const userId = localStorage.getItem('userId');
      if (userId) {
        const { doc, deleteDoc } = await import('firebase/firestore');
        const { db } = await import('@/firebase/config');
        await deleteDoc(doc(db, 'fcmTokens', userId));
      }
      
      this.token = null;
      console.log('FCM token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }
}

export const fcmService = new FCMService();