import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/deadline_utils.dart';
import '../../../data/models/enums.dart';
import '../../providers/content_providers.dart';
import '../../widgets/common.dart';
import '../../widgets/news_card.dart';
import '../../widgets/save_button.dart';

class NewsDetailScreen extends ConsumerWidget {
  const NewsDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(newsByIdProvider(id));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notice'),
        actions: [
          SaveButton(itemId: id, type: SavedItemType.news, compact: true),
          const SizedBox(width: 8),
        ],
      ),
      body: async.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.screen),
          child: ListSkeleton(count: 2),
        ),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(newsByIdProvider(id)),
        ),
        data: (item) {
          if (item == null) {
            return const EmptyState(
              icon: Icons.article_outlined,
              title: 'Notice not found',
              message: 'This update may have been withdrawn.',
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.screen, AppSpacing.md,
                AppSpacing.screen, AppSpacing.xxl),
            children: [
              Row(
                children: [
                  TagPill(
                    label: item.category.label,
                    color: AppColors.forCategory('News'),
                    filled: true,
                  ),
                  const SizedBox(width: 8),
                  Text(DeadlineUtils.formatDate(item.publishedAt),
                      style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Text(item.title,
                  style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 6),
              Text('Source: ${item.source}',
                  style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: AppSpacing.xl),
              if (item.quickSummary != null) ...[
                QuickSummaryCard(summary: item.quickSummary!),
                const SizedBox(height: AppSpacing.xl),
              ],
              Text(item.body, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: AppSpacing.xl),
              SaveButton(
                itemId: item.id,
                type: SavedItemType.news,
                label: 'Save this notice',
              ),
            ],
          );
        },
      ),
    );
  }
}
