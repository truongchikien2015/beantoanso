import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/providers.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/mascot_bubble.dart';
import '../../domain/models/safety_analysis.dart';

class DemoScreenshot {
  final String title;
  final String description;
  final String ocrText;
  final String imageUrl;

  const DemoScreenshot({
    required this.title,
    required this.description,
    required this.ocrText,
    required this.imageUrl,
  });
}

final List<DemoScreenshot> _demoScreenshots = [
  const DemoScreenshot(
    title: 'Quà game miễn phí',
    description: 'Tin nhắn dụ dỗ bé cung cấp mã OTP để nạp kim cương game miễn phí.',
    ocrText: 'Anh tặng em 5000 kim cương, hãy bấm vào link garena-free.com và nhập OTP nhé!',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
  ),
  const DemoScreenshot(
    title: 'Đe dọa chế ảnh dìm',
    description: 'Tin nhắn bắt nạt bé nạp thẻ cào 50k nếu không sẽ chế ảnh dìm gửi lên nhóm lớp.',
    ocrText: 'Ê cu kia, liệu hồn mà nộp 50.000đ thẻ cào cho tao, nếu không tao sẽ chế ảnh dìm hàng mày rồi đăng lên nhóm lớp!',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500',
  ),
  const DemoScreenshot(
    title: 'Xin ảnh riêng tư',
    description: 'Người lạ tự xưng là chị dễ thương nhắn tin xin ảnh chụp phòng ngủ riêng tư.',
    ocrText: 'Chào bé đáng yêu! Chị đang thi ảnh đẹp. Bé chụp giúp chị phòng ngủ của bé gửi cho chị nha.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500',
  ),
  const DemoScreenshot(
    title: 'Mạo danh cô giáo',
    description: 'Người lạ giả danh cô giáo chủ nhiệm nhắn tin xin thông tin tài khoản ngân hàng của bố mẹ.',
    ocrText: 'Chào con, cô giáo chủ nhiệm đây. Con gửi cho cô số điện thoại và số tài khoản ngân hàng của mẹ con nhé.',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500',
  ),
  const DemoScreenshot(
    title: 'Tin nhắn học tập',
    description: 'Tin nhắn thông báo học tập thông thường, không chứa bất kỳ từ khóa nguy hiểm nào.',
    ocrText: 'Ngày mai lớp mình được nghỉ học do sửa chữa điện nhé các em. Thứ tư chúng ta đi học bình thường.',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500',
  ),
];

class SafetyScanScreen extends ConsumerStatefulWidget {
  const SafetyScanScreen({super.key});

  @override
  ConsumerState<SafetyScanScreen> createState() => _SafetyScanScreenState();
}

class _SafetyScanScreenState extends ConsumerState<SafetyScanScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _inputController = TextEditingController();
  bool _isScanning = false;
  SafetyAnalysis? _analysisResult;
  String? _extractedText;
  int _selectedDemoIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _inputController.dispose();
    super.dispose();
  }

  Future<void> _handleScan() async {
    String queryText = _inputController.text.trim();
    String? ocrText;

    if (_tabController.index == 2) {
      final demo = _demoScreenshots[_selectedDemoIndex];
      ocrText = demo.ocrText;
      queryText = demo.ocrText;
    } else {
      if (queryText.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Hãy điền nội dung cần kiểm tra nhé!')),
        );
        return;
      }
    }

    setState(() {
      _isScanning = true;
      _analysisResult = null;
      _extractedText = null;
    });

    // Simulate OCR scanning delay of 1.5 seconds if processing image
    if (_tabController.index == 2) {
      await Future.delayed(const Duration(milliseconds: 1500));
    }

    final repository = ref.read(safetyRepositoryProvider);
    SafetyAnalysis result;

    try {
      result = await repository.analyzeText(queryText);
    } catch (e) {
      // Client-side fallback if server is unreachable
      result = const SafetyAnalysis(
        riskLevel: RiskLevel.caution,
        riskScore: 50,
        riskTypes: [],
        childFriendlySummary: "Có lỗi khi kết nối với máy chủ phân tích. Con hãy hỏi bố mẹ trước khi làm theo tin nhắn này nha.",
        detectedSignals: ["Mất kết nối máy chủ"],
        recommendedActions: ["Hỏi bố mẹ ngay"],
        suggestNotifyAdult: true,
        suggestOpenSos: false,
      );
    }

    if (mounted) {
      setState(() {
        _isScanning = false;
        _analysisResult = result;
        _extractedText = ocrText;
      });
    }
  }

  void _resetScan() {
    setState(() {
      _inputController.clear();
      _analysisResult = null;
      _extractedText = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: Text(
          'Quét nguy hiểm',
          style: AppTextStyles.headlineMedium.copyWith(color: AppColors.primary),
        ),
        elevation: 1,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_analysisResult == null && !_isScanning) ...[
                // Instruction Mascot Bubble
                const MascotBubble(
                  text: "Con thấy tin nhắn, link nhận quà game, hay ảnh nhắn tin nào đáng nghi? Con dán vào đây Cú Cú quét phân tích cho con ngay nha!",
                  showMascot: true,
                  isLeftMascot: true,
                ),
                const SizedBox(height: 16),
                // Custom Tab Bar Container
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainer,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.outlineVariant, width: 2),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    labelColor: AppColors.primary,
                    unselectedLabelColor: AppColors.onSurfaceVariant,
                    indicatorColor: AppColors.primary,
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    labelStyle: AppTextStyles.labelBold,
                    tabs: const [
                      Tab(text: 'Dán Link'),
                      Tab(text: 'Dán Tin nhắn'),
                      Tab(text: 'Chụp màn hình'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Tab View Content
                AnimatedBuilder(
                  animation: _tabController,
                  builder: (context, _) {
                    return _buildTabContent();
                  },
                ),
                const SizedBox(height: 24),
                AppButton(
                  text: 'Bắt đầu quét',
                  onPressed: _handleScan,
                  icon: const Icon(Icons.security, color: Colors.white),
                ),
              ] else if (_isScanning) ...[
                _buildScanningView(),
              ] else ...[
                _buildResultView(),
              ]
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    if (_tabController.index == 0) {
      // Paste Link tab
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.outlineVariant, width: 2),
        ),
        child: TextField(
          controller: _inputController,
          maxLines: 2,
          style: AppTextStyles.bodyLarge,
          decoration: InputDecoration(
            hintText: 'Ví dụ: http://nhanquafree.com/diamonds...',
            hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.outline),
            border: InputBorder.none,
          ),
        ),
      );
    } else if (_tabController.index == 1) {
      // Paste Message tab
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.outlineVariant, width: 2),
        ),
        child: TextField(
          controller: _inputController,
          maxLines: 5,
          style: AppTextStyles.bodyLarge,
          decoration: InputDecoration(
            hintText: 'Nhập toàn bộ nội dung tin nhắn con nhận được...',
            hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.outline),
            border: InputBorder.none,
          ),
        ),
      );
    } else {
      // Screenshot upload tab
      final currentDemo = _demoScreenshots[_selectedDemoIndex];
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Chọn một ảnh chụp màn hình mẫu để quét:',
            style: AppTextStyles.labelBold.copyWith(color: AppColors.outline, fontSize: 13),
          ),
          const SizedBox(height: 8),
          // Horizontal list of demo screenshots selection
          SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _demoScreenshots.length,
              itemBuilder: (context, index) {
                final demo = _demoScreenshots[index];
                final isSelected = _selectedDemoIndex == index;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedDemoIndex = index;
                      _analysisResult = null;
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : AppColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.outlineVariant,
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        demo.title,
                        style: AppTextStyles.labelBold.copyWith(
                          color: isSelected ? Colors.white : AppColors.onSurface,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          // Details of selected demo
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.outlineVariant, width: 2),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    currentDemo.imageUrl,
                    height: 160,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 160,
                      color: Colors.grey.shade200,
                      child: const Icon(Icons.image, size: 48, color: Colors.grey),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  currentDemo.title,
                  style: AppTextStyles.headlineMedium.copyWith(fontSize: 16, color: AppColors.primary),
                ),
                const SizedBox(height: 4),
                Text(
                  currentDemo.description,
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.outline, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      );
    }
  }

  Widget _buildScanningView() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(strokeWidth: 6),
          const SizedBox(height: 24),
          Text(
            _tabController.index == 2
                ? 'Cú Cú đang quét chữ trong ảnh...'
                : 'Cú Cú đang quét và phân tích...',
            style: AppTextStyles.headlineMedium.copyWith(color: AppColors.primary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Con đợi một xíu nhé, sắp xong rồi!',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.outline),
          ),
        ],
      ),
    );
  }

  Widget _buildResultView() {
    final result = _analysisResult!;
    Color statusColor = AppColors.primary;
    Color statusBg = AppColors.primaryFixed;
    Color borderCol = AppColors.primary;
    IconData statusIcon = Icons.check_circle;
    String statusTitle = "AN TOÀN";

    if (result.riskLevel == RiskLevel.danger) {
      statusColor = AppColors.error;
      statusBg = AppColors.errorContainer;
      borderCol = AppColors.error;
      statusIcon = Icons.dangerous;
      statusTitle = "NGUY HIỂM CỰC KỲ";
    } else if (result.riskLevel == RiskLevel.caution) {
      statusColor = AppColors.tertiary;
      statusBg = AppColors.tertiaryFixed;
      borderCol = AppColors.tertiary;
      statusIcon = Icons.warning;
      statusTitle = "ĐÁNG NGHI NGẠI";
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Extracted OCR text card (If scan type was image)
        if (_extractedText != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.blue.shade200, width: 2),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.document_scanner, color: Colors.blue, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'CHỮ ĐỌC ĐƯỢC TỪ ẢNH:',
                      style: AppTextStyles.labelBold.copyWith(color: Colors.blue.shade900, fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '"$_extractedText"',
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontStyle: FontStyle.italic,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue.shade800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Status banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: statusBg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: borderCol, width: 3),
            boxShadow: [
              BoxShadow(
                color: borderCol,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(statusIcon, color: statusColor, size: 36),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ĐÁNH GIÁ: $statusTitle',
                      style: AppTextStyles.labelBold.copyWith(color: statusColor, fontSize: 16),
                    ),
                    Text(
                      'Điểm rủi ro: ${result.riskScore}/100',
                      style: AppTextStyles.bodyMedium.copyWith(color: statusColor, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        // Mascot speech summary
        MascotBubble(
          text: result.childFriendlySummary,
          showMascot: true,
          isLeftMascot: true,
        ),
        const SizedBox(height: 16),
        // Risk signals card
        if (result.detectedSignals.isNotEmpty) ...[
          Text('DẤU HIỆU PHÁT HIỆN', style: AppTextStyles.labelBold.copyWith(color: AppColors.outline)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.surfaceVariant, width: 2),
            ),
            child: Column(
              children: result.detectedSignals.map((sig) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4.0),
                  child: Row(
                    children: [
                      const Icon(Icons.arrow_right, color: AppColors.error),
                      const SizedBox(width: 8),
                      Expanded(child: Text(sig, style: AppTextStyles.bodyMedium)),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),
        ],
        // Action plans card
        Text('HÀNH ĐỘNG CÚ CÚ KHUYÊN BÉ', style: AppTextStyles.labelBold.copyWith(color: AppColors.outline)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.surfaceVariant, width: 2),
          ),
          child: Column(
            children: result.recommendedActions.map((act) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6.0),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline, color: Colors.green),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        act,
                        style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 28),
        // Action CTA Row
        Row(
          children: [
            Expanded(
              child: AppButton(
                text: 'Quét lại',
                onPressed: _resetScan,
                backgroundColor: AppColors.surfaceContainerHigh,
                textColor: AppColors.onSurface,
                shadowColor: AppColors.outlineVariant,
              ),
            ),
            const SizedBox(width: 12),
            if (result.suggestNotifyAdult)
              Expanded(
                child: AppButton(
                  text: 'Báo người lớn',
                  onPressed: () => context.push('/sos'),
                  backgroundColor: AppColors.error,
                  shadowColor: const Color(0xFF93000A),
                ),
              ),
          ],
        )
      ],
    );
  }
}
