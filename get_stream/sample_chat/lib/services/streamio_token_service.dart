import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:jwt_decode/jwt_decode.dart';
import '../models/streamio_auth_token.dart';
import '../utils/app_logger.dart';

class StreamIOTokenService {
  static const String baseUrl = 'http://localhost:8001';

  Future<StreamIOAuthToken> fetchToken(String userId) async {
    StreamIOLogger.tokenFetching(userId);
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/generate-token/$userId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final token = data['token'] as String;

        // Decode JWT to get expiration
        DateTime? expiresAt;
        try {
          final decodedToken = Jwt.parseJwt(token);
          if (decodedToken['exp'] != null) {
            expiresAt = DateTime.fromMillisecondsSinceEpoch(
              (decodedToken['exp'] as int) * 1000,
            );
          }
        } catch (e) {
          AppLogger.warning('Could not decode JWT expiration', e);
        }

        StreamIOLogger.tokenFetched(userId, expiresAt ?? DateTime.now());
        return StreamIOAuthToken(
          token: token,
          userId: userId,
          cachedAt: DateTime.now(),
          expiresAt: expiresAt,
        );
      } else {
        throw Exception('Failed to fetch token: ${response.statusCode}');
      }
    } catch (e) {
      StreamIOLogger.apiError(userId, e);
      throw Exception('Error fetching StreamIO token: $e');
    }
  }
}
