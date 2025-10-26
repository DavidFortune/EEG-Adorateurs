import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailLink,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { app } from './config';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configuration pour le lien par email
// Always use the production URL for email links to ensure they work correctly
const getRedirectUrl = () => {
  return 'https://adorateurs.eglisegalilee.com/auth/callback';
};

const actionCodeSettings = {
  url: getRedirectUrl(),
  handleCodeInApp: true,
  // These settings help ensure the link is formatted correctly
  iOS: {
    bundleId: 'com.eglisegalilee.adorateurs'
  },
  android: {
    packageName: 'com.eglisegalilee.adorateurs'
  }
};

export const authService = {
  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  },

  /**
   * Send sign-in link to email
   */
  async sendEmailSignInLink(email: string): Promise<void> {
    try {
      console.log('Sending email sign-in link to:', email);
      console.log('Action code settings:', actionCodeSettings);
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Stocker l'email dans localStorage pour la vérification
      localStorage.setItem('emailForSignIn', email);
      console.log('Email sign-in link sent successfully');
    } catch (error) {
      console.error('Email link sending error:', error);
      throw error;
    }
  },

  /**
   * Complete email sign-in with link
   */
  async completeEmailSignIn(emailLink: string): Promise<User> {
    try {
      console.log('Checking if URL is sign-in link...');
      if (isSignInWithEmailLink(auth, emailLink)) {
        console.log('Valid sign-in link detected');
        let email = localStorage.getItem('emailForSignIn');
        console.log('Email from localStorage:', email);
        
        if (!email) {
          // Si l'email n'est pas disponible, demander à l'utilisateur
          email = window.prompt('Veuillez confirmer votre adresse email');
          console.log('Email from prompt:', email);
        }
        
        if (!email) {
          throw new Error('Email requis pour compléter la connexion');
        }

        console.log('Attempting to sign in with email:', email);
        const result = await signInWithEmailLink(auth, email, emailLink);
        console.log('Sign-in successful, user:', result.user.email);
        localStorage.removeItem('emailForSignIn');
        return result.user;
      } else {
        console.log('Not a valid sign-in link');
        throw new Error('Lien de connexion invalide');
      }
    } catch (error) {
      console.error('Email sign in completion error:', error);
      throw error;
    }
  },

  /**
   * Sign out current user
   */
  async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    // Check if running in Cypress test environment
    if (typeof window !== 'undefined' && (window as any).Cypress && (window as any).CYPRESS_MOCK_USER) {
      return (window as any).CYPRESS_MOCK_USER as User;
    }
    return auth.currentUser;
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    // Check if running in Cypress test environment
    if (typeof window !== 'undefined' && (window as any).Cypress && (window as any).CYPRESS_MOCK_USER) {
      // Immediately call callback with mock user
      setTimeout(() => callback((window as any).CYPRESS_MOCK_USER as User), 0);
      return () => {}; // Return empty unsubscribe function
    }
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    // Check if running in Cypress test environment
    if (typeof window !== 'undefined' && (window as any).Cypress && (window as any).CYPRESS_MOCK_USER) {
      return true;
    }
    return auth.currentUser !== null;
  },

  /**
   * Check if current URL is a sign-in link
   */
  isSignInWithEmailLink(url: string): boolean {
    return isSignInWithEmailLink(auth, url);
  },

  /**
   * Wait for auth state to be initialized
   */
  waitForAuth(): Promise<User | null> {
    // Check if running in Cypress test environment
    if (typeof window !== 'undefined' && (window as any).Cypress && (window as any).CYPRESS_MOCK_USER) {
      return Promise.resolve((window as any).CYPRESS_MOCK_USER as User);
    }

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
};