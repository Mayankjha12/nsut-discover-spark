import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/enums.dart';
import '../providers/saved_provider.dart';

/// Bookmark control with a small pop animation and optimistic state.
class SaveButton extends ConsumerStatefulWidget {
  const SaveButton({
    super.key,
    required this.itemId,
    required this.type,
    this.compact = false,
    this.label,
  });

  final String itemId;
  final SavedItemType type;
  final bool compact;
  final String? label;

  @override
  ConsumerState<SaveButton> createState() => _SaveButtonState();
}

class _SaveButtonState extends ConsumerState<SaveButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 320),
  );

  late final Animation<double> _scale = TweenSequence<double>([
    TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.82), weight: 30),
    TweenSequenceItem(
      tween: Tween(begin: 0.82, end: 1.14)
          .chain(CurveTween(curve: Curves.easeOutBack)),
      weight: 40,
    ),
    TweenSequenceItem(tween: Tween(begin: 1.14, end: 1.0), weight: 30),
  ]).animate(_controller);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTap() {
    HapticFeedback.selectionClick();
    final nowSaved =
        ref.read(savedProvider.notifier).toggle(widget.itemId, widget.type);
    _controller.forward(from: 0);
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        duration: const Duration(milliseconds: 1400),
        content: Text(nowSaved ? 'Saved to your list' : 'Removed from saved'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final saved = ref.watch(isSavedProvider(widget.itemId));
    final color = saved ? AppColors.accentBright : AppColors.textSecondary;

    final icon = ScaleTransition(
      scale: _scale,
      child: AnimatedSwitcher(
        duration: AppDurations.fast,
        transitionBuilder: (child, anim) =>
            FadeTransition(opacity: anim, child: child),
        child: Icon(
          saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
          key: ValueKey(saved),
          size: widget.compact ? 20 : 22,
          color: color,
        ),
      ),
    );

    if (widget.compact) {
      return Semantics(
        button: true,
        label: saved ? 'Remove from saved' : 'Save',
        child: InkResponse(
          onTap: _onTap,
          radius: 22,
          child: Padding(padding: const EdgeInsets.all(6), child: icon),
        ),
      );
    }

    return OutlinedButton.icon(
      onPressed: _onTap,
      icon: icon,
      label: Text(widget.label ?? (saved ? 'Saved' : 'Save')),
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(
          color: saved ? AppColors.accent : AppColors.borderStrong,
        ),
        backgroundColor: saved ? AppColors.accentSoft : Colors.transparent,
      ),
    );
  }
}
