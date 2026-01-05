import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stream_chat_flutter/stream_chat_flutter.dart';
import 'providers/streamio_token_provider.dart';
import 'screens/channel_list_screen.dart';
import 'utils/app_logger.dart';

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Stream Chat Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const StreamIOChatInitializer(
        userId: 'john', // Make this dynamic based on your auth system
      ),
    );
  }
}

class StreamIOChatInitializer extends ConsumerWidget {
  final String userId;

  const StreamIOChatInitializer({Key? key, required this.userId})
    : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const apiKey = String.fromEnvironment("STREAM_CHAT_API_KEY");
    final tokenAsync = ref.watch(streamIOAuthTokenProvider(userId));

    return tokenAsync.when(
      data: (authToken) {
        // Check if token is expiring soon and refresh in background
        if (authToken.isExpiringSoon) {
          Future.microtask(() {
            ref.read(refreshStreamIOTokenProvider(userId));
          });
        }

        return StreamChatApp(
          apiKey: apiKey,
          token: authToken.token,
          userId: userId,
        );
      },
      loading: () => const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Loading StreamIO authentication...'),
            ],
          ),
        ),
      ),
      error: (error, stack) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(streamIOAuthTokenProvider(userId));
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class StreamChatApp extends ConsumerStatefulWidget {
  final String apiKey;
  final String token;
  final String userId;

  const StreamChatApp({
    Key? key,
    required this.apiKey,
    required this.token,
    required this.userId,
  }) : super(key: key);

  @override
  ConsumerState<StreamChatApp> createState() => _StreamChatAppState();
}

class _StreamChatAppState extends ConsumerState<StreamChatApp> {
  late StreamChatClient client;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initializeClient();
  }

  Future<void> _initializeClient() async {
    client = StreamChatClient(widget.apiKey, logLevel: Level.INFO);

    try {
      await client.connectUser(User(id: widget.userId), widget.token);

      setState(() {
        _isInitialized = true;
      });
    } catch (e) {
      AppLogger.error('Error connecting user', e);
      // Try to refresh token and retry
      try {
        final newToken = await ref.read(
          refreshStreamIOTokenProvider(widget.userId),
        );
        await client.connectUser(User(id: widget.userId), newToken.token);

        setState(() {
          _isInitialized = true;
        });
      } catch (retryError) {
        AppLogger.error('Error after token refresh', retryError);
        rethrow;
      }
    }
  }

  @override
  void dispose() {
    client.disconnectUser();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return StreamChat(
      client: client,
      streamChatThemeData: StreamChatThemeData(
        colorTheme: StreamColorTheme.light(
          accentPrimary: const Color(0xffffe072),
        ),
        channelHeaderTheme: const StreamChannelHeaderThemeData(
          color: Color(0xffd34646),
          titleStyle: TextStyle(color: Colors.white),
        ),
      ),
      child: const ChannelListScreen(),
    );
  }
}
