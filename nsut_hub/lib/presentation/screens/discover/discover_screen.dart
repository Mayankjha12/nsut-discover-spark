import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/enums.dart';
import '../../../data/repositories/opportunity_repository.dart';
import '../../providers/behaviour_provider.dart';
import '../../providers/content_providers.dart';
import '../../widgets/common.dart';
import '../../widgets/opportunity_card.dart';

class DiscoverScreen extends ConsumerStatefulWidget {
  const DiscoverScreen({super.key});

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  int _visible = 8;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 400) {
      setState(() => _visible += 8);
    }
  }

  void _update(OpportunityQuery Function(OpportunityQuery q) mutate) {
    final notifier = ref.read(discoverQueryProvider.notifier);
    notifier.state = mutate(notifier.state);
    setState(() => _visible = 8);
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(discoverQueryProvider);
    final resultsAsync = ref.watch(discoverResultsProvider);

    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        color: AppColors.accentBright,
        backgroundColor: AppColors.surface,
        onRefresh: () async {
          ref.invalidate(discoverResultsProvider);
          await ref.read(discoverResultsProvider.future);
        },
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.screen,
                    AppSpacing.lg, AppSpacing.screen, AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('Discover',
                            style:
                                Theme.of(context).textTheme.headlineMedium),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: () => context.push(AppRoutes.hackathons),
                          icon: const Icon(Icons.code_rounded, size: 16),
                          label: const Text('Hackathons'),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    TextField(
                      controller: _controller,
                      textInputAction: TextInputAction.search,
                      style: Theme.of(context).textTheme.bodyLarge,
                      decoration: InputDecoration(
                        hintText:
                            'Search hackathons, internships, scholarships…',
                        prefixIcon: const Icon(Icons.search_rounded,
                            size: 20, color: AppColors.textMuted),
                        suffixIcon: query.search.isEmpty
                            ? null
                            : IconButton(
                                icon: const Icon(Icons.close_rounded, size: 18),
                                onPressed: () {
                                  _controller.clear();
                                  _update((q) => q.copyWith(search: ''));
                                },
                              ),
                      ),
                      onSubmitted: (value) {
                        ref
                            .read(behaviourNotifierProvider.notifier)
                            .recordSearch(value);
                        _update((q) => q.copyWith(search: value));
                      },
                      onChanged: (value) =>
                          _update((q) => q.copyWith(search: value)),
                    ),
                  ],
                ),
              ),
            ),

            // categories
            SliverToBoxAdapter(
              child: _ChipRow(
                children: [
                  AppFilterChip(
                    label: 'All',
                    selected: query.categories.isEmpty,
                    onTap: () => _update((q) => const OpportunityQuery()
                        .copyWith(search: q.search, sort: q.sort)),
                  ),
                  for (final c in OpportunityCategory.values)
                    AppFilterChip(
                      label: c.label,
                      selected: query.categories.contains(c),
                      onTap: () {
                        final next = {...query.categories};
                        next.contains(c) ? next.remove(c) : next.add(c);
                        _update((q) => q.copyWith(categories: next));
                      },
                    ),
                ],
              ),
            ),

            // mode + location filters
            SliverToBoxAdapter(
              child: _ChipRow(
                children: [
                  for (final m in [EventMode.online, EventMode.offline])
                    AppFilterChip(
                      label: m.label,
                      icon: m == EventMode.online
                          ? Icons.language_rounded
                          : Icons.place_outlined,
                      selected: query.modes.contains(m),
                      onTap: () {
                        final next = {...query.modes};
                        next.contains(m) ? next.remove(m) : next.add(m);
                        _update((q) => q.copyWith(modes: next));
                      },
                    ),
                  for (final s in LocationScope.values)
                    AppFilterChip(
                      label: s.label,
                      selected: query.scopes.contains(s),
                      onTap: () {
                        final next = {...query.scopes};
                        next.contains(s) ? next.remove(s) : next.add(s);
                        _update((q) => q.copyWith(scopes: next));
                      },
                    ),
                ],
              ),
            ),

            // sort row
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.screen,
                    AppSpacing.sm, AppSpacing.screen, AppSpacing.md),
                child: Row(
                  children: [
                    resultsAsync.when(
                      loading: () => const SkeletonBox(
                          height: 12, width: 90, radius: 999),
                      error: (_, __) => const SizedBox.shrink(),
                      data: (items) => Text(
                        '${items.length} result${items.length == 1 ? '' : 's'}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    const Spacer(),
                    _SortButton(
                      current: query.sort,
                      onSelected: (s) => _update((q) => q.copyWith(sort: s)),
                    ),
                  ],
                ),
              ),
            ),

            resultsAsync.when(
              loading: () => const SliverPadding(
                padding: EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                sliver: SliverToBoxAdapter(child: ListSkeleton(count: 4)),
              ),
              error: (e, _) => SliverFillRemaining(
                hasScrollBody: false,
                child: ErrorView(
                  message: e.toString(),
                  onRetry: () => ref.invalidate(discoverResultsProvider),
                ),
              ),
              data: (items) {
                if (items.isEmpty) {
                  return const SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(
                      icon: Icons.search_off_rounded,
                      title: 'Nothing matches those filters',
                      message:
                          'Try removing a filter or searching for something broader.',
                    ),
                  );
                }
                final shown = items.take(_visible).toList();
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                      AppSpacing.screen, 0, AppSpacing.screen,
                      AppSpacing.bottomNavInset),
                  sliver: SliverList.separated(
                    itemCount: shown.length + (shown.length < items.length ? 1 : 0),
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.md),
                    itemBuilder: (context, i) {
                      if (i >= shown.length) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: Center(
                            child: SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.accentBright,
                              ),
                            ),
                          ),
                        );
                      }
                      return OpportunityCard(opportunity: shown[i]);
                    },
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ChipRow extends StatelessWidget {
  const _ChipRow({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 42,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
        itemCount: children.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) => Center(child: children[i]),
      ),
    );
  }
}

class _SortButton extends StatelessWidget {
  const _SortButton({required this.current, required this.onSelected});

  final SortOption current;
  final ValueChanged<SortOption> onSelected;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<SortOption>(
      color: AppColors.surfaceElevated,
      position: PopupMenuPosition.under,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        side: const BorderSide(color: AppColors.border),
      ),
      onSelected: onSelected,
      itemBuilder: (_) => [
        for (final s in SortOption.values)
          PopupMenuItem(
            value: s,
            child: Row(
              children: [
                Icon(
                  s == current
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_off_rounded,
                  size: 16,
                  color:
                      s == current ? AppColors.accentBright : AppColors.textMuted,
                ),
                const SizedBox(width: 10),
                Text(s.label,
                    style: Theme.of(context).textTheme.bodyLarge),
              ],
            ),
          ),
      ],
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.swap_vert_rounded,
              size: 16, color: AppColors.accentBright),
          const SizedBox(width: 5),
          Text(
            current.label,
            style: const TextStyle(
              fontFamily: AppTheme.fontFamily,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.accentBright,
            ),
          ),
        ],
      ),
    );
  }
}
