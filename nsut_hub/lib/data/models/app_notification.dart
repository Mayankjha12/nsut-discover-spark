enum NotificationKind { deadline, recommendation, news, system }

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.kind,
    required this.createdAt,
    this.read = false,
    this.targetOpportunityId,
    this.targetNewsId,
  });

  final String id;
  final String title;
  final String body;
  final NotificationKind kind;
  final DateTime createdAt;
  final bool read;
  final String? targetOpportunityId;
  final String? targetNewsId;

  AppNotification copyWith({bool? read}) => AppNotification(
        id: id,
        title: title,
        body: body,
        kind: kind,
        createdAt: createdAt,
        read: read ?? this.read,
        targetOpportunityId: targetOpportunityId,
        targetNewsId: targetNewsId,
      );

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as String,
        title: json['title'] as String,
        body: json['body'] as String? ?? '',
        kind: NotificationKind.values.firstWhere(
          (k) => k.name == json['kind'],
          orElse: () => NotificationKind.system,
        ),
        createdAt: DateTime.parse(json['createdAt'] as String),
        read: json['read'] as bool? ?? false,
        targetOpportunityId: json['targetOpportunityId'] as String?,
        targetNewsId: json['targetNewsId'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'kind': kind.name,
        'createdAt': createdAt.toIso8601String(),
        'read': read,
        'targetOpportunityId': targetOpportunityId,
        'targetNewsId': targetNewsId,
      };
}
