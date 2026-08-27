import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/datasources/mock_notifications.dart';
import '../../data/models/app_notification.dart';

class NotificationsNotifier extends StateNotifier<List<AppNotification>> {
  NotificationsNotifier() : super(MockNotifications.all());

  void markRead(String id) {
    state = [
      for (final n in state) n.id == id ? n.copyWith(read: true) : n,
    ];
  }

  void markAllRead() {
    state = [for (final n in state) n.copyWith(read: true)];
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, List<AppNotification>>(
        (ref) => NotificationsNotifier());

final unreadNotificationCountProvider = Provider<int>(
    (ref) => ref.watch(notificationsProvider).where((n) => !n.read).length);
