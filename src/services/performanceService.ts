import { getPerformance, trace, type PerformanceTrace } from 'firebase/performance';
import { app } from '@/firebase/config';

interface PageMetrics {
  pageName: string;
  loadTime: number;
  timestamp: number;
}

interface APIMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode?: number;
  timestamp: number;
}

class PerformanceService {
  private performance;
  private activeTraces: Map<string, PerformanceTrace> = new Map();
  private pageMetrics: PageMetrics[] = [];
  private apiMetrics: APIMetrics[] = [];
  private maxMetricsStorage = 100; // Keep last 100 metrics in memory

  constructor() {
    try {
      this.performance = getPerformance(app);
      console.log('Performance monitoring initialized');

      // Track initial page load
      this.trackInitialPageLoad();
    } catch (error) {
      console.error('Error initializing performance monitoring:', error);
    }
  }

  /**
   * Track initial page load using Navigation Timing API
   */
  private trackInitialPageLoad() {
    if (typeof window === 'undefined' || !window.performance) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
        const firstPaintTime = this.getFirstPaint();

        // Log initial page load metrics
        console.log('Initial page load metrics:', {
          pageLoadTime,
          domReadyTime,
          firstPaintTime
        });

        // Create a custom trace for initial load
        if (this.performance) {
          const initialLoadTrace = trace(this.performance, 'initial_page_load');
          initialLoadTrace.putMetric('page_load_ms', pageLoadTime);
          initialLoadTrace.putMetric('dom_ready_ms', domReadyTime);
          if (firstPaintTime) {
            initialLoadTrace.putMetric('first_paint_ms', firstPaintTime);
          }
          initialLoadTrace.start();
          initialLoadTrace.stop();
        }
      }, 0);
    });
  }

  /**
   * Get First Paint time
   */
  private getFirstPaint(): number | null {
    if (typeof window === 'undefined' || !window.performance) return null;

    const paintEntries = window.performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  /**
   * Start tracking a page load
   */
  startPageTrace(pageName: string): void {
    try {
      if (!this.performance) return;

      const traceName = `page_${pageName}`;
      const pageTrace = trace(this.performance, traceName);
      pageTrace.start();
      this.activeTraces.set(traceName, pageTrace);
    } catch (error) {
      console.error('Error starting page trace:', error);
    }
  }

  /**
   * Stop tracking a page load and record metrics
   */
  stopPageTrace(pageName: string, additionalMetrics?: Record<string, number>): void {
    try {
      if (!this.performance) return;

      const traceName = `page_${pageName}`;
      const pageTrace = this.activeTraces.get(traceName);

      if (pageTrace) {
        // Add additional metrics if provided
        if (additionalMetrics) {
          Object.entries(additionalMetrics).forEach(([key, value]) => {
            pageTrace.putMetric(key, value);
          });
        }

        pageTrace.stop();
        this.activeTraces.delete(traceName);
      }
    } catch (error) {
      console.error('Error stopping page trace:', error);
    }
  }

  /**
   * Track a page view with automatic timing
   */
  async trackPageView(pageName: string, callback?: () => Promise<void>): Promise<void> {
    const startTime = window.performance.now();
    this.startPageTrace(pageName);

    try {
      if (callback) {
        await callback();
      }
    } finally {
      const loadTime = window.performance.now() - startTime;
      this.stopPageTrace(pageName, {
        load_time_ms: Math.round(loadTime)
      });

      // Store in memory for analytics
      this.pageMetrics.push({
        pageName,
        loadTime: Math.round(loadTime),
        timestamp: Date.now()
      });

      // Keep only last N metrics
      if (this.pageMetrics.length > this.maxMetricsStorage) {
        this.pageMetrics.shift();
      }
    }
  }

  /**
   * Start tracking an API call
   */
  startAPITrace(endpoint: string, method: string = 'GET'): string {
    try {
      if (!this.performance) return '';

      const traceId = `api_${method}_${endpoint}_${Date.now()}`;
      const apiTrace = trace(this.performance, `api_${method}_${this.sanitizeEndpoint(endpoint)}`);
      apiTrace.putAttribute('endpoint', endpoint);
      apiTrace.putAttribute('method', method);
      apiTrace.start();
      this.activeTraces.set(traceId, apiTrace);

      return traceId;
    } catch (error) {
      console.error('Error starting API trace:', error);
      return '';
    }
  }

  /**
   * Stop tracking an API call and record metrics
   */
  stopAPITrace(
    traceId: string,
    statusCode?: number,
    responseSize?: number,
    errorCode?: string
  ): void {
    try {
      if (!this.performance || !traceId) return;

      const apiTrace = this.activeTraces.get(traceId);

      if (apiTrace) {
        if (statusCode) {
          apiTrace.putMetric('status_code', statusCode);
          apiTrace.putAttribute('status', statusCode.toString());
        }
        if (responseSize) {
          apiTrace.putMetric('response_size_bytes', responseSize);
        }
        if (errorCode) {
          apiTrace.putAttribute('error', errorCode);
        }

        apiTrace.stop();
        this.activeTraces.delete(traceId);
      }
    } catch (error) {
      console.error('Error stopping API trace:', error);
    }
  }

  /**
   * Track a Firestore operation
   */
  async trackFirestoreOperation<T>(
    operation: string,
    collection: string,
    callback: () => Promise<T>
  ): Promise<T> {
    if (!this.performance) {
      return await callback();
    }

    const traceName = `firestore_${operation}_${collection}`;
    const startTime = window.performance.now();
    const firestoreTrace = trace(this.performance, traceName);

    try {
      firestoreTrace.putAttribute('collection', collection);
      firestoreTrace.putAttribute('operation', operation);
      firestoreTrace.start();

      const result = await callback();

      const responseTime = Math.round(window.performance.now() - startTime);
      firestoreTrace.putMetric('response_time_ms', responseTime);
      firestoreTrace.putAttribute('status', 'success');
      firestoreTrace.stop();

      // Store in memory
      this.apiMetrics.push({
        endpoint: `firestore/${collection}`,
        method: operation,
        responseTime,
        timestamp: Date.now()
      });

      if (this.apiMetrics.length > this.maxMetricsStorage) {
        this.apiMetrics.shift();
      }

      return result;
    } catch (error) {
      const responseTime = Math.round(window.performance.now() - startTime);
      firestoreTrace.putMetric('response_time_ms', responseTime);
      firestoreTrace.putAttribute('status', 'error');
      firestoreTrace.putAttribute('error', (error as Error).message);
      firestoreTrace.stop();

      throw error;
    }
  }

  /**
   * Track a custom performance metric
   */
  trackCustomMetric(name: string, value: number, unit: string = 'ms'): void {
    try {
      if (!this.performance) return;

      const customTrace = trace(this.performance, `custom_${name}`);
      customTrace.putMetric(`${name}_${unit}`, value);
      customTrace.start();
      customTrace.stop();
    } catch (error) {
      console.error('Error tracking custom metric:', error);
    }
  }

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.trackCustomMetric(`component_${componentName}_render`, renderTime);
  }

  /**
   * Get average page load time
   */
  getAveragePageLoadTime(): number {
    if (this.pageMetrics.length === 0) return 0;
    const total = this.pageMetrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return Math.round(total / this.pageMetrics.length);
  }

  /**
   * Get average API response time
   */
  getAverageAPIResponseTime(): number {
    if (this.apiMetrics.length === 0) return 0;
    const total = this.apiMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return Math.round(total / this.apiMetrics.length);
  }

  /**
   * Get slowest pages
   */
  getSlowestPages(limit: number = 5): PageMetrics[] {
    return [...this.pageMetrics]
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, limit);
  }

  /**
   * Get slowest API calls
   */
  getSlowestAPICalls(limit: number = 5): APIMetrics[] {
    return [...this.apiMetrics]
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit);
  }

  /**
   * Sanitize endpoint for trace naming
   */
  private sanitizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .substring(0, 100); // Firebase trace names have max length
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      averagePageLoadTime: this.getAveragePageLoadTime(),
      averageAPIResponseTime: this.getAverageAPIResponseTime(),
      totalPageViews: this.pageMetrics.length,
      totalAPIRequests: this.apiMetrics.length,
      slowestPages: this.getSlowestPages(3),
      slowestAPIs: this.getSlowestAPICalls(3)
    };
  }
}

export const performanceService = new PerformanceService();
