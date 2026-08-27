import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/enums.dart';
import '../../../data/models/opportunity.dart';
import '../../providers/content_providers.dart';
import '../../widgets/common.dart';
import '../../widgets/opportunity_card.dart';

/// Dedicated hackathon discovery: NSUT, Delhi/NCR, national and international.
class HackathonsScreen extends ConsumerStatefulWidget {
  const HackathonsScreen({super.key});

  @override
  ConsumerState<HackathonsScreen> createState() => _HackathonsScreenState();
}

class _HackathonsScreenState extends ConsumerState<HackathonsScreen> {
  Set<EventMode> _modes = {};
  Set<LocationScope> _scopes = {};
  String? _domain;
  bool _beginnerOnly = false;
  int? _teamSize;

  static const _domains = [
    'AI',
    'Web',
    'Blockchain',
    'Robotics',
    'FinTech',
    'Open Innovation',
  ];

  List<Opportunity> _filter(List<Opportunity> items) {
    return items.where((o) {
      if (o.category != OpportunityCategory.hackathons) return false;
      if (_modes.isNotEmpty && !_modes.contains(o.mode)) return false;
      if (_beginnerOnly && !o.beginnerFriendly) return false;
      if (_domain != null &&
          !o.tags.any((t) => t.toLowerCase().contains(_domain!.toLowerCase())) &&
          !o.skills
              .any((s) => s.toLowerCase().contains(_domain!.toLowerCase()))) {
        return false;
      }
      if (_teamSize != null) {
        final min = o.teamSizeMin ?? 1;
        final max = o.teamSizeMax ?? 1;
        if (_teamSize! < min || _teamSize! > max) return false;
      }
      if (_scopes.isNotEmpty) {
        final loc = o.location.toLowerCase();
        final matches = _scopes.any((s) => switch (s) {
              LocationScope.delhi =>
                loc.contains('delhi') || loc.contains('ncr'),
              LocationScope.india =>
                !loc.contains('global') && !loc.contains('switzerland'),
              LocationScope.international =>
                loc.contains('global') || loc.contains('switzerland'),
            });
        if (!matches) return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(allOpportunitiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hackathons'),
        actions: [
          IconButton(
            tooltip: 'Filters',
            icon: const Icon(Icons.tune_rounded),
            onPressed: _openFilters,
          ),
        ],
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
        data: (all) {
          final items = _filter(all);
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.code_off_rounded,
              title: 'No hackathons match these filters',
              message: 'Try clearing a filter to see more events.',
            );
          }

          final now = DateTime.now();
          final closingSoon = [...items]
            ..retainWhere((o) =>
                !o.deadline.isBefore(now) &&
                o.deadline.difference(now).inDays <= 7)
            ..sort((a, b) => a.deadline.compareTo(b.deadline));
          final popular = [...items]
            ..sort((a, b) => b.popularity.compareTo(a.popularity));
          final newest = [...items]
            ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
          final recommended = ref
              .watch(recommendedProvider)
              .where((s) => s.opportunity.isHackathon)
              .toList();

          return RefreshIndicator(
            color: AppColors.accentBright,
            backgroundColor: AppColors.surface,
            onRefresh: () async {
              ref.invalidate(allOpportunitiesProvider);
              await ref.read(allOpportunitiesProvider.future);
            },
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
              children: [
                _QuickFilters(
                  modes: _modes,
                  scopes: _scopes,
                  domain: _domain,
                  beginnerOnly: _beginnerOnly,
                  onModeToggle: (m) => setState(() {
                    _modes.contains(m) ? _modes.remove(m) : _modes.add(m);
                    _modes = {..._modes};
                  }),
                  onScopeToggle: (s) => setState(() {
                    _scopes.contains(s) ? _scopes.remove(s) : _scopes.add(s);
                    _scopes = {..._scopes};
                  }),
                  onDomain: (d) =>
                      setState(() => _domain = _domain == d ? null : d),
                  onBeginner: () =>
                      setState(() => _beginnerOnly = !_beginnerOnly),
                  domains: _domains,
                ),
                if (closingSoon.isNotEmpty) ...[
                  const SectionHeader(
                    title: 'Closing Soon',
                    subtitle: 'Register before the window shuts',
                  ),
                  _list(closingSoon),
                ],
                if (recommended.isNotEmpty) ...[
                  const SectionHeader(title: 'Recommended'),
                  _list(recommended.map((s) => s.opportunity).take(4).toList()),
                ],
                const SectionHeader(title: 'Popular'),
                _list(popular.take(5).toList()),
                const SectionHeader(title: 'New'),
                _list(newest.take(5).toList()),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _list(List<Opportunity> items) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
        child: Column(
          children: [
            for (final o in items)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: OpportunityCard(opportunity: o),
              ),
          ],
        ),
      );

  void _openFilters() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm,
                AppSpacing.lg, AppSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Filters',
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: AppSpacing.lg),
                Text('Team size',
                    style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final size in [1, 2, 3, 4, 6])
                      AppFilterChip(
                        label: size == 1 ? 'Solo' : '$size members',
                        selected: _teamSize == size,
                        onTap: () {
                          setSheetState(() {});
                          setState(() =>
                              _teamSize = _teamSize == size ? null : size);
                        },
                      ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                SwitchListTile(
                  value: _beginnerOnly,
                  activeColor: AppColors.accent,
                  contentPadding: EdgeInsets.zero,
                  title: Text('Beginner friendly only',
                      style: Theme.of(context).textTheme.titleMedium),
                  onChanged: (v) {
                    setSheetState(() {});
                    setState(() => _beginnerOnly = v);
                  },
                ),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Show results'),
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

class _QuickFilters extends StatelessWidget {
  const _QuickFilters({
    required this.modes,
    required this.scopes,
    required this.domain,
    required this.beginnerOnly,
    required this.onModeToggle,
    required this.onScopeToggle,
    required this.onDomain,
    required this.onBeginner,
    required this.domains,
  });

  final Set<EventMode> modes;
  final Set<LocationScope> scopes;
  final String? domain;
  final bool beginnerOnly;
  final ValueChanged<EventMode> onModeToggle;
  final ValueChanged<LocationScope> onScopeToggle;
  final ValueChanged<String> onDomain;
  final VoidCallback onBeginner;
  final List<String> domains;

  @override
  Widget build(BuildContext context) {
    Widget row(List<Widget> children) => SizedBox(
          height: 42,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            itemCount: children.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) => Center(child: children[i]),
          ),
        );

    return Column(
      children: [
        const SizedBox(height: AppSpacing.sm),
        row([
          for (final d in domains)
            AppFilterChip(
              label: d,
              selected: domain == d,
              onTap: () => onDomain(d),
            ),
        ]),
        const SizedBox(height: 6),
        row([
          for (final m in EventMode.values)
            AppFilterChip(
              label: m.label,
              selected: modes.contains(m),
              onTap: () => onModeToggle(m),
            ),
          for (final s in LocationScope.values)
            AppFilterChip(
              label: s.label,
              selected: scopes.contains(s),
              onTap: () => onScopeToggle(s),
            ),
          AppFilterChip(
            label: 'Beginner friendly',
            icon: Icons.eco_rounded,
            selected: beginnerOnly,
            onTap: onBeginner,
          ),
        ]),
      ],
    );
  }
}
