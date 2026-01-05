import 'package:hive_ce/hive.dart';

part 'streamio_auth_token.g.dart';

@HiveType(typeId: 0)
class StreamIOAuthToken {
  @HiveField(0)
  final String token;

  @HiveField(1)
  final String userId;

  @HiveField(2)
  final DateTime cachedAt;

  @HiveField(3)
  final DateTime? expiresAt;

  StreamIOAuthToken({
    required this.token,
    required this.userId,
    required this.cachedAt,
    this.expiresAt,
  });

  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }

  bool get isExpiringSoon {
    if (expiresAt == null) return false;
    // Consider token expiring soon if less than 1 hour remaining
    final oneHourFromNow = DateTime.now().add(const Duration(hours: 1));
    return oneHourFromNow.isAfter(expiresAt!);
  }

  @override
  String toString() {
    return 'StreamIOAuthToken(userId: $userId, cachedAt: $cachedAt, expiresAt: $expiresAt, isExpired: $isExpired)';
  }
}
