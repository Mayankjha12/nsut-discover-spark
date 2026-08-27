import 'enums.dart';

class UserProfile {
  const UserProfile({
    required this.id,
    required this.name,
    this.email,
    this.branch = Branch.cse,
    this.year = 3,
    this.interests = const [],
    this.skills = const [],
    this.onboarded = false,
    this.notificationPrefs = const {},
    this.defaultReminder = ReminderOption.threeDays,
  });

  final String id;
  final String name;
  final String? email;
  final Branch branch;
  final int year;
  final List<String> interests;
  final List<String> skills;
  final bool onboarded;

  /// category label -> enabled
  final Map<String, bool> notificationPrefs;
  final ReminderOption defaultReminder;

  String get firstName => name.split(' ').first;

  String get yearLabel => switch (year) {
        1 => '1st Year',
        2 => '2nd Year',
        3 => '3rd Year',
        _ => '${year}th Year',
      };

  UserProfile copyWith({
    String? name,
    String? email,
    Branch? branch,
    int? year,
    List<String>? interests,
    List<String>? skills,
    bool? onboarded,
    Map<String, bool>? notificationPrefs,
    ReminderOption? defaultReminder,
  }) =>
      UserProfile(
        id: id,
        name: name ?? this.name,
        email: email ?? this.email,
        branch: branch ?? this.branch,
        year: year ?? this.year,
        interests: interests ?? this.interests,
        skills: skills ?? this.skills,
        onboarded: onboarded ?? this.onboarded,
        notificationPrefs: notificationPrefs ?? this.notificationPrefs,
        defaultReminder: defaultReminder ?? this.defaultReminder,
      );

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        id: json['id'] as String,
        name: json['name'] as String? ?? 'Student',
        email: json['email'] as String?,
        branch: BranchX.fromApi(json['branch'] as String?),
        year: json['year'] as int? ?? 1,
        interests:
            (json['interests'] as List?)?.map((e) => e.toString()).toList() ??
                const [],
        skills: (json['skills'] as List?)?.map((e) => e.toString()).toList() ??
            const [],
        onboarded: json['onboarded'] as bool? ?? false,
        notificationPrefs: (json['notificationPrefs'] as Map?)
                ?.map((k, v) => MapEntry(k.toString(), v == true)) ??
            const {},
        defaultReminder: ReminderOption.values.firstWhere(
          (r) => r.name == json['defaultReminder'],
          orElse: () => ReminderOption.threeDays,
        ),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'branch': branch.name,
        'year': year,
        'interests': interests,
        'skills': skills,
        'onboarded': onboarded,
        'notificationPrefs': notificationPrefs,
        'defaultReminder': defaultReminder.name,
      };

  static const UserProfile demo = UserProfile(
    id: 'demo-user',
    name: 'Mayank Kumar Jha',
    email: 'mayank.ug23@nsut.ac.in',
    branch: Branch.cse,
    year: 3,
    interests: ['AI/ML', 'Web Development', 'Research'],
    skills: ['Flutter', 'Python', 'React', 'PostgreSQL'],
    onboarded: true,
  );
}
