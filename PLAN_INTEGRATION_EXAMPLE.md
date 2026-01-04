# Error Tracking Integration Example

This document shows how to integrate error tracking into existing services and components.

## Example: Firestore Service Integration

### Before (without error tracking)

```typescript
// members.ts - Original version
export const membersService = {
  async getMemberById(memberId: string): Promise<Member | null> {
    try {
      const memberDoc = await getDoc(doc(db, MEMBERS_COLLECTION, memberId));

      if (!memberDoc.exists()) {
        return null;
      }

      return {
        id: memberDoc.id,
        ...convertFirestoreToMember(memberDoc.data() as FirestoreMember)
      };
    } catch (error) {
      console.error('Error getting member:', error);
      throw error;
    }
  }
}
```

### After (with error tracking)

```typescript
// members.ts - With error tracking
import { errorTrackingService } from '@/services/errorTrackingService';
import { ErrorCategory, ErrorSeverity } from '@/types/error';

export const membersService = {
  async getMemberById(memberId: string): Promise<Member | null> {
    try {
      const memberDoc = await getDoc(doc(db, MEMBERS_COLLECTION, memberId));

      if (!memberDoc.exists()) {
        return null;
      }

      return {
        id: memberDoc.id,
        ...convertFirestoreToMember(memberDoc.data() as FirestoreMember)
      };
    } catch (error) {
      // Track the error with context
      errorTrackingService.trackError(
        error,
        {
          memberId,
          operation: 'getMemberById',
          collection: MEMBERS_COLLECTION
        },
        ErrorCategory.FIRESTORE,
        ErrorSeverity.MEDIUM
      );

      throw error;
    }
  },

  async updateMember(memberId: string, updates: Partial<Member>): Promise<void> {
    try {
      const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
      const firestoreUpdates = convertMemberToFirestore(updates as Omit<Member, 'id'>);

      await updateDoc(memberRef, {
        ...firestoreUpdates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      errorTrackingService.trackError(
        error,
        {
          memberId,
          operation: 'updateMember',
          updatedFields: Object.keys(updates)
        },
        ErrorCategory.FIRESTORE,
        ErrorSeverity.HIGH // Higher severity for write operations
      );

      throw error;
    }
  }
}
```

## Example: Component Integration

### Before (without error tracking)

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { membersService } from '@/firebase/members';

const members = ref([]);
const loading = ref(false);

const loadMembers = async () => {
  loading.value = true;
  try {
    members.value = await membersService.getAllMembers();
  } catch (error) {
    console.error('Failed to load members:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadMembers();
});
</script>
```

### After (with error tracking and auto-retry)

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { membersService } from '@/firebase/members';
import { useErrorTracking } from '@/composables/useErrorTracking';
import { ErrorCategory } from '@/types/error';

const members = ref([]);
const loading = ref(false);
const { withErrorHandling } = useErrorTracking();

const loadMembers = async () => {
  loading.value = true;

  const result = await withErrorHandling(
    async () => {
      return await membersService.getAllMembers();
    },
    {
      context: {
        component: 'MembersList',
        action: 'loadMembers'
      },
      category: ErrorCategory.FIRESTORE,
      retry: true,
      maxRetries: 2,
      retryDelay: 1000,
      showToast: true,
      onError: () => {
        // Optional: Set empty state or show custom UI
        members.value = [];
      }
    }
  );

  if (result) {
    members.value = result;
  }

  loading.value = false;
};

onMounted(() => {
  loadMembers();
});
</script>
```

## Example: Form Validation with Error Tracking

### Before

```vue
<script setup lang="ts">
const email = ref('');
const error = ref('');

const validateEmail = () => {
  if (!email.value.includes('@')) {
    error.value = 'Email invalide';
    return false;
  }
  error.value = '';
  return true;
};

const handleSubmit = async () => {
  if (!validateEmail()) {
    return;
  }

  try {
    await submitForm(email.value);
  } catch (err) {
    error.value = 'Erreur lors de la soumission';
  }
};
</script>
```

### After

```vue
<script setup lang="ts">
import { useErrorTracking } from '@/composables/useErrorTracking';
import { ErrorCategory, ErrorSeverity } from '@/types/error';

const email = ref('');
const error = ref('');
const { handleError, withErrorHandling } = useErrorTracking();

const validateEmail = () => {
  if (!email.value.includes('@')) {
    error.value = 'Email invalide';

    // Track validation error
    handleError(
      new Error('Invalid email format'),
      {
        field: 'email',
        value: email.value,
        form: 'contactForm'
      },
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      false // Don't show toast for validation errors
    );

    return false;
  }
  error.value = '';
  return true;
};

const handleSubmit = async () => {
  if (!validateEmail()) {
    return;
  }

  const result = await withErrorHandling(
    async () => {
      return await submitForm(email.value);
    },
    {
      context: {
        email: email.value,
        form: 'contactForm'
      },
      category: ErrorCategory.NETWORK,
      retry: true,
      maxRetries: 2,
      onError: (err) => {
        error.value = 'Erreur lors de la soumission';
      }
    }
  );

  if (result) {
    // Success handling
    email.value = '';
    error.value = '';
  }
};
</script>
```

## Example: Network Request with Custom Recovery

```typescript
import { errorTrackingService } from '@/services/errorTrackingService';
import { ErrorCategory } from '@/types/error';

async function fetchWithRecovery(url: string, options?: RequestInit) {
  let retries = 0;
  const maxRetries = 3;
  let lastError: any;

  while (retries <= maxRetries) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Success - mark as recovered if this was a retry
      if (retries > 0 && lastError) {
        errorTrackingService.markAsRecovered(
          lastError.id,
          `retry_success_attempt_${retries}`
        );
      }

      return await response.json();
    } catch (error) {
      lastError = errorTrackingService.trackError(
        error,
        {
          url,
          method: options?.method || 'GET',
          attempt: retries + 1,
          maxRetries
        },
        ErrorCategory.NETWORK
      );

      retries++;

      if (retries > maxRetries) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, 1000 * Math.pow(2, retries - 1))
      );
    }
  }
}

// Usage
try {
  const data = await fetchWithRecovery('https://api.example.com/data');
  console.log(data);
} catch (error) {
  console.error('Failed after retries:', error);
}
```

## Example: Authentication Service Integration

```typescript
import { errorTrackingService } from '@/services/errorTrackingService';
import { ErrorCategory, ErrorSeverity } from '@/types/error';

class AuthService {
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Set user ID for error tracking
      errorTrackingService.setUserId(userCredential.user.uid);

      return userCredential.user;
    } catch (error: any) {
      // Track auth error with specific severity based on error code
      const severity = this.getAuthErrorSeverity(error.code);

      errorTrackingService.trackError(
        error,
        {
          email,
          errorCode: error.code,
          operation: 'signIn'
        },
        ErrorCategory.AUTHENTICATION,
        severity
      );

      throw error;
    }
  }

  private getAuthErrorSeverity(errorCode: string): ErrorSeverity {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return ErrorSeverity.MEDIUM;

      case 'auth/too-many-requests':
      case 'auth/user-disabled':
        return ErrorSeverity.HIGH;

      case 'auth/network-request-failed':
        return ErrorSeverity.LOW;

      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  async signOut() {
    try {
      await signOut(auth);

      // Clear error tracking on sign out
      errorTrackingService.clearErrors();
    } catch (error) {
      errorTrackingService.trackError(
        error,
        { operation: 'signOut' },
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.LOW
      );

      throw error;
    }
  }
}
```

## Summary

### Key Integration Points

1. **Services**: Add error tracking to all service methods
2. **Components**: Use `withErrorHandling` for async operations
3. **Forms**: Track validation errors separately
4. **Network**: Implement retry logic with error tracking
5. **Auth**: Track authentication events and set user ID

### Benefits

- ✅ Centralized error tracking across the application
- ✅ Automatic categorization and severity classification
- ✅ Built-in retry logic for transient failures
- ✅ User-friendly error messages
- ✅ Analytics integration for monitoring
- ✅ Error rate metrics and recovery tracking
- ✅ Easy debugging with error context and history
