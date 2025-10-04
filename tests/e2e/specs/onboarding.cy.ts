describe('Successful Onboarding Flow', () => {
  beforeEach(() => {
    // Clear app data before each test
    cy.clearAppData();

    // Mock Firebase authentication with test user
    cy.mockFirebaseAuth();
  });

  it('should complete onboarding successfully with all steps', () => {
    // Visit the onboarding welcome page
    cy.visit('/onboarding/welcome');
    cy.waitForIonic();

    // Step 1: Welcome Page
    cy.contains('Organisez vos services').should('be.visible');
    cy.contains('button', 'Commencer').should('be.visible').click();

    // Step 2: Personal Info Page
    cy.url().should('include', '/onboarding/personal-info');
    cy.waitForIonic();
    cy.contains('Informations personnelles').should('be.visible');

    // Fill in the full name - Ionic input requires finding the native input
    cy.get('ion-input[placeholder*="complet"]').find('input').type('Jean Dupont');

    // Continue to next step
    cy.contains('button', 'Continuer').should('be.visible').click();

    // Step 3: Team Selection Page (optional)
    cy.url().should('include', '/onboarding/teams');
    cy.contains('Équipes').should('be.visible');

    // Skip team selection or select a team if available
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Passer")').length > 0) {
        cy.contains('button', 'Passer').click();
      } else if ($body.find('button:contains("Continuer")').length > 0) {
        cy.contains('button', 'Continuer').click();
      }
    });

    // Step 4: Phone Page (optional)
    cy.url().should('include', '/onboarding/phone');
    cy.waitForIonic();
    cy.contains('Téléphone').should('be.visible');

    // Fill in phone number
    cy.get('ion-input[type="tel"]').find('input').type('5141234567');

    // Continue to congratulations
    cy.contains('button', 'Continuer').should('be.visible').click();

    // Step 5: Congratulations Page
    cy.url().should('include', '/onboarding/congratulations');
    cy.contains('Félicitations').should('be.visible');
    cy.contains('Jean').should('be.visible');

    // Wait for data to be saved (button should be enabled)
    cy.contains('button', 'C\'est parti').should('not.be.disabled');

    // Complete onboarding
    cy.contains('button', 'C\'est parti').click();

    // Should navigate to home page
    cy.url().should('include', '/tabs/accueil');
    cy.contains('Accueil').should('be.visible');
  });

  it('should complete onboarding with minimal information', () => {
    // Visit the onboarding welcome page
    cy.visit('/onboarding/welcome');
    cy.waitForIonic();

    // Step 1: Welcome Page
    cy.contains('button', 'Commencer').should('be.visible').click();

    // Step 2: Personal Info Page - minimum required info
    cy.url().should('include', '/onboarding/personal-info');
    cy.waitForIonic();
    cy.get('ion-input[placeholder*="complet"]').find('input').type('Marie Martin');
    cy.contains('button', 'Continuer').should('be.visible').click();

    // Step 3: Skip team selection
    cy.url().should('include', '/onboarding/teams');
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Passer")').length > 0) {
        cy.contains('button', 'Passer').click();
      } else if ($body.find('button:contains("Continuer")').length > 0) {
        cy.contains('button', 'Continuer').click();
      }
    });

    // Step 4: Skip phone
    cy.url().should('include', '/onboarding/phone');
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Passer")').length > 0) {
        cy.contains('button', 'Passer').click();
      }
    });

    // Step 5: Complete onboarding
    cy.url().should('include', '/onboarding/congratulations');
    cy.contains('Marie').should('be.visible');
    cy.contains('button', 'C\'est parti').should('not.be.disabled');
    cy.contains('button', 'C\'est parti').click();

    // Verify navigation to home
    cy.url().should('include', '/tabs/accueil');
  });

  it('should validate required fields in personal info', () => {
    cy.visit('/onboarding/personal-info');
    cy.waitForIonic();

    // Try to continue without filling name
    cy.contains('button', 'Continuer').should('be.visible').click();

    // Should stay on the same page or show validation
    cy.url().should('include', '/onboarding/personal-info');

    // Fill in name and continue should work
    cy.get('ion-input[placeholder*="complet"]').find('input').type('Test User');
    cy.contains('button', 'Continuer').should('be.visible').click();

    // Should navigate away from personal info page
    cy.url().should('not.include', '/onboarding/personal-info');
  });

  it('should allow navigation back through onboarding steps', () => {
    cy.visit('/onboarding/personal-info');
    cy.waitForIonic();

    // Fill in personal info
    cy.get('ion-input[placeholder*="complet"]').find('input').type('Pierre Durand');
    cy.contains('button', 'Continuer').should('be.visible').click();

    // On teams page
    cy.url().should('include', '/onboarding/teams');
    cy.waitForIonic();

    // Go back
    cy.get('ion-back-button').click();

    // Should be back on personal info
    cy.url().should('include', '/onboarding/personal-info');
    cy.waitForIonic();

    // Name should still be filled
    cy.get('ion-input[placeholder*="complet"]').find('input').should('have.value', 'Pierre Durand');
  });

  it('should handle phone number formatting', () => {
    cy.visit('/onboarding/phone');
    cy.waitForIonic();

    // Enter phone number
    cy.get('ion-input[type="tel"]').find('input').type('5145551234');

    // Phone number should be present
    cy.get('ion-input[type="tel"]').find('input').should('have.value', '5145551234');

    // Continue should work
    cy.contains('button', 'Continuer').should('be.visible').click();
    cy.url().should('include', '/onboarding/congratulations');
  });

  it('should show encouragement message on congratulations page', () => {
    cy.visit('/onboarding/congratulations');

    // Should show encouragement
    cy.contains('Parole d\'encouragement').should('be.visible');
    cy.contains('Colossiens').should('be.visible');

    // Should show celebration emoji
    cy.get('.celebration-emoji').should('be.visible');
  });

  it('should allow selecting and deselecting teams', () => {
    cy.visit('/onboarding/teams');
    cy.waitForIonic();

    // Wait for teams to load
    cy.get('.teams-container', { timeout: 10000 }).should('be.visible');

    // Check if there are teams available
    cy.get('body').then(($body) => {
      if ($body.find('.team-card').length > 0) {
        // Select first team
        cy.get('.team-card').first().click();
        cy.get('.team-card').first().should('have.class', 'selected');
        cy.get('.team-card').first().find('.check-icon').should('be.visible');

        // Button should show count
        cy.contains('button', '1 équipe').should('be.visible');

        // Deselect the team
        cy.get('.team-card').first().click();
        cy.get('.team-card').first().should('not.have.class', 'selected');

        // Button should show skip option
        cy.contains('button', 'Ignorer cette étape').should('be.visible');

        // Select multiple teams if available
        if ($body.find('.team-card').length > 1) {
          cy.get('.team-card').first().click();
          cy.get('.team-card').eq(1).click();
          cy.contains('button', '2 équipes').should('be.visible');
        }
      } else {
        // No teams available
        cy.contains('Aucune équipe disponible').should('be.visible');
      }
    });
  });

  it('should validate name with special characters and edge cases', () => {
    cy.visit('/onboarding/personal-info');
    cy.waitForIonic();

    // Test with special characters (French accents)
    cy.get('ion-input[placeholder*="complet"]').find('input').clear().type('François Côté');
    cy.contains('button', 'Continuer').should('not.be.disabled');

    // Test with hyphenated name
    cy.get('ion-input[placeholder*="complet"]').find('input').clear().type('Marie-Claire Dubois');
    cy.contains('button', 'Continuer').should('not.be.disabled');

    // Test with single character (should be invalid)
    cy.get('ion-input[placeholder*="complet"]').find('input').clear().type('A');
    cy.contains('button', 'Continuer').should('be.disabled');

    // Test with numbers only (should be invalid)
    cy.get('ion-input[placeholder*="complet"]').find('input').clear().type('12345');
    cy.contains('button', 'Continuer').should('be.disabled');

    // Test with very long name
    cy.get('ion-input[placeholder*="complet"]').find('input').clear().type('Jean-Philippe Alexandre Emmanuel Rodriguez Martinez');
    cy.contains('button', 'Continuer').should('not.be.disabled');

    // Test with empty spaces only (should be invalid)
    cy.get('ion-input[placeholder*="complet"]').find('input').clear().type('   ');
    cy.contains('button', 'Continuer').should('be.disabled');
  });

  it('should update progress bar as user moves through steps', () => {
    cy.visit('/onboarding/welcome');
    cy.waitForIonic();

    // Welcome page - no progress bar (or 0%)
    cy.contains('button', 'Commencer').click();

    // Personal info page - should have progress bar
    cy.url().should('include', '/onboarding/personal-info');
    cy.waitForIonic();
    cy.get('ion-progress-bar').should('exist');

    // Fill in name and continue
    cy.get('ion-input[placeholder*="complet"]').find('input').type('Progress Test');
    cy.contains('button', 'Continuer').click();

    // Teams page - progress should update
    cy.url().should('include', '/onboarding/teams');
    cy.waitForIonic();
    cy.get('ion-progress-bar').should('exist');

    // Skip teams
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Continuer")').length > 0) {
        cy.contains('button', 'Continuer').click();
      }
    });

    // Phone page - progress should be higher
    cy.url().should('include', '/onboarding/phone');
    cy.waitForIonic();
    cy.get('ion-progress-bar').should('exist');
  });

  it('should preserve form data when navigating back and forth', () => {
    const testName = 'Data Persistence Test';
    const testPhone = '5149876543';

    cy.visit('/onboarding/welcome');
    cy.waitForIonic();
    cy.contains('button', 'Commencer').click();

    // Fill personal info
    cy.url().should('include', '/onboarding/personal-info');
    cy.waitForIonic();
    cy.get('ion-input[placeholder*="complet"]').find('input').type(testName);
    cy.contains('button', 'Continuer').click();

    // Skip teams
    cy.url().should('include', '/onboarding/teams');
    cy.waitForIonic();
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Continuer")').length > 0) {
        cy.contains('button', 'Continuer').click();
      }
    });

    // Fill phone
    cy.url().should('include', '/onboarding/phone');
    cy.waitForIonic();
    cy.get('ion-input[type="tel"]').find('input').type(testPhone);

    // Go back to personal info
    cy.get('ion-button.back-button').click();
    cy.url().should('include', '/onboarding/teams');
    cy.waitForIonic();

    cy.get('ion-button.back-button').click();
    cy.url().should('include', '/onboarding/personal-info');
    cy.waitForIonic();

    // Name should still be filled
    cy.get('ion-input[placeholder*="complet"]').find('input').should('have.value', testName);

    // Navigate forward again
    cy.contains('button', 'Continuer').click();
    cy.url().should('include', '/onboarding/teams');
    cy.waitForIonic();

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Continuer")').length > 0) {
        cy.contains('button', 'Continuer').click();
      }
    });

    // Phone should still be filled
    cy.url().should('include', '/onboarding/phone');
    cy.waitForIonic();
    cy.get('ion-input[type="tel"]').find('input').should('have.value', testPhone);
  });

  it('should display user first name on congratulations page', () => {
    cy.visit('/onboarding/welcome');
    cy.waitForIonic();
    cy.contains('button', 'Commencer').click();

    // Fill in full name
    cy.url().should('include', '/onboarding/personal-info');
    cy.waitForIonic();
    cy.get('ion-input[placeholder*="complet"]').find('input').type('Sophie Tremblay');
    cy.contains('button', 'Continuer').click();

    // Skip teams
    cy.url().should('include', '/onboarding/teams');
    cy.waitForIonic();
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Continuer")').length > 0) {
        cy.contains('button', 'Continuer').click();
      }
    });

    // Skip phone
    cy.url().should('include', '/onboarding/phone');
    cy.waitForIonic();
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Passer")').length > 0) {
        cy.contains('button', 'Passer').click();
      } else {
        cy.contains('button', 'Continuer').click();
      }
    });

    // Should show first name on congratulations
    cy.url().should('include', '/onboarding/congratulations');
    cy.contains('Sophie').should('be.visible');
    cy.contains('Félicitations Sophie').should('be.visible');
  });

  it('should handle empty team list gracefully', () => {
    cy.visit('/onboarding/teams');
    cy.waitForIonic();

    // Wait for loading to complete
    cy.get('.teams-container', { timeout: 10000 }).should('be.visible');

    // Should either show teams or empty state
    cy.get('body').then(($body) => {
      if ($body.find('.team-card').length === 0) {
        cy.contains('Aucune équipe disponible').should('be.visible');
        cy.contains('button', 'Ignorer cette étape').should('be.visible');
      }
    });

    // Continue button should always be enabled
    cy.contains('button', /Continuer|Ignorer/).should('be.visible').should('not.be.disabled');
  });

  it('should not allow submission with whitespace-only name', () => {
    cy.visit('/onboarding/personal-info');
    cy.waitForIonic();

    // Type only spaces
    cy.get('ion-input[placeholder*="complet"]').find('input').type('     ');

    // Button should be disabled
    cy.contains('button', 'Continuer').should('be.disabled');

    // Clear and type valid name with spaces around it
    cy.get('ion-input[placeholder*="complet"]').find('input').clear().type('  Valid Name  ');

    // Button should be enabled (name will be trimmed)
    cy.contains('button', 'Continuer').should('not.be.disabled');
  });

  it('should validate phone number with various formats', () => {
    cy.visit('/onboarding/phone');
    cy.waitForIonic();

    // Test with dashes
    cy.get('ion-input[type="tel"]').find('input').type('514-123-4567');
    cy.get('ion-input[type="tel"]').find('input').should('not.be.empty');

    // Test with parentheses
    cy.get('ion-input[type="tel"]').find('input').clear().type('(514) 123-4567');
    cy.get('ion-input[type="tel"]').find('input').should('not.be.empty');

    // Test with spaces
    cy.get('ion-input[type="tel"]').find('input').clear().type('514 123 4567');
    cy.get('ion-input[type="tel"]').find('input').should('not.be.empty');

    // Test with numbers only
    cy.get('ion-input[type="tel"]').find('input').clear().type('5141234567');
    cy.get('ion-input[type="tel"]').find('input').should('not.be.empty');

    // Continue should work
    cy.contains('button', 'Continuer').should('be.visible').should('not.be.disabled');
  });

  it('should skip phone step when requested', () => {
    cy.visit('/onboarding/phone');
    cy.waitForIonic();

    // Check if skip button is available
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Passer")').length > 0) {
        cy.contains('button', 'Passer').click();
        cy.url().should('include', '/onboarding/congratulations');
      }
    });
  });

  it('should show correct button text on teams page based on selection', () => {
    cy.visit('/onboarding/teams');
    cy.waitForIonic();

    // Wait for teams to load
    cy.get('.teams-container', { timeout: 10000 }).should('be.visible');

    // Initially should show skip option if no teams selected
    cy.contains('button', /Continuer|Ignorer/).should('be.visible');

    // Check if there are teams to select
    cy.get('body').then(($body) => {
      if ($body.find('.team-card').length > 0) {
        // Select a team
        cy.get('.team-card').first().click();

        // Button text should change to show count
        cy.contains('button', '1 équipe').should('be.visible');

        // Select another team if available
        if ($body.find('.team-card').length > 1) {
          cy.get('.team-card').eq(1).click();
          cy.contains('button', '2 équipes').should('be.visible');

          // Deselect one
          cy.get('.team-card').first().click();
          cy.contains('button', '1 équipe').should('be.visible');

          // Deselect all
          cy.get('.team-card').eq(1).click();
          cy.contains('button', 'Ignorer cette étape').should('be.visible');
        }
      }
    });
  });

  it('should complete full onboarding flow without skipping', () => {
    cy.clearAppData();
    cy.mockFirebaseAuth();
    cy.visit('/onboarding/welcome');
    cy.waitForIonic();

    // Welcome
    cy.contains('button', 'Commencer').click();

    // Personal Info
    cy.url().should('include', '/onboarding/personal-info');
    cy.waitForIonic();
    cy.get('ion-input[placeholder*="complet"]').find('input').type('Complete Flow User');
    cy.contains('button', 'Continuer').click();

    // Teams
    cy.url().should('include', '/onboarding/teams');
    cy.waitForIonic();
    cy.get('.teams-container', { timeout: 10000 }).should('be.visible');

    // Select a team if available
    cy.get('body').then(($body) => {
      if ($body.find('.team-card').length > 0) {
        cy.get('.team-card').first().click();
      }
      cy.contains('button', /Continuer/).click();
    });

    // Phone
    cy.url().should('include', '/onboarding/phone');
    cy.waitForIonic();
    cy.get('ion-input[type="tel"]').find('input').type('5145551234');
    cy.contains('button', 'Continuer').click();

    // Congratulations
    cy.url().should('include', '/onboarding/congratulations');
    cy.contains('Complete').should('be.visible');
    cy.contains('button', 'C\'est parti').should('not.be.disabled').click();

    // Should navigate to home
    cy.url().should('include', '/tabs/accueil');
  });
});
