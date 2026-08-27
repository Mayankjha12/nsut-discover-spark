import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';

/// Labelled numeric input used across the calculators.
class NumberField extends StatefulWidget {
  const NumberField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.max = 1000,
    this.decimals = false,
    this.suffix,
  });

  final String label;
  final double value;
  final ValueChanged<double> onChanged;
  final double max;
  final bool decimals;
  final String? suffix;

  @override
  State<NumberField> createState() => _NumberFieldState();
}

class _NumberFieldState extends State<NumberField> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.decimals
        ? widget.value.toStringAsFixed(2)
        : widget.value.toStringAsFixed(0),
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(widget.label,
                style: Theme.of(context).textTheme.bodyLarge),
          ),
          SizedBox(
            width: 78,
            child: TextField(
              controller: _controller,
              textAlign: TextAlign.right,
              keyboardType: TextInputType.numberWithOptions(
                  decimal: widget.decimals),
              inputFormatters: [
                FilteringTextInputFormatter.allow(
                    RegExp(widget.decimals ? r'[0-9.]' : r'[0-9]')),
              ],
              style: const TextStyle(
                fontFamily: AppTheme.fontFamily,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.accentBright,
              ),
              decoration: const InputDecoration(
                isDense: true,
                filled: false,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 10),
              ),
              onChanged: (raw) {
                final parsed = double.tryParse(raw);
                if (parsed == null) return;
                widget.onChanged(parsed.clamp(0, widget.max));
              },
            ),
          ),
          if (widget.suffix != null) ...[
            const SizedBox(width: 4),
            Text(widget.suffix!,
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ],
      ),
    );
  }
}
