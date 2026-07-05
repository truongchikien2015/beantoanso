# Bé An Toàn Số — Flutter Mobile Implementation Plan

> Mục tiêu: xây dựng mobile app Flutter ưu tiên học sinh, tập trung vào trải nghiệm học thực chiến về an toàn số để phục vụ demo cuộc thi.
>
> Trọng tâm sản phẩm: **mô phỏng tình huống thực tế → nhận diện nguy cơ → hướng dẫn hành động đúng → báo người lớn → củng cố kỹ năng bằng mini-game.**

---

## 1. Product Scope

## 1.1 Mục tiêu bản mobile v1

Luồng demo bắt buộc phải hoạt động end-to-end:

```text
Học sinh mở app
→ làm mô phỏng chat người lạ
→ quét tin nhắn/link đáng ngờ
→ nhận phân tích từ Cú Cú AI
→ bấm “Báo người lớn”
→ nhận bài học gợi ý
→ hoàn thành nhiệm vụ và nhận huy hiệu
```

## 1.2 Core features cần build

| Priority | Feature | Mục đích |
|---|---|---|
| P0 | Mô phỏng chat người lạ | Tạo trải nghiệm thực chiến, dễ demo |
| P0 | Quét link/tin nhắn/screenshot | Cho thấy ứng dụng dùng được trong đời thật |
| P0 | Cú Cú AI Assistant | Thể hiện ứng dụng AI cho học sinh |
| P0 | Nút SOS “Con cần giúp đỡ” | Hỗ trợ khi học sinh gặp rủi ro thật |
| P0 | Mini-game + huy hiệu | Tăng hứng thú học và ghi nhớ kỹ năng |
| P1 | Lộ trình học cá nhân hóa | Gợi ý bài học theo điểm yếu |
| P1 | Text-to-speech | Hỗ trợ học sinh nhỏ tuổi, đọc chậm |
| P1 | Parent alert demo | Chứng minh kết nối gia đình |
| P2 | Teacher dashboard | Có thể giữ ở web companion |
| P2 | Cổng phụ huynh đầy đủ | Không cần build hết cho bản thi |

## 1.3 Không ưu tiên cho bản mobile đầu tiên

- Admin tạo/chỉnh sửa câu hỏi.
- Import/export Excel/CSV.
- Quản lý lớp chi tiết.
- Báo cáo nhiều biểu đồ.
- Offline hoàn chỉnh.
- Chatbot tự do ngoài chủ đề.
- Hệ thống xếp hạng toàn trường.

---

# 2. Technology Stack

```text
Flutter
├── State management: Riverpod
├── Routing: go_router
├── Networking: Dio
├── Local storage: SharedPreferences hoặc Hive
├── Secure storage: flutter_secure_storage
├── Camera/gallery: image_picker
├── Text-to-speech: flutter_tts
├── Speech-to-text: speech_to_text
├── Push notification: Firebase Cloud Messaging
├── Analytics: Firebase Analytics
├── Crash reporting: Firebase Crashlytics
└── Animation: flutter_animate / Lottie
```

## 2.1 Packages

```bash
flutter pub add flutter_riverpod
flutter pub add go_router
flutter pub add dio
flutter pub add flutter_secure_storage
flutter pub add shared_preferences
flutter pub add image_picker
flutter pub add flutter_tts
flutter pub add speech_to_text
flutter pub add flutter_animate
flutter pub add lottie
flutter pub add freezed_annotation
flutter pub add json_annotation

flutter pub add firebase_core
flutter pub add firebase_messaging
flutter pub add firebase_analytics
flutter pub add firebase_crashlytics

flutter pub add --dev build_runner
flutter pub add --dev freezed
flutter pub add --dev json_serializable
```

---

# 3. Architecture

Dùng kiến trúc `feature-first` và tách `presentation / domain / data`.

```text
lib/
├── main.dart
├── app/
│   ├── app.dart
│   ├── router.dart
│   ├── theme.dart
│   └── providers.dart
│
├── core/
│   ├── api/
│   │   ├── api_client.dart
│   │   ├── api_exception.dart
│   │   └── interceptors.dart
│   ├── auth/
│   │   └── token_storage.dart
│   ├── constants/
│   ├── services/
│   │   ├── notification_service.dart
│   │   ├── tts_service.dart
│   │   ├── speech_service.dart
│   │   ├── image_service.dart
│   │   └── analytics_service.dart
│   ├── widgets/
│   │   ├── app_button.dart
│   │   ├── mascot_bubble.dart
│   │   ├── safety_card.dart
│   │   ├── loading_view.dart
│   │   └── error_view.dart
│   └── utils/
│
├── features/
│   ├── onboarding/
│   ├── home/
│   ├── simulation/
│   ├── safety_scan/
│   ├── ai_assistant/
│   ├── sos/
│   ├── missions/
│   ├── passport/
│   └── profile/
│
└── l10n/
```

## 3.1 Quy tắc phân lớp

| Layer | Trách nhiệm |
|---|---|
| `presentation` | Screens, widgets, controllers/notifiers |
| `domain` | Models, business rules, use cases |
| `data` | API calls, cache, repository implementations |
| `core` | Shared services, common UI, constants, helpers |

---

# 4. App Navigation

```text
/
├── /onboarding
├── /home
├── /learn
│   ├── /learn/scenario/:id
│   └── /learn/mission/:id
├── /scan
│   ├── /scan/text
│   ├── /scan/link
│   ├── /scan/image
│   └── /scan/result
├── /assistant
├── /sos
│   ├── /sos/select-problem
│   ├── /sos/actions
│   └── /sos/notify-adult
└── /passport
```

## 4.1 Bottom navigation

```text
Trang chủ | Luyện kỹ năng | Quét nguy hiểm | Hồ sơ
```

Nút nổi bật cố định:

```text
Con cần giúp đỡ
```

---

# 5. Main Screens

## 5.1 Onboarding

- Chào mừng với mascot Cú Cú.
- Chọn độ tuổi: `6–9`, `10–12`, `13–15`.
- Chọn kỹ năng muốn học.
- Bài kiểm tra đầu vào 6–8 câu.
- Tạo lộ trình đề xuất.

## 5.2 Home

Hiển thị:

- Lời chào và avatar.
- Cấp độ “Chiến binh An Toàn Số”.
- Nhiệm vụ hôm nay.
- 4 action cards:
  - Luyện tình huống.
  - Kiểm tra link/tin nhắn.
  - Hỏi Cú Cú AI.
  - Con cần giúp đỡ.
- Huy hiệu mới nhất.
- Chuỗi học tập.
- Tip an toàn ngắn.

## 5.3 Mô phỏng chat người lạ

Các scenario MVP:

1. Người lạ xin số điện thoại.
2. Lừa đảo nhận kim cương game.
3. Yêu cầu mã OTP.
4. Bắt nạt trong group chat.

Flow:

```text
Tin nhắn giả lập
→ học sinh chọn hành động
→ feedback của Cú Cú
→ cộng điểm/huy hiệu
→ đề xuất kỹ năng liên quan
```

## 5.4 Quét nguy hiểm

Tabs:

```text
Dán link | Dán tin nhắn | Chụp màn hình
```

Kết quả theo 3 mức:

| Risk level | UI copy |
|---|---|
| `safe` | “Tạm ổn, nhưng con vẫn nên cẩn thận.” |
| `caution` | “Có vài điểm đáng nghi. Hãy hỏi người lớn trước nhé.” |
| `danger` | “Có dấu hiệu nguy hiểm. Không bấm link và không gửi thông tin.” |

## 5.5 Cú Cú AI

AI chỉ hỗ trợ các chủ đề:

- Link lạ.
- OTP/mật khẩu.
- Người lạ nhắn tin.
- Lừa đảo game.
- Bắt nạt mạng.
- Bảo mật thông tin cá nhân.
- Cách báo người lớn.

Quick prompts:

```text
Có người xin OTP của con
Con lỡ bấm link lạ
Bạn chửi con trên mạng
Có người xin ảnh của con
```

## 5.6 SOS “Con cần giúp đỡ”

Entry points:

```text
Con thấy sợ
Có người lạ làm phiền
Có người chửi hoặc dọa con
Con lỡ bấm vào link lạ
```

Action checklist:

```text
1. Không trả lời thêm.
2. Không xóa tin nhắn.
3. Chụp màn hình.
4. Báo bố mẹ hoặc thầy cô.
```

Final CTA:

```text
Báo người lớn ngay
```

## 5.7 Passport

Hiển thị:

- Cấp độ.
- Tổng điểm.
- Streak.
- Kỹ năng đã mở khóa.
- Huy hiệu.
- Chứng nhận “Chiến binh An Toàn Số”.
- QR code mock cho chứng nhận.

---

# 6. Domain Models

## 6.1 Student profile

```dart
enum UserRole { student, parent, teacher }

class StudentProfile {
  final String id;
  final String displayName;
  final int age;
  final int level;
  final int totalPoints;
  final int streakDays;
  final List<String> unlockedSkills;

  const StudentProfile({
    required this.id,
    required this.displayName,
    required this.age,
    required this.level,
    required this.totalPoints,
    required this.streakDays,
    required this.unlockedSkills,
  });
}
```

## 6.2 Safety analysis

```dart
enum RiskLevel { safe, caution, danger }

enum RiskType {
  scam,
  otpTheft,
  suspiciousLink,
  privacy,
  bullying,
  strangerContact,
  grooming,
  harmfulContent,
}

class SafetyAnalysis {
  final RiskLevel riskLevel;
  final int riskScore;
  final List<RiskType> riskTypes;
  final String childFriendlySummary;
  final List<String> detectedSignals;
  final List<String> recommendedActions;
  final bool suggestNotifyAdult;
  final bool suggestOpenSos;

  const SafetyAnalysis({
    required this.riskLevel,
    required this.riskScore,
    required this.riskTypes,
    required this.childFriendlySummary,
    required this.detectedSignals,
    required this.recommendedActions,
    required this.suggestNotifyAdult,
    required this.suggestOpenSos,
  });
}
```

## 6.3 Simulation

```dart
class SimulationChoice {
  final String id;
  final String label;
  final bool isSafe;
  final String feedback;
  final int pointDelta;

  const SimulationChoice({
    required this.id,
    required this.label,
    required this.isSafe,
    required this.feedback,
    required this.pointDelta,
  });
}

class SimulationStep {
  final String senderName;
  final String message;
  final List<SimulationChoice> choices;

  const SimulationStep({
    required this.senderName,
    required this.message,
    required this.choices,
  });
}
```

---

# 7. Mock Data Strategy

## 7.1 Tại sao mock-first

Demo cuộc thi không được phụ thuộc hoàn toàn vào Internet, backend hay AI model.

Tạo interface chung:

```dart
abstract class SafetyRepository {
  Future<SafetyAnalysis> analyzeText(String text);
  Future<SafetyAnalysis> analyzeImage(String imagePath);
}
```

Có 2 implementation:

```text
RemoteSafetyRepository
MockSafetyRepository
```

Dùng feature flag:

```dart
const useMockSafety = true;
```

## 7.2 Các test case mock bắt buộc

```text
1. Gửi OTP để nhận quà game
2. Bấm link nhận kim cương
3. Người lạ xin ảnh cá nhân
4. Bạn chửi/dọa trên mạng
5. Giả danh giáo viên/người thân để xin thông tin
```

## 7.3 Sample scenario JSON

```json
{
  "id": "game-scam-001",
  "title": "Quà game miễn phí",
  "steps": [
    {
      "senderName": "Anh Game Siêu Vip",
      "message": "Anh tặng em 5.000 kim cương miễn phí. Gửi mã OTP để xác nhận nhé!",
      "choices": [
        {
          "id": "send_otp",
          "label": "Gửi mã OTP",
          "isSafe": false,
          "feedback": "OTP là mã bí mật. Con không được gửi cho bất kỳ ai.",
          "pointDelta": 0
        },
        {
          "id": "block",
          "label": "Không trả lời và chặn người này",
          "isSafe": true,
          "feedback": "Đúng rồi! Con đã bảo vệ tài khoản của mình.",
          "pointDelta": 20
        }
      ]
    }
  ]
}
```

---

# 8. API Contract

## 8.1 Home

```http
GET /api/v1/student/home
```

```json
{
  "student": {
    "id": "student_01",
    "displayName": "Sơn",
    "level": 3,
    "points": 1250,
    "streakDays": 5
  },
  "todayMission": {
    "id": "mission_otp",
    "title": "OTP là bí mật",
    "progress": 0.4
  },
  "recommendedSkills": [
    "Nhận diện link lừa đảo",
    "Bảo vệ thông tin cá nhân"
  ]
}
```

## 8.2 Safety scan

```http
POST /api/v1/safety/analyze
```

```json
{
  "inputType": "text",
  "content": "Bấm link nhận quà, gửi OTP để xác nhận"
}
```

```json
{
  "riskLevel": "danger",
  "riskScore": 92,
  "riskTypes": ["scam", "otpTheft"],
  "childFriendlySummary": "Tin nhắn này có dấu hiệu lừa đảo. Con đừng gửi OTP nhé.",
  "detectedSignals": [
    "Hứa quà miễn phí",
    "Yêu cầu OTP",
    "Thúc ép làm ngay"
  ],
  "recommendedActions": [
    "Không bấm link",
    "Không gửi OTP",
    "Chụp màn hình",
    "Báo người lớn"
  ],
  "suggestNotifyAdult": true,
  "suggestOpenSos": false
}
```

## 8.3 Create SOS incident

```http
POST /api/v1/incidents
```

```json
{
  "type": "stranger_contact",
  "studentId": "student_01",
  "note": "Có người lạ xin ảnh của con",
  "notifyGuardian": true
}
```

## 8.4 Complete mission

```http
POST /api/v1/missions/:missionId/complete
```

```json
{
  "score": 80,
  "selectedChoices": ["block", "report_adult"]
}
```

---

# 9. Repository and Riverpod Example

## 9.1 Repository

```dart
class SafetyRepository {
  SafetyRepository(this._dio);

  final Dio _dio;

  Future<SafetyAnalysis> analyzeText(String text) async {
    final response = await _dio.post(
      '/api/v1/safety/analyze/text',
      data: {'text': text},
    );

    return SafetyAnalysisMapper.fromJson(response.data);
  }

  Future<SafetyAnalysis> analyzeImage(String imagePath) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(imagePath),
    });

    final response = await _dio.post(
      '/api/v1/safety/analyze/image',
      data: formData,
    );

    return SafetyAnalysisMapper.fromJson(response.data);
  }
}
```

## 9.2 Riverpod controller

```dart
final safetyRepositoryProvider = Provider<SafetyRepository>((ref) {
  return SafetyRepository(ref.watch(dioProvider));
});

final safetyScanControllerProvider =
    StateNotifierProvider<SafetyScanController, AsyncValue<SafetyAnalysis?>>(
  (ref) => SafetyScanController(
    ref.watch(safetyRepositoryProvider),
  ),
);

class SafetyScanController
    extends StateNotifier<AsyncValue<SafetyAnalysis?>> {
  SafetyScanController(this._repository)
      : super(const AsyncData(null));

  final SafetyRepository _repository;

  Future<void> analyzeText(String text) async {
    if (text.trim().isEmpty) return;

    state = const AsyncLoading();

    try {
      final result = await _repository.analyzeText(text);
      state = AsyncData(result);
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
    }
  }
}
```

## 9.3 UI state usage

```dart
final scanState = ref.watch(safetyScanControllerProvider);

scanState.when(
  data: (analysis) {
    if (analysis == null) return const ScanInputView();
    return ScanResultView(analysis: analysis);
  },
  loading: () => const LoadingView(),
  error: (_, __) => const ScanErrorView(),
);
```

---

# 10. AI Safety Requirements

## 10.1 Rules

- Không gửi API key AI trong Flutter app.
- Flutter chỉ gọi backend riêng.
- Backend mới gọi model AI và áp rules engine.
- Không yêu cầu học sinh gửi mật khẩu, OTP, địa chỉ hoặc ảnh nhạy cảm.
- AI chỉ trả lời chủ đề an toàn mạng/học tập.
- Khi có nguy cơ cao, đưa hành động ngay, không hỏi dài.
- Không nói “100% lừa đảo” nếu chưa có bằng chứng chắc chắn.
- Dùng từ: “có dấu hiệu nguy hiểm”, “hãy hỏi người lớn”.
- Không đổ lỗi cho học sinh.
- Khi có nội dung grooming, đe dọa hoặc cưỡng ép: gợi ý SOS và báo người lớn ngay.

## 10.2 Prompt behavior

```text
- Ngôn ngữ tiếng Việt đơn giản, phù hợp độ tuổi.
- Mỗi câu trả lời tối đa 3–5 câu ngắn.
- Luôn đưa ra việc cần làm tiếp theo.
- Ưu tiên: không trả lời thêm, không xóa bằng chứng, báo người lớn.
- Không hiển thị lại nội dung nhạy cảm không cần thiết.
```

---

# 11. Sprint Plan

## Sprint 1 — Foundation (2–3 ngày)

- [ ] Tạo Flutter project.
- [ ] Setup theme, typography, color tokens.
- [ ] Tạo mascot Cú Cú.
- [ ] Bottom navigation.
- [ ] Onboarding chọn độ tuổi.
- [ ] Home screen với mock profile.
- [ ] Shared UI components.
- [ ] Seed missions và badges.

**Done:** Có thể mở app, chuyển tab, quay video home screen đẹp.

## Sprint 2 — Simulation (3–4 ngày)

- [ ] Xây simulation engine đơn giản.
- [ ] Làm 4 kịch bản chat.
- [ ] Feedback bằng mascot.
- [ ] Progress, điểm, huy hiệu.
- [ ] Text-to-speech cho câu hỏi.
- [ ] Mock data local JSON.

**Done:** Có demo chat người lạ và phản hồi tương tác.

## Sprint 3 — Safety Scan (3–4 ngày)

- [ ] UI scan 3 tabs: text/link/image.
- [ ] Image picker/camera.
- [ ] Mock analysis result.
- [ ] API integration.
- [ ] Result screen màu xanh/vàng/đỏ.
- [ ] CTA báo người lớn / học thêm.

**Done:** Có demo screenshot → cảnh báo nguy hiểm → hướng dẫn hành động.

## Sprint 4 — AI Assistant + SOS (3–4 ngày)

- [ ] Cú Cú AI UI.
- [ ] Quick prompts.
- [ ] Chat API/mock response.
- [ ] SOS entry screen.
- [ ] Action checklist.
- [ ] Create incident API.
- [ ] Notification mock hoặc Firebase push.

**Done:** Có luồng học sinh gặp nguy hiểm → bấm SOS → phụ huynh nhận cảnh báo.

## Sprint 5 — Gamification + Polish (2–3 ngày)

- [ ] Passport.
- [ ] Badges.
- [ ] Streak.
- [ ] Animation success.
- [ ] Empty/loading/error states.
- [ ] Accessibility pass.
- [ ] App icon/splash.
- [ ] Test điện thoại Android thật.

**Done:** App đủ ổn định và đẹp để quay video/pitch.

---

# 12. UX Rules for Students

- Font tối thiểu 16–18sp.
- Nút chính cao tối thiểu 48dp.
- Một màn hình có một CTA chính.
- Câu ngắn, từ đơn giản.
- Dùng icon + text thay vì text dài.
- Feedback ngay sau mỗi thao tác.
- Không cảnh báo theo kiểu đáng sợ.
- Khi nguy hiểm, luôn trấn an:
  - “Con không làm gì sai cả.”
  - “Hãy nhờ người lớn giúp nhé.”
- Tất cả câu hỏi/tình huống có nút đọc to.
- Không dùng nhiều form hoặc bước đăng ký phức tạp.

---

# 13. Definition of Done

```text
[ ] App chạy ổn định trên Android thật.
[ ] Có 4 tình huống mô phỏng hoàn chỉnh.
[ ] Có scan text/link hoạt động thật hoặc mock đáng tin.
[ ] Có upload screenshot.
[ ] Có Cú Cú AI với quick prompts.
[ ] Có SOS flow.
[ ] Có alert giả lập hoặc push notification thật.
[ ] Có ít nhất 5 huy hiệu.
[ ] Có lộ trình học cơ bản.
[ ] Có text-to-speech.
[ ] Có loading/error/offline state.
[ ] Có dữ liệu demo dựng sẵn.
[ ] Có video fallback nếu mạng lỗi.
```

---

# 14. Demo Script

```text
1. Học sinh nhận tin nhắn “Nhận kim cương miễn phí, gửi OTP để xác nhận”.
2. Học sinh mở Bé An Toàn Số và chụp/dán nội dung.
3. App phân tích: cảnh báo đỏ.
4. Cú Cú giải thích: OTP là mã bí mật.
5. Học sinh bấm “Báo người lớn”.
6. Parent alert xuất hiện.
7. App đề xuất bài học “OTP là bí mật”.
8. Học sinh hoàn thành mini-game và nhận badge.
```

## Closing pitch

> Bé An Toàn Số không chỉ dạy học sinh biết đáp án đúng. Ứng dụng giúp các em biết hành động đúng khi gặp nguy hiểm thật trên Internet.

---

# 15. Build Order

```text
1. Theme + Home
2. Simulation chat
3. Safety scan UI + mock result
4. SOS flow
5. Cú Cú AI
6. Missions + badges
7. Backend API integration
8. Notification
9. Polish + test real devices
```
