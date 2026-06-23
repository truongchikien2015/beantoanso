import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';

class AppButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color backgroundColor;
  final Color textColor;
  final Color shadowColor;
  final Widget? icon;
  final double height;
  final double borderRadius;
  final bool fullWidth;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.backgroundColor = AppColors.primary,
    this.textColor = AppColors.onPrimary,
    this.shadowColor = const Color(0xFF00174B),
    this.icon,
    this.height = 56,
    this.borderRadius = 16,
    this.fullWidth = true,
  });

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool _isPressed = false;

  void _onTapDown(TapDownDetails details) {
    if (widget.onPressed == null) return;
    setState(() => _isPressed = true);
  }

  void _onTapUp(TapUpDetails details) {
    if (widget.onPressed == null) return;
    setState(() => _isPressed = false);
    widget.onPressed?.call();
  }

  void _onTapCancel() {
    if (widget.onPressed == null) return;
    setState(() => _isPressed = false);
  }

  @override
  Widget build(BuildContext context) {
    final double shadowHeight = 4.0;
    final double activeOffset = _isPressed ? shadowHeight : 0.0;
    final double currentShadowHeight = _isPressed ? 0.0 : shadowHeight;

    Widget buttonBody = Stack(
      children: [
        // Shadow container
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            height: widget.height - shadowHeight,
            decoration: BoxDecoration(
              color: widget.onPressed == null 
                  ? AppColors.surfaceVariant.withValues(alpha: 0.5) 
                  : widget.shadowColor,
              borderRadius: BorderRadius.circular(widget.borderRadius),
            ),
          ),
        ),
        // Content container that moves
        AnimatedContainer(
          duration: const Duration(milliseconds: 60),
          margin: EdgeInsets.only(bottom: currentShadowHeight, top: activeOffset),
          height: widget.height - shadowHeight,
          decoration: BoxDecoration(
            color: widget.onPressed == null
                ? AppColors.surfaceVariant
                : widget.backgroundColor,
            borderRadius: BorderRadius.circular(widget.borderRadius),
            border: Border.all(
              color: widget.onPressed == null
                  ? AppColors.outline.withValues(alpha: 0.5)
                  : widget.shadowColor.withValues(alpha: 0.3),
              width: 2,
            ),
          ),
          child: Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.icon != null) ...[
                  widget.icon!,
                  const SizedBox(width: 8),
                ],
                Text(
                  widget.text,
                  style: AppTextStyles.labelBold.copyWith(
                    color: widget.onPressed == null
                        ? AppColors.outline
                        : widget.textColor,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: SizedBox(
        height: widget.height,
        width: widget.fullWidth ? double.infinity : null,
        child: buttonBody,
      ),
    );
  }
}
