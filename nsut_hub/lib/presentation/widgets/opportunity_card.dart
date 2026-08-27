import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/deadline_utils.dart';
import '../../data/models/enums.dart';
import '../../data/models/opportunity.dart';
import '../providers/behaviour_provider.dart';
import 'common.dart';
import 'save_button.dart';

/// The single card used everywhere an opportunity appears.
class OpportunityCard extends ConsumerWidget {
  const OpportunityCard({
    super.key,
    required this.opportunity,
    this.showReason,
    this.compactWidth,
  });

  final Opportunity opportunity;
  final String? showReason;

  /// Set when the card lives in a horizontal rail.
  final double? compactWidth;

  void _open(BuildContext context, WidgetRef ref) {
    ref.read(behaviourNotifierProvider.notifier).recordView(opportunity);
    context.push('/opportunity/${opportunity.id}');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final o = opportunity;
    final deadline = DeadlineUtils.describe(o.deadline);
    final categoryColor = AppColors.forCategory(o.category.label);

    final card = Material(
      color: AppColors.surface,
      borderRadius: AppRadius.card,
      child: InkWell(
        onTap: () => _open(context, ref),
        borderRadius: AppRadius.card,
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: AppRadius.card,
            border: Border.all(color: AppColors.border),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TagPill(
                      label: o.category.singular,
                      color: categoryColor,
                      filled: true,
                      dense: true,
                    ),
                    const Spacer(),
                    SaveButton(
                      itemId: o.id,
                      type: SavedItemType.opportunity,
                      compact: true,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  o.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 3),
                Text(
                  o.organization,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (o.rewardLabel != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    children: [
                      Icon(
                        o.stipend != null
                            ? Icons.payments_outlined
                            : Icons.emoji_events_outlined,
                        size: 15,
                        color: AppColors.accentBright,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          o.rewardLabel!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontFamily: AppTheme.fontFamily,
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: AppColors.accentBright,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    TagPill(
                      label: o.mode.label,
                      icon: o.mode == EventMode.online
                          ? Icons.language_rounded
                          : Icons.place_outlined,
                      dense: true,
                    ),
                    if (o.isHackathon)
                      TagPill(label: o.teamSizeLabel, dense: true),
                    if (o.beginnerFriendly)
                      const TagPill(
                        label: 'Beginner friendly',
                        color: AppColors.success,
                        filled: true,
                        dense: true,
                      ),
                    ...o.tags.take(2).map((t) => TagPill(label: t, dense: true)),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: deadline.color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 7),
                    Expanded(
                      child: Text(
                        DeadlineUtils.closesIn(o.deadline),
                        style: TextStyle(
                          fontFamily: AppTheme.fontFamily,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: deadline.color,
                        ),
                      ),
                    ),
                    Text(
                      o.location,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                if (showReason != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(
                      color: AppColors.accentSoft,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.auto_awesome_rounded,
                            size: 13, color: AppColors.accentBright),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            showReason!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: AppTheme.fontFamily,
                              fontSize: 11.5,
                              color: AppColors.accentBright,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.lg),
                Row(
                  children: [
                    Expanded(
                      child: SaveButton(
                        itemId: o.id,
                        type: SavedItemType.opportunity,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: FilledButton(
                        onPressed: () => _open(context, ref),
                        child: const Text('View'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (compactWidth == null) return card;
    return SizedBox(width: compactWidth, child: card);
  }
}

/// Dense single-line row used in deadline lists and search results.
class OpportunityListTile extends ConsumerWidget {
  const OpportunityListTile({
    super.key,
    required this.opportunity,
    this.trailing,
  });

  final Opportunity opportunity;
  final Widget? trailing;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deadline = DeadlineUtils.describe(opportunity.deadline);
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.md),
        onTap: () {
          ref.read(behaviourNotifierProvider.notifier).recordView(opportunity);
          context.push('/opportunity/${opportunity.id}');
        },
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            child: Row(
              children: [
                Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(
                    color: deadline.color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        opportunity.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${deadline.label} · ${opportunity.category.singular}',
                        style: TextStyle(
                          fontFamily: AppTheme.fontFamily,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: deadline.color,
                        ),
                      ),
                    ],
                  ),
                ),
                trailing ??
                    SaveButton(
                      itemId: opportunity.id,
                      type: SavedItemType.opportunity,
                      compact: true,
                    ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
