import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/enums.dart';
import '../../../data/models/opportunity.dart';
import '../../providers/content_providers.dart';
import '../../providers/saved_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/news_card.dart';
import '../../widgets/opportunity_card.dart';
import '../../widgets/resource_card.dart';
import '../../widgets/sheets.dart';

class SavedScreen extends ConsumerStatefulWidget {
  const SavedScreen({super.key});

  @override
  ConsumerState<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends ConsumerState<SavedScreen>
    with SingleTickerProviderStateMixin {
  static const _tabs = [
    'All',
    'Hackathons',
    'Internships',
    'Research',
    'Scholarships',
    'Resources',
    'News',
  ];

  late final TabController _controller =
      TabController(length: _tabs.length, vsync: this);

  String? _activeCollection;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<Opportunity> _filterOpportunities(
      List<Opportunity> items, String tab) {
    final byCollection = _activeCollection == null
        ? items
        : items.where((o) {
            final s = ref.read(savedProvider).forItem(o.id);
            return s?.collectionIds.contains(_activeCollection) ?? false;
          }).toList();

    return switch (tab) {
      'Hackathons' => byCollection
          .where((o) => o.category == OpportunityCategory.hackathons)
          .toList(),
      'Internships' => byCollection
          .where((o) => o.category == OpportunityCategory.internships)
          .toList(),
      'Research' => byCollection
          .where((o) => o.category == OpportunityCategory.research)
          .toList(),
      'Scholarships' => byCollection
          .where((o) => o.category == OpportunityCategory.scholarships)
          .toList(),
      _ => byCollection,
    };
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(savedProvider);
    final opportunities = ref.watch(savedOpportunitiesProvider);
    final news = ref.watch(savedNewsProvider);
    final resources = ref.watch(savedResourcesProvider);

    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.screen, AppSpacing.lg, AppSpacing.screen, AppSpacing.md),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Saved',
                          style: Theme.of(context).textTheme.headlineMedium),
                      const SizedBox(height: 3),
                      Text(
                        '${state.items.length} item${state.items.length == 1 ? '' : 's'} tracked',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: () => context.push(AppRoutes.deadlines),
                  icon: const Icon(Icons.alarm_rounded, size: 17),
                  label: const Text('Deadlines'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 40),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                ),
              ],
            ),
          ),

          // collections
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding:
                  const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
              children: [
                AppFilterChip(
                  label: 'All items',
                  selected: _activeCollection == null,
                  onTap: () => setState(() => _activeCollection = null),
                ),
                for (final c in state.collections) ...[
                  const SizedBox(width: 8),
                  AppFilterChip(
                    label: '${c.emoji} ${c.name}',
                    selected: _activeCollection == c.id,
                    onTap: () => setState(() => _activeCollection =
                        _activeCollection == c.id ? null : c.id),
                  ),
                ],
                const SizedBox(width: 8),
                AppFilterChip(
                  label: 'New',
                  icon: Icons.add_rounded,
                  selected: false,
                  onTap: _createCollection,
                ),
              ],
            ),
          ),

          TabBar(
            controller: _controller,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            dividerColor: AppColors.border,
            indicatorColor: AppColors.accentBright,
            indicatorSize: TabBarIndicatorSize.label,
            labelColor: AppColors.textPrimary,
            unselectedLabelColor: AppColors.textMuted,
            labelStyle: const TextStyle(
              fontFamily: AppTheme.fontFamily,
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
            ),
            tabs: [for (final t in _tabs) Tab(text: t)],
          ),

          Expanded(
            child: state.loading
                ? const Padding(
                    padding: EdgeInsets.all(AppSpacing.screen),
                    child: ListSkeleton(count: 3),
                  )
                : TabBarView(
                    controller: _controller,
                    children: [
                      for (final tab in _tabs)
                        _TabContent(
                          tab: tab,
                          opportunities: _filterOpportunities(opportunities, tab),
                          news: news,
                          resources: resources,
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  void _createCollection() {
    final controller = TextEditingController();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm,
              AppSpacing.lg, AppSpacing.lg + MediaQuery.of(context).viewInsets.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('New collection',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: AppSpacing.lg),
              TextField(
                controller: controller,
                autofocus: true,
                decoration: const InputDecoration(
                    hintText: 'e.g. Apply This Week'),
              ),
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    final name = controller.text.trim();
                    if (name.isNotEmpty) {
                      ref
                          .read(savedProvider.notifier)
                          .createCollection(name);
                    }
                    Navigator.of(context).pop();
                  },
                  child: const Text('Create collection'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabContent extends ConsumerWidget {
  const _TabContent({
    required this.tab,
    required this.opportunities,
    required this.news,
    required this.resources,
  });

  final String tab;
  final List<Opportunity> opportunities;
  final List news;
  final List resources;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (tab == 'News') {
      if (news.isEmpty) return _empty(context, 'news');
      return ListView.separated(
        padding: const EdgeInsets.fromLTRB(AppSpacing.screen, AppSpacing.lg,
            AppSpacing.screen, AppSpacing.bottomNavInset),
        itemCount: news.length,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (_, i) => NewsCard(item: news[i]),
      );
    }

    if (tab == 'Resources') {
      if (resources.isEmpty) return _empty(context, 'resources');
      return ListView.separated(
        padding: const EdgeInsets.fromLTRB(AppSpacing.screen, AppSpacing.lg,
            AppSpacing.screen, AppSpacing.bottomNavInset),
        itemCount: resources.length,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (_, i) => ResourceCard(resource: resources[i]),
      );
    }

    if (opportunities.isEmpty) return _empty(context, 'items');

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(AppSpacing.screen, AppSpacing.lg,
          AppSpacing.screen, AppSpacing.bottomNavInset),
      itemCount: opportunities.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (_, i) {
        final o = opportunities[i];
        return Dismissible(
          key: ValueKey('saved-${o.id}'),
          direction: DismissDirection.endToStart,
          background: Container(
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 20),
            decoration: BoxDecoration(
              color: AppColors.danger.withValues(alpha: 0.14),
              borderRadius: AppRadius.card,
            ),
            child: const Icon(Icons.bookmark_remove_rounded,
                color: AppColors.danger),
          ),
          onDismissed: (_) => ref
              .read(savedProvider.notifier)
              .toggle(o.id, SavedItemType.opportunity),
          child: Column(
            children: [
              OpportunityCard(opportunity: o),
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => ReminderSheet.show(context, o),
                      icon: const Icon(Icons.alarm_rounded, size: 16),
                      label: Text(
                        ref
                                .watch(savedProvider)
                                .forItem(o.id)
                                ?.reminder
                                .label ??
                            'No reminder',
                      ),
                      style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 40)),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => CollectionSheet.show(context, o.id),
                      icon: const Icon(Icons.folder_open_rounded, size: 16),
                      label: const Text('Collection'),
                      style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 40)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _empty(BuildContext context, String what) => EmptyState(
        icon: Icons.bookmark_border_rounded,
        title: "You haven't saved any $what yet.",
        message: 'Explore opportunities and bookmark what interests you.',
        actionLabel: 'Discover',
        onAction: () => context.go(AppRoutes.discover),
      );
}
