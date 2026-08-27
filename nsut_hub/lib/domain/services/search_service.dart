import '../../data/models/enums.dart';
import '../../data/models/news_item.dart';
import '../../data/models/opportunity.dart';
import '../../data/models/resource_item.dart';

class SearchGroup {
  const SearchGroup({
    required this.label,
    required this.opportunities,
    required this.news,
    required this.resources,
  });

  final String label;
  final List<Opportunity> opportunities;
  final List<NewsItem> news;
  final List<ResourceItem> resources;

  int get count => opportunities.length + news.length + resources.length;
  bool get isEmpty => count == 0;
}

class GlobalSearchResult {
  const GlobalSearchResult({required this.query, required this.groups});

  final String query;
  final List<SearchGroup> groups;

  int get total => groups.fold(0, (sum, g) => sum + g.count);
  bool get isEmpty => total == 0;
}

/// Groups results across every content type — powers the global search screen.
class SearchService {
  const SearchService();

  GlobalSearchResult search({
    required String query,
    required List<Opportunity> opportunities,
    required List<NewsItem> news,
    required List<ResourceItem> resources,
  }) {
    final q = query.toLowerCase().trim();
    if (q.isEmpty) {
      return GlobalSearchResult(query: query, groups: const []);
    }

    final matchedOpps = opportunities.where((o) => _matchOpp(o, q)).toList();
    final groups = <SearchGroup>[];

    for (final category in OpportunityCategory.values) {
      final items =
          matchedOpps.where((o) => o.category == category).toList();
      if (items.isEmpty) continue;
      groups.add(SearchGroup(
        label: category.label,
        opportunities: items,
        news: const [],
        resources: const [],
      ));
    }

    final matchedNews = news.where((n) => _matchNews(n, q)).toList();
    if (matchedNews.isNotEmpty) {
      groups.add(SearchGroup(
        label: 'News',
        opportunities: const [],
        news: matchedNews,
        resources: const [],
      ));
    }

    final matchedResources = resources.where((r) => _matchRes(r, q)).toList();
    if (matchedResources.isNotEmpty) {
      groups.add(SearchGroup(
        label: 'Resources',
        opportunities: const [],
        news: const [],
        resources: matchedResources,
      ));
    }

    groups.sort((a, b) => b.count.compareTo(a.count));
    return GlobalSearchResult(query: query, groups: groups);
  }

  static bool _matchOpp(Opportunity o, String q) =>
      o.title.toLowerCase().contains(q) ||
      o.organization.toLowerCase().contains(q) ||
      o.description.toLowerCase().contains(q) ||
      o.tags.any((t) => t.toLowerCase().contains(q)) ||
      o.skills.any((s) => s.toLowerCase().contains(q));

  static bool _matchNews(NewsItem n, String q) =>
      n.title.toLowerCase().contains(q) ||
      n.summary.toLowerCase().contains(q) ||
      n.body.toLowerCase().contains(q);

  static bool _matchRes(ResourceItem r, String q) =>
      r.title.toLowerCase().contains(q) ||
      r.subject.toLowerCase().contains(q) ||
      r.type.label.toLowerCase().contains(q) ||
      r.tags.any((t) => t.toLowerCase().contains(q));
}
