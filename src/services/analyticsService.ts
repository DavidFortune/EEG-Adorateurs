import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { app } from '@/firebase/config';

interface SessionData {
  sessionId: string;
  startTime: number;
  screenViews: number;
  lastScreenView: number;
}

class AnalyticsService {
  private analytics;
  private currentSession: SessionData | null = null;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    try {
      this.analytics = getAnalytics(app);
      console.log('Analytics initialized');
    } catch (error) {
      console.error('Error initializing analytics:', error);
    }
  }

  /**
   * Initialize analytics with user information
   */
  async initializeUser(userId: string, userProperties?: Record<string, any>) {
    try {
      if (!this.analytics) return;

      setUserId(this.analytics, userId);

      if (userProperties) {
        setUserProperties(this.analytics, userProperties);
      }

      // Start a new session
      this.startSession();
    } catch (error) {
      console.error('Error initializing user analytics:', error);
    }
  }

  /**
   * Start a new session
   */
  private startSession() {
    const now = Date.now();

    // Check if we should continue the previous session or start a new one
    if (this.currentSession) {
      const timeSinceLastActivity = now - this.currentSession.lastScreenView;

      // If more than session timeout, end the current session and start a new one
      if (timeSinceLastActivity > this.sessionTimeout) {
        this.endSession();
      } else {
        // Continue the current session
        return;
      }
    }

    // Create a new session
    this.currentSession = {
      sessionId: this.generateSessionId(),
      startTime: now,
      screenViews: 0,
      lastScreenView: now
    };

    // Log session start event
    this.logEvent('session_start', {
      session_id: this.currentSession.sessionId
    });
  }

  /**
   * End the current session and log metrics
   */
  private endSession() {
    if (!this.currentSession) return;

    const sessionDuration = Date.now() - this.currentSession.startTime;

    // Log session end event with metrics
    this.logEvent('session_end', {
      session_id: this.currentSession.sessionId,
      session_duration: sessionDuration,
      screen_views: this.currentSession.screenViews,
      screens_per_minute: (this.currentSession.screenViews / (sessionDuration / 60000)).toFixed(2)
    });

    this.currentSession = null;
  }

  /**
   * Track a screen view
   */
  trackScreenView(screenName: string, screenClass?: string) {
    try {
      if (!this.analytics) return;

      // Ensure session is active
      this.startSession();

      if (this.currentSession) {
        this.currentSession.screenViews++;
        this.currentSession.lastScreenView = Date.now();
      }

      // Log screen view event
      logEvent(this.analytics, 'screen_view', {
        firebase_screen: screenName,
        firebase_screen_class: screenClass || screenName,
        session_id: this.currentSession?.sessionId
      });
    } catch (error) {
      console.error('Error tracking screen view:', error);
    }
  }

  /**
   * Log a custom event
   */
  logEvent(eventName: string, eventParams?: Record<string, any>) {
    try {
      if (!this.analytics) return;

      logEvent(this.analytics, eventName, {
        ...eventParams,
        session_id: this.currentSession?.sessionId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }

  /**
   * Track user engagement actions
   */
  trackEngagement(action: string, details?: Record<string, any>) {
    this.logEvent('user_engagement', {
      engagement_action: action,
      ...details
    });
  }

  /**
   * Track service interactions
   */
  trackServiceInteraction(action: 'view' | 'create' | 'edit' | 'delete', serviceId?: string) {
    this.logEvent('service_interaction', {
      action,
      service_id: serviceId
    });
  }

  /**
   * Track team interactions
   */
  trackTeamInteraction(action: 'view' | 'join' | 'leave' | 'approve' | 'reject', teamId?: string) {
    this.logEvent('team_interaction', {
      action,
      team_id: teamId
    });
  }

  /**
   * Track availability updates
   */
  trackAvailabilityUpdate(serviceId: string, availability: 'available' | 'unavailable') {
    this.logEvent('availability_update', {
      service_id: serviceId,
      availability
    });
  }

  /**
   * Get current session duration
   */
  getCurrentSessionDuration(): number {
    if (!this.currentSession) return 0;
    return Date.now() - this.currentSession.startTime;
  }

  /**
   * Get current screen views count
   */
  getCurrentScreenViews(): number {
    return this.currentSession?.screenViews || 0;
  }

  /**
   * Handle app going to background
   */
  handleAppPause() {
    if (this.currentSession) {
      this.logEvent('app_pause', {
        session_duration: this.getCurrentSessionDuration(),
        screen_views: this.getCurrentScreenViews()
      });
    }
  }

  /**
   * Handle app coming to foreground
   */
  handleAppResume() {
    this.logEvent('app_resume');
    this.startSession(); // This will check if session should continue or start new
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup on logout
   */
  cleanup() {
    this.endSession();
  }
}

export const analyticsService = new AnalyticsService();
