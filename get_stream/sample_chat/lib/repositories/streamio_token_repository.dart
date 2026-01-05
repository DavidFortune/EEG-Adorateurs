import 'package:hive_ce/hive.dart';
import 'package:path_provider/path_provider.dart';
import '../models/streamio_auth_token.dart';
import '../services/streamio_token_service.dart';
import '../utils/app_logger.dart';

class StreamIOTokenRepository {
  static const String _boxName = 'streamio_tokens';
  final StreamIOTokenService _tokenService = StreamIOTokenService();
  Box<StreamIOAuthToken>? _box;

  Future<void> init() async {
    final appDocDir = await getApplicationDocumentsDirectory();
    Hive.init(appDocDir.path);

    // Register adapter if not already registered
    if (!Hive.isAdapterRegistered(0)) {
      Hive.registerAdapter(StreamIOAuthTokenAdapter());
    }

    _box = await Hive.openBox<StreamIOAuthToken>(_boxName);
    StreamIOLogger.repositoryInitialized();
  }

  Future<StreamIOAuthToken> getToken(
    String userId, {
    bool forceRefresh = false,
  }) async {
    if (_box == null) {
      throw Exception(
        'StreamIOTokenRepository not initialized. Call init() first.',
      );
    }

    // Check cache first
    if (!forceRefresh) {
      final cachedToken = _box!.get(userId);
      if (cachedToken != null && !cachedToken.isExpired) {
        StreamIOLogger.tokenLoadedFromCache(userId);
        return cachedToken;
      }

      if (cachedToken != null && cachedToken.isExpired) {
        StreamIOLogger.tokenExpired(userId);
      }
    }

    // Fetch new token
    StreamIOLogger.tokenRefreshing(userId);
    final newToken = await _tokenService.fetchToken(userId);

    // Cache it
    await _box!.put(userId, newToken);
    StreamIOLogger.tokenCached(userId);

    return newToken;
  }

  Future<void> clearToken(String userId) async {
    if (_box == null) return;
    await _box!.delete(userId);
    StreamIOLogger.tokenCleared(userId);
  }

  Future<void> clearAllTokens() async {
    if (_box == null) return;
    await _box!.clear();
    AppLogger.info('🗑️ Cleared all StreamIO tokens');
  }

  StreamIOAuthToken? getCachedTokenSync(String userId) {
    return _box?.get(userId);
  }
}
