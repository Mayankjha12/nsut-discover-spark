import 'package:flutter_test/flutter_test.dart';
import 'package:nsut_hub/domain/services/grade_calculator.dart';

void main() {
  group('SGPA', () {
    test('weights grade points by credits', () {
      final sgpa = GradeCalculator.sgpa(const [
        SubjectEntry(name: 'A', credits: 4, grade: 'A'), // 9 * 4
        SubjectEntry(name: 'B', credits: 3, grade: 'B+'), // 8 * 3
        SubjectEntry(name: 'C', credits: 4, grade: 'A+'), // 10 * 4
      ]);
      expect(sgpa, closeTo((36 + 24 + 40) / 11, 0.0001));
    });

    test('returns zero with no credits', () {
      expect(GradeCalculator.sgpa(const []), 0);
    });
  });

  group('CGPA projection', () {
    test('blends completed and remaining credits', () {
      final cgpa = GradeCalculator.projectedCgpa(
        currentCgpa: 8,
        completedCredits: 100,
        expectedSgpa: 9,
        remainingCredits: 20,
      );
      expect(cgpa, closeTo((800 + 180) / 120, 0.0001));
    });

    test('predicts across multiple future semesters', () {
      final cgpa = GradeCalculator.predictFinalCgpa(
        currentCgpa: 7.82,
        completedCredits: 96,
        future: const [
          SemesterProjection(semester: 5, sgpa: 8.5, credits: 24),
          SemesterProjection(semester: 6, sgpa: 9.0, credits: 24),
        ],
      );
      expect(cgpa, greaterThan(7.82));
      expect(cgpa, lessThan(9.0));
    });
  });

  group('Target mode', () {
    test('computes the SGPA required to hit a target CGPA', () {
      final required = GradeCalculator.requiredSgpa(
        targetCgpa: 8.5,
        currentCgpa: 7.82,
        completedCredits: 96,
        remainingCredits: 48,
      );
      expect(required, isNotNull);
      expect(GradeCalculator.isAchievable(required), isTrue);
    });

    test('flags unreachable targets', () {
      final required = GradeCalculator.requiredSgpa(
        targetCgpa: 9.9,
        currentCgpa: 6.0,
        completedCredits: 120,
        remainingCredits: 12,
      );
      expect(GradeCalculator.isAchievable(required), isFalse);
    });
  });
}
