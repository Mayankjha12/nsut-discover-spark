import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_router.dart';
import '../../widgets/app_bottom_nav.dart';

const _tabRoutes = [
  AppRoutes.home,
  AppRoutes.discover,
  AppRoutes.saved,
  AppRoutes.tools,
  AppRoutes.profile,
];

/// Persistent scaffold for the five primary tabs.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.location, required this.child});

  final String location;
  final Widget child;

  int get _index {
    final i = _tabRoutes.indexOf(location);
    return i < 0 ? 0 : i;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: child,
      bottomNavigationBar: AppBottomNav(
        currentIndex: _index,
        onTap: (i) {
          if (_tabRoutes[i] == location) return;
          context.go(_tabRoutes[i]);
        },
      ),
    );
  }
}
