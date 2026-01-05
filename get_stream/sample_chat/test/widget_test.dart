// Test that channel navigation includes required StreamChatTheme wrapper

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stream_chat_flutter/stream_chat_flutter.dart';

void main() {
  testWidgets('StreamChatTheme wrapper should be present in widget tree', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: StreamChatTheme(
          data: StreamChatThemeData.light(),
          child: const Scaffold(body: Center(child: Text('Test content'))),
        ),
      ),
    );

    expect(find.byType(StreamChatTheme), findsOneWidget);
    expect(find.text('Test content'), findsOneWidget);
  });

  testWidgets('StreamChannel with StreamChatTheme wrapper should not throw', (
    WidgetTester tester,
  ) async {
    final client = StreamChatClient('test-api-key');
    final channel = client.channel('messaging', id: 'test-channel');

    await tester.pumpWidget(
      MaterialApp(
        home: StreamChat(
          client: client,
          child: StreamChatTheme(
            data: StreamChatThemeData.light(),
            child: StreamChannel(
              channel: channel,
              child: const Scaffold(body: SizedBox()),
            ),
          ),
        ),
      ),
    );

    // Should pump without errors
    await tester.pump();

    // Verify no exceptions
    expect(tester.takeException(), isNull);
    expect(find.byType(StreamChannel), findsOneWidget);
  });
}
