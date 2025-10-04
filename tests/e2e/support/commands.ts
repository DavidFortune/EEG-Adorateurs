/// <reference types="cypress" />

/**
 * Custom Cypress Commands for EEG Adorateurs
 */

/**
 * Mock Firebase authentication with a test user
 */
Cypress.Commands.add('mockFirebaseAuth', (user?: Partial<FirebaseUser>) => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: null,
    photoURL: null,
    ...user
  };

  // Set the mock user on the window object for auth service to use
  cy.on('window:before:load', (win) => {
    (win as any).CYPRESS_MOCK_USER = mockUser;
  });
});

/**
 * Complete the onboarding flow with provided data
 */
Cypress.Commands.add('completeOnboarding', (options = {}) => {
  const {
    fullName = 'Test User',
    phone = '5141234567',
    skipTeams = true,
    skipPhone = false
  } = options;

  // Navigate to onboarding
  cy.visit('/onboarding/welcome');
  cy.waitForIonic();

  // Welcome page
  cy.contains('button', 'Commencer').should('be.visible').click();

  // Personal info
  cy.waitForIonic();
  cy.get('ion-input[placeholder*="complet"]').find('input').type(fullName);
  cy.contains('button', 'Continuer').should('be.visible').click();

  // Teams (optional)
  if (skipTeams) {
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Passer")').length > 0) {
        cy.contains('button', 'Passer').click();
      } else if ($body.find('button:contains("Continuer")').length > 0) {
        cy.contains('button', 'Continuer').click();
      }
    });
  }

  // Phone (optional)
  if (!skipPhone && phone) {
    cy.get('ion-input[type="tel"]').find('input').type(phone);
  }

  if (skipPhone) {
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Passer")').length > 0) {
        cy.contains('button', 'Passer').click();
      } else {
        cy.contains('button', 'Continuer').click();
      }
    });
  } else {
    cy.contains('button', 'Continuer').click();
  }

  // Congratulations
  cy.url().should('include', '/onboarding/congratulations');
  cy.contains('button', 'C\'est parti').should('not.be.disabled');
  cy.contains('button', 'C\'est parti').click();

  // Should be on home page
  cy.url().should('include', '/tabs/accueil');
});

/**
 * Wait for Ionic components to be ready
 */
Cypress.Commands.add('waitForIonic', () => {
  cy.window().should('have.property', 'Ionic');
});

/**
 * Clear all app data (localStorage, indexedDB, cookies)
 */
Cypress.Commands.add('clearAppData', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.indexedDB.databases().then((databases) => {
      databases.forEach((db) => {
        if (db.name) {
          win.indexedDB.deleteDatabase(db.name);
        }
      });
    });
  });
});

// TypeScript type definitions
interface FirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}

interface OnboardingOptions {
  fullName?: string;
  phone?: string;
  skipTeams?: boolean;
  skipPhone?: boolean;
}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Mock Firebase authentication with a test user
       * @param user - Partial Firebase user object to override defaults
       * @example cy.mockFirebaseAuth({ email: 'custom@example.com' })
       */
      mockFirebaseAuth(user?: Partial<FirebaseUser>): Chainable<void>;

      /**
       * Complete the onboarding flow with provided data
       * @param options - Onboarding options
       * @example cy.completeOnboarding({ fullName: 'Jean Dupont', phone: '5141234567' })
       */
      completeOnboarding(options?: OnboardingOptions): Chainable<void>;

      /**
       * Wait for Ionic framework to be ready
       * @example cy.waitForIonic()
       */
      waitForIonic(): Chainable<void>;

      /**
       * Clear all app data including localStorage, cookies, and indexedDB
       * @example cy.clearAppData()
       */
      clearAppData(): Chainable<void>;
    }
  }
}

export {};
