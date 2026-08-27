import 'enums.dart';

class NewsItem {
  const NewsItem({
    required this.id,
    required this.title,
    required this.category,
    required this.publishedAt,
    required this.source,
    required this.summary,
    required this.body,
    this.quickSummary,
    this.sourceUrl,
    this.isImportant = false,
  });

  final String id;
  final String title;
  final NewsCategory category;
  final DateTime publishedAt;
  final String source;
  final String summary;
  final String body;

  /// Structured extraction produced by the backend/AI layer for long notices.
  final QuickSummary? quickSummary;
  final String? sourceUrl;
  final bool isImportant;

  factory NewsItem.fromJson(Map<String, dynamic> json) => NewsItem(
        id: json['id'] as String,
        title: json['title'] as String,
        category: NewsCategoryX.fromApi(json['category'] as String?),
        publishedAt: DateTime.parse(json['publishedAt'] as String),
        source: json['source'] as String? ?? 'NSUT',
        summary: json['summary'] as String? ?? '',
        body: json['body'] as String? ?? '',
        quickSummary: json['quickSummary'] == null
            ? null
            : QuickSummary.fromJson(
                json['quickSummary'] as Map<String, dynamic>),
        sourceUrl: json['sourceUrl'] as String?,
        isImportant: json['isImportant'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'category': category.name,
        'publishedAt': publishedAt.toIso8601String(),
        'source': source,
        'summary': summary,
        'body': body,
        'quickSummary': quickSummary?.toJson(),
        'sourceUrl': sourceUrl,
        'isImportant': isImportant,
      };
}

class QuickSummary {
  const QuickSummary({
    required this.what,
    required this.who,
    this.deadline,
    required this.action,
  });

  final String what;
  final String who;
  final String? deadline;
  final String action;

  factory QuickSummary.fromJson(Map<String, dynamic> json) => QuickSummary(
        what: json['what'] as String? ?? '',
        who: json['who'] as String? ?? '',
        deadline: json['deadline'] as String?,
        action: json['action'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'what': what,
        'who': who,
        'deadline': deadline,
        'action': action,
      };
}
