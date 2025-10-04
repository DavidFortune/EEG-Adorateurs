/**
 * Error Categories for classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  FIRESTORE = 'firestore',
  STORAGE = 'storage',
  PERFORMANCE = 'performance',
  UI = 'ui',
  UNKNOWN = 'unknown'
}

/**
 * Error Severity Levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Tracked Error Interface
 */
export interface TrackedError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  timestamp: number;
  userId?: string;
  context?: Record<string, any>;
  recovered: boolean;
  attemptedRecovery?: string;
}

/**
 * Error Rate Metrics
 */
export interface ErrorRateMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorRate: number; // errors per minute
  mostFrequentErrors: ErrorFrequency[];
  recentErrors: TrackedError[];
}

/**
 * Error Frequency Tracking
 */
export interface ErrorFrequency {
  message: string;
  category: ErrorCategory;
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
}

/**
 * Error Recovery Strategy
 */
export interface ErrorRecoveryStrategy {
  retry: boolean;
  retryDelay?: number;
  maxRetries?: number;
  fallback?: () => void;
  userMessage?: string;
}
