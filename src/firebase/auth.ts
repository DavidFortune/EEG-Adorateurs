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
const actionCodeSettings = {
  url: window.location.origin + '/onboarding/welcome',
  handleCodeInApp: true
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
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Stocker l'email dans localStorage pour la vérification
      localStorage.setItem('emailForSignIn', email);
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
      if (isSignInWithEmailLink(auth, emailLink)) {
        let email = localStorage.getItem('emailForSignIn');
        if (!email) {
          // Si l'email n'est pas disponible, demander à l'utilisateur
          email = window.prompt('Veuillez confirmer votre adresse email');
        }
        
        if (!email) {
          throw new Error('Email requis pour compléter la connexion');
        }

        const result = await signInWithEmailLink(auth, email, emailLink);
        localStorage.removeItem('emailForSignIn');
        return result.user;
      } else {
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
    return auth.currentUser;
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  },

  /**
   * Check if current URL is a sign-in link
   */
  isSignInWithEmailLink(url: string): boolean {
    return isSignInWithEmailLink(auth, url);
  }
};