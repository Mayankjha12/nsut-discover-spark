import 'package:flutter/material.dart';

/// Single source of truth for every colour in NSUT Hub.
/// Never hardcode a Color inside a widget — add a token here instead.
class AppColors {
  AppColors._();

  // Base surfaces — deep navy
  static const Color background = Color(0xFF080D18);
  static const Color surface = Color(0xFF0E1626);
  static const Color surfaceElevated = Color(0xFF141F33);
  static const Color surfaceHover = Color(0xFF1A2740);

  // Borders / dividers
  static const Color border = Color(0xFF1E2B44);
  static const Color borderStrong = Color(0xFF2A3B5C);

  // Accent — blue / cyan
  static const Color accent = Color(0xFF3B82F6);
  static const Color accentBright = Color(0xFF22D3EE);
  static const Color accentSoft = Color(0x223B82F6);

  // Text
  static const Color textPrimary = Color(0xFFF2F6FF);
  static const Color textSecondary = Color(0xFF97A5BF);
  static const Color textMuted = Color(0xFF64748B);

  // Deadline urgency scale
  static const Color urgentRed = Color(0xFFF43F5E);
  static const Color urgentOrange = Color(0xFFFB923C);
  static const Color urgentYellow = Color(0xFFFACC15);
  static const Color urgentGreen = Color(0xFF34D399);

  // Semantic
  static const Color success = Color(0xFF34D399);
  static const Color warning = Color(0xFFFBBF24);
  static const Color danger = Color(0xFFF43F5E);

  // Category tints
  static const Map<String, Color> category = {
    'Hackathons': Color(0xFF6366F1),
    'Internships': Color(0xFF22D3EE),
    'Research': Color(0xFFA78BFA),
    'Scholarships': Color(0xFF34D399),
    'Fellowships': Color(0xFFF59E0B),
    'Competitions': Color(0xFFF472B6),
    'Open Source': Color(0xFF38BDF8),
    'Programs': Color(0xFF818CF8),
    'News': Color(0xFF60A5FA),
    'Resources': Color(0xFF2DD4BF),
  };

  static Color forCategory(String name) =>
      category[name] ?? accent;
}
