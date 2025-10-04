# Error Tracking and Monitoring

This document explains the error tracking and categorization system implemented in the EEG Adorateurs application.

## Overview

The error tracking system provides:

- **Automatic error categorization** by type (network, auth, validation, etc.)
- **Error severity classification** (low, medium, high, critical)
- **Error rate metrics** and monitoring
- **Automatic recovery strategies** with retry logic
- **Integration with Firebase Analytics** for centralized tracking
- **User-friendly error notifications**

## Architecture

### Core Components

1. **Error Types** (`src/types/error.ts`)
   - Defines error categories, severity levels, and interfaces
   - `ErrorCategory`: Network, Authentication, Authorization, Validation, Firestore, Storage, Performance, UI, Unknown
   - `ErrorSeverity`: Low, Medium, High, Critical

2. **Error Tracking Service** (`src/services/errorTrackingService.ts`)
   - Central service for tracking and categorizing errors
   - Maintains error history and frequency metrics
   - Provides recovery strategies based on error type
   - Integrates with analytics service

3. **Error Tracking Composable** (`src/composables/useErrorTracking.ts`)
   - Vue composable for easy error handling in components
   - Provides `handleError()` and `withErrorHandling()` utilities
   - Automatic retry logic and user notifications

4. **Global Error Handler** (`src/App.vue`)
   - Catches unhandled errors and promise rejections
   - Automatically tracks all application errors
   - Shows user-friendly messages for critical errors

5. **Error Dashboard** (`src/components/ErrorDashboard.vue`)
   - Visual dashboard for monitoring errors
   - Shows error rates, categories, and severity
   - Displays most frequent and recent errors
   - Export and clear functionality

## Usage

### Basic Error Handling

```typescript
import { useErrorTracking } from '@/composables/useErrorTracking';

const { handleError } = useErrorTracking();

try {
  await someOperation();
} catch (error) {
  await handleError(
    error,
    { userId: user.id, action: 'operation_name' },
    ErrorCategory.FIRESTORE,
    ErrorSeverity.MEDIUM
  );
}
```

### With Automatic Retry

```typescript
const { withErrorHandling } = useErrorTracking();

const result = await withErrorHandling(
  async () => {
    return await fetchData();
  },
  {
    context: { endpoint: '/api/data' },
    category: ErrorCategory.NETWORK,
    retry: true,
    maxRetries: 3,
    retryDelay: 1000,
    showToast: true
  }
);
```

### Custom Error Recovery

```typescript
const { handleError } = useErrorTracking();

try {
  await criticalOperation();
} catch (error) {
  const { trackedError, recovery } = await handleError(error);

  if (recovery.retry) {
    // Implement custom retry logic
    for (let i = 0; i < recovery.maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, recovery.retryDelay));
      try {
        await criticalOperation();
        errorTrackingService.markAsRecovered(trackedError.id, 'manual_retry');
        break;
      } catch (retryError) {
        if (i === recovery.maxRetries - 1) throw retryError;
      }
    }
  }
}
```

## Error Categories

### Network Errors
- Connection timeouts
- Failed fetch requests
- Network unavailability
- **Recovery**: Automatic retry (3 attempts with 2s delay)

### Authentication Errors
- Invalid credentials
- Expired tokens
- Unauthorized access
- **Recovery**: Redirect to login page

### Authorization Errors
- Permission denied
- Forbidden actions
- Access denied
- **Recovery**: Show permission error, no retry

### Validation Errors
- Invalid form data
- Format errors
- Required field missing
- **Recovery**: Show validation message, no retry

### Firestore Errors
- Database read/write failures
- Permission errors
- Document not found
- **Recovery**: Retry (2 attempts with 1s delay)

### Storage Errors
- File upload failures
- Download errors
- Storage quota exceeded
- **Recovery**: Retry (2 attempts with 3s delay)

### Performance Errors
- Slow operations
- Timeouts
- Memory issues
- **Recovery**: Track and monitor, no retry

### UI Errors
- Render errors
- Component failures
- Type errors
- **Recovery**: Track and monitor, no retry

## Error Metrics

### Available Metrics

```typescript
import { errorTrackingService } from '@/services/errorTrackingService';

// Get comprehensive metrics
const metrics = errorTrackingService.getErrorMetrics();
console.log({
  totalErrors: metrics.totalErrors,
  errorRate: metrics.errorRate, // errors per minute
  errorsByCategory: metrics.errorsByCategory,
  errorsBySeverity: metrics.errorsBySeverity,
  mostFrequentErrors: metrics.mostFrequentErrors,
  recentErrors: metrics.recentErrors
});

// Get critical errors
const critical = errorTrackingService.getCriticalErrors();

// Get recovery rate (percentage)
const recoveryRate = errorTrackingService.getRecoveryRate();

// Get errors by category
const networkErrors = errorTrackingService.getErrorsByCategory(ErrorCategory.NETWORK);

// Get errors in time range
const recentErrors = errorTrackingService.getErrorsInTimeRange(
  Date.now() - 3600000, // 1 hour ago
  Date.now()
);
```

### Monitoring Dashboard

Add the `ErrorDashboard` component to any admin or settings page:

```vue
<template>
  <ion-page>
    <ion-content>
      <ErrorDashboard />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import ErrorDashboard from '@/components/ErrorDashboard.vue';
</script>
```

## Integration with Firebase Analytics

All errors are automatically logged to Firebase Analytics with the following data:

- **Event Name**: `app_error`
- **Parameters**:
  - `error_category`: The error category
  - `error_severity`: The severity level
  - `error_message`: Truncated error message (100 chars)
  - `error_id`: Unique error identifier
  - `user_id`: Current user ID (if authenticated)
  - `recovered`: Whether the error was recovered

Recovery events are also tracked:

- **Event Name**: `error_recovered`
- **Parameters**:
  - `error_id`: The recovered error ID
  - `error_category`: The error category
  - `recovery_strategy`: How it was recovered

## Best Practices

### 1. Always Provide Context

```typescript
await handleError(error, {
  userId: user.id,
  action: 'save_profile',
  previousValue: oldData,
  newValue: newData
});
```

### 2. Use Appropriate Categories

```typescript
// Network requests
await handleError(error, context, ErrorCategory.NETWORK);

// Form validation
await handleError(error, context, ErrorCategory.VALIDATION);

// Firestore operations
await handleError(error, context, ErrorCategory.FIRESTORE);
```

### 3. Set Correct Severity

```typescript
// Low: Warnings, validation errors
ErrorSeverity.LOW

// Medium: Failed operations that can be retried
ErrorSeverity.MEDIUM

// High: Authentication, authorization, critical data errors
ErrorSeverity.HIGH

// Critical: System failures, crashes
ErrorSeverity.CRITICAL
```

### 4. Use withErrorHandling for Network Requests

```typescript
const data = await withErrorHandling(
  async () => await api.fetchData(),
  {
    category: ErrorCategory.NETWORK,
    retry: true,
    maxRetries: 3
  }
);
```

### 5. Mark Recovered Errors

```typescript
const { trackedError } = await handleError(error);

try {
  // Attempt recovery
  await retryOperation();

  // Mark as recovered
  errorTrackingService.markAsRecovered(trackedError.id, 'manual_retry_success');
} catch (recoveryError) {
  // Recovery failed
}
```

## Exporting Error Reports

For debugging and support:

```typescript
import { errorTrackingService } from '@/services/errorTrackingService';

// Export error summary as JSON
const summary = errorTrackingService.exportErrorSummary();

// Download as file
const blob = new Blob([summary], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `error-report-${Date.now()}.json`;
link.click();
```

## Testing

To test the error tracking system:

1. Navigate to the error tracking example page
2. Use the test buttons to simulate different error types
3. View the error dashboard to see tracked errors
4. Check the recovery rate and error metrics
5. Export error reports for analysis

## Performance Considerations

- Errors are stored in memory (max 200 most recent)
- Error frequency is tracked with a Map for efficient lookups
- Automatic cleanup prevents memory leaks
- Error messages are truncated in analytics to save bandwidth

## Future Enhancements

- [ ] Server-side error aggregation
- [ ] Email notifications for critical errors
- [ ] Automatic error grouping and deduplication
- [ ] Error trends and pattern detection
- [ ] Integration with external monitoring services (Sentry, LogRocket)
- [ ] Custom error recovery workflows
- [ ] Machine learning-based error prediction
