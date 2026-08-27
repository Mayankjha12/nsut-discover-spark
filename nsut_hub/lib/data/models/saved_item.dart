import 'enums.dart';

class SavedItem {
  const SavedItem({
    required this.id,
    required this.itemId,
    required this.type,
    required this.savedAt,
    this.collectionIds = const [],
    this.reminder = ReminderOption.none,
    this.customReminderAt,
    this.opened = false,
  });

  final String id;
  final String itemId;
  final SavedItemType type;
  final DateTime savedAt;
  final List<String> collectionIds;
  final ReminderOption reminder;
  final DateTime? customReminderAt;
  final bool opened;

  SavedItem copyWith({
    List<String>? collectionIds,
    ReminderOption? reminder,
    DateTime? customReminderAt,
    bool? opened,
  }) =>
      SavedItem(
        id: id,
        itemId: itemId,
        type: type,
        savedAt: savedAt,
        collectionIds: collectionIds ?? this.collectionIds,
        reminder: reminder ?? this.reminder,
        customReminderAt: customReminderAt ?? this.customReminderAt,
        opened: opened ?? this.opened,
      );

  factory SavedItem.fromJson(Map<String, dynamic> json) => SavedItem(
        id: json['id'] as String,
        itemId: json['itemId'] as String,
        type: SavedItemTypeX.fromApi(json['type'] as String?),
        savedAt: DateTime.parse(json['savedAt'] as String),
        collectionIds: (json['collectionIds'] as List?)
                ?.map((e) => e.toString())
                .toList() ??
            const [],
        reminder: ReminderOption.values.firstWhere(
          (r) => r.name == json['reminder'],
          orElse: () => ReminderOption.none,
        ),
        customReminderAt: json['customReminderAt'] == null
            ? null
            : DateTime.parse(json['customReminderAt'] as String),
        opened: json['opened'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'itemId': itemId,
        'type': type.apiValue,
        'savedAt': savedAt.toIso8601String(),
        'collectionIds': collectionIds,
        'reminder': reminder.name,
        'customReminderAt': customReminderAt?.toIso8601String(),
        'opened': opened,
      };
}

class SavedCollection {
  const SavedCollection({
    required this.id,
    required this.name,
    this.emoji = '📁',
  });

  final String id;
  final String name;
  final String emoji;

  factory SavedCollection.fromJson(Map<String, dynamic> json) =>
      SavedCollection(
        id: json['id'] as String,
        name: json['name'] as String,
        emoji: json['emoji'] as String? ?? '📁',
      );

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'emoji': emoji};

  static const List<SavedCollection> defaults = [
    SavedCollection(id: 'apply-this-week', name: 'Apply This Week', emoji: '⚡'),
    SavedCollection(id: 'research', name: 'Research', emoji: '🔬'),
    SavedCollection(
        id: 'summer-internships', name: 'Summer Internships', emoji: '☀️'),
    SavedCollection(id: 'important', name: 'Important', emoji: '⭐'),
    SavedCollection(id: 'competitions', name: 'Competitions', emoji: '🏆'),
  ];
}
