/// Build-time configuration.
///
/// Run with a real backend:
///   flutter run --dart-define=USE_MOCK_DATA=false \
///               --dart-define=API_BASE_URL=https://api.nsuthub.app/v1
class AppConfig {
  AppConfig._();

  static const String appName = 'NSUT Hub';
  static const String tagline = 'Discover. Save. Participate.';

  static const bool useMockData =
      bool.fromEnvironment('USE_MOCK_DATA', defaultValue: true);

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.nsuthub.app/v1',
  );

  /// Artificial latency for the mock layer so skeleton loaders are real.
  static const Duration mockLatency = Duration(milliseconds: 450);
}

/// Single place for every REST path the app will call.
class ApiRoutes {
  ApiRoutes._();

  static const String opportunities = '/opportunities';
  static const String hackathons = '/opportunities?category=hackathons';
  static const String news = '/news';
  static const String resources = '/resources';
  static const String saved = '/me/saved';
  static const String collections = '/me/collections';
  static const String deadlines = '/me/deadlines';
  static const String notifications = '/me/notifications';
  static const String profile = '/me';
  static const String categories = '/categories';
  static const String tags = '/tags';
  static const String search = '/search';

  static String opportunity(String id) => '/opportunities/$id';
  static String newsItem(String id) => '/news/$id';
  static String savedItem(String id) => '/me/saved/$id';
}
