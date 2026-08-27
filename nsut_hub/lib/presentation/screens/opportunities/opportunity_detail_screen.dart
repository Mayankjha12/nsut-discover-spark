import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/deadline_utils.dart';
import '../../../data/models/enums.dart';
import '../../../data/models/opportunity.dart';
import '../../providers/behaviour_provider.dart';
import '../../providers/content_providers.dart';
import '../../providers/saved_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/save_button.dart';
import '../../widgets/sheets.dart';

class OpportunityDetailScreen extends ConsumerStatefulWidget {
  const OpportunityDetailScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<OpportunityDetailScreen> createState() =>
      _OpportunityDetailScreenState();
}

class _OpportunityDetailScreenState
    extends ConsumerState<OpportunityDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final async = ref.watch(opportunityByIdProvider(widget.id));

    return Scaffold(
      body: async.when(
        loading: () => const SafeArea(
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.screen),
            child: ListSkeleton(count: 3),
          ),
        ),
        error: (e, _) => SafeArea(
          child: ErrorView(
            message: e.toString(),
            onRetry: () => ref.invalidate(opportunityByIdProvider(widget.id)),
          ),
        ),
        data: (o) {
          if (o == null) {
            return const SafeArea(
              child: EmptyState(
                icon: Icons.help_outline_rounded,
                title: 'This opportunity is no longer listed',
                message: 'It may have closed or been removed by the source.',
              ),
            );
          }
          return _Content(opportunity: o);
        },
      ),
    );
  }
}

class _Content extends ConsumerStatefulWidget {
  const _Content({required this.opportunity});

  final Opportunity opportunity;

  @override
  ConsumerState<_Content> createState() => _ContentState();
}

class _ContentState extends ConsumerState<_Content> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(behaviourNotifierProvider.notifier)
          .recordView(widget.opportunity);
      ref.read(savedProvider.notifier).markOpened(widget.opportunity.id);
    });
  }

  Future<void> _apply() async {
    final uri = Uri.tryParse(widget.opportunity.applyUrl);
    if (uri == null) return;
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Couldn't open the application page.")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.opportunity;
    final deadline = DeadlineUtils.describe(o.deadline);
    final saved = ref.watch(isSavedProvider(o.id));
    final categoryColor = AppColors.forCategory(o.category.label);

    return Column(
      children: [
        Expanded(
          child: CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                backgroundColor: AppColors.background,
                surfaceTintColor: Colors.transparent,
                title: Text(o.category.singular,
                    style: Theme.of(context).textTheme.titleMedium),
                actions: [
                  SaveButton(
                    itemId: o.id,
                    type: SavedItemType.opportunity,
                    compact: true,
                  ),
                  const SizedBox(width: 8),
                ],
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.screen, 0,
                    AppSpacing.screen, AppSpacing.xxl),
                sliver: SliverList.list(children: [
                  // deadline banner — always highly visible
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: deadline.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(
                          color: deadline.color.withValues(alpha: 0.42)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.schedule_rounded,
                            size: 17, color: deadline.color),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Text(
                            deadline.isPassed
                                ? 'Applications closed'
                                : 'Deadline in ${deadline.label.toLowerCase()}',
                            style: TextStyle(
                              fontFamily: AppTheme.fontFamily,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: deadline.color,
                            ),
                          ),
                        ),
                        Text(
                          DeadlineUtils.formatDate(o.deadline),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(o.title,
                      style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.corporate_fare_rounded,
                          size: 15, color: categoryColor),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(o.organization,
                            style: Theme.of(context).textTheme.bodyLarge),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  _FactGrid(opportunity: o),
                  if (o.tags.isNotEmpty || o.skills.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.lg),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        for (final t in o.tags)
                          TagPill(label: t, color: categoryColor, filled: true),
                        for (final s in o.skills) TagPill(label: s),
                      ],
                    ),
                  ],
                  const SizedBox(height: AppSpacing.xl),
                  _Section(
                    title: 'About',
                    child: Text(
                      o.about.isEmpty ? o.description : o.about,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ),
                  _Section(
                    title: 'Eligibility',
                    child: Text(o.eligibility,
                        style: Theme.of(context).textTheme.bodyLarge),
                  ),
                  if (o.timeline.isNotEmpty)
                    _Section(
                      title: 'Timeline',
                      child: Column(
                        children: [
                          for (var i = 0; i < o.timeline.length; i++)
                            _TimelineRow(
                              entry: o.timeline[i],
                              isLast: i == o.timeline.length - 1,
                            ),
                        ],
                      ),
                    ),
                  if (o.requirements.isNotEmpty)
                    _Section(
                      title: 'Requirements',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          for (final r in o.requirements)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 9),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Padding(
                                    padding: EdgeInsets.only(top: 6),
                                    child: Icon(Icons.circle,
                                        size: 5, color: AppColors.accentBright),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(r,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyLarge),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  _Section(
                    title: 'Source',
                    child: Row(
                      children: [
                        const Icon(Icons.link_rounded,
                            size: 15, color: AppColors.textMuted),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Listed via ${o.source}',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (saved) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => ReminderSheet.show(context, o),
                            icon: const Icon(Icons.alarm_rounded, size: 18),
                            label: const Text('Set Reminder'),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () =>
                                CollectionSheet.show(context, o.id),
                            icon: const Icon(Icons.folder_open_rounded, size: 18),
                            label: const Text('Collection'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ]),
              ),
            ],
          ),
        ),
        _StickyActions(opportunity: o, onApply: _apply),
      ],
    );
  }
}

class _StickyActions extends StatelessWidget {
  const _StickyActions({required this.opportunity, required this.onApply});

  final Opportunity opportunity;
  final VoidCallback onApply;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.screen, AppSpacing.md, AppSpacing.screen, AppSpacing.md),
          child: Row(
            children: [
              Expanded(
                flex: 2,
                child: SaveButton(
                  itemId: opportunity.id,
                  type: SavedItemType.opportunity,
                  label: 'Save',
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                flex: 3,
                child: FilledButton.icon(
                  onPressed: onApply,
                  icon: const Icon(Icons.open_in_new_rounded, size: 18),
                  label: const Text('Apply Now'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FactGrid extends StatelessWidget {
  const _FactGrid({required this.opportunity});

  final Opportunity opportunity;

  @override
  Widget build(BuildContext context) {
    final o = opportunity;
    final facts = <(IconData, String, String)>[
      (Icons.place_outlined, 'Location', o.location),
      (Icons.language_rounded, 'Mode', o.mode.label),
      if (o.duration != null)
        (Icons.timelapse_rounded, 'Duration', o.duration!),
      if (o.rewardLabel != null)
        (
          o.stipend != null ? Icons.payments_outlined : Icons.emoji_events_outlined,
          o.stipend != null ? 'Stipend' : 'Prize',
          o.rewardLabel!
        ),
      if (o.isHackathon) (Icons.groups_rounded, 'Team', o.teamSizeLabel),
      (Icons.category_rounded, 'Category', o.category.label),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: Column(
        children: [
          for (var i = 0; i < facts.length; i++)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 11),
              decoration: BoxDecoration(
                border: i == facts.length - 1
                    ? null
                    : const Border(
                        bottom: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  Icon(facts[i].$1, size: 15, color: AppColors.textMuted),
                  const SizedBox(width: 10),
                  Text(facts[i].$2,
                      style: Theme.of(context).textTheme.bodyMedium),
                  const Spacer(),
                  Flexible(
                    child: Text(
                      facts[i].$3,
                      textAlign: TextAlign.right,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          child,
        ],
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({required this.entry, required this.isLast});

  final TimelineEntry entry;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final done = entry.done || entry.date.isBefore(DateTime.now());
    final color = done ? AppColors.textMuted : AppColors.accentBright;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 4),
                height: 11,
                width: 11,
                decoration: BoxDecoration(
                  color: done ? AppColors.surfaceElevated : color,
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 1.5),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(width: 1.4, color: AppColors.border),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(entry.label,
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 2),
                  Text(DeadlineUtils.formatDate(entry.date),
                      style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
