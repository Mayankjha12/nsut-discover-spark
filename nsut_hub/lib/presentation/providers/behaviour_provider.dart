import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/enums.dart';
import '../../data/models/opportunity.dart';
import '../../domain/services/recommendation_service.dart';
import 'content_providers.dart';
import 'saved_provider.dart';

/// Tracks in-session behaviour: which categories get viewed and what is
/// searched. Persisting this to the backend later needs no UI change.
class BehaviourNotifier extends StateNotifier<BehaviourSignals> {
  BehaviourNotifier() : super(const BehaviourSignals());

  void recordView(Opportunity opportunity) {
    final views = {...state.viewedCategories};
    views[opportunity.category] = (views[opportunity.category] ?? 0) + 1;
    state = BehaviourSignals(
      savedTags: state.savedTags,
      viewedCategories: views,
      searches: state.searches,
    );
  }

  void recordSearch(String term) {
    if (term.trim().isEmpty) return;
    final next = [term.trim(), ...state.searches.where((s) => s != term.trim())]
        .take(8)
        .toList();
    state = BehaviourSignals(
      savedTags: state.savedTags,
      viewedCategories: state.viewedCategories,
      searches: next,
    );
  }

  void clearSearches() {
    state = BehaviourSignals(
      savedTags: state.savedTags,
      viewedCategories: state.viewedCategories,
      searches: const [],
    );
  }

  void setSavedTags(Map<String, int> tags) {
    state = BehaviourSignals(
      savedTags: tags,
      viewedCategories: state.viewedCategories,
      searches: state.searches,
    );
  }
}

final behaviourNotifierProvider =
    StateNotifierProvider<BehaviourNotifier, BehaviourSignals>(
        (ref) => BehaviourNotifier());

/// Merges in-session signals with tag weights derived from saved items.
final behaviourSignalsProvider = Provider<BehaviourSignals>((ref) {
  final base = ref.watch(behaviourNotifierProvider);
  final savedIds = ref
      .watch(savedProvider)
      .items
      .where((s) => s.type == SavedItemType.opportunity)
      .map((s) => s.itemId)
      .toSet();
  final all = ref.watch(allOpportunitiesProvider).valueOrNull ?? const [];

  final tags = <String, int>{};
  for (final o in all.where((o) => savedIds.contains(o.id))) {
    for (final t in [...o.tags, ...o.skills]) {
      final key = t.toLowerCase();
      tags[key] = (tags[key] ?? 0) + 1;
    }
  }

  return BehaviourSignals(
    savedTags: tags,
    viewedCategories: base.viewedCategories,
    searches: base.searches,
  );
});

final recentSearchesProvider = Provider<List<String>>(
    (ref) => ref.watch(behaviourNotifierProvider).searches);
