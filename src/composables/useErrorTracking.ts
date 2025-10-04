import { errorTrackingService } from '@/services/errorTrackingService';
import { ErrorCategory, ErrorSeverity, type ErrorRecoveryStrategy } from '@/types/error';
import { toastController } from '@ionic/vue';

/**
 * Composable for error tracking with automatic recovery and user notifications
 */
export function useErrorTracking() {
  /**
   * Track and handle an error with automatic recovery attempts
   */
  const handleError = async (
    error: Error | unknown,
    context?: Record<string, any>,
    category?: ErrorCategory,
    severity?: ErrorSeverity,
    showToast = true
  ) => {
    // Track the error
    const trackedError = errorTrackingService.trackError(error, context, category, severity);

    // Get suggested recovery strategy
    const recovery = errorTrackingService.getSuggestedRecovery(trackedError);

    // Show user notification if requested
    if (showToast && recovery.userMessage) {
      await showErrorToast(recovery.userMessage);
    }

    return { trackedError, recovery };
  };

  /**
   * Execute a function with automatic error handling and retry logic
   */
  const withErrorHandling = async <T>(
    fn: () => Promise<T>,
    options?: {
      context?: Record<string, any>;
      category?: ErrorCategory;
      onError?: (error: any) => void;
      showToast?: boolean;
      retry?: boolean;
      maxRetries?: number;
      retryDelay?: number;
    }
  ): Promise<T | null> => {
    const maxRetries = options?.retry ? (options.maxRetries || 3) : 0;
    const retryDelay = options?.retryDelay || 1000;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();

        // If we had to retry, mark the error as recovered
        if (attempt > 0 && lastError) {
          const trackedError = errorTrackingService.trackError(
            lastError,
            { ...options?.context, attempts: attempt },
            options?.category
          );
          errorTrackingService.markAsRecovered(
            trackedError.id,
            `retry_attempt_${attempt}`
          );
        }

        return result;
      } catch (error) {
        lastError = error;

        // If this is the last attempt, handle the error
        if (attempt === maxRetries) {
          const { trackedError } = await handleError(
            error,
            { ...options?.context, attempts: attempt + 1 },
            options?.category,
            undefined,
            options?.showToast !== false
          );

          // Call custom error handler if provided
          if (options?.onError) {
            options.onError(error);
          }

          return null;
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    return null;
  };

  /**
   * Show error toast notification
   */
  const showErrorToast = async (message: string, duration = 4000) => {
    const toast = await toastController.create({
      message,
      duration,
      position: 'top',
      color: 'danger',
      buttons: [
        {
          text: 'Fermer',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  };

  /**
   * Get error metrics
   */
  const getMetrics = () => {
    return errorTrackingService.getErrorMetrics();
  };

  /**
   * Get critical errors
   */
  const getCriticalErrors = () => {
    return errorTrackingService.getCriticalErrors();
  };

  /**
   * Get recovery rate
   */
  const getRecoveryRate = () => {
    return errorTrackingService.getRecoveryRate();
  };

  /**
   * Export error summary for debugging
   */
  const exportSummary = () => {
    return errorTrackingService.exportErrorSummary();
  };

  /**
   * Clear error history
   */
  const clearErrors = () => {
    errorTrackingService.clearErrors();
  };

  return {
    handleError,
    withErrorHandling,
    showErrorToast,
    getMetrics,
    getCriticalErrors,
    getRecoveryRate,
    exportSummary,
    clearErrors
  };
}
