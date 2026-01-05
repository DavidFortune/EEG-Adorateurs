import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:stream_chat_flutter/stream_chat_flutter.dart';
import '../utils/app_logger.dart';
import 'channel_screen.dart';

class ChannelListScreen extends StatefulWidget {
  const ChannelListScreen({Key? key}) : super(key: key);

  @override
  State<ChannelListScreen> createState() => _ChannelListScreenState();
}

class _ChannelListScreenState extends State<ChannelListScreen> {
  late final _listController = StreamChannelListController(
    client: StreamChat.of(context).client,
    filter: Filter.in_('members', [StreamChat.of(context).currentUser!.id]),
    channelStateSort: const [SortOption('last_message_at')],
    limit: 20,
  );

  @override
  void dispose() {
    _listController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const StreamChannelListHeader(
        subtitle: Text('Channels'),
        showConnectionStateTile: true,
      ),
      body: RefreshIndicator(
        onRefresh: () => _listController.refresh(),
        child: StreamChannelListView(
          controller: _listController,
          itemBuilder: _channelTileBuilder,
          onChannelTap: _onChannelTap,
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _createNewChannel(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _onChannelTap(Channel channel) {
    final client = StreamChat.of(context).client;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (newContext) => StreamChat(
          client: client,
          child: StreamChatTheme(
            data: StreamChatThemeData.light(),
            child: StreamChannel(
              channel: channel,
              child: const ChannelScreen(),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _createNewChannel(BuildContext context) async {
    final client = StreamChat.of(context).client;
    final currentUser = StreamChat.of(context).currentUser;

    if (currentUser == null) return;

    final channelName = await showDialog<String>(
      context: context,
      builder: (context) {
        final controller = TextEditingController();
        return AlertDialog(
          title: const Text('Create New Channel'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              labelText: 'Channel Name',
              hintText: 'Enter channel name',
            ),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, controller.text),
              child: const Text('Create'),
            ),
          ],
        );
      },
    );

    if (channelName == null || channelName.trim().isEmpty) return;

    try {
      final channel = client.channel(
        'messaging',
        id: 'channel-${DateTime.now().millisecondsSinceEpoch}',
        extraData: {
          'name': channelName.trim(),
          'image':
              'https://api.dicebear.com/7.x/initials/svg?seed=${channelName.trim()}',
          'members': [currentUser.id],
        },
      );

      await channel.watch();

      if (context.mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (newContext) => StreamChat(
              client: client,
              child: StreamChatTheme(
                data: StreamChatThemeData.light(),
                child: StreamChannel(
                  channel: channel,
                  child: const ChannelScreen(),
                ),
              ),
            ),
          ),
        );
      }
    } catch (e) {
      AppLogger.error('Error creating channel', e);
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to create channel: $e')));
      }
    }
  }

  Widget _channelTileBuilder(
    BuildContext context,
    List<Channel> channels,
    int index,
    StreamChannelListTile defaultChannelTile,
  ) {
    final channel = channels[index];
    final lastMessage = channel.state?.messages.reversed.firstWhereOrNull(
      (message) => !message.isDeleted,
    );

    final subtitle = lastMessage == null ? 'nothing yet' : lastMessage.text!;
    final opacity = (channel.state?.unreadCount ?? 0) > 0 ? 1.0 : 0.5;
    final theme = StreamChatTheme.of(context);

    return ListTile(
      onTap: () => _onChannelTap(channel),
      leading: StreamChannelAvatar(channel: channel),
      title: StreamChannelName(
        channel: channel,
        textStyle: theme.channelPreviewTheme.titleStyle!.copyWith(
          color: theme.colorTheme.textHighEmphasis.withOpacity(opacity),
        ),
      ),
      subtitle: Text(subtitle),
      trailing: channel.state!.unreadCount > 0
          ? CircleAvatar(
              radius: 10,
              child: Text(channel.state!.unreadCount.toString()),
            )
          : const SizedBox(),
    );
  }
}
