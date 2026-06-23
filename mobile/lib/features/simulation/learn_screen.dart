import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/mascot_bubble.dart';
import '../../domain/models/simulation.dart';

class LearnScreen extends ConsumerWidget {
  const LearnScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repository = ref.watch(safetyRepositoryProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: Text(
          'Chọn lộ trình học tập',
          style: AppTextStyles.headlineMedium.copyWith(
            color: AppColors.primary,
          ),
        ),
        elevation: 1,
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600.0),
            child: FutureBuilder(
              future: Future.wait([
                repository.getScenarios(),
                repository.getLearningPaths(),
              ]),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return const Center(
                    child: Text('Có lỗi xảy ra khi tải lộ trình học.'),
                  );
                }

                final List<dynamic> results = snapshot.data as List<dynamic>;
                final scenarios = results[0] as List<SimulationScenario>;
                final publicPaths = results[1] as List<Map<String, dynamic>>;

                return SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Mascot Bubble
                      const MascotBubble(
                        text:
                            'Mỗi lộ trình có các chủ đề khác nhau. Con hãy chọn lộ trình muốn học nhé!',
                      ),
                      const SizedBox(height: 24),

                      // Section 1: Thực hành tình huống thực tế
                      Row(
                        children: [
                          const Icon(
                            Icons.verified_user,
                            color: AppColors.primary,
                            size: 24,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Thực hành tình huống thực tế',
                            style: AppTextStyles.headlineMedium.copyWith(
                              fontSize: 18,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // List of quick scenarios
                      ...scenarios.map((scenario) {
                        IconData icon = Icons.chat_bubble;
                        Color iconColor = AppColors.primary;
                        Color bgColor = AppColors.primaryFixed;
                        String desc =
                            'Tập xử lý phản xạ nhanh khi có tình huống xảy ra';

                        if (scenario.id.contains("scam")) {
                          icon = Icons.chat;
                          iconColor = AppColors.primary;
                          bgColor = AppColors.primaryFixed;
                          desc =
                              'Tập xử lý khi người lạ nhắn tin, ảnh riêng tư hoặc tặng quà game.';
                        } else if (scenario.id.contains("privacy")) {
                          icon = Icons.lock_person;
                          iconColor = AppColors.tertiary;
                          bgColor = AppColors.tertiaryFixed;
                          desc =
                              'Trò chơi phân loại thông tin nào có thể chia sẻ và thông tin cần giữ bí mật.';
                        } else if (scenario.id.contains("bullying")) {
                          icon = Icons.warning;
                          iconColor = AppColors.error;
                          bgColor = AppColors.errorContainer;
                          desc =
                              'Vạch trần Email lừa đảo, rà soát hòm thư và phát hiện điểm đáng ngờ.';
                        }

                        return GestureDetector(
                          onTap: () {
                            context.push('/simulation/${scenario.id}');
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 16.0),
                            padding: const EdgeInsets.all(16.0),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerLowest,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppColors.surfaceVariant,
                                width: 2,
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  color: AppColors.surfaceVariant,
                                  offset: Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: bgColor,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(icon, color: iconColor),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            scenario.title,
                                            style: AppTextStyles.headlineMedium
                                                .copyWith(fontSize: 16),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            desc,
                                            style: AppTextStyles.bodyMedium
                                                .copyWith(
                                                  color: AppColors.outline,
                                                  fontSize: 13,
                                                ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Align(
                                  alignment: Alignment.bottomRight,
                                  child: TextButton(
                                    onPressed: () {
                                      context.push(
                                        '/simulation/${scenario.id}',
                                      );
                                    },
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Bắt đầu ngay ',
                                          style: AppTextStyles.labelBold
                                              .copyWith(
                                                color: AppColors.primary,
                                              ),
                                        ),
                                        const Icon(
                                          Icons.arrow_forward,
                                          size: 16,
                                          color: AppColors.primary,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),

                      const SizedBox(height: 20),

                      // Section 2: Các lộ trình có sẵn
                      Text(
                        'Các lộ trình có sẵn',
                        style: AppTextStyles.headlineMedium.copyWith(
                          fontSize: 18,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),

                      if (publicPaths.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Text(
                              'Chưa có lộ trình học tập nào được kích hoạt.',
                            ),
                          ),
                        )
                      else
                        ...publicPaths.map((p) {
                          final pathId = p['id'] as String? ?? 'path_demo_01';
                          final pathTitle = p['title'] as String? ?? 'Chưa rõ';
                          final pathDesc = p['description'] as String? ?? '';
                          return GestureDetector(
                            key: ValueKey(pathId),
                            onTap: () {
                              context.push('/learning-path/$pathId');
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 16.0),
                              padding: const EdgeInsets.all(20.0),
                              decoration: BoxDecoration(
                                color: Colors.green.shade50,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: Colors.green.shade200,
                                  width: 2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.green.shade100,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 60,
                                    height: 60,
                                    decoration: const BoxDecoration(
                                      color: Colors.green,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.nature_people,
                                      color: Colors.white,
                                      size: 32,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          pathTitle,
                                          style: AppTextStyles.headlineMedium
                                              .copyWith(
                                                fontSize: 20,
                                                color: Colors.green.shade900,
                                              ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          pathDesc,
                                          style: AppTextStyles.bodyMedium
                                              .copyWith(
                                                color: Colors.green.shade800,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(
                                      Icons.arrow_forward_ios,
                                      color: Colors.green,
                                    ),
                                    onPressed: () {
                                      context.push('/learning-path/$pathId');
                                    },
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                      const SizedBox(height: 32),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
