import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/mascot_bubble.dart';

class QuizScreen extends ConsumerStatefulWidget {
  final String stepId;

  const QuizScreen({super.key, required this.stepId});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _stepContent;
  List<dynamic> _questions = [];

  int _currentIndex = 0;
  String? _selectedOption; // "A", "B", "C"
  bool _isAnswered = false;
  int _correctCount = 0;

  // Track student answers to submit at the end
  final List<Map<String, dynamic>> _userAnswers = [];

  bool _isResultView = false;
  bool _isSubmitting = false;
  int _xpAwarded = 0;

  @override
  void initState() {
    super.initState();
    _loadStepContent();
  }

  Future<void> _loadStepContent() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await ref
          .read(safetyRepositoryProvider)
          .getStepContent(widget.stepId);
      if (mounted) {
        setState(() {
          _stepContent = data;
          _questions = (data['questions'] as List<dynamic>?) ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Không tải được câu hỏi trắc nghiệm.';
          _isLoading = false;
        });
      }
    }
  }

  void _handleOptionSelect(String option) {
    if (_isAnswered) return;

    final currentQuestion = _questions[_currentIndex] as Map<String, dynamic>;
    final correctOption = currentQuestion['correct_option'] as String;
    final isCorrect = option == correctOption;

    setState(() {
      _selectedOption = option;
      _isAnswered = true;
      if (isCorrect) {
        _correctCount++;
      }

      // Record answer
      _userAnswers.add({
        'question_id': currentQuestion['id'] as String,
        'selected_option': option,
      });
    });
  }

  void _handleNext() async {
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedOption = null;
        _isAnswered = false;
      });
    } else {
      // Last question completed -> submit results
      await _submitQuizResults();
    }
  }

  Future<void> _submitQuizResults() async {
    setState(() {
      _isSubmitting = true;
    });

    final pathId = _stepContent?['path_id'] as String? ?? 'path_demo_01';
    final score = (_correctCount / _questions.length * 100).round();

    try {
      final res = await ref
          .read(safetyRepositoryProvider)
          .submitQuiz(
            pathId: pathId,
            stepId: widget.stepId,
            score: score,
            answers: _userAnswers,
          );

      final xp = res['xp_awarded'] as int? ?? (score ~/ 10 * 10);
      final stats = res['stats'] is Map
          ? Map<String, dynamic>.from(res['stats'] as Map)
          : null;
      ref
          .read(studentProfileProvider.notifier)
          .applyServerStats(stats, fallbackXp: xp);

      if (mounted) {
        setState(() {
          _xpAwarded = xp;
          _isResultView = true;
          _isSubmitting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Không nộp được bài học. Con hãy thử lại nhé.';
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_errorMessage != null || _questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Làm bài trắc nghiệm')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_errorMessage ?? 'Không tìm thấy câu hỏi nào con nhé!'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadStepContent,
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    if (_isSubmitting) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Đang nộp bài học của con lên máy chủ...'),
            ],
          ),
        ),
      );
    }

    if (_isResultView) {
      return _buildResultView();
    }

    final currentQuestion = _questions[_currentIndex] as Map<String, dynamic>;
    final questionText = currentQuestion['question'] as String? ?? '';
    final optA = currentQuestion['option_a'] as String? ?? '';
    final optB = currentQuestion['option_b'] as String? ?? '';
    final optC = currentQuestion['option_c'] as String? ?? '';
    final correctOption = currentQuestion['correct_option'] as String? ?? 'A';
    final explanation = currentQuestion['explanation'] as String? ?? '';

    final int qNumber = _currentIndex + 1;
    final int qTotal = _questions.length;
    final double progressPercent = qNumber / qTotal;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.outline),
          onPressed: () {
            // Confirm quit
            showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Thoát học?'),
                content: const Text(
                  'Con có muốn tạm dừng bài học và quay lại bản đồ không?',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Học tiếp'),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.pop();
                    },
                    child: const Text('Thoát'),
                  ),
                ],
              ),
            );
          },
        ),
        title: Text(
          'Làm bài học trắc nghiệm',
          style: AppTextStyles.headlineMedium.copyWith(fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Question Progress Indicator
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Câu hỏi $qNumber của $qTotal',
                            style: AppTextStyles.labelBold.copyWith(
                              color: AppColors.outline,
                            ),
                          ),
                          Text(
                            '${(progressPercent * 100).round()}%',
                            style: AppTextStyles.labelBold.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: progressPercent,
                          minHeight: 8,
                          backgroundColor: AppColors.surfaceVariant,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Question Details Scroll Section
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 8,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Question Card
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: AppColors.surfaceVariant,
                              width: 2,
                            ),
                          ),
                          child: Text(
                            questionText,
                            style: AppTextStyles.headlineMedium.copyWith(
                              fontSize: 18,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Options A, B, C
                        _buildOptionCard(
                          label: 'A',
                          text: optA,
                          isSelected: _selectedOption == 'A',
                          correctOption: correctOption,
                        ),
                        const SizedBox(height: 12),
                        _buildOptionCard(
                          label: 'B',
                          text: optB,
                          isSelected: _selectedOption == 'B',
                          correctOption: correctOption,
                        ),
                        const SizedBox(height: 12),
                        _buildOptionCard(
                          label: 'C',
                          text: optC,
                          isSelected: _selectedOption == 'C',
                          correctOption: correctOption,
                        ),
                        const SizedBox(height: 20),

                        // Mascot Explanation Bubble if answered
                        if (_isAnswered) ...[
                          MascotBubble(
                            text: _selectedOption == correctOption
                                ? '🎉 Chính xác rồi! Con siêu quá. $explanation'
                                : '😕 Chưa đúng rồi con ơi! Đáp án đúng là $correctOption nhé. $explanation',
                          ),
                          const SizedBox(height: 24),
                        ],
                      ],
                    ),
                  ),
                ),

                // Next Button
                if (_isAnswered)
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: AppColors.surface,
                    child: AppButton(
                      text: _currentIndex < _questions.length - 1
                          ? 'Tiếp tục ➡️'
                          : 'Hoàn thành 🏆',
                      onPressed: _handleNext,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOptionCard({
    required String label,
    required String text,
    required bool isSelected,
    required String correctOption,
  }) {
    Color bg = AppColors.surfaceContainerLowest;
    Color border = AppColors.surfaceVariant;
    Widget trailing = Text(
      label,
      style: AppTextStyles.labelBold.copyWith(color: AppColors.outline),
    );

    if (_isAnswered) {
      if (label == correctOption) {
        // Highlight correct option in green
        bg = Colors.green.shade50;
        border = Colors.green.shade500;
        trailing = const Icon(Icons.check_circle, color: Colors.green);
      } else if (isSelected) {
        // Highlight chosen incorrect option in red
        bg = Colors.red.shade50;
        border = Colors.red.shade500;
        trailing = const Icon(Icons.cancel, color: Colors.red);
      }
    } else {
      // Normal state, hover/selection effect
      if (isSelected) {
        bg = AppColors.primaryFixed;
        border = AppColors.primary;
      }
    }

    return GestureDetector(
      onTap: () => _handleOptionSelect(label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: border,
            width: isSelected || (label == correctOption && _isAnswered)
                ? 2.5
                : 2,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? AppColors.primary.withValues(alpha: 0.1)
                  : AppColors.surfaceVariant,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                text,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.bold,
                  color: _isAnswered && label != correctOption && !isSelected
                      ? Colors.grey.shade500
                      : AppColors.onSurface,
                ),
              ),
            ),
            const SizedBox(width: 8),
            trailing,
          ],
        ),
      ),
    );
  }

  Widget _buildResultView() {
    final int score = (_correctCount / _questions.length * 100).round();
    const String certificateBadge = '🏆';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600.0),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Spacer(),
                  const Center(
                    child: Text(
                      certificateBadge,
                      style: TextStyle(fontSize: 80),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Hoàn thành xuất sắc!',
                    style: AppTextStyles.displayMobile.copyWith(
                      color: Colors.green.shade800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Con đã hoàn thành chặng học an toàn số ngày hôm nay.',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.outline,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),

                  // Score Box
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppColors.surfaceVariant,
                        width: 2,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Column(
                          children: [
                            Text(
                              'Đúng',
                              style: AppTextStyles.labelBold.copyWith(
                                color: AppColors.outline,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_correctCount / ${_questions.length}',
                              style: AppTextStyles.headlineMedium.copyWith(
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          width: 2,
                          height: 40,
                          color: AppColors.surfaceVariant,
                        ),
                        Column(
                          children: [
                            Text(
                              'Điểm số',
                              style: AppTextStyles.labelBold.copyWith(
                                color: AppColors.outline,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$score%',
                              style: AppTextStyles.headlineMedium.copyWith(
                                color: Colors.green,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          width: 2,
                          height: 40,
                          color: AppColors.surfaceVariant,
                        ),
                        Column(
                          children: [
                            Text(
                              'Điểm XP',
                              style: AppTextStyles.labelBold.copyWith(
                                color: AppColors.outline,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '+$_xpAwarded XP',
                              style: AppTextStyles.headlineMedium.copyWith(
                                color: AppColors.tertiary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const Spacer(),
                  // Back button
                  AppButton(
                    text: 'Quay lại bản đồ',
                    onPressed: () {
                      context.pop();
                    },
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
