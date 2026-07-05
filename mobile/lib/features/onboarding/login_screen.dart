import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/app_button.dart';
import '../../core/utils/test_helper.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _classCodeController = TextEditingController();
  final _studentIdController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Check if user is already logged in
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!TestHelper.isTesting) {
        _checkAutoLogin();
      }
    });
  }

  void _checkAutoLogin() async {
    setState(() => _isLoading = true);
    final loggedIn = await ref.read(studentProfileProvider.notifier).autoLogin();
    if (mounted) {
      setState(() => _isLoading = false);
      if (loggedIn) {
        context.go('/home');
      }
    }
  }

  @override
  void dispose() {
    _classCodeController.dispose();
    _studentIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (_studentIdController.text.trim().isEmpty ||
        _passwordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng điền đầy đủ thông tin con nhé!'),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await ref.read(studentProfileProvider.notifier).login(
            _studentIdController.text.trim(),
            _passwordController.text.trim(),
          );
      if (mounted) {
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        String errMsg = 'Mã số học sinh hoặc mật khẩu không chính xác con nhé!';
        if (e is DioException) {
          if (e.response?.statusCode == 401) {
            errMsg = 'Mã số học sinh hoặc mật khẩu không chính xác con nhé!';
          } else {
            errMsg = 'Không kết nối được máy chủ. Con vui lòng kiểm tra mạng hoặc dùng Chế độ demo nhé!';
          }
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errMsg),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _handleDemoSkip() {
    ref.read(studentProfileProvider.notifier).skipOnboarding();
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    const String mascotUrl =
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDxqKieRxuS3MlvFe2cUnNR3xK_033-2ZIKKhCqMbQ_uku6a2hY3L1UzXq2bvR53R0WTwcbkyNHgRMejtetleztnt1smzaF0Qnl_CYCaUmkN3M-gc-4WL6z1AWBHRKXf_AIob8kS3hUUxBgCTFbC7nqlcChbF-Xjq1Tt2Rfe0IqtS3TGD_d22qxciCMXeMO8VxPXhpQrc3sDjG-bVS8kMlqVOE10wvLHe7ZBt_vvmVW4F-a4VXXEDY_VkIcUkkCi0z-tL0ZXqAkATQ';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomPaint(
        painter: DottedBackgroundPainter(),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 400),
                padding: const EdgeInsets.all(24.0),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.surfaceVariant, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.onSurface.withValues(alpha: 0.08),
                      offset: const Offset(0, 8),
                      blurRadius: 16,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Mascot Circle
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primaryFixed,
                        border: Border.all(
                          color: AppColors.surfaceContainerLowest,
                          width: 4,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                        image: TestHelper.isTesting
                            ? null
                            : const DecorationImage(
                                image: NetworkImage(mascotUrl),
                                fit: BoxFit.cover,
                              ),
                      ),
                      child: TestHelper.isTesting
                          ? const Icon(
                              Icons.face,
                              size: 48,
                              color: AppColors.primary,
                            )
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Đăng nhập lớp học',
                      style: AppTextStyles.headlineMedium.copyWith(
                        color: AppColors.primary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sử dụng mã của thầy cô để vào lớp nhé!',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    // Form fields
                    _buildTextField(
                      controller: _studentIdController,
                      hintText: 'Tên hoặc Mã số học sinh',
                      icon: Icons.badge,
                    ),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _passwordController,
                      hintText: 'Mật khẩu',
                      icon: Icons.lock,
                      obscureText: _obscurePassword,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility
                              : Icons.visibility_off,
                          color: AppColors.outline,
                        ),
                        onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    _isLoading
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 8.0),
                              child: CircularProgressIndicator(color: AppColors.primary),
                            ),
                          )
                        : AppButton(
                            text: 'Vào lớp ngay',
                            onPressed: _handleLogin,
                            icon: const Icon(
                              Icons.arrow_forward,
                              color: Colors.white,
                            ),
                          ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.push('/onboarding'),
                      child: Text(
                        'Đăng ký / Tạo tài khoản mới',
                        style: AppTextStyles.labelBold.copyWith(
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const Divider(),
                    TextButton(
                      onPressed: _handleDemoSkip,
                      child: Text(
                        'Chế độ demo thi thử (Bỏ qua đăng nhập)',
                        style: AppTextStyles.labelBold.copyWith(
                          color: AppColors.secondary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.help_outline,
                          color: AppColors.outline,
                          size: 18,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Nếu con quên mã, hãy hỏi thầy cô hoặc bố mẹ nhé.',
                            style: AppTextStyles.labelMedium.copyWith(
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
    bool obscureText = false,
    Widget? suffixIcon,
  }) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.surfaceVariant, width: 2),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          Icon(icon, color: AppColors.outline),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: controller,
              obscureText: obscureText,
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.onSurface,
              ),
              decoration: InputDecoration(
                hintText: hintText,
                hintStyle: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.outline,
                ),
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          suffixIcon ?? const SizedBox.shrink(),
        ],
      ),
    );
  }
}

// Background painter to draw dotted grid
class DottedBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primaryFixed.withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;

    const double spacing = 28.0;
    for (double x = 14; x < size.width; x += spacing) {
      for (double y = 14; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), 2, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
