import 'package:flutter/material.dart';
import 'package:stream_chat_flutter/stream_chat_flutter.dart';

class ChannelScreen extends StatelessWidget {
  const ChannelScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: StreamChannelHeader(showConnectionStateTile: true),
      body: Column(
        children: <Widget>[
          Expanded(child: StreamMessageListView()),
          StreamMessageInput(disableAttachments: true),
        ],
      ),
    );
  }
}
