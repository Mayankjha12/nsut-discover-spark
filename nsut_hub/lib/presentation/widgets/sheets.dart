import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/enums.dart';
import '../../data/models/opportunity.dart';
import '../providers/saved_provider.dart';

/// Reminder picker — 1 day / 3 days / 1 week / custom / none.
class ReminderSheet extends ConsumerWidget {
  const ReminderSheet({super.key, required this.opportunity});

  final Opportunity opportunity;

  static Future<void> show(BuildContext context, Opportunity o) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => ReminderSheet(opportunity: o),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedProvider).forItem(opportunity.id);
    final current = saved?.reminder ?? ReminderOption.none;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Set reminder',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            Text(opportunity.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: AppSpacing.lg),
            ...ReminderOption.values.map((option) {
              final selected = option == current;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Material(
                  color: selected
                      ? AppColors.accentSoft
                      : AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    onTap: () async {
                      DateTime? custom;
                      if (option == ReminderOption.custom) {
                        custom = await showDatePicker(
                          context: context,
                          firstDate: DateTime.now(),
                          lastDate: opportunity.deadline,
                          initialDate: DateTime.now(),
                        );
                        if (custom == null) return;
                      }
                      await ref.read(savedProvider.notifier).setReminder(
                            opportunity,
                            option,
                            customAt: custom,
                          );
                      if (context.mounted) Navigator.of(context).pop();
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 14),
                      child: Row(
                        children: [
                          Icon(
                            selected
                                ? Icons.radio_button_checked_rounded
                                : Icons.radio_button_off_rounded,
                            size: 19,
                            color: selected
                                ? AppColors.accentBright
                                : AppColors.textMuted,
                          ),
                          const SizedBox(width: 12),
                          Text(option.label,
                              style:
                                  Theme.of(context).textTheme.titleMedium),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

/// Move a saved item into one or more collections; also creates new ones.
class CollectionSheet extends ConsumerStatefulWidget {
  const CollectionSheet({super.key, required this.itemId});

  final String itemId;

  static Future<void> show(BuildContext context, String itemId) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => CollectionSheet(itemId: itemId),
    );
  }

  @override
  ConsumerState<CollectionSheet> createState() => _CollectionSheetState();
}

class _CollectionSheetState extends ConsumerState<CollectionSheet> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(savedProvider);
    final item = state.forItem(widget.itemId);

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.lg,
          AppSpacing.sm,
          AppSpacing.lg,
          AppSpacing.lg + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add to collection',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: AppSpacing.lg),
            ...state.collections.map((c) {
              final inCollection =
                  item?.collectionIds.contains(c.id) ?? false;
              return CheckboxListTile(
                value: inCollection,
                dense: true,
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.trailing,
                activeColor: AppColors.accent,
                title: Text('${c.emoji}  ${c.name}',
                    style: Theme.of(context).textTheme.titleMedium),
                onChanged: (v) {
                  ref.read(savedProvider.notifier).moveToCollection(
                        widget.itemId,
                        c.id,
                        add: v ?? false,
                      );
                },
              );
            }),
            const Divider(height: AppSpacing.xl),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration:
                        const InputDecoration(hintText: 'New collection name'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                FilledButton(
                  onPressed: () {
                    final name = _controller.text.trim();
                    if (name.isEmpty) return;
                    ref.read(savedProvider.notifier).createCollection(name);
                    _controller.clear();
                  },
                  child: const Text('Create'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
