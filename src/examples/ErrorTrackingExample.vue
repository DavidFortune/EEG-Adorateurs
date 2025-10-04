<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Exemple - Suivi des erreurs</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h1>Exemples d'utilisation du suivi des erreurs</h1>

      <!-- Error Dashboard -->
      <ErrorDashboard />

      <!-- Example Actions -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Actions de test</ion-card-title>
          <ion-card-subtitle>Testez le suivi des erreurs</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <div class="button-group">
            <ion-button expand="block" @click="simulateNetworkError">
              Simuler erreur réseau
            </ion-button>

            <ion-button expand="block" @click="simulateValidationError">
              Simuler erreur validation
            </ion-button>

            <ion-button expand="block" @click="simulateAuthError">
              Simuler erreur authentification
            </ion-button>

            <ion-button expand="block" @click="simulateFirestoreError">
              Simuler erreur Firestore
            </ion-button>

            <ion-button expand="block" @click="testAutoRecovery">
              Test récupération automatique
            </ion-button>

            <ion-button expand="block" @click="testWithRetry" color="success">
              Test avec réessais
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Code Examples -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Exemples de code</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <pre class="code-block">{{ codeExample1 }}</pre>
          <pre class="code-block">{{ codeExample2 }}</pre>
          <pre class="code-block">{{ codeExample3 }}</pre>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton
} from '@ionic/vue';
import { useErrorTracking } from '@/composables/useErrorTracking';
import { ErrorCategory, ErrorSeverity } from '@/types/error';
import ErrorDashboard from '@/components/ErrorDashboard.vue';

const { handleError, withErrorHandling } = useErrorTracking();

// Simulate different types of errors
const simulateNetworkError = async () => {
  const error = new Error('Network timeout: Failed to fetch data from server');
  await handleError(error, { endpoint: '/api/users' }, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM);
};

const simulateValidationError = async () => {
  const error = new Error('Validation failed: Email format is invalid');
  await handleError(error, { field: 'email', value: 'invalid' }, ErrorCategory.VALIDATION, ErrorSeverity.LOW);
};

const simulateAuthError = async () => {
  const error = new Error('Authentication failed: Invalid credentials');
  await handleError(error, { attemptedAction: 'login' }, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH);
};

const simulateFirestoreError = async () => {
  const error = new Error('Firestore: Permission denied');
  await handleError(error, { collection: 'users', operation: 'read' }, ErrorCategory.FIRESTORE, ErrorSeverity.HIGH);
};

// Test auto-recovery
const testAutoRecovery = async () => {
  try {
    throw new Error('Test error that will be recovered');
  } catch (error) {
    const { trackedError } = await handleError(
      error,
      { test: true },
      ErrorCategory.NETWORK,
      ErrorSeverity.LOW
    );

    // Simulate successful recovery
    setTimeout(() => {
      // In real scenario, you'd mark as recovered after successful retry
      console.log('Error recovered:', trackedError.id);
    }, 1000);
  }
};

// Test with automatic retry
const testWithRetry = async () => {
  let attempts = 0;

  const result = await withErrorHandling(
    async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return { success: true, attempts };
    },
    {
      context: { operation: 'test_retry' },
      category: ErrorCategory.NETWORK,
      retry: true,
      maxRetries: 3,
      retryDelay: 500,
      showToast: true
    }
  );

  if (result) {
    console.log('Success after retries:', result);
  }
};

// Code examples for documentation
const codeExample1 = `// Example 1: Basic error handling
import { useErrorTracking } from '@/composables/useErrorTracking';

const { handleError } = useErrorTracking();

try {
  await saveData(data);
} catch (error) {
  await handleError(
    error,
    { userId: user.id, action: 'save_data' },
    ErrorCategory.FIRESTORE
  );
}`;

const codeExample2 = `// Example 2: With automatic retry
const { withErrorHandling } = useErrorTracking();

const result = await withErrorHandling(
  async () => {
    return await fetchUserData(userId);
  },
  {
    context: { userId },
    category: ErrorCategory.NETWORK,
    retry: true,
    maxRetries: 3,
    retryDelay: 1000
  }
);`;

const codeExample3 = `// Example 3: Custom error recovery
const { handleError } = useErrorTracking();

try {
  await performAction();
} catch (error) {
  const { trackedError, recovery } = await handleError(error);

  if (recovery.retry) {
    // Implement custom retry logic
    setTimeout(() => performAction(), recovery.retryDelay);
  }
}`;
</script>

<style scoped>
h1 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #111827;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.code-block {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}
</style>
