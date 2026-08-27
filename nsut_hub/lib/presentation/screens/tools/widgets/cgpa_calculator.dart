import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../domain/services/grade_calculator.dart';
import '../tools_screen.dart';
import 'number_field.dart';

class CgpaCalculator extends StatefulWidget {
  const CgpaCalculator({super.key});

  @override
  State<CgpaCalculator> createState() => _CgpaCalculatorState();
}

class _CgpaCalculatorState extends State<CgpaCalculator> {
  double _currentCgpa = 7.82;
  int _completedCredits = 96;
  int _remainingCredits = 24;
  double _expectedSgpa = 8.5;

  @override
  Widget build(BuildContext context) {
    final projected = GradeCalculator.projectedCgpa(
      currentCgpa: _currentCgpa,
      completedCredits: _completedCredits,
      expectedSgpa: _expectedSgpa,
      remainingCredits: _remainingCredits,
    );

    return ListView(
      padding: const EdgeInsets.fromLTRB(AppSpacing.screen, AppSpacing.lg,
          AppSpacing.screen, AppSpacing.bottomNavInset),
      children: [
        ResultPanel(
          label: 'PROJECTED CGPA',
          value: GradeCalculator.format(projected),
          caption:
              'After ${_remainingCredits} more credits at ${GradeCalculator.format(_expectedSgpa)} SGPA',
        ),
        const SizedBox(height: AppSpacing.xl),
        NumberField(
          label: 'Current CGPA',
          value: _currentCgpa,
          max: 10,
          decimals: true,
          onChanged: (v) => setState(() => _currentCgpa = v),
        ),
        const SizedBox(height: AppSpacing.md),
        NumberField(
          label: 'Completed credits',
          value: _completedCredits.toDouble(),
          max: 300,
          onChanged: (v) => setState(() => _completedCredits = v.round()),
        ),
        const SizedBox(height: AppSpacing.md),
        NumberField(
          label: 'Remaining credits',
          value: _remainingCredits.toDouble(),
          max: 300,
          onChanged: (v) => setState(() => _remainingCredits = v.round()),
        ),
        const SizedBox(height: AppSpacing.md),
        NumberField(
          label: 'Expected SGPA for remaining credits',
          value: _expectedSgpa,
          max: 10,
          decimals: true,
          onChanged: (v) => setState(() => _expectedSgpa = v),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          'Projection assumes every remaining credit is earned at the expected SGPA.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}
