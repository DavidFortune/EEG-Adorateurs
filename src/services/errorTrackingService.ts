import {
  ErrorCategory,
  ErrorSeverity,
  TrackedError,
  ErrorRateMetrics,
  ErrorFrequency,
  ErrorRecoveryStrategy
} from '@/types/error';
import { analyticsService } from './analyticsService';

class ErrorTrackingService {
  private errors: TrackedError[] = [];
  private errorFrequency: Map<string, ErrorFrequency> = new Map();
  private maxErrorsInMemory = 200; // Keep last 200 errors
  private startTime = Date.now();
  private currentUserId?: string;

  /**
   * Set the current user ID for error tracking
   */
  setUserId(userId: string) {
    this.currentUserId = userId;
  }

  /**
   * Track an error with automatic categorization
   */
  trackError(
    error: Error | unknown,
    context?: Record<string, any>,
    category?: ErrorCategory,
    severity?: ErrorSeverity
  ): TrackedError {
    const trackedError = this.createTrackedError(error, context, category, severity);

    // Store error
    this.errors.push(trackedError);

    // Manage memory
    if (this.errors.length > this.maxErrorsInMemory) {
      this.errors.shift();
    }

    // Update frequency tracking
    this.updateErrorFrequency(trackedError);

    // Log to analytics
    this.logErrorToAnalytics(trackedError);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Tracked Error:', {
        category: trackedError.category,
        severity: trackedError.severity,
        message: trackedError.message,
        context: trackedError.context
      });
    }

    return trackedError;
  }

  /**
   * Create a tracked error object
   */
  private createTrackedError(
    error: Error | unknown,
    context?: Record<string, any>,
    category?: ErrorCategory,
    severity?: ErrorSeverity
  ): TrackedError {
    const errorObj = error as Error;
    const message = errorObj?.message || String(error);

    return {
      id: this.generateErrorId(),
      category: category || this.categorizeError(errorObj, message),
      severity: severity || this.determineSeverity(errorObj, message),
      message,
      stack: errorObj?.stack,
      timestamp: Date.now(),
      userId: this.currentUserId,
      context,
      recovered: false
    };
  }

  /**
   * Automatically categorize errors based on type and message
   */
  private categorizeError(error: Error, message: string): ErrorCategory {
    const lowerMessage = message.toLowerCase();

    // Network errors
    if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('connection')
    ) {
      return ErrorCategory.NETWORK;
    }

    // Authentication errors
    if (
      lowerMessage.includes('auth') ||
      lowerMessage.includes('login') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('unauthenticated') ||
      lowerMessage.includes('token')
    ) {
      return ErrorCategory.AUTHENTICATION;
    }

    // Authorization errors
    if (
      lowerMessage.includes('permission') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('access denied')
    ) {
      return ErrorCategory.AUTHORIZATION;
    }

    // Validation errors
    if (
      lowerMessage.includes('validation') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('required') ||
      lowerMessage.includes('format')
    ) {
      return ErrorCategory.VALIDATION;
    }

    // Firestore errors
    if (
      lowerMessage.includes('firestore') ||
      lowerMessage.includes('firebase') ||
      lowerMessage.includes('document') ||
      error.name?.includes('FirebaseError')
    ) {
      return ErrorCategory.FIRESTORE;
    }

    // Storage errors
    if (
      lowerMessage.includes('storage') ||
      lowerMessage.includes('upload') ||
      lowerMessage.includes('download')
    ) {
      return ErrorCategory.STORAGE;
    }

    // Performance errors
    if (
      lowerMessage.includes('performance') ||
      lowerMessage.includes('slow') ||
      lowerMessage.includes('timeout')
    ) {
      return ErrorCategory.PERFORMANCE;
    }

    // UI errors
    if (
      lowerMessage.includes('render') ||
      lowerMessage.includes('component') ||
      error.name === 'TypeError'
    ) {
      return ErrorCategory.UI;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, message: string): ErrorSeverity {
    const lowerMessage = message.toLowerCase();

    // Critical errors
    if (
      lowerMessage.includes('critical') ||
      lowerMessage.includes('fatal') ||
      lowerMessage.includes('crash')
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity
    if (
      lowerMessage.includes('auth') ||
      lowerMessage.includes('permission') ||
      lowerMessage.includes('data loss')
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity
    if (
      lowerMessage.includes('failed') ||
      lowerMessage.includes('error') ||
      lowerMessage.includes('timeout')
    ) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity (warnings, validation errors)
    return ErrorSeverity.LOW;
  }

  /**
   * Update error frequency tracking
   */
  private updateErrorFrequency(error: TrackedError) {
    const key = `${error.category}:${error.message}`;
    const existing = this.errorFrequency.get(key);

    if (existing) {
      existing.count++;
      existing.lastOccurrence = error.timestamp;
    } else {
      this.errorFrequency.set(key, {
        message: error.message,
        category: error.category,
        count: 1,
        firstOccurrence: error.timestamp,
        lastOccurrence: error.timestamp
      });
    }
  }

  /**
   * Log error to analytics
   */
  private logErrorToAnalytics(error: TrackedError) {
    analyticsService.logEvent('app_error', {
      error_category: error.category,
      error_severity: error.severity,
      error_message: error.message.substring(0, 100), // Limit message length
      error_id: error.id,
      user_id: error.userId,
      recovered: error.recovered
    });
  }

  /**
   * Mark an error as recovered
   */
  markAsRecovered(errorId: string, recoveryStrategy: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.recovered = true;
      error.attemptedRecovery = recoveryStrategy;

      // Log recovery to analytics
      analyticsService.logEvent('error_recovered', {
        error_id: errorId,
        error_category: error.category,
        recovery_strategy: recoveryStrategy
      });
    }
  }

  /**
   * Get error rate metrics
   */
  getErrorMetrics(): ErrorRateMetrics {
    const now = Date.now();
    const timeElapsed = (now - this.startTime) / 60000; // in minutes

    // Count errors by category
    const errorsByCategory: Record<ErrorCategory, number> = {} as Record<ErrorCategory, number>;
    Object.values(ErrorCategory).forEach(cat => {
      errorsByCategory[cat] = 0;
    });

    // Count errors by severity
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as Record<ErrorSeverity, number>;
    Object.values(ErrorSeverity).forEach(sev => {
      errorsBySeverity[sev] = 0;
    });

    this.errors.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });

    // Get most frequent errors
    const mostFrequentErrors = Array.from(this.errorFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: this.errors.length,
      errorsByCategory,
      errorsBySeverity,
      errorRate: timeElapsed > 0 ? this.errors.length / timeElapsed : 0,
      mostFrequentErrors,
      recentErrors: this.errors.slice(-20) // Last 20 errors
    };
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): TrackedError[] {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): TrackedError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Get errors in time range
   */
  getErrorsInTimeRange(startTime: number, endTime: number): TrackedError[] {
    return this.errors.filter(
      error => error.timestamp >= startTime && error.timestamp <= endTime
    );
  }

  /**
   * Get critical errors
   */
  getCriticalErrors(): TrackedError[] {
    return this.getErrorsBySeverity(ErrorSeverity.CRITICAL);
  }

  /**
   * Get unrecovered errors
   */
  getUnrecoveredErrors(): TrackedError[] {
    return this.errors.filter(error => !error.recovered);
  }

  /**
   * Get recovery rate (percentage of errors that were recovered)
   */
  getRecoveryRate(): number {
    if (this.errors.length === 0) return 100;
    const recovered = this.errors.filter(e => e.recovered).length;
    return (recovered / this.errors.length) * 100;
  }

  /**
   * Clear error history
   */
  clearErrors() {
    this.errors = [];
    this.errorFrequency.clear();
  }

  /**
   * Get suggested recovery strategy based on error category
   */
  getSuggestedRecovery(error: TrackedError): ErrorRecoveryStrategy {
    switch (error.category) {
      case ErrorCategory.NETWORK:
        return {
          retry: true,
          retryDelay: 2000,
          maxRetries: 3,
          userMessage: 'Problème de connexion. Nouvelle tentative...'
        };

      case ErrorCategory.AUTHENTICATION:
        return {
          retry: false,
          fallback: () => {
            // Redirect to login
            window.location.href = '/login';
          },
          userMessage: 'Session expirée. Veuillez vous reconnecter.'
        };

      case ErrorCategory.AUTHORIZATION:
        return {
          retry: false,
          userMessage: 'Vous n\'avez pas la permission pour cette action.'
        };

      case ErrorCategory.VALIDATION:
        return {
          retry: false,
          userMessage: 'Veuillez vérifier les informations saisies.'
        };

      case ErrorCategory.FIRESTORE:
        return {
          retry: true,
          retryDelay: 1000,
          maxRetries: 2,
          userMessage: 'Erreur lors de l\'accès aux données. Nouvelle tentative...'
        };

      case ErrorCategory.STORAGE:
        return {
          retry: true,
          retryDelay: 3000,
          maxRetries: 2,
          userMessage: 'Erreur lors du transfert de fichier. Nouvelle tentative...'
        };

      default:
        return {
          retry: false,
          userMessage: 'Une erreur s\'est produite. Veuillez réessayer.'
        };
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export error summary for debugging
   */
  exportErrorSummary(): string {
    const metrics = this.getErrorMetrics();
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics,
      recentErrors: metrics.recentErrors.map(e => ({
        category: e.category,
        severity: e.severity,
        message: e.message,
        timestamp: new Date(e.timestamp).toISOString(),
        recovered: e.recovered
      }))
    }, null, 2);
  }
}

export const errorTrackingService = new ErrorTrackingService();
