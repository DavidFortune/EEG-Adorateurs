import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/streamio_auth_token.dart';
import '../repositories/streamio_token_repository.dart';

// Repository provider
final streamIOTokenRepositoryProvider = Provider<StreamIOTokenRepository>((
  ref,
) {
  return StreamIOTokenRepository();
});

// Token provider for a specific user
final streamIOAuthTokenProvider =
    FutureProvider.family<StreamIOAuthToken, String>((ref, userId) async {
      final repository = ref.watch(streamIOTokenRepositoryProvider);
      return repository.getToken(userId);
    });

// Provider to refresh token
final refreshStreamIOTokenProvider =
    Provider.family<Future<StreamIOAuthToken>, String>((ref, userId) async {
      final repository = ref.read(streamIOTokenRepositoryProvider);
      return repository.getToken(userId, forceRefresh: true);
    });
