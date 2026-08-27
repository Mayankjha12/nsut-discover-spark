import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import 'widgets/cgpa_calculator.dart';
import 'widgets/cgpa_predictor.dart';
import 'widgets/sgpa_calculator.dart';

class ToolsScreen extends StatefulWidget {
  const ToolsScreen({super.key});

  @override
  State<ToolsScreen> createState() => _ToolsScreenState();
}

class _ToolsScreenState extends State<ToolsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 3, vsync: this);

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.screen,
                AppSpacing.lg, AppSpacing.screen, AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Tools',
                    style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 3),
                Text('Calculate, project and plan your grades.',
                    style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          TabBar(
            controller: _tabs,
            dividerColor: AppColors.border,
            indicatorColor: AppColors.accentBright,
            indicatorSize: TabBarIndicatorSize.label,
            labelColor: AppColors.textPrimary,
            unselectedLabelColor: AppColors.textMuted,
            labelStyle: const TextStyle(
              fontFamily: AppTheme.fontFamily,
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
            ),
            tabs: const [
              Tab(text: 'SGPA'),
              Tab(text: 'CGPA'),
              Tab(text: 'Predictor'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: const [
                SgpaCalculator(),
                CgpaCalculator(),
                CgpaPredictor(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Shared animated result panel used by all three calculators.
class ResultPanel extends StatelessWidget {
  const ResultPanel({
    super.key,
    required this.label,
    required this.value,
    this.caption,
    this.tone = AppColors.accentBright,
  });

  final String label;
  final String value;
  final String? caption;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: AppDurations.normal,
      curve: Curves.easeOut,
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.1),
        borderRadius: AppRadius.card,
        border: Border.all(color: tone.withValues(alpha: 0.35)),
      ),
      child: Column(
        children: [
          Text(label, style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: double.tryParse(value) ?? 0),
            duration: const Duration(milliseconds: 520),
            curve: Curves.easeOutCubic,
            builder: (context, v, _) => Text(
              double.tryParse(value) == null ? value : v.toStringAsFixed(2),
              style: TextStyle(
                fontFamily: AppTheme.fontFamily,
                fontSize: 42,
                fontWeight: FontWeight.w700,
                height: 1,
                color: tone,
              ),
            ),
          ),
          if (caption != null) ...[
            const SizedBox(height: 8),
            Text(caption!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium),
          ],
        ],
      ),
    );
  }
}
