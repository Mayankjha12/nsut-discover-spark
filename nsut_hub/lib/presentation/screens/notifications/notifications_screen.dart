import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/deadline_utils.dart';
import '../../../data/models/app_notification.dart';
import '../../providers/notification_provider.dart';
import '../../providers/profile_provider.dart';
import '../../widgets/common.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  static const _categories = [
    'Deadlines',
    'Recommendations',
    'NSUT News',
    'Hackathons',
    'Internships',
    'Scholarships',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(notificationsProvider);
    final profile = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () =>
                ref.read(notificationsProvider.notifier).markAllRead(),
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: items.isEmpty
          ? const EmptyState(
              icon: Icons.notifications_off_outlined,
              title: 'Nothing new right now',
              message:
                  'Deadline reminders and matching opportunities will land here.',
            )
          : ListView(
              padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
              children: [
                for (final n in items)
                  _NotificationTile(
                    notification: n,
                    onTap: () {
                      ref.read(notificationsProvider.notifier).markRead(n.id);
                      if (n.targetOpportunityId != null) {
                        context.push('/opportunity/${n.targetOpportunityId}');
                      } else if (n.targetNewsId != null) {
                        context.push('/news/${n.targetNewsId}');
                      }
                    },
                  ),
                const SectionHeader(
                  title: 'Notification preferences',
                  subtitle: 'Choose what is worth interrupting you for',
                ),
                for (final c in _categories)
                  SwitchListTile(
                    value: profile.notificationPrefs[c] ?? true,
                    activeColor: AppColors.accent,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.screen),
                    title: Text(c,
                        style: Theme.of(context).textTheme.titleMedium),
                    onChanged: (v) => ref
                        .read(profileProvider.notifier)
                        .setNotificationPref(c, v),
                  ),
              ],
            ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  IconData get _icon => switch (notification.kind) {
        NotificationKind.deadline => Icons.alarm_rounded,
        NotificationKind.recommendation => Icons.auto_awesome_rounded,
        NotificationKind.news => Icons.article_outlined,
        NotificationKind.system => Icons.info_outline_rounded,
      };

  Color get _color => switch (notification.kind) {
        NotificationKind.deadline => AppColors.urgentOrange,
        NotificationKind.recommendation => AppColors.accentBright,
        NotificationKind.news => AppColors.accent,
        NotificationKind.system => AppColors.textMuted,
      };

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.screen, AppSpacing.sm, AppSpacing.screen, 0),
      child: Material(
        color: notification.read
            ? AppColors.surface
            : AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.md),
          onTap: onTap,
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(
                color: notification.read
                    ? AppColors.border
                    : AppColors.borderStrong,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(_icon, size: 18, color: _color),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(notification.title,
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 3),
                        Text(notification.body,
                            style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 6),
                        Text(
                          DeadlineUtils.relativeDate(notification.createdAt),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  if (!notification.read)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      height: 7,
                      width: 7,
                      decoration: const BoxDecoration(
                        color: AppColors.accentBright,
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
