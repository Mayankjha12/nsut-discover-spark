import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/enums.dart';
import '../../providers/profile_provider.dart';
import '../../widgets/common.dart';

/// Optional, skippable personalization — never a wall in front of the app.
class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final notifier = ref.read(profileProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Personalize'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).maybePop(),
            child: const Text('Skip'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.screen, AppSpacing.md,
            AppSpacing.screen, AppSpacing.xxl),
        children: [
          Text('Tell us a little about you',
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          Text(
            'All of this is optional — it only sharpens your recommendations.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Year', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final y in [1, 2, 3, 4])
                AppFilterChip(
                  label: y == 1 ? '1st Year' : '${y}${y == 2 ? 'nd' : y == 3 ? 'rd' : 'th'} Year',
                  selected: profile.year == y,
                  onTap: () => notifier.setYear(y),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Branch', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final b in Branch.values)
                AppFilterChip(
                  label: b.label,
                  selected: profile.branch == b,
                  onTap: () => notifier.setBranch(b),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Interests', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final i in Interests.all)
                AppFilterChip(
                  label: i,
                  selected: profile.interests.contains(i),
                  onTap: () => notifier.toggleInterest(i),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Skills', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            initialValue: profile.skills.join(', '),
            decoration: const InputDecoration(
              hintText: 'Flutter, Python, Figma…',
            ),
            onChanged: (v) => notifier.setSkills(
              v.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          FilledButton(
            onPressed: () {
              notifier.completeOnboarding();
              Navigator.of(context).maybePop();
            },
            child: const Text('Save preferences'),
          ),
          const SizedBox(height: AppSpacing.md),
          Center(
            child: Text(
              'You can change these any time from Profile.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppRadius.card,
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome_rounded,
                    size: 17, color: AppColors.accentBright),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'NSUT Hub also learns from what you save, search and open.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
