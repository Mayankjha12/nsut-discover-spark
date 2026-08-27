import '../../core/config/app_config.dart';
import '../datasources/api_client.dart';
import '../datasources/mock_opportunities.dart';
import '../models/enums.dart';
import '../models/opportunity.dart';

class OpportunityQuery {
  const OpportunityQuery({
    this.categories = const {},
    this.modes = const {},
    this.scopes = const {},
    this.search = '',
    this.sort = SortOption.recommended,
    this.beginnerFriendlyOnly = false,
    this.minTeamSize,
    this.maxTeamSize,
    this.page = 1,
    this.pageSize = 20,
  });

  final Set<OpportunityCategory> categories;
  final Set<EventMode> modes;
  final Set<LocationScope> scopes;
  final String search;
  final SortOption sort;
  final bool beginnerFriendlyOnly;
  final int? minTeamSize;
  final int? maxTeamSize;
  final int page;
  final int pageSize;

  OpportunityQuery copyWith({
    Set<OpportunityCategory>? categories,
    Set<EventMode>? modes,
    Set<LocationScope>? scopes,
    String? search,
    SortOption? sort,
    bool? beginnerFriendlyOnly,
    int? minTeamSize,
    int? maxTeamSize,
    int? page,
  }) =>
      OpportunityQuery(
        categories: categories ?? this.categories,
        modes: modes ?? this.modes,
        scopes: scopes ?? this.scopes,
        search: search ?? this.search,
        sort: sort ?? this.sort,
        beginnerFriendlyOnly: beginnerFriendlyOnly ?? this.beginnerFriendlyOnly,
        minTeamSize: minTeamSize ?? this.minTeamSize,
        maxTeamSize: maxTeamSize ?? this.maxTeamSize,
        page: page ?? this.page,
        pageSize: pageSize,
      );

  Map<String, dynamic> toQueryParams() => {
        if (categories.isNotEmpty)
          'category': categories.map((c) => c.apiValue).join(','),
        if (modes.isNotEmpty) 'mode': modes.map((m) => m.apiValue).join(','),
        if (scopes.isNotEmpty) 'scope': scopes.map((s) => s.name).join(','),
        if (search.isNotEmpty) 'q': search,
        'sort': sort.name,
        if (beginnerFriendlyOnly) 'beginnerFriendly': true,
        'page': page,
        'pageSize': pageSize,
      };
}

abstract class OpportunityRepository {
  Future<List<Opportunity>> fetch(OpportunityQuery query);
  Future<Opportunity?> byId(String id);
  Future<List<Opportunity>> byIds(List<String> ids);
}

/// Local dataset implementation — identical contract to the API version.
class MockOpportunityRepository implements OpportunityRepository {
  MockOpportunityRepository() : _all = MockOpportunities.all();

  final List<Opportunity> _all;

  @override
  Future<List<Opportunity>> fetch(OpportunityQuery q) async {
    await Future<void>.delayed(AppConfig.mockLatency);
    var items = _dedupe(_all).where((o) => _matches(o, q)).toList();
    items = _sort(items, q.sort);
    final start = (q.page - 1) * q.pageSize;
    if (start >= items.length) return const [];
    return items.sublist(start, (start + q.pageSize).clamp(0, items.length));
  }

  @override
  Future<Opportunity?> byId(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    try {
      return _all.firstWhere((o) => o.id == id);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<List<Opportunity>> byIds(List<String> ids) async {
    return _all.where((o) => ids.contains(o.id)).toList();
  }

  bool _matches(Opportunity o, OpportunityQuery q) {
    if (q.categories.isNotEmpty && !q.categories.contains(o.category)) {
      return false;
    }
    if (q.modes.isNotEmpty && !q.modes.contains(o.mode)) return false;
    if (q.beginnerFriendlyOnly && !o.beginnerFriendly) return false;
    if (q.minTeamSize != null && (o.teamSizeMax ?? 1) < q.minTeamSize!) {
      return false;
    }
    if (q.maxTeamSize != null && (o.teamSizeMin ?? 1) > q.maxTeamSize!) {
      return false;
    }
    if (q.scopes.isNotEmpty && !q.scopes.any((s) => _inScope(o, s))) {
      return false;
    }
    if (q.search.trim().isNotEmpty && !matchesText(o, q.search)) return false;
    return true;
  }

  static bool _inScope(Opportunity o, LocationScope scope) {
    final loc = o.location.toLowerCase();
    switch (scope) {
      case LocationScope.delhi:
        return loc.contains('delhi') || loc.contains('ncr') ||
            loc.contains('gurugram') || loc.contains('noida');
      case LocationScope.india:
        return !loc.contains('canada') &&
            !loc.contains('switzerland') &&
            !loc.contains('global') &&
            !loc.contains('asia pacific');
      case LocationScope.international:
        return loc.contains('global') ||
            loc.contains('canada') ||
            loc.contains('switzerland') ||
            loc.contains('asia pacific') ||
            loc.contains('worldwide');
    }
  }

  static bool matchesText(Opportunity o, String query) {
    final q = query.toLowerCase().trim();
    if (q.isEmpty) return true;
    return o.title.toLowerCase().contains(q) ||
        o.organization.toLowerCase().contains(q) ||
        o.description.toLowerCase().contains(q) ||
        o.category.label.toLowerCase().contains(q) ||
        o.tags.any((t) => t.toLowerCase().contains(q)) ||
        o.skills.any((s) => s.toLowerCase().contains(q));
  }

  /// Ingestion may produce the same hackathon from several sources; only the
  /// freshest record of a duplicate group is shown.
  static List<Opportunity> _dedupe(List<Opportunity> items) {
    final byGroup = <String, Opportunity>{};
    final out = <Opportunity>[];
    for (final o in items) {
      final group = o.duplicateGroupId;
      if (group == null) {
        out.add(o);
        continue;
      }
      final existing = byGroup[group];
      if (existing == null || o.updatedAt.isAfter(existing.updatedAt)) {
        byGroup[group] = o;
      }
    }
    return [...out, ...byGroup.values];
  }

  static List<Opportunity> _sort(List<Opportunity> items, SortOption sort) {
    final list = [...items];
    switch (sort) {
      case SortOption.deadlineSoon:
        list.sort((a, b) => a.deadline.compareTo(b.deadline));
      case SortOption.newest:
        list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      case SortOption.popular:
        list.sort((a, b) => b.popularity.compareTo(a.popularity));
      case SortOption.recommended:
        list.sort((a, b) {
          final byPop = b.popularity.compareTo(a.popularity);
          if (byPop != 0) return byPop;
          return a.deadline.compareTo(b.deadline);
        });
    }
    return list;
  }
}

/// Wired against the production REST/PostgreSQL backend.
class ApiOpportunityRepository implements OpportunityRepository {
  ApiOpportunityRepository(this._client);

  final ApiClient _client;

  @override
  Future<List<Opportunity>> fetch(OpportunityQuery query) async {
    final rows = await _client.getList(
      ApiRoutes.opportunities,
      query: query.toQueryParams(),
    );
    return rows.map(Opportunity.fromJson).toList();
  }

  @override
  Future<Opportunity?> byId(String id) async {
    final row = await _client.getOne(ApiRoutes.opportunity(id));
    return Opportunity.fromJson(row);
  }

  @override
  Future<List<Opportunity>> byIds(List<String> ids) async {
    if (ids.isEmpty) return const [];
    final rows = await _client
        .getList(ApiRoutes.opportunities, query: {'ids': ids.join(',')});
    return rows.map(Opportunity.fromJson).toList();
  }
}
