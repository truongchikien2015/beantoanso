import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/mascot_bubble.dart';

class AiAssistantScreen extends ConsumerStatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  ConsumerState<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends ConsumerState<AiAssistantScreen> {
  final List<Map<String, dynamic>> _messages = [
    {
      'sender': 'bot',
      'text': 'Chào con! Cú Cú AI luôn có mặt để giải đáp mọi thắc mắc của con về an toàn mạng. Con muốn hỏi Cú Cú điều gì thế?'
    }
  ];

  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  final List<String> _quickPrompts = [
    'Có người xin OTP của con',
    'Con lỡ bấm vào link lạ',
    'Bạn bắt nạt con trên mạng',
    'Có người xin ảnh của con'
  ];

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add({
        'sender': 'user',
        'text': text,
      });
      // Add a placeholder message for "Thinking"
      _messages.add({
        'sender': 'bot',
        'text': 'Cú Cú đang suy nghĩ kĩ con nhé...',
        'isThinking': true,
      });
      _textController.clear();
    });
    _scrollToBottom();

    try {
      final repo = ref.read(safetyRepositoryProvider);
      final reply = await repo.askMascot(text);

      if (!mounted) return;

      setState(() {
        _messages.removeWhere((m) => m['isThinking'] == true);
        _messages.add({
          'sender': 'bot',
          'text': reply,
        });
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _messages.removeWhere((m) => m['isThinking'] == true);
        _messages.add({
          'sender': 'bot',
          'text': 'Cú Cú gặp lỗi kết nối máy chủ rồi. Con hãy thử lại sau nhé!',
        });
      });
    }
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    const String mascotUrl = 
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDxqKieRxuS3MlvFe2cUnNR3xK_033-2ZIKKhCqMbQ_uku6a2hY3L1UzXq2bvR53R0WTwcbkyNHgRMejtetleztnt1smzaF0Qnl_CYCaUmkN3M-gc-4WL6z1AWBHRKXf_AIob8kS3hUUxBgCTFbC7nqlcChbF-Xjq1Tt2Rfe0IqtS3TGD_d22qxciCMXeMO8VxPXhpQrc3sDjG-bVS8kMlqVOE10wvLHe7ZBt_vvmVW4F-a4VXXEDY_VkIcUkkCi0z-tL0ZXqAkATQ';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.onSurface),
          onPressed: () => context.pop(),
        ),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                image: DecorationImage(image: NetworkImage(mascotUrl), fit: BoxFit.cover),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Cú Cú An Toàn', style: AppTextStyles.headlineMedium.copyWith(fontSize: 16)),
                  Row(
                    children: [
                      Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
                      const SizedBox(width: 4),
                      Text('Luôn sẵn sàng giúp con', style: AppTextStyles.labelMedium.copyWith(color: AppColors.primary, fontSize: 10)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        elevation: 1,
      ),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                // Chat List
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isUser = msg['sender'] == 'user';

                      if (isUser) {
                        return _buildUserBubble(msg['text']);
                      } else {
                        // Display Mascot Bubble for Cú Cú
                        return MascotBubble(
                          text: msg['text'],
                          showMascot: true,
                          isLeftMascot: true,
                        );
                      }
                    },
                  ),
                ),
                // Quick Chips Suggestions
                if (_messages.length == 1)
                  SizedBox(
                    height: 52,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: _quickPrompts.length,
                      itemBuilder: (context, index) {
                        final prompt = _quickPrompts[index];
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0, bottom: 6),
                          child: ActionChip(
                            label: Text(
                              prompt,
                              style: AppTextStyles.labelBold.copyWith(color: AppColors.primary, fontSize: 12),
                            ),
                            backgroundColor: AppColors.surfaceContainerLowest,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: const BorderSide(color: AppColors.primary, width: 2),
                            ),
                            onPressed: () => _sendMessage(prompt),
                          ),
                        );
                      },
                    ),
                  ),
                // Input Bar Container
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: const BoxDecoration(
                    color: AppColors.surfaceContainerLowest,
                    border: Border(top: BorderSide(color: AppColors.surfaceVariant, width: 1)),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.attach_file, color: AppColors.outline),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Chức năng tải file đính kèm đang được xây dựng con nhé!')),
                          );
                        },
                      ),
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerLow,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: AppColors.outlineVariant, width: 2),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: TextField(
                            controller: _textController,
                            style: AppTextStyles.bodyMedium,
                            textInputAction: TextInputAction.send,
                            onSubmitted: _sendMessage,
                            decoration: InputDecoration(
                              hintText: 'Hỏi Cú Cú về an toàn mạng...',
                              hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.outline),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                        child: IconButton(
                          icon: const Icon(Icons.send, color: Colors.white),
                          onPressed: () => _sendMessage(_textController.text),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            // Floating red SOS alert widget overlay
            Positioned(
              bottom: 90,
              right: 16,
              child: FloatingActionButton(
                heroTag: 'ai_sos_fab',
                backgroundColor: AppColors.error,
                foregroundColor: AppColors.onError,
                shape: const CircleBorder(),
                onPressed: () => context.push('/sos'),
                child: const Text('SOS', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserBubble(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          const SizedBox(width: 40),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: const BoxDecoration(
                    color: AppColors.primaryContainer,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(20),
                      bottomLeft: Radius.circular(20),
                      bottomRight: Radius.circular(4),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  child: Text(
                    text,
                    style: AppTextStyles.bodyMedium.copyWith(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
