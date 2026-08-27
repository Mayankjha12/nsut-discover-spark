/// Shared vocabularies used across models, filters and the future API.

enum OpportunityCategory {
  hackathons,
  internships,
  research,
  scholarships,
  fellowships,
  competitions,
  openSource,
  programs,
}

extension OpportunityCategoryX on OpportunityCategory {
  String get label => switch (this) {
        OpportunityCategory.hackathons => 'Hackathons',
        OpportunityCategory.internships => 'Internships',
        OpportunityCategory.research => 'Research',
        OpportunityCategory.scholarships => 'Scholarships',
        OpportunityCategory.fellowships => 'Fellowships',
        OpportunityCategory.competitions => 'Competitions',
        OpportunityCategory.openSource => 'Open Source',
        OpportunityCategory.programs => 'Programs',
      };

  String get singular => switch (this) {
        OpportunityCategory.hackathons => 'Hackathon',
        OpportunityCategory.internships => 'Internship',
        OpportunityCategory.research => 'Research',
        OpportunityCategory.scholarships => 'Scholarship',
        OpportunityCategory.fellowships => 'Fellowship',
        OpportunityCategory.competitions => 'Competition',
        OpportunityCategory.openSource => 'Open Source',
        OpportunityCategory.programs => 'Program',
      };

  String get apiValue => switch (this) {
        OpportunityCategory.openSource => 'open_source',
        _ => name,
      };

  static OpportunityCategory fromApi(String? value) {
    switch (value) {
      case 'open_source':
      case 'Open Source':
        return OpportunityCategory.openSource;
      default:
        return OpportunityCategory.values.firstWhere(
          (c) => c.name == value || c.label == value,
          orElse: () => OpportunityCategory.competitions,
        );
    }
  }
}

enum EventMode { online, offline, hybrid }

extension EventModeX on EventMode {
  String get label => switch (this) {
        EventMode.online => 'Online',
        EventMode.offline => 'Offline',
        EventMode.hybrid => 'Hybrid',
      };

  String get apiValue => name;

  static EventMode fromApi(String? value) => EventMode.values.firstWhere(
        (m) => m.name == value || m.label == value,
        orElse: () => EventMode.online,
      );
}

enum LocationScope { delhi, india, international }

extension LocationScopeX on LocationScope {
  String get label => switch (this) {
        LocationScope.delhi => 'Delhi',
        LocationScope.india => 'India',
        LocationScope.international => 'International',
      };
}

enum SortOption { recommended, deadlineSoon, newest, popular }

extension SortOptionX on SortOption {
  String get label => switch (this) {
        SortOption.recommended => 'Recommended',
        SortOption.deadlineSoon => 'Deadline Soon',
        SortOption.newest => 'Newest',
        SortOption.popular => 'Popular',
      };
}

enum SavedItemType { opportunity, news, resource }

extension SavedItemTypeX on SavedItemType {
  String get apiValue => name;

  static SavedItemType fromApi(String? value) =>
      SavedItemType.values.firstWhere((t) => t.name == value,
          orElse: () => SavedItemType.opportunity);
}

enum ReminderOption { none, oneDay, threeDays, oneWeek, custom }

extension ReminderOptionX on ReminderOption {
  String get label => switch (this) {
        ReminderOption.none => 'No reminder',
        ReminderOption.oneDay => '1 day before',
        ReminderOption.threeDays => '3 days before',
        ReminderOption.oneWeek => '1 week before',
        ReminderOption.custom => 'Custom date',
      };

  int? get daysBefore => switch (this) {
        ReminderOption.oneDay => 1,
        ReminderOption.threeDays => 3,
        ReminderOption.oneWeek => 7,
        _ => null,
      };
}

enum NewsCategory {
  official,
  academics,
  placements,
  research,
  scholarships,
  sports,
  achievements,
  studentUpdates,
}

extension NewsCategoryX on NewsCategory {
  String get label => switch (this) {
        NewsCategory.official => 'Official',
        NewsCategory.academics => 'Academics',
        NewsCategory.placements => 'Placements',
        NewsCategory.research => 'Research',
        NewsCategory.scholarships => 'Scholarships',
        NewsCategory.sports => 'Sports',
        NewsCategory.achievements => 'Achievements',
        NewsCategory.studentUpdates => 'Student Updates',
      };

  static NewsCategory fromApi(String? value) =>
      NewsCategory.values.firstWhere((c) => c.name == value || c.label == value,
          orElse: () => NewsCategory.official);
}

enum ResourceType {
  notes,
  pyqs,
  labManual,
  book,
  cheatSheet,
  assignment,
  studyMaterial,
  interviewPrep,
}

extension ResourceTypeX on ResourceType {
  String get label => switch (this) {
        ResourceType.notes => 'Notes',
        ResourceType.pyqs => 'PYQs',
        ResourceType.labManual => 'Lab Manual',
        ResourceType.book => 'Book',
        ResourceType.cheatSheet => 'Cheat Sheet',
        ResourceType.assignment => 'Assignment',
        ResourceType.studyMaterial => 'Study Material',
        ResourceType.interviewPrep => 'Interview Prep',
      };

  static ResourceType fromApi(String? value) =>
      ResourceType.values.firstWhere((t) => t.name == value || t.label == value,
          orElse: () => ResourceType.notes);
}

enum Branch { cse, it, ece, ee, mechanical, civil, bba, mba, ict, coe }

extension BranchX on Branch {
  String get label => switch (this) {
        Branch.cse => 'CSE',
        Branch.it => 'IT',
        Branch.ece => 'ECE',
        Branch.ee => 'EE',
        Branch.mechanical => 'MPAE',
        Branch.civil => 'Civil',
        Branch.bba => 'BBA',
        Branch.mba => 'MBA',
        Branch.ict => 'ICE',
        Branch.coe => 'COE',
      };

  static Branch fromApi(String? value) =>
      Branch.values.firstWhere((b) => b.name == value || b.label == value,
          orElse: () => Branch.cse);
}

class Interests {
  Interests._();
  static const List<String> all = [
    'AI/ML',
    'Web Development',
    'App Development',
    'Competitive Programming',
    'Research',
    'Robotics',
    'Design',
    'Cybersecurity',
    'Finance',
  ];
}
