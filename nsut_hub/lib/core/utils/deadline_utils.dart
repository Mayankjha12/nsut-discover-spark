import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../theme/app_colors.dart';

enum DeadlineUrgency { today, soon, upcoming, relaxed, passed }

class DeadlineInfo {
  const DeadlineInfo({
    required this.daysLeft,
    required this.label,
    required this.urgency,
    required this.color,
  });

  final int daysLeft;
  final String label;
  final DeadlineUrgency urgency;
  final Color color;

  bool get isPassed => urgency == DeadlineUrgency.passed;
}

class DeadlineUtils {
  DeadlineUtils._();

  static int daysLeft(DateTime deadline, {DateTime? now}) {
    final today = _dateOnly(now ?? DateTime.now());
    return _dateOnly(deadline).difference(today).inDays;
  }

  static DeadlineInfo describe(DateTime deadline, {DateTime? now}) {
    final days = daysLeft(deadline, now: now);

    if (days < 0) {
      return DeadlineInfo(
        daysLeft: days,
        label: 'Closed',
        urgency: DeadlineUrgency.passed,
        color: AppColors.textMuted,
      );
    }
    if (days == 0) {
      return const DeadlineInfo(
        daysLeft: 0,
        label: 'Today',
        urgency: DeadlineUrgency.today,
        color: AppColors.urgentRed,
      );
    }
    if (days == 1) {
      return const DeadlineInfo(
        daysLeft: 1,
        label: 'Tomorrow',
        urgency: DeadlineUrgency.today,
        color: AppColors.urgentRed,
      );
    }
    if (days <= 3) {
      return DeadlineInfo(
        daysLeft: days,
        label: '$days days',
        urgency: DeadlineUrgency.soon,
        color: AppColors.urgentOrange,
      );
    }
    if (days <= 7) {
      return DeadlineInfo(
        daysLeft: days,
        label: '$days days',
        urgency: DeadlineUrgency.upcoming,
        color: AppColors.urgentYellow,
      );
    }
    return DeadlineInfo(
      daysLeft: days,
      label: '$days days',
      urgency: DeadlineUrgency.relaxed,
      color: AppColors.urgentGreen,
    );
  }

  /// "Registration closes in 4 days" style copy.
  static String closesIn(DateTime deadline, {DateTime? now}) {
    final info = describe(deadline, now: now);
    switch (info.urgency) {
      case DeadlineUrgency.passed:
        return 'Registration closed';
      case DeadlineUrgency.today:
        return info.daysLeft == 0
            ? 'Closes today'
            : 'Closes tomorrow';
      default:
        return 'Closes in ${info.daysLeft} days';
    }
  }

  static String formatDate(DateTime date) =>
      DateFormat('d MMM yyyy').format(date);

  static String formatShort(DateTime date) => DateFormat('d MMM').format(date);

  static String relativeDate(DateTime date, {DateTime? now}) {
    final diff = _dateOnly(now ?? DateTime.now()).difference(_dateOnly(date)).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    if (diff < 7) return '$diff days ago';
    if (diff < 30) return '${(diff / 7).floor()}w ago';
    return formatShort(date);
  }

  static DateTime _dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);
}
