import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/app_button.dart';

class LearningPathDetailScreen extends ConsumerStatefulWidget {
  final String pathId;

  const LearningPathDetailScreen({
    super.key,
    required this.pathId,
  });

  @override
  ConsumerState<LearningPathDetailScreen> createState() =>
      _LearningPathDetailScreenState();
}

class _LearningPathDetailScreenState
    extends ConsumerState<LearningPathDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _dashboardData;
  List<Map<String, dynamic>>? _learningPaths;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final repository = ref.read(safetyRepositoryProvider);
      final results = await Future.wait([
        repository.getStudentDashboard(),
        repository.getLearningPaths(),
      ]);
      debugPrint('ℹ️ [LearningPathDetail] dashboardData: ${results[0]}');
      if (mounted) {
        setState(() {
          _dashboardData = results[0] as Map<String, dynamic>;
          _learningPaths = (results[1] as List<dynamic>).map((e) => e as Map<String, dynamic>).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Không tải được thông tin lộ trình.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null || _dashboardData == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Hành trình an toàn')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_errorMessage ?? 'Đã có lỗi xảy ra'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadDashboardData,
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    Map<String, dynamic>? path;
    List<dynamic> steps = [];

    final assignedPath = _dashboardData!['assigned_path'] as Map<String, dynamic>?;
    if (assignedPath != null && assignedPath['id'] == widget.pathId) {
      path = assignedPath;
      steps = (path['steps'] as List<dynamic>?) ?? [];
    } else {
      // Find from public learning paths
      final matchingPath = _learningPaths?.firstWhere(
        (p) => p['id'] == widget.pathId,
        orElse: () => <String, dynamic>{},
      );
      if (matchingPath != null && matchingPath.isNotEmpty) {
        path = matchingPath;
        final topicIds = (matchingPath['topic_ids'] as List<dynamic>?) ?? [];
        steps = topicIds.map((topicId) {
          final idx = topicIds.indexOf(topicId);
          return {
            'id': topicId, // Use topicId directly as step_id
            'path_id': widget.pathId,
            'step_order': idx + 1,
            'step_type': 'topic',
            'topic_id': topicId,
            'question_set_id': null,
          };
        }).toList();
      } else {
        path = assignedPath;
        steps = (path?['steps'] as List<dynamic>?) ?? [];
      }
    }

    final progressList = (_dashboardData!['progress'] as List<dynamic>?) ?? [];

    // Map step status
    // Step is completed if there is an entry in progressList for its step_id with score >= 80 (or any score for topic completed)
    final Set<String> completedStepIds = progressList
        .map((p) => p['step_id'] as String)
        .toSet();

    // The first uncompleted step is the active one
    String? activeStepId;
    for (var step in steps) {
      final stepId = step['id'] as String;
      if (!completedStepIds.contains(stepId)) {
        activeStepId = stepId;
        break;
      }
    }
    // If all are completed, the last one is active
    if (activeStepId == null && steps.isNotEmpty) {
      activeStepId = steps.last['id'] as String;
    }

    // Calculate progress
    final int completedCount = completedStepIds.length;
    final int totalCount = steps.length;
    final double percent = totalCount > 0 ? completedCount / totalCount : 0.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.primary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          path?['title'] as String? ?? 'Hành trình an toàn',
          style: AppTextStyles.headlineMedium.copyWith(color: AppColors.primary),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.primary),
            onPressed: _loadDashboardData,
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Progress Bar Section
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  color: AppColors.surface,
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.map, color: AppColors.primary, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'Tiến độ hành trình',
                                style: AppTextStyles.labelBold,
                              ),
                            ],
                          ),
                          Text(
                            '$completedCount / $totalCount chặng',
                            style: AppTextStyles.labelBold.copyWith(color: AppColors.primary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: percent,
                          minHeight: 12,
                          backgroundColor: AppColors.surfaceVariant,
                          valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                        ),
                      ),
                    ],
                  ),
                ),

                // Interactive Map and List
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // 1. Curvy Game Map Visual
                        Container(
                          height: 180,
                          margin: const EdgeInsets.only(bottom: 24),
                          decoration: BoxDecoration(
                            color: Colors.lightBlue.shade50,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: Colors.lightBlue.shade100, width: 2),
                          ),
                          child: Stack(
                            children: [
                              // Background Line Connector
                              Positioned.fill(
                                child: CustomPaint(
                                  painter: MapPathPainter(nodeCount: steps.length),
                                ),
                              ),
                              // Node items laid out on the map
                              ...List.generate(steps.length, (index) {
                                final step = steps[index];
                                final stepId = step['id'] as String;
                                final isCompleted = completedStepIds.contains(stepId);
                                final isActive = stepId == activeStepId;
                                final isLocked = !isCompleted && !isActive;

                                // Positions alternating on the curved layout dynamically
                                double xFactor = 0.5;
                                final mod = index % 4;
                                if (mod == 0) xFactor = 0.25;
                                if (mod == 1) xFactor = 0.5;
                                if (mod == 2) xFactor = 0.75;
                                if (mod == 3) xFactor = 0.5;

                                double yFactor = steps.length > 1
                                    ? 0.8 - (index * (0.6 / (steps.length - 1)))
                                    : 0.5;

                                return Align(
                                  alignment: FractionalOffset(xFactor, yFactor),
                                  child: _buildMapNode(
                                    order: index + 1,
                                    isCompleted: isCompleted,
                                    isActive: isActive,
                                    isLocked: isLocked,
                                    onTap: () {
                                      if (!isLocked) {
                                        context.push('/quiz/$stepId').then((_) => _loadDashboardData());
                                      }
                                    },
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),

                        // 2. Chặng học List Section
                        Text(
                          'Các chặng học',
                          style: AppTextStyles.headlineMedium.copyWith(fontSize: 18),
                        ),
                        const SizedBox(height: 12),

                        // List view of steps
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: steps.length,
                          itemBuilder: (context, index) {
                            final step = steps[index];
                            final stepId = step['id'] as String;
                            final stepOrder = step['step_order'] as int? ?? (index + 1);
                            final topicId = step['topic_id'] as String? ?? 'password';
                            final isCompleted = completedStepIds.contains(stepId);
                            final isActive = stepId == activeStepId;
                            final isLocked = !isCompleted && !isActive;

                            final title = getTopicTitle(stepOrder, topicId);

                            // Theme customization
                            Color cardBg = AppColors.surfaceContainerLowest;
                            Color borderCol = AppColors.surfaceVariant;
                            Widget trailingWidget = const Icon(Icons.lock, color: AppColors.outline);

                            if (isCompleted) {
                              cardBg = Colors.green.shade50;
                              borderCol = Colors.green.shade200;
                              trailingWidget = const Icon(Icons.check_circle, color: Colors.green, size: 28);
                            } else if (isActive) {
                              cardBg = AppColors.primaryFixed;
                              borderCol = AppColors.primary;
                              trailingWidget = const Icon(Icons.play_circle_filled, color: AppColors.primary, size: 32);
                            }

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: cardBg,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: borderCol, width: isActive ? 2.5 : 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: isActive
                                        ? AppColors.primary.withValues(alpha: 0.15)
                                        : AppColors.surfaceVariant,
                                    offset: const Offset(0, 4),
                                    blurRadius: isActive ? 8 : 0,
                                  ),
                                ],
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                leading: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isLocked
                                        ? Colors.grey.shade300
                                        : (isCompleted ? Colors.green : AppColors.primary),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      '$stepOrder',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                                title: Text(
                                  title,
                                  style: AppTextStyles.labelBold.copyWith(
                                    color: isLocked ? Colors.grey.shade600 : AppColors.onSurface,
                                    fontSize: 15,
                                  ),
                                ),
                                subtitle: Text(
                                  isActive
                                      ? 'ĐANG HỌC • Hãy hoàn thành bài học này nhé!'
                                      : (isCompleted ? 'Hoàn thành tuyệt vời!' : 'Chặng học đang khóa'),
                                  style: AppTextStyles.bodyMedium.copyWith(
                                    color: isActive ? AppColors.primary : Colors.grey.shade500,
                                    fontSize: 12,
                                  ),
                                ),
                                trailing: trailingWidget,
                                onTap: isLocked
                                    ? null
                                    : () {
                                        context.push('/quiz/$stepId').then((_) => _loadDashboardData());
                                      },
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),

                // Fixed Bottom "Vào bài học ngay" button
                if (activeStepId != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      border: const Border(
                        top: BorderSide(color: AppColors.surfaceVariant, width: 2),
                      ),
                    ),
                    child: AppButton(
                      text: 'Vào bài học ngay 🚀',
                      onPressed: () {
                        context.push('/quiz/$activeStepId').then((_) => _loadDashboardData());
                      },
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMapNode({
    required int order,
    required bool isCompleted,
    required bool isActive,
    required bool isLocked,
    required VoidCallback onTap,
  }) {
    Color bg = Colors.grey.shade300;
    Color border = Colors.grey.shade400;
    Widget child = Text('$order', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16));

    if (isCompleted) {
      bg = Colors.green;
      border = Colors.green.shade700;
      child = const Icon(Icons.check, color: Colors.white, size: 24);
    } else if (isActive) {
      bg = Colors.yellow.shade600;
      border = AppColors.primary;
      child = const Icon(Icons.shield, color: Colors.white, size: 26);
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: bg,
          shape: BoxShape.circle,
          border: Border.all(color: border, width: isActive ? 3 : 2),
          boxShadow: [
            if (isActive)
              BoxShadow(
                color: Colors.yellow.shade800.withValues(alpha: 0.5),
                blurRadius: 12,
                spreadRadius: 4,
              ),
          ],
        ),
        child: Center(child: child),
      ),
    );
  }
}

// Custom Painter to draw connection paths in map
class MapPathPainter extends CustomPainter {
  final int nodeCount;

  MapPathPainter({required this.nodeCount});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.lightBlue.shade200
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();

    // Map alternating coordinates
    final points = <Offset>[];
    for (int index = 0; index < nodeCount; index++) {
      double xFactor = 0.5;
      final mod = index % 4;
      if (mod == 0) xFactor = 0.25;
      if (mod == 1) xFactor = 0.5;
      if (mod == 2) xFactor = 0.75;
      if (mod == 3) xFactor = 0.5;

      double yFactor = nodeCount > 1
          ? 0.8 - (index * (0.6 / (nodeCount - 1)))
          : 0.5;

      points.add(Offset(size.width * xFactor, size.height * yFactor));
    }

    if (points.isNotEmpty) {
      path.moveTo(points.first.dx, points.first.dy);
      for (int i = 1; i < points.length; i++) {
        // Draw Bezier curves for a premium look
        final p0 = points[i - 1];
        final p1 = points[i];
        final controlX = (p0.dx + p1.dx) / 2;
        final controlY = (p0.dy + p1.dy) / 2;
        path.quadraticBezierTo(controlX, controlY - 10, p1.dx, p1.dy);
      }
    }

    // Draw dashed path
    final dashPath = Path();
    double distance = 0.0;
    const double dashWidth = 8.0;
    const double dashSpace = 6.0;

    for (final pathMetric in path.computeMetrics()) {
      while (distance < pathMetric.length) {
        dashPath.addPath(
          pathMetric.extractPath(distance, distance + dashWidth),
          Offset.zero,
        );
        distance += dashWidth + dashSpace;
      }
    }

    canvas.drawPath(dashPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

String getTopicSlug(String topicIdOrSlug) {
  final map = {
    '6a37fd655f70efbc84b0cf55': 'stranger',
    '6a37fd655f70efbc84b0cf56': 'phishing',
    '6a37fd655f70efbc84b0cf57': 'password',
    '6a37fd655f70efbc84b0cf5b': 'privacy',
    '6a37fd655f70efbc84b0cf58': 'behavior',
    '6a37fd655f70efbc84b0cf5f': 'screentime',
  };
  return map[topicIdOrSlug] ?? topicIdOrSlug;
}

String getTopicTitle(int stepOrder, String topicId) {
  final normalized = getTopicSlug(topicId);
  switch (normalized) {
    case 'stranger':
      return 'Chặng $stepOrder: Người lạ nhắn tin';
    case 'phishing':
      return 'Chặng $stepOrder: Link lạ và lừa đảo';
    case 'password':
      return 'Chặng $stepOrder: Mật khẩu và tài khoản';
    case 'privacy':
      return 'Chặng $stepOrder: Bảo vệ thông tin';
    case 'behavior':
      return 'Chặng $stepOrder: Ứng xử văn minh';
    case 'screentime':
      return 'Chặng $stepOrder: Thời gian màn hình';
    case 'badcontent':
      return 'Chặng $stepOrder: Tin giả & nội dung xấu';
    default:
      return 'Chặng $stepOrder: An toàn số';
  }
}

