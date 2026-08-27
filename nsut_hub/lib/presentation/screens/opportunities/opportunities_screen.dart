import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/enums.dart';
import '../../providers/content_providers.dart';
import '../../widgets/common.dart';
import '../../widgets/opportunity_card.dart';

/// Everything that is not a hackathon, grouped by category tabs.
class OpportunitiesScreen extends ConsumerStatefulWidget {
  const OpportunitiesScreen({super.key, this.initialCategory});

  final OpportunityCategory? initialCategory;

  @override
  ConsumerState<OpportunitiesScreen> createState() =>
      _OpportunitiesScreenState();
}

class _OpportunitiesScreenState extends ConsumerState<OpportunitiesScreen>
    with SingleTickerProviderStateMixin {
  static const _categories = [
    OpportunityCategory.internships,
    OpportunityCategory.research,
    OpportunityCategory.scholarships,
    OpportunityCategory.fellowships,
    OpportunityCategory.competitions,
    OpportunityCategory.openSource,
    OpportunityCategory.programs,
  ];

  late final TabController _tabs = TabController(
    length: _categories.length,
    vsync: this,
    initialIndex: widget.initialCategory == null
        ? 0
        : _categories.indexOf(widget.initialCategory!).clamp(0, _categories.length - 1),
  );

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(allOpportunitiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Opportunities'),
        bottom: TabBar(
          controller: _tabs,
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
          tabs: [for (final c in _categories) Tab(text: c.label)],
        ),
      ),
      body: async.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.screen),
          child: ListSkeleton(),
        ),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(allOpportunitiesProvider),
        ),
        data: (all) => TabBarView(
          controller: _tabs,
          children: [
            for (final c in _categories)
              Builder(builder: (context) {
                final items = all.where((o) => o.category == c).toList()
                  ..sort((a, b) => a.deadline.compareTo(b.deadline));
                if (items.isEmpty) {
                  return EmptyState(
                    icon: Icons.inbox_rounded,
                    title: 'No ${c.label.toLowerCase()} right now',
                    message:
                        'New listings are added as soon as they are published.',
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(AppSpacing.screen),
                  itemCount: items.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(height: AppSpacing.md),
                  itemBuilder: (_, i) =>
                      OpportunityCard(opportunity: items[i]),
                );
              }),
          ],
        ),
      ),
    );
  }
}
