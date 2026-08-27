import 'dart:developer' as developer;

import '../../data/models/enums.dart';
import '../../data/models/opportunity.dart';

/// Abstraction over push + local reminders.
///
/// The mock implementation only logs, so the app runs without any Firebase
/// setup. Swap in [FirebaseNotificationService] once `firebase_messaging` and
/// `flutter_local_notifications` are enabled in pubspec.yaml.
abstract class NotificationService {
  Future<void> initialise();
  Future<String?> deviceToken();
  Future<void> scheduleDeadlineReminder({
    required Opportunity opportunity,
    required ReminderOption option,
    DateTime? customAt,
  });
  Future<void> cancelReminder(String opportunityId);
  Future<void> setCategoryEnabled(String category, bool enabled);
}

class MockNotificationService implements NotificationService {
  final Map<String, DateTime> _scheduled = {};

  @override
  Future<void> initialise() async {
    developer.log('Notification service ready (mock)', name: 'nsut_hub');
  }

  @override
  Future<String?> deviceToken() async => 'mock-fcm-token';

  @override
  Future<void> scheduleDeadlineReminder({
    required Opportunity opportunity,
    required ReminderOption option,
    DateTime? customAt,
  }) async {
    if (option == ReminderOption.none) {
      return cancelReminder(opportunity.id);
    }
    final fireAt = option == ReminderOption.custom
        ? customAt
        : opportunity.deadline
            .subtract(Duration(days: option.daysBefore ?? 1));
    if (fireAt == null) return;
    _scheduled[opportunity.id] = fireAt;
    developer.log(
      'Reminder set for ${opportunity.title} at $fireAt',
      name: 'nsut_hub',
    );
  }

  @override
  Future<void> cancelReminder(String opportunityId) async {
    _scheduled.remove(opportunityId);
  }

  @override
  Future<void> setCategoryEnabled(String category, bool enabled) async {
    developer.log('Topic $category -> $enabled', name: 'nsut_hub');
  }
}

/// Reference implementation — uncomment the Firebase dependencies first.
///
/// ```dart
/// class FirebaseNotificationService implements NotificationService {
///   final _messaging = FirebaseMessaging.instance;
///   final _local = FlutterLocalNotificationsPlugin();
///
///   @override
///   Future<void> initialise() async {
///     await _messaging.requestPermission();
///     await _local.initialize(const InitializationSettings(
///       android: AndroidInitializationSettings('@mipmap/ic_launcher'),
///       iOS: DarwinInitializationSettings(),
///     ));
///     FirebaseMessaging.onMessage.listen(_showForeground);
///   }
///
///   @override
///   Future<String?> deviceToken() => _messaging.getToken();
///
///   @override
///   Future<void> setCategoryEnabled(String category, bool enabled) =>
///       enabled ? _messaging.subscribeToTopic(category)
///               : _messaging.unsubscribeFromTopic(category);
/// }
/// ```
library;
