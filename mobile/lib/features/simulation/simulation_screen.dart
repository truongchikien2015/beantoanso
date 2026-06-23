import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/mascot_bubble.dart';
import '../../domain/models/simulation.dart';

class SimulationScreen extends ConsumerStatefulWidget {
  final String scenarioId;

  const SimulationScreen({
    super.key,
    required this.scenarioId,
  });

  @override
  ConsumerState<SimulationScreen> createState() => _SimulationScreenState();
}

class _SimulationScreenState extends ConsumerState<SimulationScreen> {
  SimulationScenario? _scenario;
  bool _isLoading = true;
  bool _hasAnswered = false;
  bool _isAnswerCorrect = false;

  // Local chat messages log
  final List<Map<String, dynamic>> _messages = []; // { 'sender': 'stranger'/'student'/'mascot', 'text': '...' }

  @override
  void initState() {
    super.initState();
    _loadScenario();
  }

  Future<void> _loadScenario() async {
    final repository = ref.read(safetyRepositoryProvider);
    final scenarios = await repository.getScenarios();
    final match = scenarios.firstWhere(
      (s) => s.id == widget.scenarioId,
      orElse: () => scenarios.first,
    );

    setState(() {
      _scenario = match;
      _isLoading = false;
      // Seed first message
      if (match.steps.isNotEmpty) {
        _messages.add({
          'sender': 'stranger',
          'text': match.steps.first.message,
        });
      }
    });
  }

  void _handleChoice(SimulationChoice choice) {
    if (_hasAnswered) return;

    setState(() {
      _hasAnswered = true;
      _isAnswerCorrect = choice.isSafe;

      // 1. Add student choice to message log
      _messages.add({
        'sender': 'student',
        'text': choice.label,
      });

      // 2. Add Cú Cú mascot response to message log
      _messages.add({
        'sender': 'mascot',
        'text': choice.feedback,
      });

      // 3. Award points if correct
      if (choice.isSafe) {
        ref.read(studentProfileProvider.notifier).addPoints(choice.pointDelta);
        ref.read(studentProfileProvider.notifier).unlockSkill(_scenario?.title ?? '');
      }
    });
  }

  void _resetScenario() {
    setState(() {
      _hasAnswered = false;
      _isAnswerCorrect = false;
      _messages.clear();
      if (_scenario != null && _scenario!.steps.isNotEmpty) {
        _messages.add({
          'sender': 'stranger',
          'text': _scenario!.steps.first.message,
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_scenario == null) {
      return const Scaffold(
        body: Center(child: Text('Không tìm thấy kịch bản.')),
      );
    }

    final step = _scenario!.steps.first;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.onSurface),
          onPressed: () => context.pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              step.senderName,
              style: AppTextStyles.headlineMedium.copyWith(fontSize: 18),
            ),
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  'Đang hoạt động',
                  style: AppTextStyles.labelMedium.copyWith(color: AppColors.primary, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
        elevation: 1,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Chat area
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[index];
                  final isStranger = msg['sender'] == 'stranger';
                  final isStudent = msg['sender'] == 'student';

                  if (isStudent) {
                    return _buildStudentBubble(msg['text']);
                  } else if (isStranger) {
                    return _buildStrangerBubble(msg['text'], step.senderName);
                  } else {
                    // Mascot feedback bubble
                    return MascotBubble(
                      text: msg['text'],
                      showMascot: true,
                      isLeftMascot: true,
                    );
                  }
                },
              ),
            ),
            // Prompt helper Cú Cú if not answered yet
            if (!_hasAnswered)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: MascotBubble(
                  text: 'Tin nhắn trên của ${step.senderName} có an toàn không con? Con nên làm gì bây giờ?',
                  showMascot: true,
                  isLeftMascot: true,
                ),
              ),
            // Choices & CTA Actions
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.surfaceContainerLowest,
                border: Border(top: BorderSide(color: AppColors.surfaceVariant, width: 2)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!_hasAnswered) ...[
                    // Selection choices
                    ...step.choices.map((choice) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: AppButton(
                          text: choice.label,
                          onPressed: () => _handleChoice(choice),
                          backgroundColor: AppColors.primaryContainer,
                          textColor: Colors.white,
                          shadowColor: const Color(0xFF00174B),
                        ),
                      );
                    }),
                  ] else ...[
                    // Feedback states
                    if (_isAnswerCorrect) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.tertiaryFixed,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.tertiary, width: 2),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.star, color: AppColors.tertiary, size: 32),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Xuất sắc! Con được cộng +20 điểm và mở khoá kỹ năng "${_scenario!.title}"!',
                                style: AppTextStyles.labelBold.copyWith(color: AppColors.onTertiaryFixedVariant),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      AppButton(
                        text: 'Hoàn thành bài tập',
                        onPressed: () => context.pop(),
                        backgroundColor: AppColors.primary,
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.errorContainer,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.error, width: 2),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning, color: AppColors.error, size: 32),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Hãy suy nghĩ kỹ lại con nhé. Không nên làm theo yêu cầu này.',
                                style: AppTextStyles.labelBold.copyWith(color: AppColors.onErrorContainer),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: AppButton(
                              text: 'Thử lại',
                              onPressed: _resetScenario,
                              backgroundColor: AppColors.secondary,
                              shadowColor: const Color(0xFF23005C),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: AppButton(
                              text: 'Báo người lớn',
                              onPressed: () => context.push('/sos'),
                              backgroundColor: AppColors.error,
                              shadowColor: const Color(0xFF93000A),
                            ),
                          ),
                        ],
                      ),
                    ]
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStrangerBubble(String text, String senderName) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: AppColors.surfaceContainerHigh,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person, color: AppColors.outline),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(senderName, style: AppTextStyles.labelBold.copyWith(fontSize: 12, color: AppColors.outline)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: const BorderRadius.only(
                      topRight: Radius.circular(16),
                      bottomLeft: Radius.circular(4),
                      bottomRight: Radius.circular(16),
                      topLeft: Radius.circular(16),
                    ),
                  ),
                  child: Text(text, style: AppTextStyles.bodyMedium),
                ),
              ],
            ),
          ),
          const SizedBox(width: 40), // Spacer
        ],
      ),
    );
  }

  Widget _buildStudentBubble(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          const SizedBox(width: 40), // Spacer
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('Con', style: AppTextStyles.labelBold.copyWith(fontSize: 12, color: AppColors.outline)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: const BoxDecoration(
                    color: AppColors.primaryContainer,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(4),
                      topRight: Radius.circular(16),
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
