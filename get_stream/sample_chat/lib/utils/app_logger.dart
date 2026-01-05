import 'package:logger/logger.dart';

/// Configurable logging utility using the Logger package.
/// Log level can be configured via environment variable: --dart-define=LOG_LEVEL=info
class AppLogger {
  static final Logger _logger = Logger(
    printer: PrettyPrinter(
      methodCount: 0,
      errorMethodCount: 5,
      lineLength: 80,
      colors: true,
      printEmojis: true,
      dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
    ),
    level: _getLogLevel(),
  );

  /// Parse LOG_LEVEL from environment variable (debug, info, warning, error)
  /// Defaults to 'debug' if not specified
  static Level _getLogLevel() {
    const logLevelStr = String.fromEnvironment(
      'LOG_LEVEL',
      defaultValue: 'debug',
    );
    switch (logLevelStr.toLowerCase()) {
      case 'debug':
        return Level.debug;
      case 'info':
        return Level.info;
      case 'warning':
        return Level.warning;
      case 'error':
        return Level.error;
      case 'off':
        return Level.off;
      default:
        return Level.debug;
    }
  }

  static void debug(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    _logger.d(message, error: error, stackTrace: stackTrace);
  }

  static void info(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    _logger.i(message, error: error, stackTrace: stackTrace);
  }

  static void warning(
    dynamic message, [
    dynamic error,
    StackTrace? stackTrace,
  ]) {
    _logger.w(message, error: error, stackTrace: stackTrace);
  }

  static void error(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    _logger.e(message, error: error, stackTrace: stackTrace);
  }
}

/// Domain-specific logger for StreamIO token operations
class StreamIOLogger {
  static void tokenFetching(String userId) {
    AppLogger.info('🔑 Fetching StreamIO token for user: $userId');
  }

  static void tokenFetched(String userId, DateTime expiresAt) {
    AppLogger.info(
      '✅ StreamIO token fetched for user: $userId (expires: $expiresAt)',
    );
  }

  static void tokenCached(String userId) {
    AppLogger.debug('💾 StreamIO token cached for user: $userId');
  }

  static void tokenLoadedFromCache(String userId) {
    AppLogger.debug('📦 StreamIO token loaded from cache for user: $userId');
  }

  static void tokenExpired(String userId) {
    AppLogger.warning('⏰ StreamIO token expired for user: $userId');
  }

  static void tokenExpiringSoon(String userId, Duration remaining) {
    AppLogger.warning(
      '⚠️ StreamIO token expiring soon for user: $userId (${remaining.inMinutes} minutes remaining)',
    );
  }

  static void tokenRefreshing(String userId) {
    AppLogger.info('🔄 Refreshing StreamIO token for user: $userId');
  }

  static void tokenCleared(String userId) {
    AppLogger.debug('🗑️ StreamIO token cleared for user: $userId');
  }

  static void apiError(String userId, dynamic error) {
    AppLogger.error('❌ StreamIO API error for user: $userId', error);
  }

  static void cacheError(dynamic error) {
    AppLogger.error('❌ StreamIO cache error', error);
  }

  static void repositoryInitialized() {
    AppLogger.info('📂 StreamIO token repository initialized');
  }
}
