import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/deadline_utils.dart';
import '../../../data/models/opportunity.dart';
import '../../providers/content_providers.dart';
import '../../providers/saved_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/opportunity_card.dart';
import '../../widgets/sheets.dart';

/// Deadline tracker for saved items, bucketed by urgency.
class DeadlinesScreen extends ConsumerWidget {
  const DeadlinesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(upcomingDeadlinesProvider);

    final thisWeek = items
        .where((o) => DeadlineUtils.daysLeft(o.deadline) <= 7)
        .toList();
    final thisMonth = items
        .where((o) {
          final d = DeadlineUtils.daysLeft(o.deadline);
          return d > 7 && d <= 30;
        })
        .toList();
    final later =
        items.where((o) => DeadlineUtils.daysLeft(o.deadline) > 30).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Deadline Tracker')),
      body: items.isEmpty
          ? EmptyState(
              icon: Icons.check_circle_outline_rounded,
              title: "You're all caught up 🎉",
              message:
                  'Save opportunities and their deadlines will show up here.',
              actionLabel: 'Discover opportunities',
              onAction: () => context.go(AppRoutes.discover),
            )
          : ListView(
              padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
              children: [
                if (thisWeek.isNotEmpty) ...[
                  const _GroupHeader('THIS WEEK'),
                  ...thisWeek.map((o) => _DeadlineRow(opportunity: o)),
                ],
                if (thisMonth.isNotEmpty) ...[
                  const _GroupHeader('THIS MONTH'),
                  ...thisMonth.map((o) => _DeadlineRow(opportunity: o)),
                ],
                if (later.isNotEmpty) ...[
                  const _GroupHeader('LATER'),
                  ...later.map((o) => _DeadlineRow(opportunity: o)),
                ],
              ],
            ),
    );
  }
}

class _GroupHeader extends StatelessWidget {
  const _GroupHeader(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.screen, AppSpacing.xl, AppSpacing.screen, AppSpacing.md),
      child: Text(label, style: Theme.of(context).textTheme.labelSmall),
    );
  }
}

class _DeadlineRow extends ConsumerWidget {
  const _DeadlineRow({required this.opportunity});

  final Opportunity opportunity;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final info = DeadlineUtils.describe(opportunity.deadline);
    final reminder = ref.watch(savedProvider).forItem(opportunity.id)?.reminder;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.screen, 0, AppSpacing.screen, AppSpacing.sm),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            OpportunityListTile(
              opportunity: opportunity,
              trailing: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: info.color.withValues(alpha: 0.14),
                  borderRadius: AppRadius.chip,
                ),
                child: Text(
                  info.label,
                  style: TextStyle(
                    fontFamily: AppTheme.fontFamily,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: info.color,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 8, 6),
              child: Row(
                children: [
                  const Icon(Icons.alarm_rounded,
                      size: 14, color: AppColors.textMuted),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      reminder?.label ?? 'No reminder',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  TextButton(
                    onPressed: () =>
                        ReminderSheet.show(context, opportunity),
                    child: const Text('Change'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
