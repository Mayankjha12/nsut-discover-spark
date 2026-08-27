import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class BottomNavItem {
  const BottomNavItem(this.icon, this.activeIcon, this.label);
  final IconData icon;
  final IconData activeIcon;
  final String label;
}

const bottomNavItems = <BottomNavItem>[
  BottomNavItem(Icons.home_outlined, Icons.home_rounded, 'Home'),
  BottomNavItem(Icons.explore_outlined, Icons.explore_rounded, 'Discover'),
  BottomNavItem(Icons.bookmark_border_rounded, Icons.bookmark_rounded, 'Saved'),
  BottomNavItem(Icons.calculate_outlined, Icons.calculate_rounded, 'Tools'),
  BottomNavItem(Icons.person_outline_rounded, Icons.person_rounded, 'Profile'),
];

/// Floating bottom bar — thumb friendly, no Material default chrome.
class AppBottomNav extends StatelessWidget {
  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(14, 0, 14, 10 + bottomInset * 0.4),
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.borderStrong),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: List.generate(bottomNavItems.length, (i) {
            final item = bottomNavItems[i];
            final selected = i == currentIndex;
            return Expanded(
              child: InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () {
                  HapticFeedback.selectionClick();
                  onTap(i);
                },
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    AnimatedContainer(
                      duration: AppDurations.fast,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 4),
                      decoration: BoxDecoration(
                        color:
                            selected ? AppColors.accentSoft : Colors.transparent,
                        borderRadius: AppRadius.chip,
                      ),
                      child: Icon(
                        selected ? item.activeIcon : item.icon,
                        size: 21,
                        color: selected
                            ? AppColors.accentBright
                            : AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.label,
                      style: TextStyle(
                        fontFamily: AppTheme.fontFamily,
                        fontSize: 10.5,
                        fontWeight:
                            selected ? FontWeight.w600 : FontWeight.w500,
                        color: selected
                            ? AppColors.accentBright
                            : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
