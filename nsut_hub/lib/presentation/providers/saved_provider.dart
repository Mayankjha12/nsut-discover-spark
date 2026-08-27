import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/enums.dart';
import '../../data/models/opportunity.dart';
import '../../data/models/saved_item.dart';
import '../../data/repositories/saved_repository.dart';
import '../../domain/services/notification_service.dart';
import 'repository_providers.dart';

class SavedState {
  const SavedState({
    this.items = const [],
    this.collections = const [],
    this.loading = true,
  });

  final List<SavedItem> items;
  final List<SavedCollection> collections;
  final bool loading;

  SavedState copyWith({
    List<SavedItem>? items,
    List<SavedCollection>? collections,
    bool? loading,
  }) =>
      SavedState(
        items: items ?? this.items,
        collections: collections ?? this.collections,
        loading: loading ?? this.loading,
      );

  bool isSaved(String itemId) => items.any((i) => i.itemId == itemId);

  SavedItem? forItem(String itemId) {
    for (final i in items) {
      if (i.itemId == itemId) return i;
    }
    return null;
  }

  List<SavedItem> inCollection(String collectionId) =>
      items.where((i) => i.collectionIds.contains(collectionId)).toList();
}

/// Optimistic save store: state changes immediately, persistence follows.
class SavedNotifier extends StateNotifier<SavedState> {
  SavedNotifier(this._repo, this._notifications) : super(const SavedState()) {
    _load();
  }

  final SavedRepository _repo;
  final NotificationService _notifications;

  Future<void> _load() async {
    final items = await _repo.loadItems();
    final collections = await _repo.loadCollections();
    if (!mounted) return;
    state = SavedState(items: items, collections: collections, loading: false);
  }

  /// Returns true when the item is now saved, false when it was removed.
  bool toggle(String itemId, SavedItemType type) {
    final existing = state.forItem(itemId);
    if (existing != null) {
      state = state.copyWith(
        items: state.items.where((i) => i.itemId != itemId).toList(),
      );
      _notifications.cancelReminder(itemId);
      _persistItems();
      return false;
    }
    final item = SavedItem(
      id: 'sv-${DateTime.now().microsecondsSinceEpoch}',
      itemId: itemId,
      type: type,
      savedAt: DateTime.now(),
    );
    state = state.copyWith(items: [item, ...state.items]);
    _persistItems();
    return true;
  }

  void markOpened(String itemId) {
    final existing = state.forItem(itemId);
    if (existing == null || existing.opened) return;
    _replace(existing.copyWith(opened: true));
  }

  void moveToCollection(String itemId, String collectionId, {bool add = true}) {
    final existing = state.forItem(itemId);
    if (existing == null) return;
    final ids = [...existing.collectionIds];
    if (add) {
      if (!ids.contains(collectionId)) ids.add(collectionId);
    } else {
      ids.remove(collectionId);
    }
    _replace(existing.copyWith(collectionIds: ids));
  }

  Future<void> setReminder(
    Opportunity opportunity,
    ReminderOption option, {
    DateTime? customAt,
  }) async {
    var existing = state.forItem(opportunity.id);
    if (existing == null) {
      toggle(opportunity.id, SavedItemType.opportunity);
      existing = state.forItem(opportunity.id);
    }
    if (existing == null) return;
    _replace(existing.copyWith(reminder: option, customReminderAt: customAt));
    await _notifications.scheduleDeadlineReminder(
      opportunity: opportunity,
      option: option,
      customAt: customAt,
    );
  }

  void createCollection(String name, {String emoji = '📁'}) {
    final id = name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-');
    if (state.collections.any((c) => c.id == id)) return;
    state = state.copyWith(
      collections: [...state.collections, SavedCollection(id: id, name: name, emoji: emoji)],
    );
    _repo.persistCollections(state.collections);
  }

  void deleteCollection(String id) {
    state = state.copyWith(
      collections: state.collections.where((c) => c.id != id).toList(),
      items: state.items
          .map((i) => i.copyWith(
              collectionIds:
                  i.collectionIds.where((c) => c != id).toList()))
          .toList(),
    );
    _repo.persistCollections(state.collections);
    _persistItems();
  }

  void _replace(SavedItem updated) {
    state = state.copyWith(
      items: state.items
          .map((i) => i.itemId == updated.itemId ? updated : i)
          .toList(),
    );
    _persistItems();
  }

  void _persistItems() => _repo.persistItems(state.items);
}

final savedProvider =
    StateNotifierProvider<SavedNotifier, SavedState>((ref) {
  return SavedNotifier(
    ref.watch(savedRepositoryProvider),
    ref.watch(notificationServiceProvider),
  );
});

final isSavedProvider = Provider.family<bool, String>(
  (ref, itemId) => ref.watch(savedProvider).isSaved(itemId),
);
