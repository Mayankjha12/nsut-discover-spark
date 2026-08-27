import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/deadline_utils.dart';
import '../../data/models/enums.dart';
import '../../data/models/resource_item.dart';
import 'common.dart';
import 'save_button.dart';

class ResourceCard extends StatelessWidget {
  const ResourceCard({super.key, required this.resource, this.onOpen});

  final ResourceItem resource;
  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context) {
    final r = resource;
    return Material(
      color: AppColors.surface,
      borderRadius: AppRadius.card,
      child: InkWell(
        borderRadius: AppRadius.card,
        onTap: onOpen,
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: AppRadius.card,
            border: Border.all(color: AppColors.border),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 42,
                  width: 42,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                    border: Border.all(color: AppColors.border),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    r.fileType,
                    style: const TextStyle(
                      fontFamily: AppTheme.fontFamily,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.accentBright,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        r.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${r.subject} · ${r.branch.label} · Sem ${r.semester}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          TagPill(
                            label: r.type.label,
                            color: AppColors.forCategory('Resources'),
                            filled: true,
                            dense: true,
                          ),
                          TagPill(
                            label: '${r.upvotes} upvotes',
                            icon: Icons.arrow_upward_rounded,
                            dense: true,
                          ),
                          if (r.sizeLabel != null)
                            TagPill(label: r.sizeLabel!, dense: true),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Uploaded by ${r.uploadedBy} · ${DeadlineUtils.relativeDate(r.createdAt)}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                SaveButton(
                  itemId: r.id,
                  type: SavedItemType.resource,
                  compact: true,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
