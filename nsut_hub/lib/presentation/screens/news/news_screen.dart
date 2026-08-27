import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/enums.dart';
import '../../providers/content_providers.dart';
import '../../widgets/common.dart';
import '../../widgets/news_card.dart';

class NewsScreen extends ConsumerStatefulWidget {
  const NewsScreen({super.key});

  @override
  ConsumerState<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends ConsumerState<NewsScreen> {
  NewsCategory? _category;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(allNewsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('NSUT News')),
      body: Column(
        children: [
          SizedBox(
            height: 46,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding:
                  const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
              children: [
                Center(
                  child: AppFilterChip(
                    label: 'All',
                    selected: _category == null,
                    onTap: () => setState(() => _category = null),
                  ),
                ),
                for (final c in NewsCategory.values) ...[
                  const SizedBox(width: 8),
                  Center(
                    child: AppFilterChip(
                      label: c.label,
                      selected: _category == c,
                      onTap: () => setState(
                          () => _category = _category == c ? null : c),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Expanded(
            child: async.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(AppSpacing.screen),
                child: ListSkeleton(),
              ),
              error: (e, _) => ErrorView(
                message: e.toString(),
                onRetry: () => ref.invalidate(allNewsProvider),
              ),
              data: (all) {
                final items = _category == null
                    ? all
                    : all.where((n) => n.category == _category).toList();
                if (items.isEmpty) {
                  return const EmptyState(
                    icon: Icons.article_outlined,
                    title: 'No updates in this category',
                    message: 'Check back after the next official notice.',
                  );
                }
                return RefreshIndicator(
                  color: AppColors.accentBright,
                  backgroundColor: AppColors.surface,
                  onRefresh: () async {
                    ref.invalidate(allNewsProvider);
                    await ref.read(allNewsProvider.future);
                  },
                  child: ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(AppSpacing.screen),
                    itemCount: items.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.md),
                    itemBuilder: (_, i) => NewsCard(item: items[i]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
