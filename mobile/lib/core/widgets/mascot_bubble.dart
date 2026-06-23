import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';
import '../services/tts_service.dart';

import '../utils/test_helper.dart';

class MascotBubble extends StatefulWidget {
  final String text;
  final bool showMascot;
  final bool isLeftMascot;

  const MascotBubble({
    super.key,
    required this.text,
    this.showMascot = true,
    this.isLeftMascot = true,
  });

  @override
  State<MascotBubble> createState() => _MascotBubbleState();
}

class _MascotBubbleState extends State<MascotBubble> {
  bool _isPlaying = false;

  Future<void> _toggleSpeak() async {
    if (_isPlaying) {
      await TtsService.instance.stop();
      setState(() => _isPlaying = false);
    } else {
      setState(() => _isPlaying = true);
      await TtsService.instance.speak(widget.text);
      // For demo, reset playing state after a short while or on completion.
      // Since vi-VN TTS completes, we can just reset after a calculation of length.
      final durationMs = widget.text.length * 100 + 1000;
      Future.delayed(Duration(milliseconds: durationMs), () {
        if (mounted) {
          setState(() => _isPlaying = false);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    const String mascotUrl = 
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDxqKieRxuS3MlvFe2cUnNR3xK_033-2ZIKKhCqMbQ_uku6a2hY3L1UzXq2bvR53R0WTwcbkyNHgRMejtetleztnt1smzaF0Qnl_CYCaUmkN3M-gc-4WL6z1AWBHRKXf_AIob8kS3hUUxBgCTFbC7nqlcChbF-Xjq1Tt2Rfe0IqtS3TGD_d22qxciCMXeMO8VxPXhpQrc3sDjG-bVS8kMlqVOE10wvLHe7ZBt_vvmVW4F-a4VXXEDY_VkIcUkkCi0z-tL0ZXqAkATQ';

    final Widget mascotWidget = Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.primaryFixed, width: 2),
        color: Colors.white,
        image: TestHelper.isTesting
            ? null
            : const DecorationImage(
                image: NetworkImage(mascotUrl),
                fit: BoxFit.cover,
              ),
      ),
      child: TestHelper.isTesting
          ? const Icon(Icons.face, size: 36, color: AppColors.primary)
          : null,
    );

    final Widget bubbleWidget = Expanded(
      child: Stack(
        children: [
          // Bubble background with shadow
          Container(
            margin: const EdgeInsets.only(bottom: 4),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLowest,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(20),
                topRight: const Radius.circular(20),
                bottomLeft: Radius.circular(widget.isLeftMascot ? 4 : 20),
                bottomRight: Radius.circular(widget.isLeftMascot ? 20 : 4),
              ),
              border: Border.all(color: AppColors.outlineVariant, width: 2),
              boxShadow: const [
                BoxShadow(
                  color: AppColors.surfaceContainerHigh,
                  offset: Offset(0, 4),
                  blurRadius: 0,
                ),
              ],
            ),
            padding: const EdgeInsets.only(left: 16, right: 48, top: 14, bottom: 14),
            child: Text(
              widget.text,
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.onSurface,
                fontSize: 16,
              ),
            ),
          ),
          // Speaker icon button
          Positioned(
            right: 8,
            top: 8,
            child: InkWell(
              onTap: _toggleSpeak,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: _isPlaying 
                      ? AppColors.primaryContainer.withValues(alpha: 0.1) 
                      : Colors.transparent,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isPlaying ? Icons.volume_up : Icons.volume_mute,
                  color: _isPlaying ? AppColors.primary : AppColors.outline,
                  size: 24,
                ),
              ),
            ),
          ),
        ],
      ),
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (widget.showMascot && widget.isLeftMascot) ...[
            mascotWidget,
            const SizedBox(width: 12),
          ],
          bubbleWidget,
          if (widget.showMascot && !widget.isLeftMascot) ...[
            const SizedBox(width: 12),
            mascotWidget,
          ],
        ],
      ),
    );
  }
}
