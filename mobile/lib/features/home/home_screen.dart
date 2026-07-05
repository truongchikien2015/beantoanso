import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/app_button.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(studentProfileProvider);

    // If profile is not set (not logged in), default to demo skip values
    final displayName = profile?.displayName ?? 'Sơn';
    final level = profile?.level ?? 3;
    final totalPoints = profile?.totalPoints ?? 1250;
    final streakDays = profile?.streakDays ?? 5;

    // Calculate level percentage (e.g. 500 points per level)
    final pointsInCurrentLevel = totalPoints % 500;
    final double levelProgress = pointsInCurrentLevel / 500.0;

    const String avatarUrl = 
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCtguRtC6nx6Ck-ZMN8sqhtAm70mGjpm02SxrbQ_v3Z7MOdFd7YUIWq-GVmHSAcuTUYUt6Dz-0275gQ7ia8YcS-vZRBHaHyneLpd2xiK4PV_fHDGo7mhILyBV-paqFtNgJnJd25MKLz0XoOsL4gM5JxjZnTCBlDG9_VcDYHi_CQ9CeZvx13KDfNpaTfDuxyQicUJHuuSAX9KsSUbN0QD_dqIaNL8vLFoYbCxUb1t2x8mItjM46Lck-lo_zRmDqBXVGzbI7KfjvRXnc';

    const String badgeUrl = 
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAOBNmc5kGbL7N7-qJ1yHAutdQUMsfgTzQ4B0XXAdUkKZCmtE4Kb-FPjEGXKmtnsmD8-jbapRr9Q19h4ONy0RwKrDNZp6FmkLsrMz0UVZ1dAhRPo4R2RSqOsneM4FXiDb7GR2WCCZKnrKjDp1gU3RvLjUqaIqHHe3tgGnxm6I_joJ-7oPCYdkWApZ1sSqlXVekdNPxqmF5-aaxdxjj4QVoStNjXEsERvwI_E7RlqwKkH1NM2_lOkBDuIL7dR1zQiV3ysHiPrnzMJjQ';

    const String mascotUrl = 
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDxqKieRxuS3MlvFe2cUnNR3xK_033-2ZIKKhCqMbQ_uku6a2hY3L1UzXq2bvR53R0WTwcbkyNHgRMejtetleztnt1smzaF0Qnl_CYCaUmkN3M-gc-4WL6z1AWBHRKXf_AIob8kS3hUUxBgCTFbC7nqlcChbF-Xjq1Tt2Rfe0IqtS3TGD_d22qxciCMXeMO8VxPXhpQrc3sDjG-bVS8kMlqVOE10wvLHe7ZBt_vvmVW4F-a4VXXEDY_VkIcUkkCi0z-tL0ZXqAkATQ';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        toolbarHeight: 70,
        backgroundColor: AppColors.surface,
        elevation: 1,
        title: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary, width: 2),
                image: const DecorationImage(
                  image: NetworkImage(avatarUrl),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Chào con, bạn nhỏ!',
                style: AppTextStyles.headlineMedium.copyWith(color: AppColors.primary, fontSize: 20),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications, color: AppColors.primary, size: 28),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Hôm nay không có thông báo mới con nhé!')),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome & Level Section
              Text(
                'Chào $displayName! 👋',
                style: AppTextStyles.displayMobile,
              ),
              const SizedBox(height: 8),
              // Level Badge Row
              Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.tertiaryFixed,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.tertiary, width: 2),
                      boxShadow: const [
                        BoxShadow(
                          color: AppColors.tertiary,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        const Icon(Icons.military_tech, color: AppColors.tertiary),
                        const SizedBox(width: 6),
                        Text(
                          'Chiến binh An Toàn Số — Cấp $level',
                          style: AppTextStyles.labelBold.copyWith(color: AppColors.tertiary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              // Gamified Progress Bar
              Stack(
                alignment: Alignment.centerLeft,
                children: [
                  Container(
                    height: 16,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.outlineVariant, width: 2),
                    ),
                  ),
                  FractionallySizedBox(
                    widthFactor: levelProgress.clamp(0.05, 1.0),
                    child: Container(
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  // Cute Star marker
                  Align(
                    alignment: Alignment(levelProgress * 2.0 - 1.0, 0.0),
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: AppColors.tertiaryFixed,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: Colors.black12, blurRadius: 2, offset: Offset(0, 2)),
                        ],
                      ),
                      child: const Icon(Icons.star, color: AppColors.tertiary, size: 18),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Main Mission Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.surfaceVariant, width: 2),
                  boxShadow: const [
                    BoxShadow(
                      color: AppColors.surfaceVariant,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'NHIỆM VỤ HÔM NAY',
                              style: AppTextStyles.labelBold.copyWith(color: AppColors.outline),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Nhận diện link lừa đảo',
                              style: AppTextStyles.headlineMedium,
                            ),
                          ],
                        ),
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.secondaryFixed,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.onSecondaryFixed, width: 2),
                          ),
                          child: const Icon(Icons.shield, color: AppColors.onSecondaryFixed),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Tiến độ', style: AppTextStyles.bodyMedium),
                        Text('2 / 5 bài', style: AppTextStyles.labelBold.copyWith(color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: const LinearProgressIndicator(
                        value: 0.4,
                        minHeight: 10,
                        backgroundColor: AppColors.surfaceVariant,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.secondary),
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      text: 'Bắt đầu',
                      onPressed: () => context.push('/simulation/game-scam-001'),
                      icon: const Icon(Icons.play_arrow, color: Colors.white),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              // Action Cards Grid
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.1,
                children: [
                  _buildGridCard(
                    icon: Icons.chat_bubble,
                    color: AppColors.primary,
                    bgColor: AppColors.primaryFixed,
                    title: 'Luyện tình huống',
                    onPressed: () {
                      // Navigate to index 1 of BottomNavBar (Kỹ năng)
                      // GoRoute handles navigationShell index
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Hãy chọn một tình huống dưới đây nhé!')),
                      );
                      // Go to Learn tab
                      context.go('/learn');
                    },
                  ),
                  _buildGridCard(
                    icon: Icons.search,
                    color: AppColors.tertiary,
                    bgColor: AppColors.tertiaryFixed,
                    title: 'Kiểm tra link / tin nhắn',
                    onPressed: () => context.go('/scan'),
                  ),
                  _buildGridCard(
                    icon: Icons.face,
                    color: AppColors.primary,
                    bgColor: AppColors.primaryFixed,
                    title: 'Hỏi Cú Cú AI',
                    onPressed: () => context.push('/assistant'),
                    imageMascot: mascotUrl,
                  ),
                  _buildGridCard(
                    icon: Icons.sos,
                    color: AppColors.error,
                    bgColor: AppColors.errorContainer,
                    title: 'Con cần giúp đỡ',
                    onPressed: () => context.push('/sos'),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Bottom Stats (Badge & Streak)
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLowest,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.surfaceVariant, width: 2),
                        boxShadow: const [BoxShadow(color: AppColors.surfaceVariant, offset: Offset(0, 3))],
                      ),
                      child: Row(
                        children: [
                           Image.network(badgeUrl, width: 36, height: 36, errorBuilder: (context, error, stackTrace) => const Icon(Icons.military_tech)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('HUY HIỆU MỚI', style: AppTextStyles.labelBold.copyWith(fontSize: 10, color: AppColors.outline)),
                                Text('Mắt Cú Tinh Anh', style: AppTextStyles.labelBold.copyWith(fontSize: 12), overflow: TextOverflow.ellipsis),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLowest,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.surfaceVariant, width: 2),
                        boxShadow: const [BoxShadow(color: AppColors.surfaceVariant, offset: Offset(0, 3))],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: const BoxDecoration(color: AppColors.tertiaryFixed, shape: BoxShape.circle),
                            child: const Icon(Icons.local_fire_department, color: AppColors.tertiary),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('CHUỖI HỌC TẬP', style: AppTextStyles.labelBold.copyWith(fontSize: 10, color: AppColors.outline)),
                              Text('$streakDays ngày', style: AppTextStyles.labelBold.copyWith(fontSize: 12)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // Tip Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryFixed,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.primary, width: 2),
                  boxShadow: const [BoxShadow(color: AppColors.primary, offset: Offset(0, 4))],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.tips_and_updates, color: AppColors.primary, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('MẸO AN TOÀN', style: AppTextStyles.labelBold.copyWith(color: AppColors.onPrimaryFixed)),
                          const SizedBox(height: 4),
                          Text(
                            '"Không ai được phép xin mã OTP của con."',
                            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.onPrimaryFixed, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGridCard({
    required IconData icon,
    required Color color,
    required Color bgColor,
    required String title,
    required VoidCallback onPressed,
    String? imageMascot,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.surfaceVariant, width: 2),
        boxShadow: const [
          BoxShadow(
            color: AppColors.surfaceVariant,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (imageMascot != null)
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primaryFixed, width: 2),
                      image: DecorationImage(image: NetworkImage(imageMascot), fit: BoxFit.cover),
                    ),
                  )
                else
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
                    child: Icon(icon, color: color, size: 24),
                  ),
                const SizedBox(height: 10),
                Text(
                  title,
                  style: AppTextStyles.labelBold.copyWith(fontSize: 14),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
