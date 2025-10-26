# End-to-End Tests

This directory contains Cypress end-to-end tests for the EEG Adorateurs application.

## Prerequisites

- Node.js installed
- Application dependencies installed (`npm install`)
- Development server running (`npm run dev`)

## Running Tests

### Interactive Mode (Cypress GUI)
```bash
npm run test:e2e
```

This opens the Cypress Test Runner where you can:
- Select and run individual tests
- Watch tests execute in real-time
- Debug tests with DevTools
- See detailed error messages and screenshots

### Headless Mode (CI/CD)
```bash
npx cypress run
```

This runs all tests in headless mode and outputs results to the console. Useful for:
- Continuous Integration pipelines
- Automated testing
- Quick validation before commits

## Test Structure

```
tests/e2e/
├── fixtures/          # Test data and mock data
│   └── users.json    # Mock user data for authentication
├── specs/            # Test specification files
│   ├── onboarding.cy.ts  # Onboarding flow tests
│   └── test.cy.ts        # Example test
└── support/          # Helper functions and custom commands
    ├── commands.ts   # Custom Cypress commands
    └── e2e.ts       # Global configuration
```

## Available Tests

### Onboarding Tests (`onboarding.cy.ts`)

#### 1. Complete Onboarding with All Steps
Tests the full onboarding flow including:
- Welcome page
- Personal information (full name)
- Team selection
- Phone number
- Congratulations page
- Navigation to home page

#### 2. Minimal Onboarding
Tests completing onboarding with only required information:
- Full name only
- Skipping optional steps (teams, phone)

#### 3. Field Validation
Tests that required fields are properly validated:
- Cannot proceed without filling required fields
- Validation errors are shown

#### 4. Navigation Between Steps
Tests that users can navigate backward:
- Back button functionality
- Data persistence when navigating back

#### 5. Phone Number Formatting
Tests phone number input handling:
- Accepts numeric input
- Validates phone format

#### 6. Congratulations Page Content
Tests final congratulations page:
- Shows user's first name
- Displays encouragement message
- Shows celebration emoji

## Custom Cypress Commands

### `cy.mockFirebaseAuth(user?)`
Mock Firebase authentication for testing authenticated routes.

```typescript
// Use default test user
cy.mockFirebaseAuth();

// Use custom user data
cy.mockFirebaseAuth({
  email: 'custom@example.com',
  uid: 'custom-user-id'
});
```

### `cy.completeOnboarding(options?)`
Automatically complete the entire onboarding flow.

```typescript
// Complete with defaults
cy.completeOnboarding();

// Complete with custom data
cy.completeOnboarding({
  fullName: 'Jean Dupont',
  phone: '5141234567',
  skipTeams: true,
  skipPhone: false
});
```

### `cy.waitForIonic()`
Wait for Ionic framework to be fully loaded.

```typescript
cy.visit('/');
cy.waitForIonic();
```

### `cy.clearAppData()`
Clear all application data including localStorage, cookies, and IndexedDB.

```typescript
beforeEach(() => {
  cy.clearAppData();
});
```

## Test Fixtures

### users.json
Contains mock user data for authentication testing:
- `testUser`: Standard authenticated user
- `onboardingUser`: User going through onboarding
- `memberData`: Complete member information
- `minimalMemberData`: Minimal required information

Usage:
```typescript
cy.fixture('users').then((users) => {
  cy.mockFirebaseAuth(users.testUser);
});
```

## Best Practices

### 1. Clean State
Always start tests with a clean state:
```typescript
beforeEach(() => {
  cy.clearAppData();
  cy.mockFirebaseAuth();
});
```

### 2. Use Custom Commands
Leverage custom commands for common operations:
```typescript
// ✅ Good
cy.completeOnboarding({ fullName: 'Test User' });

// ❌ Avoid repetition
cy.visit('/onboarding/welcome');
cy.contains('button', 'Commencer').click();
// ... many more steps
```

### 3. Wait for Elements
Always wait for elements to be visible before interacting:
```typescript
cy.contains('button', 'Continuer').should('be.visible').click();
```

### 4. Use Data Attributes
For critical UI elements, consider adding `data-cy` attributes:
```html
<ion-button data-cy="continue-button">Continuer</ion-button>
```

```typescript
cy.get('[data-cy="continue-button"]').click();
```

## Debugging Tests

### 1. Interactive Mode
Use Cypress Test Runner for best debugging experience:
- See each command as it executes
- Inspect DOM at any point
- Use browser DevTools
- Take screenshots

### 2. Screenshots
Failed tests automatically capture screenshots saved to:
```
tests/e2e/screenshots/
```

### 3. Videos
Test runs record videos saved to:
```
tests/e2e/videos/
```

### 4. Console Logs
Use `cy.log()` to add custom logging:
```typescript
cy.log('Starting onboarding flow');
cy.visit('/onboarding/welcome');
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Run Cypress tests
        run: |
          npm run dev &
          npx wait-on http://localhost:5173
          npx cypress run
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: cypress-screenshots
          path: tests/e2e/screenshots
```

## Troubleshooting

### Tests timeout
Increase timeout in `cypress.config.ts`:
```typescript
export default defineConfig({
  e2e: {
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000
  }
});
```

### Elements not found
- Ensure dev server is running
- Check for correct selectors
- Wait for Ionic components to load

### Authentication issues
- Verify Firebase mock is correctly set up
- Check localStorage has auth data
- Ensure routes require auth properly

## Writing New Tests

1. Create a new spec file in `tests/e2e/specs/`
2. Import fixtures if needed
3. Set up beforeEach hooks for clean state
4. Write descriptive test names
5. Use custom commands for common operations
6. Add assertions to verify expected behavior

Example:
```typescript
describe('New Feature', () => {
  beforeEach(() => {
    cy.clearAppData();
    cy.mockFirebaseAuth();
  });

  it('should do something specific', () => {
    cy.visit('/new-feature');
    cy.contains('Expected Text').should('be.visible');
    // More test code...
  });
});
```

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Ionic Testing Guide](https://ionicframework.com/docs/angular/testing)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
