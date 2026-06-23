import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/mascot_bubble.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _currentStep = 0;
  final _nameController = TextEditingController();
  int _selectedAgeGroup = 1; // 0: 6-9, 1: 10-12, 2: 13-15
  final List<String> _selectedSkills = [];

  final List<String> _ageGroupsText = ['6 – 9 tuổi', '10 – 12 tuổi', '13 – 15 tuổi'];
  final List<String> _skillsList = [
    'Quét tin nhắn & link lừa đảo',
    'Tránh người lạ gạ gẫm',
    'Đối phó bắt nạt trên mạng',
    'Bảo mật OTP & mật khẩu'
  ];

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep == 0 && _nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Hãy điền tên con trước nhé!')),
      );
      return;
    }
    if (_currentStep < 2) {
      setState(() => _currentStep++);
    } else {
      _finishOnboarding();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    } else {
      context.pop();
    }
  }

  void _finishOnboarding() {
    // Save to provider
    ref.read(studentProfileProvider.notifier).loginLocal(
      _nameController.text,
      _selectedAgeGroup == 0 ? 8 : (_selectedAgeGroup == 1 ? 11 : 14),
    );
    // Add default skills
    for (var skill in _selectedSkills) {
      ref.read(studentProfileProvider.notifier).unlockSkill(skill);
    }
    // Redirect
    context.go('/home');
  }

  void _toggleSkill(String skill) {
    setState(() {
      if (_selectedSkills.contains(skill)) {
        _selectedSkills.remove(skill);
      } else {
        _selectedSkills.add(skill);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.onSurface),
          onPressed: _prevStep,
        ),
        title: Text(
          'Bước ${_currentStep + 1} / 3',
          style: AppTextStyles.labelBold.copyWith(color: AppColors.outline),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Mascot interaction bubble
                      MascotBubble(text: _getMascotText()),
                      const SizedBox(height: 32),
                      // Step Content
                      if (_currentStep == 0) _buildNameStep(),
                      if (_currentStep == 1) _buildAgeStep(),
                      if (_currentStep == 2) _buildSkillsStep(),
                    ],
                  ),
                ),
              ),
              // Back / Next controls
              const SizedBox(height: 16),
              AppButton(
                text: _currentStep == 2 ? 'Bắt đầu hành trình! 🚀' : 'Tiếp tục',
                onPressed: _nextStep,
                icon: const Icon(Icons.arrow_forward, color: Colors.white),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  String _getMascotText() {
    switch (_currentStep) {
      case 0:
        return "Chào con! Ta là Cú Cú - Hộ vệ An Toàn Số của con. Rất vui được đồng hành cùng con học cách tự vệ trên không gian mạng. Tên của con là gì thế?";
      case 1:
        return "Chào bé ${_nameController.text}! Để Cú Cú đưa ra những thử thách phù hợp nhất với con, con hãy chọn nhóm tuổi của mình nhé.";
      case 2:
        return "Tuyệt vời! Con muốn Cú Cú hỗ trợ rèn luyện những kỹ năng an toàn nào trước? Con có thể chọn nhiều kỹ năng cùng lúc.";
      default:
        return "";
    }
  }

  Widget _buildNameStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tên của con là:',
          style: AppTextStyles.headlineMedium,
        ),
        const SizedBox(height: 12),
        Container(
          height: 56,
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.primary, width: 2),
            boxShadow: const [
              BoxShadow(
                color: AppColors.primaryFixed,
                offset: Offset(0, 4),
                blurRadius: 0,
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            controller: _nameController,
            style: AppTextStyles.bodyLarge,
            decoration: const InputDecoration(
              hintText: 'Nhập tên của con...',
              border: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAgeStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Nhóm tuổi của con:',
          style: AppTextStyles.headlineMedium,
        ),
        const SizedBox(height: 16),
        ...List.generate(3, (index) {
          final isSelected = _selectedAgeGroup == index;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: AppButton(
              text: _ageGroupsText[index],
              onPressed: () => setState(() => _selectedAgeGroup = index),
              backgroundColor: isSelected ? AppColors.primary : AppColors.surfaceContainerLowest,
              textColor: isSelected ? Colors.white : AppColors.onSurface,
              shadowColor: isSelected ? const Color(0xFF00174B) : AppColors.outlineVariant,
            ),
          );
        }),
      ],
    );
  }

  Widget _buildSkillsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Chọn kỹ năng con quan tâm:',
          style: AppTextStyles.headlineMedium,
        ),
        const SizedBox(height: 16),
        ..._skillsList.map((skill) {
          final isSelected = _selectedSkills.contains(skill);
          return Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: AppButton(
              text: skill,
              onPressed: () => _toggleSkill(skill),
              backgroundColor: isSelected ? AppColors.secondary : AppColors.surfaceContainerLowest,
              textColor: isSelected ? Colors.white : AppColors.onSurface,
              shadowColor: isSelected ? const Color(0xFF23005C) : AppColors.outlineVariant,
              icon: isSelected 
                  ? const Icon(Icons.check_circle, color: Colors.white)
                  : const Icon(Icons.radio_button_unchecked, color: AppColors.outline),
            ),
          );
        }),
      ],
    );
  }
}
