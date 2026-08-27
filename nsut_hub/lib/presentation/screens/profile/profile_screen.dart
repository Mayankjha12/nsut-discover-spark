import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/enums.dart';
import '../../providers/content_providers.dart';
import '../../providers/profile_provider.dart';
import '../../providers/saved_provider.dart';
import '../../widgets/common.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final saved = ref.watch(savedProvider);
    final tracked = saved.items.where((i) => i.reminder != ReminderOption.none).length;
    final opened = saved.items.where((i) => i.opened).length;
    final deadlines = ref.watch(upcomingDeadlinesProvider).length;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.only(bottom: AppSpacing.bottomNavInset),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.screen,
                AppSpacing.lg, AppSpacing.screen, AppSpacing.lg),
            child: Row(
              children: [
                Container(
                  height: 58,
                  width: 58,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceElevated,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.borderStrong),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    profile.firstName.characters.first.toUpperCase(),
                    style: const TextStyle(
                      fontFamily: AppTheme.fontFamily,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: AppColors.accentBright,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.lg),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(profile.name,
                          style: Theme.of(context).textTheme.headlineSmall),
                      const SizedBox(height: 3),
                      Text(
                        '${profile.branch.label} · ${profile.yearLabel}',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      if (profile.email != null)
                        Text(profile.email!,
                            style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => context.push(AppRoutes.onboarding),
                  icon: const Icon(Icons.edit_outlined, size: 19),
                ),
              ],
            ),
          ),

          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: Row(
              children: [
                _Stat(label: 'Saved', value: '${saved.items.length}'),
                const SizedBox(width: AppSpacing.sm),
                _Stat(label: 'Tracked', value: '$tracked'),
                const SizedBox(width: AppSpacing.sm),
                _Stat(label: 'Opened', value: '$opened'),
              ],
            ),
          ),

          const SectionHeader(title: 'Interests'),
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final i in Interests.all)
                  AppFilterChip(
                    label: i,
                    selected: profile.interests.contains(i),
                    onTap: () =>
                        ref.read(profileProvider.notifier).toggleInterest(i),
                  ),
              ],
            ),
          ),

          const SectionHeader(title: 'Explore'),
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: Column(
              children: [
                _Row(
                  icon: Icons.code_rounded,
                  label: 'Hackathons',
                  onTap: () => context.push(AppRoutes.hackathons),
                ),
                _Row(
                  icon: Icons.work_outline_rounded,
                  label: 'Opportunities',
                  onTap: () => context.push(AppRoutes.opportunities),
                ),
                _Row(
                  icon: Icons.article_outlined,
                  label: 'NSUT News',
                  onTap: () => context.push(AppRoutes.news),
                ),
                _Row(
                  icon: Icons.folder_copy_outlined,
                  label: 'Resources',
                  onTap: () => context.push(AppRoutes.resources),
                ),
                _Row(
                  icon: Icons.alarm_rounded,
                  label: 'Deadline Tracker',
                  trailing: '$deadlines',
                  onTap: () => context.push(AppRoutes.deadlines),
                ),
              ],
            ),
          ),

          const SectionHeader(title: 'Settings'),
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: Column(
              children: [
                _Row(
                  icon: Icons.notifications_none_rounded,
                  label: 'Notifications',
                  onTap: () => context.push(AppRoutes.notifications),
                ),
                _Row(
                  icon: Icons.alarm_add_rounded,
                  label: 'Reminder preference',
                  trailing: profile.defaultReminder.label,
                  onTap: () => _pickReminder(context, ref),
                ),
                _Row(
                  icon: Icons.tune_rounded,
                  label: 'Personalization',
                  onTap: () => context.push(AppRoutes.onboarding),
                ),
                _Row(
                  icon: Icons.dark_mode_outlined,
                  label: 'Theme',
                  trailing: 'Dark',
                  onTap: () {},
                ),
                _Row(
                  icon: Icons.account_circle_outlined,
                  label: 'Account',
                  trailing: 'Demo mode',
                  onTap: () {},
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.xl),
          Center(
            child: Column(
              children: [
                Text('${AppConfig.appName} · ${AppConfig.tagline}',
                    style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 2),
                Text('v1.0.0 · demo data',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _pickReminder(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final r in ReminderOption.values)
              ListTile(
                title: Text(r.label,
                    style: Theme.of(context).textTheme.titleMedium),
                onTap: () {
                  ref.read(profileProvider.notifier).setDefaultReminder(r);
                  Navigator.of(context).pop();
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(value,
                style: const TextStyle(
                  fontFamily: AppTheme.fontFamily,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.accentBright,
                )),
            const SizedBox(height: 3),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.md),
          onTap: onTap,
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: AppColors.border),
            ),
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
              child: Row(
                children: [
                  Icon(icon, size: 18, color: AppColors.accentBright),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(label,
                        style: Theme.of(context).textTheme.titleMedium),
                  ),
                  if (trailing != null)
                    Text(trailing!,
                        style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(width: 6),
                  const Icon(Icons.chevron_right_rounded,
                      size: 18, color: AppColors.textMuted),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
