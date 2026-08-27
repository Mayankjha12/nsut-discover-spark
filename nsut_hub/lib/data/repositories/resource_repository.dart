import '../../core/config/app_config.dart';
import '../datasources/api_client.dart';
import '../datasources/mock_resources.dart';
import '../models/enums.dart';
import '../models/resource_item.dart';

enum ResourceSort { mostUseful, recentlyAdded }

class ResourceQuery {
  const ResourceQuery({
    this.branch,
    this.semester,
    this.subject,
    this.type,
    this.search = '',
    this.sort = ResourceSort.mostUseful,
  });

  final Branch? branch;
  final int? semester;
  final String? subject;
  final ResourceType? type;
  final String search;
  final ResourceSort sort;

  ResourceQuery copyWith({
    Branch? branch,
    int? semester,
    String? subject,
    ResourceType? type,
    String? search,
    ResourceSort? sort,
    bool clearSemester = false,
    bool clearSubject = false,
    bool clearType = false,
  }) =>
      ResourceQuery(
        branch: branch ?? this.branch,
        semester: clearSemester ? null : (semester ?? this.semester),
        subject: clearSubject ? null : (subject ?? this.subject),
        type: clearType ? null : (type ?? this.type),
        search: search ?? this.search,
        sort: sort ?? this.sort,
      );
}

abstract class ResourceRepository {
  Future<List<ResourceItem>> fetch(ResourceQuery query);
  Future<List<ResourceItem>> byIds(List<String> ids);
}

class MockResourceRepository implements ResourceRepository {
  MockResourceRepository() : _all = MockResources.all();

  final List<ResourceItem> _all;

  @override
  Future<List<ResourceItem>> fetch(ResourceQuery q) async {
    await Future<void>.delayed(AppConfig.mockLatency);
    final search = q.search.toLowerCase().trim();
    final items = _all.where((r) {
      if (q.branch != null && r.branch != q.branch) return false;
      if (q.semester != null && r.semester != q.semester) return false;
      if (q.subject != null && r.subject != q.subject) return false;
      if (q.type != null && r.type != q.type) return false;
      if (search.isEmpty) return true;
      return r.title.toLowerCase().contains(search) ||
          r.subject.toLowerCase().contains(search) ||
          r.type.label.toLowerCase().contains(search) ||
          r.tags.any((t) => t.toLowerCase().contains(search));
    }).toList();

    switch (q.sort) {
      case ResourceSort.mostUseful:
        items.sort((a, b) => b.upvotes.compareTo(a.upvotes));
      case ResourceSort.recentlyAdded:
        items.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    }
    return items;
  }

  @override
  Future<List<ResourceItem>> byIds(List<String> ids) async =>
      _all.where((r) => ids.contains(r.id)).toList();
}

class ApiResourceRepository implements ResourceRepository {
  ApiResourceRepository(this._client);

  final ApiClient _client;

  @override
  Future<List<ResourceItem>> fetch(ResourceQuery q) async {
    final rows = await _client.getList(ApiRoutes.resources, query: {
      if (q.branch != null) 'branch': q.branch!.name,
      if (q.semester != null) 'semester': q.semester,
      if (q.subject != null) 'subject': q.subject,
      if (q.type != null) 'type': q.type!.name,
      if (q.search.isNotEmpty) 'q': q.search,
      'sort': q.sort.name,
    });
    return rows.map(ResourceItem.fromJson).toList();
  }

  @override
  Future<List<ResourceItem>> byIds(List<String> ids) async {
    if (ids.isEmpty) return const [];
    final rows =
        await _client.getList(ApiRoutes.resources, query: {'ids': ids.join(',')});
    return rows.map(ResourceItem.fromJson).toList();
  }
}
