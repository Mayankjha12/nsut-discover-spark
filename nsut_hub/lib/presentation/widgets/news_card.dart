import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/deadline_utils.dart';
import '../../data/models/enums.dart';
import '../../data/models/news_item.dart';
import 'common.dart';
import 'save_button.dart';

class NewsCard extends StatelessWidget {
  const NewsCard({super.key, required this.item, this.compact = false});

  final NewsItem item;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: AppRadius.card,
      child: InkWell(
        borderRadius: AppRadius.card,
        onTap: () => context.push('/news/${item.id}'),
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
                  children: [
                    TagPill(
                      label: item.category.label,
                      color: AppColors.forCategory('News'),
                      filled: true,
                      dense: true,
                    ),
                    if (item.isImportant) ...[
                      const SizedBox(width: 6),
                      const TagPill(
                        label: 'Important',
                        color: AppColors.warning,
                        filled: true,
                        dense: true,
                      ),
                    ],
                    const Spacer(),
                    Text(
                      DeadlineUtils.relativeDate(item.publishedAt),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  item.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  item.summary,
                  maxLines: compact ? 2 : 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    const Icon(Icons.corporate_fare_rounded,
                        size: 13, color: AppColors.textMuted),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        item.source,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    SaveButton(
                      itemId: item.id,
                      type: SavedItemType.news,
                      compact: true,
                    ),
                    TextButton(
                      onPressed: () => context.push('/news/${item.id}'),
                      child: const Text('Read More'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The structured extraction block shown on long official notices.
class QuickSummaryCard extends StatelessWidget {
  const QuickSummaryCard({super.key, required this.summary});

  final QuickSummary summary;

  @override
  Widget build(BuildContext context) {
    Widget row(IconData icon, String label, String value) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 15, color: AppColors.accentBright),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: Theme.of(context).textTheme.labelSmall),
                    const SizedBox(height: 2),
                    Text(value,
                        style: Theme.of(context).textTheme.bodyLarge),
                  ],
                ),
              ),
            ],
          ),
        );

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: AppRadius.card,
        border: Border.all(color: AppColors.borderStrong),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.bolt_rounded,
                  size: 17, color: AppColors.accentBright),
              const SizedBox(width: 7),
              Text('Quick Summary',
                  style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          row(Icons.help_outline_rounded, 'WHAT IS THIS?', summary.what),
          row(Icons.people_outline_rounded, 'WHO IS ELIGIBLE?', summary.who),
          if (summary.deadline != null)
            row(Icons.schedule_rounded, 'DEADLINE', summary.deadline!),
          row(Icons.task_alt_rounded, 'ACTION REQUIRED', summary.action),
        ],
      ),
    );
  }
}
