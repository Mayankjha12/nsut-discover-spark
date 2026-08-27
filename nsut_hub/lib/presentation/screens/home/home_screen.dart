import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/deadline_utils.dart';
import '../../../data/models/opportunity.dart';
import '../../providers/behaviour_provider.dart';
import '../../providers/content_providers.dart';
import '../../providers/notification_provider.dart';
import '../../providers/profile_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/news_card.dart';
import '../../widgets/opportunity_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final greeting = ref.watch(greetingProvider);
    final opportunitiesAsync = ref.watch(allOpportunitiesProvider);
    final newsAsync = ref.watch(allNewsProvider);

    final deadlines = ref.watch(upcomingDeadlinesProvider).take(4).toList();
    final recommended = ref.watch(recommendedProvider).take(6).toList();
    final trending = ref.watch(trendingProvider);
    final recentlySaved = ref.watch(recentlySavedProvider).take(5).toList();
    final headline = ref.watch(recommendationHeadlineProvider);
    final unread = ref.watch(unreadNotificationCountProvider);

    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        color: AppColors.accentBright,
        backgroundColor: AppColors.surface,
        onRefresh: () async {
          ref.invalidate(allOpportunitiesProvider);
          ref.invalidate(allNewsProvider);
          await ref.read(allOpportunitiesProvider.future);
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: AppSpacing.bottomNavInset),
          children: [
            _Header(
              greeting: '$greeting, ${profile.firstName} 👋',
              unread: unread,
            ),

            // ---------------------------------------------- upcoming deadlines
            SectionHeader(
              title: 'Upcoming Deadlines',
              subtitle: deadlines.isEmpty
                  ? null
                  : '${deadlines.length} saved item${deadlines.length == 1 ? '' : 's'} closing soon',
              actionLabel: 'Tracker',
              onAction: () => context.push(AppRoutes.deadlines),
              padding: const EdgeInsets.fromLTRB(
                  AppSpacing.screen, AppSpacing.lg, AppSpacing.screen, AppSpacing.md),
            ),
            if (deadlines.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                child: _InlineEmpty(
                  icon: Icons.check_circle_outline_rounded,
                  message: "You're all caught up 🎉",
                  hint: 'Save an opportunity to start tracking its deadline.',
                ),
              )
            else
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                child: Column(
                  children: [
                    for (final o in deadlines)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: OpportunityListTile(opportunity: o),
                      ),
                  ],
                ),
              ),

            // ------------------------------------------------- recommendations
            SectionHeader(
              title: 'Recommended For You',
              subtitle: headline,
              actionLabel: 'More',
              onAction: () => context.go(AppRoutes.discover),
            ),
            opportunitiesAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                child: ListSkeleton(count: 2),
              ),
              error: (e, _) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                child: ErrorView(
                  message: e.toString(),
                  onRetry: () => ref.invalidate(allOpportunitiesProvider),
                ),
              ),
              data: (_) => _HorizontalRail(
                children: [
                  for (final s in recommended)
                    OpportunityCard(
                      opportunity: s.opportunity,
                      showReason: s.reason,
                      compactWidth: 296,
                    ),
                ],
              ),
            ),

            // --------------------------------------------------------- trending
            const SectionHeader(
              title: 'Trending',
              subtitle: 'What NSUT students are applying to right now',
            ),
            _HorizontalRail(
              children: [
                for (final o in trending.take(6))
                  OpportunityCard(opportunity: o, compactWidth: 296),
              ],
            ),

            // -------------------------------------------------------- NSUT news
            SectionHeader(
              title: 'NSUT News',
              actionLabel: 'All news',
              onAction: () => context.push(AppRoutes.news),
            ),
            newsAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                child: ListSkeleton(count: 2),
              ),
              error: (e, _) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                child: ErrorView(
                  message: e.toString(),
                  onRetry: () => ref.invalidate(allNewsProvider),
                ),
              ),
              data: (news) => Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                child: Column(
                  children: [
                    for (final n in news.take(3))
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: NewsCard(item: n, compact: true),
                      ),
                  ],
                ),
              ),
            ),

            // ------------------------------------------------------ quick tools
            const SectionHeader(title: 'Quick Tools'),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
              child: Row(
                children: [
                  _ToolCard(
                    label: 'SGPA',
                    icon: Icons.calculate_rounded,
                    onTap: () => context.go(AppRoutes.tools),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  _ToolCard(
                    label: 'CGPA',
                    icon: Icons.stacked_line_chart_rounded,
                    onTap: () => context.go(AppRoutes.tools),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  _ToolCard(
                    label: 'Predictor',
                    icon: Icons.trending_up_rounded,
                    onTap: () => context.go(AppRoutes.tools),
                  ),
                ],
              ),
            ),

            // --------------------------------------------------- recently saved
            SectionHeader(
              title: 'Recently Saved',
              actionLabel: 'Saved',
              onAction: () => context.go(AppRoutes.saved),
            ),
            if (recentlySaved.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                child: _InlineEmpty(
                  icon: Icons.bookmark_border_rounded,
                  message: "You haven't saved anything yet.",
                  hint: 'Explore opportunities and bookmark what interests you.',
                ),
              )
            else
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                child: Column(
                  children: [
                    for (final o in recentlySaved)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: OpportunityListTile(opportunity: o),
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

class _Header extends ConsumerWidget {
  const _Header({required this.greeting, required this.unread});

  final String greeting;
  final int unread;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.screen, AppSpacing.lg, AppSpacing.screen, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(greeting,
                        style: Theme.of(context).textTheme.headlineMedium),
                    const SizedBox(height: 4),
                    Text("Here's what's worth checking out.",
                        style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
              _IconAction(
                icon: Icons.notifications_none_rounded,
                badge: unread,
                onTap: () => context.push(AppRoutes.notifications),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _SearchEntry(
            onTap: () {
              ref.read(behaviourNotifierProvider.notifier);
              context.push(AppRoutes.search);
            },
          ),
        ],
      ),
    );
  }
}

class _SearchEntry extends StatelessWidget {
  const _SearchEntry({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
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
          child: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            child: Row(
              children: [
                Icon(Icons.search_rounded, size: 19, color: AppColors.textMuted),
                SizedBox(width: 10),
                Text(
                  'Search hackathons, internships…',
                  style: TextStyle(
                    fontFamily: AppTheme.fontFamily,
                    fontSize: 14,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _IconAction extends StatelessWidget {
  const _IconAction({required this.icon, required this.onTap, this.badge = 0});

  final IconData icon;
  final VoidCallback onTap;
  final int badge;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Material(
          color: AppColors.surface,
          shape: const CircleBorder(
              side: BorderSide(color: AppColors.border)),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Icon(icon, size: 20, color: AppColors.textPrimary),
            ),
          ),
        ),
        if (badge > 0)
          Positioned(
            right: 2,
            top: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: AppColors.danger,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.background, width: 1.5),
              ),
              child: Text(
                '$badge',
                style: const TextStyle(
                  fontFamily: AppTheme.fontFamily,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _HorizontalRail extends StatelessWidget {
  const _HorizontalRail({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: AppSpacing.screen),
        child: _InlineEmpty(
          icon: Icons.explore_outlined,
          message: 'Nothing here yet.',
          hint: 'Pull down to refresh.',
        ),
      );
    }
    return SizedBox(
      height: 320,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
        itemCount: children.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
        itemBuilder: (_, i) => children[i],
      ),
    );
  }
}

class _ToolCard extends StatelessWidget {
  const _ToolCard({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
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
              padding: const EdgeInsets.symmetric(vertical: 18),
              child: Column(
                children: [
                  Icon(icon, size: 21, color: AppColors.accentBright),
                  const SizedBox(height: 8),
                  Text(label,
                      style: Theme.of(context).textTheme.titleSmall),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _InlineEmpty extends StatelessWidget {
  const _InlineEmpty({
    required this.icon,
    required this.message,
    required this.hint,
  });

  final IconData icon;
  final String message;
  final String hint;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.textMuted),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(message,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 2),
                Text(hint, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
