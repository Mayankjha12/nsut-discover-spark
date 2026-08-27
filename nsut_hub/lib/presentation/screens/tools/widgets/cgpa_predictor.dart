import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../domain/services/grade_calculator.dart';
import '../tools_screen.dart';
import 'number_field.dart';

class CgpaPredictor extends StatefulWidget {
  const CgpaPredictor({super.key});

  @override
  State<CgpaPredictor> createState() => _CgpaPredictorState();
}

class _CgpaPredictorState extends State<CgpaPredictor> {
  bool _targetMode = false;

  double _currentCgpa = 7.82;
  int _completedCredits = 96;
  double _targetCgpa = 8.5;
  int _remainingCredits = 48;

  final List<SemesterProjection> _future = [
    const SemesterProjection(semester: 5, sgpa: 8.5, credits: 24),
    const SemesterProjection(semester: 6, sgpa: 9.0, credits: 24),
    const SemesterProjection(semester: 7, sgpa: 8.8, credits: 20),
    const SemesterProjection(semester: 8, sgpa: 9.0, credits: 16),
  ];

  @override
  Widget build(BuildContext context) {
    final predicted = GradeCalculator.predictFinalCgpa(
      currentCgpa: _currentCgpa,
      completedCredits: _completedCredits,
      future: _future,
    );
    final required = GradeCalculator.requiredSgpa(
      targetCgpa: _targetCgpa,
      currentCgpa: _currentCgpa,
      completedCredits: _completedCredits,
      remainingCredits: _remainingCredits,
    );
    final achievable = GradeCalculator.isAchievable(required);

    return ListView(
      padding: const EdgeInsets.fromLTRB(AppSpacing.screen, AppSpacing.lg,
          AppSpacing.screen, AppSpacing.bottomNavInset),
      children: [
        Row(
          children: [
            Expanded(
              child: _ModeButton(
                label: 'Predict',
                selected: !_targetMode,
                onTap: () => setState(() => _targetMode = false),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _ModeButton(
                label: 'Target',
                selected: _targetMode,
                onTap: () => setState(() => _targetMode = true),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        if (_targetMode)
          ResultPanel(
            label: 'SGPA NEEDED EVERY REMAINING SEMESTER',
            value: required == null
                ? '—'
                : GradeCalculator.format(required.clamp(0, 99)),
            tone: achievable ? AppColors.success : AppColors.danger,
            caption: required == null
                ? 'Add remaining credits to calculate.'
                : achievable
                    ? 'Reach ${GradeCalculator.format(_targetCgpa)} CGPA by averaging ${GradeCalculator.format(required)} across $_remainingCredits credits.'
                    : 'Out of reach with $_remainingCredits credits left — the maximum SGPA is 10.00.',
          )
        else
          ResultPanel(
            label: 'PROJECTED FINAL CGPA',
            value: GradeCalculator.format(predicted),
            caption:
                'Based on ${_future.length} upcoming semesters and $_completedCredits completed credits',
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
        if (_targetMode) ...[
          NumberField(
            label: 'Target CGPA',
            value: _targetCgpa,
            max: 10,
            decimals: true,
            onChanged: (v) => setState(() => _targetCgpa = v),
          ),
          const SizedBox(height: AppSpacing.md),
          NumberField(
            label: 'Remaining credits',
            value: _remainingCredits.toDouble(),
            max: 300,
            onChanged: (v) => setState(() => _remainingCredits = v.round()),
          ),
        ] else ...[
          Text('Future semesters',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.sm),
          for (var i = 0; i < _future.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: _SemesterRow(
                projection: _future[i],
                onSgpa: (v) =>
                    setState(() => _future[i] = _future[i].copyWith(sgpa: v)),
                onCredits: (v) => setState(
                    () => _future[i] = _future[i].copyWith(credits: v)),
              ),
            ),
        ],
      ],
    );
  }
}

class _ModeButton extends StatelessWidget {
  const _ModeButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppDurations.fast,
        padding: const EdgeInsets.symmetric(vertical: 13),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.accent : AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
              color: selected ? AppColors.accent : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: AppTheme.fontFamily,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _SemesterRow extends StatelessWidget {
  const _SemesterRow({
    required this.projection,
    required this.onSgpa,
    required this.onCredits,
  });

  final SemesterProjection projection;
  final ValueChanged<double> onSgpa;
  final ValueChanged<int> onCredits;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 92,
            child: Text('Semester ${projection.semester}',
                style: Theme.of(context).textTheme.titleMedium),
          ),
          Expanded(
            child: Slider(
              value: projection.sgpa,
              min: 4,
              max: 10,
              divisions: 60,
              activeColor: AppColors.accent,
              inactiveColor: AppColors.surfaceElevated,
              label: projection.sgpa.toStringAsFixed(1),
              onChanged: onSgpa,
            ),
          ),
          SizedBox(
            width: 44,
            child: Text(
              projection.sgpa.toStringAsFixed(1),
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontFamily: AppTheme.fontFamily,
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.accentBright,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
