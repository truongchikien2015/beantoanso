import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class PassportScreen extends ConsumerStatefulWidget {
  const PassportScreen({super.key});

  @override
  ConsumerState<PassportScreen> createState() => _PassportScreenState();
}

class _PassportScreenState extends ConsumerState<PassportScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _dashboardData;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final repository = ref.read(safetyRepositoryProvider);
      final data = await repository.getStudentDashboard();
      
      // Update global profile state notifier safely if student data is present
      final student = data['student'] as Map<String, dynamic>?;
      final stats = data['stats'] as Map<String, dynamic>?;
      if (student != null) {
        final nickname = student['nickname'] as String? ?? 'Bạn nhỏ';
        final xp = stats?['total_xp'] as int? ?? student['xp'] as int? ?? 0;
        final level = stats?['level'] as int? ?? student['level'] as int? ?? 1;
        final streak = stats?['current_streak'] as int? ?? 5;
        
        final notifier = ref.read(studentProfileProvider.notifier);
        if (ref.read(studentProfileProvider) == null) {
          notifier.loginLocal(nickname, 10);
        }
        
        notifier.state = notifier.state?.copyWith(
          displayName: nickname,
          totalPoints: xp,
          level: level,
          streakDays: streak,
        );
      }

      if (mounted) {
        setState(() {
          _dashboardData = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Không tải được thông tin hồ sơ.';
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
        appBar: AppBar(
          title: Text(
            'Hồ sơ của con',
            style: AppTextStyles.headlineMedium.copyWith(color: AppColors.primary),
          ),
        ),
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

    final student = _dashboardData!['student'] as Map<String, dynamic>?;
    final stats = _dashboardData!['stats'] as Map<String, dynamic>?;

    final displayName = student?['nickname'] as String? ?? 'Bạn nhỏ';
    final level = stats?['level'] as int? ?? student?['level'] as int? ?? 1;
    final totalPoints = stats?['total_xp'] as int? ?? student?['xp'] as int? ?? 0;
    final streakDays = stats?['current_streak'] as int? ?? 5;

    final progress = (_dashboardData!['progress'] as List<dynamic>?) ?? [];
    final path = _dashboardData!['assigned_path'] as Map<String, dynamic>?;
    final steps = (path?['steps'] as List<dynamic>?) ?? [];

    // Create a map of step_id to topic_id
    final stepToTopic = <String, String>{};
    for (var step in steps) {
      final stepId = step['id'] as String?;
      final topicId = step['topic_id'] as String?;
      if (stepId != null && topicId != null) {
        stepToTopic[stepId] = topicId;
      }
    }

    final unlockedSkills = <String>[];
    for (var prog in progress) {
      final stepId = prog['step_id'] as String?;
      final score = prog['score'] as int? ?? 0;
      if (stepId != null && score >= 80) {
        final topicId = stepToTopic[stepId] ?? stepId;
        final skillName = getTopicSkillName(topicId);
        if (!unlockedSkills.contains(skillName)) {
          unlockedSkills.add(skillName);
        }
      }
    }

    const String avatarUrl = 
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCtguRtC6nx6Ck-ZMN8sqhtAm70mGjpm02SxrbQ_v3Z7MOdFd7YUIWq-GVmHSAcuTUYUt6Dz-0275gQ7ia8YcS-vZRBHaHyneLpd2xiK4PV_fHDGo7mhILyBV-paqFtNgJnJd25MKLz0XoOsL4gM5JxjZnTCBlDG9_VcDYHi_CQ9CeZvx13KDfNpaTfDuxyQicUJHuuSAX9KsSUbN0QD_dqIaNL8vLFoYbCxUb1t2x8mItjM46Lck-lo_zRmDqBXVGzbI7KfjvRXnc';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: Text(
          'Hồ sơ của con',
          style: AppTextStyles.headlineMedium.copyWith(color: AppColors.primary),
        ),
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.primary),
            onPressed: _loadDashboardData,
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.error),
            onPressed: () {
              ref.read(studentProfileProvider.notifier).logout();
              context.go('/login');
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
              // Avatar and general Info Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.surfaceVariant, width: 2),
                  boxShadow: const [
                    BoxShadow(color: AppColors.surfaceVariant, offset: Offset(0, 6)),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primary, width: 3),
                        image: const DecorationImage(
                          image: NetworkImage(avatarUrl),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      displayName,
                      style: AppTextStyles.headlineLarge.copyWith(fontSize: 24),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.tertiaryFixed,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.tertiary, width: 2),
                      ),
                      child: Text(
                        'Chiến binh Cấp $level',
                        style: AppTextStyles.labelBold.copyWith(color: AppColors.tertiary),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Stats Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatBox('Tổng Điểm', '$totalPoints XP', Icons.insights, AppColors.primary),
                        _buildStatBox('Học Liên Tục', '$streakDays Ngày', Icons.local_fire_department, AppColors.tertiary),
                      ],
                    )
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Unlocked Skills List
              Text(
                'KỸ NĂNG ĐÃ MỞ KHOÁ',
                style: AppTextStyles.labelBold.copyWith(color: AppColors.outline),
              ),
              const SizedBox(height: 10),
              if (unlockedSkills.isEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.surfaceVariant, width: 2),
                  ),
                  child: Center(
                    child: Text(
                      'Con chưa mở khoá kỹ năng nào. Hãy tham gia luyện tập nhé!',
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.outline),
                      textAlign: TextAlign.center,
                    ),
                  ),
                )
              else
                ...unlockedSkills.map((skill) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.surfaceVariant, width: 2),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.verified, color: Colors.green),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            skill,
                            style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              const SizedBox(height: 24),
              // Certificate Section
              Text(
                'CHỨNG NHẬN CỦA CON',
                style: AppTextStyles.labelBold.copyWith(color: AppColors.outline),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.primaryFixed,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.primary, width: 3),
                  boxShadow: const [
                    BoxShadow(color: AppColors.primary, offset: Offset(0, 6)),
                  ],
                ),
                child: Column(
                  children: [
                    const Icon(Icons.workspace_premium, color: AppColors.primary, size: 64),
                    const SizedBox(height: 8),
                    Text(
                      'CHIẾN BINH AN TOÀN SỐ',
                      style: AppTextStyles.headlineMedium.copyWith(color: AppColors.onPrimaryFixed, fontSize: 20),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Chứng nhận cấp cho bé $displayName đã hoàn thành các khóa học thực chiến an toàn số xuất sắc.',
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.onPrimaryFixed),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    // QR code validation
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.outlineVariant, width: 2),
                      ),
                      child: Image.network(
                        'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=BeAnToanSo_Student_${displayName}_Level_$level',
                        width: 90,
                        height: 90,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.qr_code, size: 90, color: AppColors.outline),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Mã xác thực học tập',
                      style: AppTextStyles.labelMedium.copyWith(color: AppColors.onPrimaryFixed, fontSize: 11),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatBox(String title, String val, IconData icon, Color color) {
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color),
        ),
        const SizedBox(height: 6),
        Text(
          title,
          style: AppTextStyles.labelMedium.copyWith(color: AppColors.outline, fontSize: 12),
        ),
        Text(
          val,
          style: AppTextStyles.headlineMedium.copyWith(fontSize: 18),
        ),
      ],
    );
  }

  String getTopicSkillName(String topicIdOrSlug) {
    final map = {
      '6a37fd655f70efbc84b0cf55': 'stranger',
      '6a37fd655f70efbc84b0cf56': 'phishing',
      '6a37fd655f70efbc84b0cf57': 'password',
      '6a37fd655f70efbc84b0cf5b': 'privacy',
      '6a37fd655f70efbc84b0cf58': 'behavior',
      '6a37fd655f70efbc84b0cf5f': 'screentime',
    };
    final slug = map[topicIdOrSlug] ?? topicIdOrSlug;
    switch (slug) {
      case 'stranger':
        return 'Nhận diện người lạ nhắn tin';
      case 'phishing':
        return 'Phát hiện đường link lừa đảo';
      case 'password':
        return 'Tạo mật khẩu và tài khoản mạnh';
      case 'privacy':
        return 'Bảo vệ thông tin cá nhân';
      case 'behavior':
        return 'Ứng xử văn minh trên mạng';
      case 'screentime':
        return 'Quản lý thời gian sử dụng màn hình';
      case 'badcontent':
        return 'Nhận biết tin giả & nội dung xấu';
      default:
        return 'Kỹ năng an toàn số';
    }
  }
}
