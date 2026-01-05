import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'providers/streamio_token_provider.dart';
import 'repositories/streamio_token_repository.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize StreamIO token repository
  final tokenRepository = StreamIOTokenRepository();
  await tokenRepository.init();

  runApp(
    ProviderScope(
      overrides: [
        streamIOTokenRepositoryProvider.overrideWithValue(tokenRepository),
      ],
      child: const MyApp(),
    ),
  );
}
