import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/enums.dart';
import '../../data/models/news_item.dart';
import '../../data/models/opportunity.dart';
import '../../data/models/resource_item.dart';
import '../../data/repositories/opportunity_repository.dart';
import '../../data/repositories/resource_repository.dart';
import '../../domain/services/recommendation_service.dart';
import 'behaviour_provider.dart';
import 'profile_provider.dart';
import 'repository_providers.dart';
import 'saved_provider.dart';

/// Everything, unfiltered. Home rails, search and recommendations derive from
/// this single cached read.
final allOpportunitiesProvider = FutureProvider<List<Opportunity>>((ref) {
  return ref
      .watch(opportunityRepositoryProvider)
      .fetch(const OpportunityQuery(pageSize: 500));
});

final allNewsProvider = FutureProvider<List<NewsItem>>((ref) {
  return ref.watch(newsRepositoryProvider).fetch();
});

final allResourcesProvider = FutureProvider<List<ResourceItem>>((ref) {
  return ref.watch(resourceRepositoryProvider).fetch(const ResourceQuery());
});

final opportunityByIdProvider =
    FutureProvider.family<Opportunity?, String>((ref, id) {
  return ref.watch(opportunityRepositoryProvider).byId(id);
});

final newsByIdProvider = FutureProvider.family<NewsItem?, String>((ref, id) {
  return ref.watch(newsRepositoryProvider).byId(id);
});

/// ------------------------------------------------------------------ discover

class DiscoverFilters {
  const DiscoverFilters({this.query = const OpportunityQuery()});
  final OpportunityQuery query;
}

final discoverQueryProvider =
    StateProvider<OpportunityQuery>((ref) => const OpportunityQuery());

final discoverResultsProvider = FutureProvider<List<Opportunity>>((ref) {
  final query = ref.watch(discoverQueryProvider);
  return ref.watch(opportunityRepositoryProvider).fetch(query);
});

/// ---------------------------------------------------------------- hackathons

final hackathonQueryProvider = StateProvider<OpportunityQuery>(
  (ref) => const OpportunityQuery(
    categories: {OpportunityCategory.hackathons},
    pageSize: 100,
  ),
);

final hackathonResultsProvider = FutureProvider<List<Opportunity>>((ref) {
  final query = ref.watch(hackathonQueryProvider);
  return ref.watch(opportunityRepositoryProvider).fetch(query);
});

/// ------------------------------------------------------------------ rankings

final recommendedProvider = Provider<List<ScoredOpportunity>>((ref) {
  final all = ref.watch(allOpportunitiesProvider).valueOrNull ?? const [];
  final profile = ref.watch(profileProvider);
  final signals = ref.watch(behaviourSignalsProvider);
  return ref
      .watch(recommendationServiceProvider)
      .rank(items: all, profile: profile, signals: signals);
});

final recommendationHeadlineProvider = Provider<String>((ref) {
  return ref.watch(recommendationServiceProvider).headline(
        ref.watch(profileProvider),
        ref.watch(behaviourSignalsProvider),
      );
});

final trendingProvider = Provider<List<Opportunity>>((ref) {
  final all = [...(ref.watch(allOpportunitiesProvider).valueOrNull ?? const [])]
    ..removeWhere((o) => o.deadline.isBefore(DateTime.now()));
  all.sort((a, b) => b.popularity.compareTo(a.popularity));
  return all.take(8).toList();
});

final closingSoonProvider = Provider<List<Opportunity>>((ref) {
  final now = DateTime.now();
  final all = [...(ref.watch(allOpportunitiesProvider).valueOrNull ?? const [])]
      .where((o) =>
          !o.deadline.isBefore(now) && o.deadline.difference(now).inDays <= 7)
      .toList()
    ..sort((a, b) => a.deadline.compareTo(b.deadline));
  return all;
});

final newestProvider = Provider<List<Opportunity>>((ref) {
  final all = [...(ref.watch(allOpportunitiesProvider).valueOrNull ?? const [])]
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  return all.take(10).toList();
});

/// -------------------------------------------------------- saved + deadlines

/// Saved opportunities resolved to full objects, sorted by deadline.
final savedOpportunitiesProvider = Provider<List<Opportunity>>((ref) {
  final saved = ref.watch(savedProvider).items;
  final all = ref.watch(allOpportunitiesProvider).valueOrNull ?? const [];
  final ids = saved
      .where((s) => s.type == SavedItemType.opportunity)
      .map((s) => s.itemId)
      .toSet();
  final items = all.where((o) => ids.contains(o.id)).toList()
    ..sort((a, b) => a.deadline.compareTo(b.deadline));
  return items;
});

final savedNewsProvider = Provider<List<NewsItem>>((ref) {
  final ids = ref
      .watch(savedProvider)
      .items
      .where((s) => s.type == SavedItemType.news)
      .map((s) => s.itemId)
      .toSet();
  final all = ref.watch(allNewsProvider).valueOrNull ?? const [];
  return all.where((n) => ids.contains(n.id)).toList();
});

final savedResourcesProvider = Provider<List<ResourceItem>>((ref) {
  final ids = ref
      .watch(savedProvider)
      .items
      .where((s) => s.type == SavedItemType.resource)
      .map((s) => s.itemId)
      .toSet();
  final all = ref.watch(allResourcesProvider).valueOrNull ?? const [];
  return all.where((r) => ids.contains(r.id)).toList();
});

/// Upcoming deadlines from saved items only — the tracker's data source.
final upcomingDeadlinesProvider = Provider<List<Opportunity>>((ref) {
  final now = DateTime.now();
  return ref
      .watch(savedOpportunitiesProvider)
      .where((o) => !o.deadline.isBefore(DateTime(now.year, now.month, now.day)))
      .toList();
});

/// Recently saved, newest first.
final recentlySavedProvider = Provider<List<Opportunity>>((ref) {
  final saved = [...ref.watch(savedProvider).items]
    ..sort((a, b) => b.savedAt.compareTo(a.savedAt));
  final all = ref.watch(allOpportunitiesProvider).valueOrNull ?? const [];
  final out = <Opportunity>[];
  for (final s in saved) {
    if (s.type != SavedItemType.opportunity) continue;
    final match = all.where((o) => o.id == s.itemId);
    if (match.isNotEmpty) out.add(match.first);
  }
  return out;
});
