import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../data/datasources/api_client.dart';
import '../../data/repositories/news_repository.dart';
import '../../data/repositories/opportunity_repository.dart';
import '../../data/repositories/profile_repository.dart';
import '../../data/repositories/resource_repository.dart';
import '../../data/repositories/saved_repository.dart';
import '../../domain/services/notification_service.dart';
import '../../domain/services/recommendation_service.dart';
import '../../domain/services/search_service.dart';

/// Flip `USE_MOCK_DATA` at build time to swap the whole data layer.
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final opportunityRepositoryProvider = Provider<OpportunityRepository>((ref) {
  return AppConfig.useMockData
      ? MockOpportunityRepository()
      : ApiOpportunityRepository(ref.watch(apiClientProvider));
});

final newsRepositoryProvider = Provider<NewsRepository>((ref) {
  return AppConfig.useMockData
      ? MockNewsRepository()
      : ApiNewsRepository(ref.watch(apiClientProvider));
});

final resourceRepositoryProvider = Provider<ResourceRepository>((ref) {
  return AppConfig.useMockData
      ? MockResourceRepository()
      : ApiResourceRepository(ref.watch(apiClientProvider));
});

final savedRepositoryProvider =
    Provider<SavedRepository>((ref) => LocalSavedRepository());

final profileRepositoryProvider =
    Provider<ProfileRepository>((ref) => LocalProfileRepository());

final notificationServiceProvider =
    Provider<NotificationService>((ref) => MockNotificationService());

final recommendationServiceProvider =
    Provider<RecommendationService>((ref) => const RecommendationService());

final searchServiceProvider =
    Provider<SearchService>((ref) => const SearchService());
