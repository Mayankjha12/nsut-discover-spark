import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../presentation/screens/deadlines/deadlines_screen.dart';
import '../../presentation/screens/discover/discover_screen.dart';
import '../../presentation/screens/hackathons/hackathons_screen.dart';
import '../../presentation/screens/home/home_screen.dart';
import '../../presentation/screens/news/news_detail_screen.dart';
import '../../presentation/screens/news/news_screen.dart';
import '../../presentation/screens/notifications/notifications_screen.dart';
import '../../presentation/screens/onboarding/onboarding_screen.dart';
import '../../presentation/screens/opportunities/opportunities_screen.dart';
import '../../presentation/screens/opportunities/opportunity_detail_screen.dart';
import '../../presentation/screens/profile/profile_screen.dart';
import '../../presentation/screens/resources/resources_screen.dart';
import '../../presentation/screens/saved/saved_screen.dart';
import '../../presentation/screens/search/search_screen.dart';
import '../../presentation/screens/shell/app_shell.dart';
import '../../presentation/screens/tools/tools_screen.dart';

/// Route names kept in one place so deep links stay consistent with the
/// backend's `nsuthub://` and `https://nsuthub.app` link scheme.
class AppRoutes {
  AppRoutes._();
  static const home = '/';
  static const discover = '/discover';
  static const saved = '/saved';
  static const tools = '/tools';
  static const profile = '/profile';
  static const hackathons = '/hackathons';
  static const opportunities = '/opportunities';
  static const news = '/news';
  static const resources = '/resources';
  static const deadlines = '/deadlines';
  static const search = '/search';
  static const notifications = '/notifications';
  static const onboarding = '/onboarding';

  static String opportunity(String id) => '/opportunity/$id';
  static String newsItem(String id) => '/news/$id';
}

final _rootKey = GlobalKey<NavigatorState>();
final _shellKey = GlobalKey<NavigatorState>();

CustomTransitionPage<T> _fadeThrough<T>(Widget child, GoRouterState state) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 220),
    transitionsBuilder: (context, animation, secondary, child) {
      return FadeTransition(
        opacity: CurveTween(curve: Curves.easeOut).animate(animation),
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.012),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
          child: child,
        ),
      );
    },
  );
}

final appRouter = GoRouter(
  navigatorKey: _rootKey,
  initialLocation: AppRoutes.home,
  routes: [
    ShellRoute(
      navigatorKey: _shellKey,
      builder: (context, state, child) =>
          AppShell(location: state.uri.path, child: child),
      routes: [
        GoRoute(
          path: AppRoutes.home,
          pageBuilder: (c, s) => _fadeThrough(const HomeScreen(), s),
        ),
        GoRoute(
          path: AppRoutes.discover,
          pageBuilder: (c, s) => _fadeThrough(const DiscoverScreen(), s),
        ),
        GoRoute(
          path: AppRoutes.saved,
          pageBuilder: (c, s) => _fadeThrough(const SavedScreen(), s),
        ),
        GoRoute(
          path: AppRoutes.tools,
          pageBuilder: (c, s) => _fadeThrough(const ToolsScreen(), s),
        ),
        GoRoute(
          path: AppRoutes.profile,
          pageBuilder: (c, s) => _fadeThrough(const ProfileScreen(), s),
        ),
      ],
    ),
    GoRoute(
      path: AppRoutes.hackathons,
      builder: (c, s) => const HackathonsScreen(),
    ),
    GoRoute(
      path: AppRoutes.opportunities,
      builder: (c, s) => const OpportunitiesScreen(),
    ),
    GoRoute(
      path: AppRoutes.news,
      builder: (c, s) => const NewsScreen(),
    ),
    GoRoute(
      path: '/news/:id',
      builder: (c, s) => NewsDetailScreen(id: s.pathParameters['id']!),
    ),
    GoRoute(
      path: AppRoutes.resources,
      builder: (c, s) => const ResourcesScreen(),
    ),
    GoRoute(
      path: AppRoutes.deadlines,
      builder: (c, s) => const DeadlinesScreen(),
    ),
    GoRoute(
      path: AppRoutes.search,
      builder: (c, s) => SearchScreen(initialQuery: s.uri.queryParameters['q']),
    ),
    GoRoute(
      path: AppRoutes.notifications,
      builder: (c, s) => const NotificationsScreen(),
    ),
    GoRoute(
      path: AppRoutes.onboarding,
      builder: (c, s) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/opportunity/:id',
      builder: (c, s) =>
          OpportunityDetailScreen(id: s.pathParameters['id']!),
    ),
  ],
);
