/// Pure calculation logic for the Tools screen — no Flutter imports, unit
/// testable in isolation.

class GradeScale {
  GradeScale._();

  /// NSUT 10-point relative grading scale.
  static const Map<String, double> points = {
    'A+': 10,
    'A': 9,
    'B+': 8,
    'B': 7,
    'C+': 6,
    'C': 5,
    'D': 4,
    'F': 0,
  };

  static List<String> get grades => points.keys.toList();

  static double pointsFor(String grade) => points[grade] ?? 0;
}

class SubjectEntry {
  const SubjectEntry({
    required this.name,
    required this.credits,
    required this.grade,
  });

  final String name;
  final int credits;
  final String grade;

  SubjectEntry copyWith({String? name, int? credits, String? grade}) =>
      SubjectEntry(
        name: name ?? this.name,
        credits: credits ?? this.credits,
        grade: grade ?? this.grade,
      );
}

class SemesterProjection {
  const SemesterProjection({required this.semester, required this.sgpa, required this.credits});

  final int semester;
  final double sgpa;
  final int credits;

  SemesterProjection copyWith({double? sgpa, int? credits}) =>
      SemesterProjection(
        semester: semester,
        sgpa: sgpa ?? this.sgpa,
        credits: credits ?? this.credits,
      );
}

class GradeCalculator {
  const GradeCalculator();

  /// SGPA = Σ(credit × grade point) / Σ(credit)
  static double sgpa(List<SubjectEntry> subjects) {
    final totalCredits =
        subjects.fold<int>(0, (sum, s) => sum + s.credits);
    if (totalCredits == 0) return 0;
    final weighted = subjects.fold<double>(
        0, (sum, s) => sum + s.credits * GradeScale.pointsFor(s.grade));
    return weighted / totalCredits;
  }

  /// Projected CGPA after adding one more semester block.
  static double projectedCgpa({
    required double currentCgpa,
    required int completedCredits,
    required double expectedSgpa,
    required int remainingCredits,
  }) {
    final total = completedCredits + remainingCredits;
    if (total == 0) return 0;
    return (currentCgpa * completedCredits + expectedSgpa * remainingCredits) /
        total;
  }

  /// Multi-semester prediction using per-semester SGPA and credits.
  static double predictFinalCgpa({
    required double currentCgpa,
    required int completedCredits,
    required List<SemesterProjection> future,
  }) {
    var points = currentCgpa * completedCredits;
    var credits = completedCredits;
    for (final s in future) {
      points += s.sgpa * s.credits;
      credits += s.credits;
    }
    if (credits == 0) return 0;
    return points / credits;
  }

  /// "What SGPA do I need to reach X?" — returns null when unreachable.
  static double? requiredSgpa({
    required double targetCgpa,
    required double currentCgpa,
    required int completedCredits,
    required int remainingCredits,
  }) {
    if (remainingCredits <= 0) return null;
    final needed = (targetCgpa * (completedCredits + remainingCredits) -
            currentCgpa * completedCredits) /
        remainingCredits;
    return needed;
  }

  static bool isAchievable(double? requiredSgpa) =>
      requiredSgpa != null && requiredSgpa <= 10.0 && requiredSgpa >= 0;

  static String format(double value) => value.toStringAsFixed(2);
}
