import 'enums.dart';

/// Core content model. Mirrors the planned backend `opportunities` table so the
/// UI never needs to change when the REST/PostgreSQL API is wired in.
class Opportunity {
  const Opportunity({
    required this.id,
    required this.title,
    required this.organization,
    required this.description,
    required this.category,
    required this.deadline,
    required this.location,
    required this.mode,
    required this.eligibility,
    this.skills = const [],
    this.tags = const [],
    this.source = 'NSUT Hub',
    this.sourceUrl,
    required this.applyUrl,
    this.prize,
    this.stipend,
    this.duration,
    this.teamSizeMin,
    this.teamSizeMax,
    this.beginnerFriendly = false,
    this.popularity = 0,
    this.about = '',
    this.requirements = const [],
    this.timeline = const [],
    this.imageUrl,
    required this.createdAt,
    required this.updatedAt,
    this.duplicateGroupId,
  });

  final String id;
  final String title;
  final String organization;
  final String description;
  final OpportunityCategory category;
  final DateTime deadline;
  final String location;
  final EventMode mode;
  final String eligibility;
  final List<String> skills;
  final List<String> tags;

  /// Where the record came from (Devfolio, Unstop, NSUT notice board, ...).
  final String source;
  final String? sourceUrl;
  final String applyUrl;

  final String? prize;
  final String? stipend;
  final String? duration;
  final int? teamSizeMin;
  final int? teamSizeMax;
  final bool beginnerFriendly;

  /// 0-100 relative popularity, used for the "Trending"/"Popular" rails.
  final int popularity;

  final String about;
  final List<String> requirements;
  final List<TimelineEntry> timeline;
  final String? imageUrl;

  final DateTime createdAt;
  final DateTime updatedAt;

  /// Set by the ingestion layer when the same opportunity is found on several
  /// platforms — the app only renders one card per group.
  final String? duplicateGroupId;

  String get teamSizeLabel {
    if (teamSizeMin == null && teamSizeMax == null) return 'Individual';
    if (teamSizeMin != null && teamSizeMax != null) {
      if (teamSizeMin == teamSizeMax) return 'Team: $teamSizeMin';
      return 'Team: $teamSizeMin–$teamSizeMax';
    }
    return 'Team: ${teamSizeMin ?? teamSizeMax}';
  }

  String? get rewardLabel => prize ?? stipend;

  bool get isHackathon => category == OpportunityCategory.hackathons;

  factory Opportunity.fromJson(Map<String, dynamic> json) => Opportunity(
        id: json['id'] as String,
        title: json['title'] as String,
        organization: json['organization'] as String? ?? '',
        description: json['description'] as String? ?? '',
        category: OpportunityCategoryX.fromApi(json['category'] as String?),
        deadline: DateTime.parse(json['deadline'] as String),
        location: json['location'] as String? ?? 'India',
        mode: EventModeX.fromApi(json['mode'] as String?),
        eligibility: json['eligibility'] as String? ?? 'Open to all students',
        skills: _stringList(json['skills']),
        tags: _stringList(json['tags']),
        source: json['source'] as String? ?? 'NSUT Hub',
        sourceUrl: json['sourceUrl'] as String?,
        applyUrl: json['applyUrl'] as String? ?? '',
        prize: json['prize'] as String?,
        stipend: json['stipend'] as String?,
        duration: json['duration'] as String?,
        teamSizeMin: json['teamSizeMin'] as int?,
        teamSizeMax: json['teamSizeMax'] as int?,
        beginnerFriendly: json['beginnerFriendly'] as bool? ?? false,
        popularity: json['popularity'] as int? ?? 0,
        about: json['about'] as String? ?? '',
        requirements: _stringList(json['requirements']),
        timeline: (json['timeline'] as List?)
                ?.map((e) => TimelineEntry.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        imageUrl: json['imageUrl'] as String?,
        createdAt: DateTime.parse(
            json['createdAt'] as String? ?? DateTime.now().toIso8601String()),
        updatedAt: DateTime.parse(
            json['updatedAt'] as String? ?? DateTime.now().toIso8601String()),
        duplicateGroupId: json['duplicateGroupId'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'organization': organization,
        'description': description,
        'category': category.apiValue,
        'deadline': deadline.toIso8601String(),
        'location': location,
        'mode': mode.apiValue,
        'eligibility': eligibility,
        'skills': skills,
        'tags': tags,
        'source': source,
        'sourceUrl': sourceUrl,
        'applyUrl': applyUrl,
        'prize': prize,
        'stipend': stipend,
        'duration': duration,
        'teamSizeMin': teamSizeMin,
        'teamSizeMax': teamSizeMax,
        'beginnerFriendly': beginnerFriendly,
        'popularity': popularity,
        'about': about,
        'requirements': requirements,
        'timeline': timeline.map((e) => e.toJson()).toList(),
        'imageUrl': imageUrl,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
        'duplicateGroupId': duplicateGroupId,
      };

  static List<String> _stringList(dynamic value) =>
      (value as List?)?.map((e) => e.toString()).toList() ?? const [];
}

class TimelineEntry {
  const TimelineEntry({
    required this.label,
    required this.date,
    this.done = false,
  });

  final String label;
  final DateTime date;
  final bool done;

  factory TimelineEntry.fromJson(Map<String, dynamic> json) => TimelineEntry(
        label: json['label'] as String,
        date: DateTime.parse(json['date'] as String),
        done: json['done'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'label': label,
        'date': date.toIso8601String(),
        'done': done,
      };
}
