import '../../core/config/app_config.dart';
import '../datasources/api_client.dart';
import '../datasources/mock_news.dart';
import '../models/enums.dart';
import '../models/news_item.dart';

abstract class NewsRepository {
  Future<List<NewsItem>> fetch({NewsCategory? category, String search});
  Future<NewsItem?> byId(String id);
}

class MockNewsRepository implements NewsRepository {
  MockNewsRepository() : _all = MockNews.all();

  final List<NewsItem> _all;

  @override
  Future<List<NewsItem>> fetch({NewsCategory? category, String search = ''}) async {
    await Future<void>.delayed(AppConfig.mockLatency);
    final q = search.toLowerCase().trim();
    final items = _all.where((n) {
      if (category != null && n.category != category) return false;
      if (q.isEmpty) return true;
      return n.title.toLowerCase().contains(q) ||
          n.summary.toLowerCase().contains(q) ||
          n.category.label.toLowerCase().contains(q);
    }).toList()
      ..sort((a, b) => b.publishedAt.compareTo(a.publishedAt));
    return items;
  }

  @override
  Future<NewsItem?> byId(String id) async {
    try {
      return _all.firstWhere((n) => n.id == id);
    } catch (_) {
      return null;
    }
  }
}

class ApiNewsRepository implements NewsRepository {
  ApiNewsRepository(this._client);

  final ApiClient _client;

  @override
  Future<List<NewsItem>> fetch({NewsCategory? category, String search = ''}) async {
    final rows = await _client.getList(ApiRoutes.news, query: {
      if (category != null) 'category': category.name,
      if (search.isNotEmpty) 'q': search,
    });
    return rows.map(NewsItem.fromJson).toList();
  }

  @override
  Future<NewsItem?> byId(String id) async =>
      NewsItem.fromJson(await _client.getOne(ApiRoutes.newsItem(id)));
}
