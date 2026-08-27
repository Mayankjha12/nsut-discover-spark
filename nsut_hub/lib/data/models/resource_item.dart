import 'enums.dart';

class ResourceItem {
  const ResourceItem({
    required this.id,
    required this.title,
    required this.subject,
    required this.branch,
    required this.semester,
    required this.type,
    required this.uploadedBy,
    required this.fileType,
    required this.upvotes,
    required this.createdAt,
    this.fileUrl = '',
    this.sizeLabel,
    this.tags = const [],
  });

  final String id;
  final String title;
  final String subject;
  final Branch branch;
  final int semester;
  final ResourceType type;
  final String uploadedBy;

  /// PDF / DOCX / ZIP / LINK
  final String fileType;
  final int upvotes;
  final DateTime createdAt;

  /// Firebase Storage download URL once uploads are live.
  final String fileUrl;
  final String? sizeLabel;
  final List<String> tags;

  factory ResourceItem.fromJson(Map<String, dynamic> json) => ResourceItem(
        id: json['id'] as String,
        title: json['title'] as String,
        subject: json['subject'] as String? ?? '',
        branch: BranchX.fromApi(json['branch'] as String?),
        semester: json['semester'] as int? ?? 1,
        type: ResourceTypeX.fromApi(json['type'] as String?),
        uploadedBy: json['uploadedBy'] as String? ?? 'NSUT Hub',
        fileType: json['fileType'] as String? ?? 'PDF',
        upvotes: json['upvotes'] as int? ?? 0,
        createdAt: DateTime.parse(json['createdAt'] as String),
        fileUrl: json['fileUrl'] as String? ?? '',
        sizeLabel: json['sizeLabel'] as String?,
        tags: (json['tags'] as List?)?.map((e) => e.toString()).toList() ??
            const [],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'subject': subject,
        'branch': branch.name,
        'semester': semester,
        'type': type.name,
        'uploadedBy': uploadedBy,
        'fileType': fileType,
        'upvotes': upvotes,
        'createdAt': createdAt.toIso8601String(),
        'fileUrl': fileUrl,
        'sizeLabel': sizeLabel,
        'tags': tags,
      };
}
