import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/mascot_bubble.dart';

class SosScreen extends StatefulWidget {
  const SosScreen({super.key});

  @override
  State<SosScreen> createState() => _SosScreenState();
}

class _SosScreenState extends State<SosScreen> {
  int? _selectedProblemIndex;
  bool _alertSent = false;

  final List<String> _problems = [
    'Con lỡ bấm vào link lạ đáng ngờ',
    'Có người lạ nhắn tin gạ gẫm con',
    'Có người đang đe dọa, chửi bới con',
    'Con thấy sợ hãi và lo lắng chuyện trên mạng',
  ];

  final List<String> _safetyChecklist = [
    'Không trả lời thêm bất kỳ tin nhắn nào của người đó.',
    'Tuyệt đối không xoá tin nhắn để giữ lại làm bằng chứng.',
    'Chụp ảnh màn hình điện thoại ngay lập tức.',
    'Nói chuyện và chia sẻ ngay với bố mẹ hoặc thầy cô con tin tưởng.',
  ];

  void _handleSendAlert() {
    setState(() {
      _alertSent = true;
    });

    // Show simulated success dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: const [
              Icon(Icons.check_circle, color: Colors.green, size: 28),
              SizedBox(width: 8),
              Text('Đã báo người lớn'),
            ],
          ),
          content: Text(
            'Hệ thống đã giả lập gửi thông báo khẩn cấp tới điện thoại của Bố/Mẹ và Thầy/Cô. Bố mẹ sẽ gọi điện hoặc đến giúp con ngay nhé!',
            style: AppTextStyles.bodyMedium,
          ),
          actions: [
            AppButton(
              text: 'Con đã hiểu',
              onPressed: () {
                Navigator.of(context).pop();
                context.go('/home'); // return to home safely
              },
              height: 48,
              borderRadius: 12,
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.onSurface),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Con cần giúp đỡ (SOS)',
          style: AppTextStyles.headlineMedium.copyWith(color: AppColors.error),
        ),
        elevation: 1,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Reassuring Cú Cú Speech bubble
                      const MascotBubble(
                        text: "Con đừng sợ nhé! Con không làm gì sai cả. Cú Cú luôn ở đây cùng con. Hãy chọn vấn đề con đang gặp phải bên dưới nhé.",
                        showMascot: true,
                        isLeftMascot: true,
                      ),
                      const SizedBox(height: 20),
                      if (_selectedProblemIndex == null) ...[
                        Text(
                          'CON ĐANG GẶP CHUYỆN GÌ THẾ?',
                          style: AppTextStyles.labelBold.copyWith(color: AppColors.outline),
                        ),
                        const SizedBox(height: 12),
                        ...List.generate(_problems.length, (index) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12.0),
                            child: AppButton(
                              text: _problems[index],
                              onPressed: () => setState(() => _selectedProblemIndex = index),
                              backgroundColor: AppColors.surfaceContainerLowest,
                              textColor: AppColors.onSurface,
                              shadowColor: AppColors.outlineVariant,
                            ),
                          );
                        }),
                      ] else ...[
                        // Checklist header
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.errorContainer,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.error, width: 2),
                          ),
                          child: Text(
                            'Vấn đề con chọn: ${_problems[_selectedProblemIndex!]}',
                            style: AppTextStyles.labelBold.copyWith(color: AppColors.onErrorContainer),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'CÁC VIỆC CON CẦN LÀM NGAY:',
                          style: AppTextStyles.labelBold.copyWith(color: AppColors.outline),
                        ),
                        const SizedBox(height: 12),
                        // Display safety checklists
                        ...List.generate(_safetyChecklist.length, (index) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerLowest,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.surfaceVariant, width: 2),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: const BoxDecoration(
                                    color: AppColors.primaryFixed,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      '${index + 1}',
                                      style: AppTextStyles.labelBold.copyWith(color: AppColors.primary),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    _safetyChecklist[index],
                                    style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ]
                    ],
                  ),
                ),
              ),
              // Notify Parent buttons
              if (_selectedProblemIndex != null && !_alertSent) ...[
                AppButton(
                  text: 'Báo người lớn ngay',
                  backgroundColor: AppColors.error,
                  shadowColor: const Color(0xFF93000A),
                  icon: const Icon(Icons.warning, color: Colors.white),
                  onPressed: _handleSendAlert,
                ),
                const SizedBox(height: 12),
                AppButton(
                  text: 'Chọn vấn đề khác',
                  backgroundColor: AppColors.surfaceContainerHigh,
                  textColor: AppColors.onSurface,
                  shadowColor: AppColors.outlineVariant,
                  onPressed: () => setState(() => _selectedProblemIndex = null),
                ),
              ]
            ],
          ),
        ),
      ),
    );
  }
}
