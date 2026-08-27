import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/enums.dart';
import '../../../data/models/resource_item.dart';
import '../../../data/repositories/resource_repository.dart';
import '../../providers/content_providers.dart';
import '../../widgets/common.dart';
import '../../widgets/resource_card.dart';

/// Branch → Semester → Subject navigation over the shared resource library.
class ResourcesScreen extends ConsumerStatefulWidget {
  const ResourcesScreen({super.key});

  @override
  ConsumerState<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends ConsumerState<ResourcesScreen> {
  Branch? _branch;
  int? _semester;
  String? _subject;
  ResourceType? _type;
  ResourceSort _sort = ResourceSort.mostUseful;
  String _search = '';

  List<ResourceItem> _apply(List<ResourceItem> all) {
    final q = _search.toLowerCase().trim();
    final items = all.where((r) {
      if (_branch != null && r.branch != _branch) return false;
      if (_semester != null && r.semester != _semester) return false;
      if (_subject != null && r.subject != _subject) return false;
      if (_type != null && r.type != _type) return false;
      if (q.isEmpty) return true;
      return r.title.toLowerCase().contains(q) ||
          r.subject.toLowerCase().contains(q) ||
          r.tags.any((t) => t.toLowerCase().contains(q));
    }).toList();

    switch (_sort) {
      case ResourceSort.mostUseful:
        items.sort((a, b) => b.upvotes.compareTo(a.upvotes));
      case ResourceSort.recentlyAdded:
        items.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    }
    return items;
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(allResourcesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Resources')),
      body: async.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.screen),
          child: ListSkeleton(),
        ),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(allResourcesProvider),
        ),
        data: (all) {
          final scoped = all.where((r) {
            if (_branch != null && r.branch != _branch) return false;
            if (_semester != null && r.semester != _semester) return false;
            return true;
          });
          final semesters = scoped.map((r) => r.semester).toSet().toList()
            ..sort();
          final subjects = scoped.map((r) => r.subject).toSet().toList()..sort();
          final items = _apply(all);

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.screen,
                    AppSpacing.md, AppSpacing.screen, AppSpacing.sm),
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search notes, PYQs, subjects…',
                    prefixIcon: Icon(Icons.search_rounded,
                        size: 20, color: AppColors.textMuted),
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),
              _Row(children: [
                for (final b in Branch.values)
                  AppFilterChip(
                    label: b.label,
                    selected: _branch == b,
                    onTap: () => setState(() {
                      _branch = _branch == b ? null : b;
                      _semester = null;
                      _subject = null;
                    }),
                  ),
              ]),
              if (semesters.isNotEmpty)
                _Row(children: [
                  for (final s in semesters)
                    AppFilterChip(
                      label: 'Sem $s',
                      selected: _semester == s,
                      onTap: () => setState(() {
                        _semester = _semester == s ? null : s;
                        _subject = null;
                      }),
                    ),
                ]),
              if (subjects.isNotEmpty && subjects.length > 1)
                _Row(children: [
                  for (final s in subjects)
                    AppFilterChip(
                      label: s,
                      selected: _subject == s,
                      onTap: () =>
                          setState(() => _subject = _subject == s ? null : s),
                    ),
                ]),
              _Row(children: [
                for (final t in ResourceType.values)
                  AppFilterChip(
                    label: t.label,
                    selected: _type == t,
                    onTap: () =>
                        setState(() => _type = _type == t ? null : t),
                  ),
              ]),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.screen, AppSpacing.sm, AppSpacing.screen, 0),
                child: Row(
                  children: [
                    Text('${items.length} resources',
                        style: Theme.of(context).textTheme.bodySmall),
                    const Spacer(),
                    for (final s in ResourceSort.values)
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: AppFilterChip(
                          label: s == ResourceSort.mostUseful
                              ? 'Most Useful'
                              : 'Recently Added',
                          selected: _sort == s,
                          onTap: () => setState(() => _sort = s),
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: items.isEmpty
                    ? const EmptyState(
                        icon: Icons.folder_off_outlined,
                        title: 'No resources available yet.',
                        message:
                            'Be the first to contribute notes for this subject.',
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(AppSpacing.screen),
                        itemCount: items.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: AppSpacing.md),
                        itemBuilder: (_, i) => ResourceCard(
                          resource: items[i],
                          onOpen: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                    'File opening connects to storage in the next release.'),
                              ),
                            );
                          },
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
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
