import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/behaviour_provider.dart';
import '../../providers/content_providers.dart';
import '../../providers/repository_providers.dart';
import '../../widgets/common.dart';
import '../../widgets/news_card.dart';
import '../../widgets/opportunity_card.dart';
import '../../widgets/resource_card.dart';

/// Global search across every content type, grouped by category.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key, this.initialQuery});

  final String? initialQuery;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.initialQuery ?? '');
  String _query = '';

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery ?? '';
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final opportunities =
        ref.watch(allOpportunitiesProvider).valueOrNull ?? const [];
    final news = ref.watch(allNewsProvider).valueOrNull ?? const [];
    final resources = ref.watch(allResourcesProvider).valueOrNull ?? const [];
    final recent = ref.watch(recentSearchesProvider);

    final result = ref.watch(searchServiceProvider).search(
          query: _query,
          opportunities: opportunities,
          news: news,
          resources: resources,
        );

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _controller,
          autofocus: widget.initialQuery == null,
          textInputAction: TextInputAction.search,
          style: Theme.of(context).textTheme.bodyLarge,
          decoration: const InputDecoration(
            hintText: 'Search everything…',
            filled: false,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
          ),
          onChanged: (v) => setState(() => _query = v),
          onSubmitted: (v) {
            ref.read(behaviourNotifierProvider.notifier).recordSearch(v);
            setState(() => _query = v);
          },
        ),
        actions: [
          if (_query.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.close_rounded),
              onPressed: () {
                _controller.clear();
                setState(() => _query = '');
              },
            ),
        ],
      ),
      body: _query.trim().isEmpty
          ? _RecentSearches(
              recent: recent,
              onPick: (term) {
                _controller.text = term;
                setState(() => _query = term);
              },
              onClear: () =>
                  ref.read(behaviourNotifierProvider.notifier).clearSearches(),
            )
          : result.isEmpty
              ? EmptyState(
                  icon: Icons.search_off_rounded,
                  title: 'No results for "$_query"',
                  message:
                      'Try a shorter term like "AI", "internship" or "scholarship".',
                )
              : ListView(
                  padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(AppSpacing.screen,
                          AppSpacing.md, AppSpacing.screen, AppSpacing.sm),
                      child: Text(
                        '${result.total} results across ${result.groups.length} categories',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    // group counts summary
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.screen),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final g in result.groups)
                            TagPill(
                              label: '${g.label} — ${g.count}',
                              color: AppColors.forCategory(g.label),
                              filled: true,
                            ),
                        ],
                      ),
                    ),
                    for (final g in result.groups) ...[
                      SectionHeader(title: g.label, subtitle: '${g.count} found'),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.screen),
                        child: Column(
                          children: [
                            for (final o in g.opportunities.take(4))
                              Padding(
                                padding:
                                    const EdgeInsets.only(bottom: AppSpacing.sm),
                                child: OpportunityListTile(opportunity: o),
                              ),
                            for (final n in g.news.take(3))
                              Padding(
                                padding:
                                    const EdgeInsets.only(bottom: AppSpacing.md),
                                child: NewsCard(item: n, compact: true),
                              ),
                            for (final r in g.resources.take(3))
                              Padding(
                                padding:
                                    const EdgeInsets.only(bottom: AppSpacing.md),
                                child: ResourceCard(resource: r),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
    );
  }
}

class _RecentSearches extends StatelessWidget {
  const _RecentSearches({
    required this.recent,
    required this.onPick,
    required this.onClear,
  });

  final List<String> recent;
  final ValueChanged<String> onPick;
  final VoidCallback onClear;

  static const _suggested = [
    'AI',
    'Internship',
    'Scholarship',
    'Research',
    'Open Source',
    'NSUT',
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.screen),
      children: [
        if (recent.isNotEmpty) ...[
          Row(
            children: [
              Text('Recent searches',
                  style: Theme.of(context).textTheme.titleLarge),
              const Spacer(),
              TextButton(onPressed: onClear, child: const Text('Clear')),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          for (final term in recent)
            ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: const Icon(Icons.history_rounded,
                  size: 18, color: AppColors.textMuted),
              title: Text(term,
                  style: Theme.of(context).textTheme.bodyLarge),
              onTap: () => onPick(term),
            ),
          const SizedBox(height: AppSpacing.lg),
        ],
        Text('Try searching for',
            style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppSpacing.md),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final s in _suggested)
              AppFilterChip(
                label: s,
                selected: false,
                onTap: () => onPick(s),
              ),
          ],
        ),
      ],
    );
  }
}
