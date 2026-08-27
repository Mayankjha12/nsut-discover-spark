import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../domain/services/grade_calculator.dart';
import '../tools_screen.dart';

class SgpaCalculator extends StatefulWidget {
  const SgpaCalculator({super.key});

  @override
  State<SgpaCalculator> createState() => _SgpaCalculatorState();
}

class _SgpaCalculatorState extends State<SgpaCalculator> {
  final List<SubjectEntry> _subjects = [
    const SubjectEntry(name: 'Subject 1', credits: 4, grade: 'A'),
    const SubjectEntry(name: 'Subject 2', credits: 3, grade: 'B+'),
    const SubjectEntry(name: 'Subject 3', credits: 4, grade: 'A+'),
  ];

  double get _sgpa => GradeCalculator.sgpa(_subjects);
  int get _credits => _subjects.fold(0, (s, e) => s + e.credits);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(AppSpacing.screen, AppSpacing.lg,
          AppSpacing.screen, AppSpacing.bottomNavInset),
      children: [
        ResultPanel(
          label: 'YOUR SGPA',
          value: GradeCalculator.format(_sgpa),
          caption: '$_credits credits across ${_subjects.length} subjects',
        ),
        const SizedBox(height: AppSpacing.xl),
        Row(
          children: [
            Text('Subjects',
                style: Theme.of(context).textTheme.titleLarge),
            const Spacer(),
            TextButton.icon(
              onPressed: () => setState(() => _subjects.add(SubjectEntry(
                    name: 'Subject ${_subjects.length + 1}',
                    credits: 3,
                    grade: 'A',
                  ))),
              icon: const Icon(Icons.add_rounded, size: 17),
              label: const Text('Add Subject'),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        for (var i = 0; i < _subjects.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: _SubjectRow(
              entry: _subjects[i],
              onChanged: (e) => setState(() => _subjects[i] = e),
              onRemove: _subjects.length <= 1
                  ? null
                  : () => setState(() => _subjects.removeAt(i)),
            ),
          ),
        const SizedBox(height: AppSpacing.md),
        Text(
          'SGPA = Σ(credits × grade point) ÷ Σ(credits), on the NSUT 10-point scale.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _SubjectRow extends StatelessWidget {
  const _SubjectRow({
    required this.entry,
    required this.onChanged,
    this.onRemove,
  });

  final SubjectEntry entry;
  final ValueChanged<SubjectEntry> onChanged;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 6, 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 4,
            child: TextFormField(
              initialValue: entry.name,
              style: Theme.of(context).textTheme.titleMedium,
              decoration: const InputDecoration(
                isDense: true,
                filled: false,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.zero,
                hintText: 'Subject name',
              ),
              onChanged: (v) => onChanged(entry.copyWith(name: v)),
            ),
          ),
          _Stepper(
            value: entry.credits,
            onChanged: (v) => onChanged(entry.copyWith(credits: v)),
          ),
          const SizedBox(width: 6),
          _GradeDropdown(
            grade: entry.grade,
            onChanged: (g) => onChanged(entry.copyWith(grade: g)),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            onPressed: onRemove,
            icon: Icon(
              Icons.remove_circle_outline_rounded,
              size: 19,
              color: onRemove == null ? AppColors.textMuted : AppColors.danger,
            ),
          ),
        ],
      ),
    );
  }
}

class _Stepper extends StatelessWidget {
  const _Stepper({required this.value, required this.onChanged});

  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: AppRadius.chip,
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          InkResponse(
            onTap: value > 1 ? () => onChanged(value - 1) : null,
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 7, vertical: 5),
              child: Icon(Icons.remove_rounded,
                  size: 14, color: AppColors.textSecondary),
            ),
          ),
          Text('$value',
              style: const TextStyle(
                fontFamily: AppTheme.fontFamily,
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              )),
          InkResponse(
            onTap: value < 8 ? () => onChanged(value + 1) : null,
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 7, vertical: 5),
              child: Icon(Icons.add_rounded,
                  size: 14, color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

class _GradeDropdown extends StatelessWidget {
  const _GradeDropdown({required this.grade, required this.onChanged});

  final String grade;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: AppRadius.chip,
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: grade,
          isDense: true,
          borderRadius: BorderRadius.circular(AppRadius.md),
          dropdownColor: AppColors.surfaceElevated,
          icon: const Icon(Icons.expand_more_rounded,
              size: 16, color: AppColors.textMuted),
          style: const TextStyle(
            fontFamily: AppTheme.fontFamily,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.accentBright,
          ),
          items: [
            for (final g in GradeScale.grades)
              DropdownMenuItem(value: g, child: Text(g)),
          ],
          onChanged: (v) => v == null ? null : onChanged(v),
        ),
      ),
    );
  }
}
