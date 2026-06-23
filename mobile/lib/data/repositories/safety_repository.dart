import 'package:dio/dio.dart';
import '../../domain/models/safety_analysis.dart';
import '../../domain/models/simulation.dart';

class SafetyRepository {
  final Dio _dio;
  final bool useMock;

  SafetyRepository(this._dio, {this.useMock = true});

  // 1. Phân tích tin nhắn / link (Text scan)
  Future<SafetyAnalysis> analyzeText(String text) async {
    if (useMock) {
      await Future.delayed(
        const Duration(milliseconds: 800),
      ); // simulate network delay
      return _analyzeTextLocally(text);
    } else {
      try {
        final response = await _dio.post(
          '/api/student/detect-scam', // Matching Next.js endpoint
          data: {'content': text},
        );

        final Map<String, dynamic> data = response.data as Map<String, dynamic>;
        final String risk = data['risk'] as String? ?? 'green';
        final String explanation = data['explanation'] as String? ?? '';

        RiskLevel riskLevel = RiskLevel.safe;
        int riskScore = 10;
        List<RiskType> riskTypes = [];
        List<String> detectedSignals = ["Nội dung thông thường"];
        List<String> recommendedActions = [
          "Tiếp tục trò chuyện an toàn",
          "Không chia sẻ mật khẩu",
        ];
        bool suggestNotifyAdult = false;
        bool suggestOpenSos = false;

        if (risk == 'red') {
          riskLevel = RiskLevel.danger;
          riskScore = 90;
          riskTypes = [RiskType.scam];
          detectedSignals = [
            "Có dấu hiệu nguy hiểm",
            "Yêu cầu hành động gấp",
            "Liên kết lạ hoặc mã OTP",
          ];
          recommendedActions = [
            "Không gửi mã OTP/mật khẩu",
            "Không bấm link lạ",
            "Chụp màn hình làm bằng chứng",
            "Bấm 'Báo người lớn' ngay",
          ];
          suggestNotifyAdult = true;
          suggestOpenSos = true;
        } else if (risk == 'yellow') {
          riskLevel = RiskLevel.caution;
          riskScore = 60;
          riskTypes = [RiskType.privacy];
          detectedSignals = [
            "Tin nhắn chưa xác minh",
            "Hứa hẹn tặng quà",
            "Hỏi thông tin cá nhân",
          ];
          recommendedActions = [
            "Không chia sẻ thông tin cá nhân",
            "Hỏi ý kiến cha mẹ",
            "Cài đặt bảo mật",
          ];
          suggestNotifyAdult = true;
          suggestOpenSos = false;
        }

        return SafetyAnalysis(
          riskLevel: riskLevel,
          riskScore: riskScore,
          riskTypes: riskTypes,
          childFriendlySummary: explanation.isNotEmpty
              ? explanation
              : "Phân tích từ Cú Cú AI.",
          detectedSignals: detectedSignals,
          recommendedActions: recommendedActions,
          suggestNotifyAdult: suggestNotifyAdult,
          suggestOpenSos: suggestOpenSos,
        );
      } catch (e) {
        // Fallback to local regex rule analysis if server is unreachable
        return _analyzeTextLocally(text);
      }
    }
  }

  // 2. Phân tích hình ảnh (Image/Screenshot scan)
  Future<SafetyAnalysis> analyzeImage(String imagePath) async {
    if (useMock) {
      await Future.delayed(const Duration(milliseconds: 1200));
      return const SafetyAnalysis(
        riskLevel: RiskLevel.danger,
        riskScore: 88,
        riskTypes: [RiskType.scam, RiskType.suspiciousLink],
        childFriendlySummary:
            "Phát hiện nguy hiểm từ ảnh chụp màn hình! Hình ảnh chứa quảng cáo trúng thưởng lớn và hướng dẫn nạp thẻ/gửi OTP để nhận giải. Đây là hành vi lừa đảo.",
        detectedSignals: [
          "Hình ảnh trúng thưởng giả mạo",
          "Yêu cầu nạp thẻ",
          "Tạo sự gấp gáp",
        ],
        recommendedActions: [
          "Không nạp tiền/thẻ",
          "Không gửi mã thẻ",
          "Báo ngay cho bố mẹ hoặc thầy cô",
        ],
        suggestNotifyAdult: true,
        suggestOpenSos: false,
      );
    } else {
      try {
        // The server detect-scam endpoint takes JSON content (not multipart file).
        // Since we are running in an app demo context, we mock the OCR scanner
        // reading a suspicious screenshot containing a scam message.
        return await analyzeText(
          "Anh tặng em 5000 kim cương, hãy bấm vào link garena-free.com và nhập OTP nhé!",
        );
      } catch (e) {
        return _analyzeTextLocally(
          "Anh tặng em 5000 kim cương, hãy bấm vào link garena-free.com và nhập OTP nhé!",
        );
      }
    }
  }

  // 4. Mascot Chat AI
  Future<String> askMascot(String message) async {
    if (useMock) {
      await Future.delayed(const Duration(milliseconds: 800));
      return _getLocalMascotResponse(message);
    } else {
      try {
        final response = await _dio.post(
          '/api/student/mascot-chat',
          data: {'message': message},
        );
        return response.data['text'] as String? ??
            'Cú Cú chưa nghe rõ, con nói lại nhé!';
      } catch (e) {
        return _getLocalMascotResponse(message);
      }
    }
  }

  String _getLocalMascotResponse(String text) {
    String reply =
        "Cú Cú nghe rồi! Con nhớ nhé: tuyệt đối không bấm link lạ, không gửi OTP, và luôn kể với bố mẹ khi gặp điều gì đáng sợ trên mạng nha!";
    final lowerText = text.toLowerCase();

    if (lowerText.contains("otp") || lowerText.contains("mã xác nhận")) {
      reply =
          "Mã OTP cực kỳ quan trọng! Con tuyệt đối KHÔNG được gửi mã OTP cho bất kỳ ai nhé. Gửi nó đi kẻ xấu sẽ ăn trộm tài khoản game hoặc tài khoản của bố mẹ đó.";
    } else if (lowerText.contains("link") || lowerText.contains("bấm")) {
      reply =
          "Con lỡ bấm link lạ đúng không? Con đừng lo lắng quá nhé. Trước mắt con không nhập thông tin hay mật khẩu vào trang web đó. Hãy báo bố mẹ xem ngay nha!";
    } else if (lowerText.contains("bắt nạt") ||
        lowerText.contains("chửi") ||
        lowerText.contains("dọa")) {
      reply =
          "Bạn bắt nạt hay đe dọa con à? Con không chửi lại bạn nhé. Con hãy chụp ảnh màn hình làm bằng chứng, chặn bạn lại và kể ngay cho bố mẹ hoặc thầy cô nghe nha. Con không làm gì sai cả.";
    } else if (lowerText.contains("ảnh") || lowerText.contains("hình")) {
      reply =
          "Tuyệt đối không gửi ảnh cá nhân, ảnh nhà cửa hay ảnh trường học cho người lạ trên mạng nhé con. Hãy từ chối ngay lập tức và tắt chat đi nha.";
    }
    return reply;
  }

  SafetyAnalysis _analyzeTextLocally(String text) {
    final lowerText = text.toLowerCase();

    if (lowerText.contains("otp") || lowerText.contains("mã xác nhận")) {
      return const SafetyAnalysis(
        riskLevel: RiskLevel.danger,
        riskScore: 95,
        riskTypes: [RiskType.otpTheft, RiskType.scam],
        childFriendlySummary:
            "Cảnh báo nguy hiểm! Tin nhắn này yêu cầu mã OTP. OTP là mã bí mật dùng để bảo vệ tài khoản, con tuyệt đối không được gửi cho bất kỳ ai, kể cả người quen nhé!",
        detectedSignals: [
          "Yêu cầu mã bí mật (OTP)",
          "Hứa tặng quà game",
          "Có dấu hiệu thúc ép",
        ],
        recommendedActions: [
          "Không gửi mã OTP",
          "Không trả lời tin nhắn",
          "Chụp màn hình làm bằng chứng",
          "Bấm 'Báo người lớn' ngay",
        ],
        suggestNotifyAdult: true,
        suggestOpenSos: true,
      );
    } else if (lowerText.contains("link") ||
        lowerText.contains("nhấp vào") ||
        lowerText.contains("http") ||
        lowerText.contains("tặng quà") ||
        lowerText.contains("kim cương")) {
      return const SafetyAnalysis(
        riskLevel: RiskLevel.danger,
        riskScore: 90,
        riskTypes: [RiskType.suspiciousLink, RiskType.scam],
        childFriendlySummary:
            "Có nguy cơ lừa đảo! Tin nhắn rủ rê bấm vào đường link lạ để nhận quà miễn phí. Các đường link này có thể chứa virus hoặc đánh cắp thông tin của con.",
        detectedSignals: ["Đường link lạ", "Quà miễn phí", "Yêu cầu đăng nhập"],
        recommendedActions: [
          "Không bấm vào link",
          "Chặn người gửi",
          "Hỏi bố mẹ hoặc thầy cô",
          "Không nhập thông tin cá nhân",
        ],
        suggestNotifyAdult: true,
        suggestOpenSos: false,
      );
    } else if (lowerText.contains("chửi") ||
        lowerText.contains("dọa") ||
        lowerText.contains("đánh") ||
        lowerText.contains("sợ")) {
      return const SafetyAnalysis(
        riskLevel: RiskLevel.caution,
        riskScore: 70,
        riskTypes: [RiskType.bullying],
        childFriendlySummary:
            "Chú ý! Có dấu hiệu đe dọa hoặc bắt nạt trên mạng. Con không làm gì sai cả. Hãy giữ bình tĩnh và tìm sự trợ giúp nhé.",
        detectedSignals: ["Lời nói đe dọa", "Bắt nạt", "Làm con lo lắng"],
        recommendedActions: [
          "Không chửi lại",
          "Chụp màn hình tin nhắn",
          "Chia sẻ với bố mẹ hoặc thầy cô",
          "Bấm nút SOS nếu con thấy sợ hãi",
        ],
        suggestNotifyAdult: true,
        suggestOpenSos: true,
      );
    } else if (lowerText.contains("ảnh") ||
        lowerText.contains("nhà") ||
        lowerText.contains("địa chỉ") ||
        lowerText.contains("số điện thoại")) {
      return const SafetyAnalysis(
        riskLevel: RiskLevel.caution,
        riskScore: 65,
        riskTypes: [RiskType.privacy, RiskType.strangerContact],
        childFriendlySummary:
            "Cần cẩn thận! Có người đang hỏi xin thông tin cá nhân hoặc hình ảnh riêng tư của con. Con đừng vội cung cấp nhé.",
        detectedSignals: [
          "Hỏi số điện thoại/địa chỉ",
          "Xin ảnh cá nhân",
          "Người lạ liên hệ",
        ],
        recommendedActions: [
          "Không cung cấp thông tin",
          "Hỏi ý kiến cha mẹ",
          "Cài đặt quyền riêng tư",
        ],
        suggestNotifyAdult: true,
        suggestOpenSos: false,
      );
    }

    return const SafetyAnalysis(
      riskLevel: RiskLevel.safe,
      riskScore: 12,
      riskTypes: [],
      childFriendlySummary:
          "An tâm! Tin nhắn này có vẻ bình thường và tạm thời chưa thấy dấu hiệu nguy hiểm. Tuy nhiên con vẫn nên chú ý bảo mật thông tin cá nhân nhé.",
      detectedSignals: ["Nội dung thông thường"],
      recommendedActions: [
        "Tiếp tục trò chuyện an toàn",
        "Không chia sẻ mật khẩu",
      ],
      suggestNotifyAdult: false,
      suggestOpenSos: false,
    );
  }

  // 3. Lấy kịch bản giả lập (Simulation scenarios)
  Future<List<SimulationScenario>> getScenarios() async {
    // Return local mock scenarios
    return [
      const SimulationScenario(
        id: "game-scam-001",
        title: "Quà game miễn phí",
        steps: [
          SimulationStep(
            senderName: "Anh Game Siêu Vip",
            message:
                "Chào em trai! Anh thấy nick em chơi hay quá. Anh đang tặng 5.000 kim cương Free cho các bạn nhỏ. Gửi mã OTP xác nhận gửi về điện thoại bố mẹ để anh nạp luôn nhé!",
            choices: [
              SimulationChoice(
                id: "send_otp",
                label: "Đọc mã OTP cho anh ấy nạp kim cương",
                isSafe: false,
                feedback:
                    "Sai rồi bé ơi! OTP là mã khóa bảo vệ. Nếu con gửi mã này, kẻ xấu sẽ cướp mất tài khoản điện thoại hoặc ngân hàng của bố mẹ đó!",
                pointDelta: 0,
              ),
              SimulationChoice(
                id: "block",
                label: "Không gửi và chặn ngay người này",
                isSafe: true,
                feedback:
                    "Tuyệt vời! Con đã nhận diện rất tốt. Không bao giờ gửi mã OTP cho bất kỳ ai tự xưng tặng quà game.",
                pointDelta: 20,
              ),
            ],
          ),
        ],
      ),
      const SimulationScenario(
        id: "stranger-privacy-002",
        title: "Người lạ xin ảnh riêng tư",
        steps: [
          SimulationStep(
            senderName: "Chị Thỏ Ngọc Xinh",
            message:
                "Chào bé đáng yêu! Chị đang tham gia cuộc thi ảnh đẹp. Bé chụp giúp chị phòng ngủ của bé và cả ngôi nhà của bé gửi cho chị được không? Nhìn bé dễ thương ghê!",
            choices: [
              SimulationChoice(
                id: "send_photo",
                label: "Chụp ảnh phòng ngủ và gửi cho chị ấy",
                isSafe: false,
                feedback:
                    "Nguy hiểm con ơi! Người lạ có thể dùng hình ảnh nhà cửa để tìm ra nơi con ở hoặc thực hiện ý đồ xấu. Không tự ý gửi ảnh cá nhân nhé!",
                pointDelta: 0,
              ),
              SimulationChoice(
                id: "decline",
                label: "Từ chối và báo ngay cho bố mẹ biết",
                isSafe: true,
                feedback:
                    "Quá xuất sắc! Con luôn biết cách bảo vệ thông tin riêng tư và gia đình mình.",
                pointDelta: 20,
              ),
            ],
          ),
        ],
      ),
      const SimulationScenario(
        id: "cyberbullying-003",
        title: "Bắt nạt trên group chat",
        steps: [
          SimulationStep(
            senderName: "Kẻ giấu mặt",
            message:
                "Ê cu kia, liệu hồn mà nộp 50.000đ thẻ cào cho tao vào tài khoản này, nếu không tao sẽ chế ảnh dìm hàng mày rồi đăng lên nhóm lớp cho mọi người cười thối mũi!",
            choices: [
              SimulationChoice(
                id: "pay_card",
                label: "Sợ hãi và đi mua thẻ nạp cho kẻ đe dọa",
                isSafe: false,
                feedback:
                    "Không nên con nhé! Kẻ bắt nạt sẽ tiếp tục đe dọa và đòi hỏi thêm. Con không làm gì sai cả, đừng sợ hãi giấu giếm.",
                pointDelta: 0,
              ),
              SimulationChoice(
                id: "screenshot_parent",
                label: "Chụp ảnh màn hình làm bằng chứng và báo thầy cô, bố mẹ",
                isSafe: true,
                feedback:
                    "Đúng rồi! Lưu lại bằng chứng và nhờ thầy cô hoặc cha mẹ can thiệp là cách thông minh và an toàn nhất.",
                pointDelta: 20,
              ),
            ],
          ),
        ],
      ),
      const SimulationScenario(
        id: "impersonation-004",
        title: "Giả danh người quen",
        steps: [
          SimulationStep(
            senderName: "Thầy Lâm chủ nhiệm",
            message:
                "Chào em học sinh, thầy đang cập nhật danh bạ phụ huynh lớp mình. Em gửi nhanh cho thầy số điện thoại, cơ quan làm việc và số tài khoản ngân hàng của bố mẹ em nhé.",
            choices: [
              SimulationChoice(
                id: "give_info",
                label: "Nhắn ngay toàn bộ thông tin cho tài khoản thầy Lâm",
                isSafe: false,
                feedback:
                    "Con cần cẩn thận! Tài khoản này có thể bị hack hoặc giả mạo. Thầy cô thật sự luôn liên hệ trực tiếp với bố mẹ chứ không xin qua học sinh.",
                pointDelta: 0,
              ),
              SimulationChoice(
                id: "verify_parent",
                label:
                    "Không gửi, chụp tin nhắn hỏi lại bố mẹ để xác minh trước",
                isSafe: true,
                feedback:
                    "Cực kỳ thông minh! Việc xác minh danh tính trước khi chia sẻ thông tin mật của gia đình là kỹ năng an toàn số rất quan trọng.",
                pointDelta: 20,
              ),
            ],
          ),
        ],
      ),
    ];
  }

  // 5. Get Student Dashboard (assigned path & progress)
  Future<Map<String, dynamic>> getStudentDashboard() async {
    if (useMock) {
      await Future.delayed(const Duration(milliseconds: 500));
      return _getMockDashboard();
    }

    final response = await _dio.get('/api/student/dashboard');
    return Map<String, dynamic>.from(response.data as Map);
  }

  // 6. Get Step Content (topic/quiz questions)
  Future<Map<String, dynamic>> getStepContent(String stepId) async {
    if (useMock) {
      await Future.delayed(const Duration(milliseconds: 500));
      return _getMockStepContent(stepId);
    }

    final response = await _dio.get('/api/student/steps/$stepId');
    return Map<String, dynamic>.from(response.data as Map);
  }

  // 7. Submit Quiz result
  Future<Map<String, dynamic>> submitQuiz({
    required String pathId,
    required String stepId,
    required int score,
    required List<Map<String, dynamic>> answers,
  }) async {
    if (useMock) {
      await Future.delayed(const Duration(milliseconds: 500));
      return {
        'success': true,
        'xp_awarded': score ~/ 10 * 10,
        'breakdown': {
          'total': answers.length,
          'correct': (score / 100 * answers.length).round(),
          'score': score,
        },
      };
    }

    final response = await _dio.post(
      '/api/student/quiz',
      data: {
        'path_id': pathId,
        'step_id': stepId,
        'score': score,
        'answers': answers,
      },
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  // Helper mocks
  Map<String, dynamic> _getMockDashboard() {
    return {
      'student': {
        'id': 'student_demo_01',
        'nickname': 'Sơn',
        'class_name': 'Lớp 5A',
        'student_code': 'bekim32',
        'assigned_path_id': 'path_demo_01',
      },
      'assigned_path': {
        'id': 'path_demo_01',
        'title': 'Hành trình an toàn',
        'description':
            'Các bài học nền tảng giúp con bảo vệ bản thân trên không gian mạng',
        'steps': [
          {
            'id': 'step_01',
            'path_id': 'path_demo_01',
            'step_order': 1,
            'step_type': 'topic',
            'topic_id': 'stranger',
          },
          {
            'id': 'step_02',
            'path_id': 'path_demo_01',
            'step_order': 2,
            'step_type': 'topic',
            'topic_id': 'phishing',
          },
          {
            'id': 'step_03',
            'path_id': 'path_demo_01',
            'step_order': 3,
            'step_type': 'topic',
            'topic_id': 'password',
          },
          {
            'id': 'step_04',
            'path_id': 'path_demo_01',
            'step_order': 4,
            'step_type': 'topic',
            'topic_id': 'privacy',
          },
        ],
        'step_count': 4,
      },
      'progress': [
        {
          'id': 'prog_01',
          'student_id': 'student_demo_01',
          'path_id': 'path_demo_01',
          'step_id': 'step_01',
          'score': 100,
        },
        {
          'id': 'prog_02',
          'student_id': 'student_demo_01',
          'path_id': 'path_demo_01',
          'step_id': 'step_02',
          'score': 100,
        },
      ],
      'stats': {'total_xp': 1250, 'level': 3},
    };
  }

  Map<String, dynamic> _getMockStepContent(String stepId) {
    String topicId = 'password';
    if (stepId == 'step_01') {
      topicId = 'stranger';
    } else if (stepId == 'step_02') {
      topicId = 'phishing';
    } else if (stepId == 'step_04') {
      topicId = 'privacy';
    }

    final Map<String, List<Map<String, dynamic>>> allQuestions = {
      'stranger': [
        {
          'id': 'q_s1',
          'question':
              'Con nhận được lời mời kết bạn từ một người lạ có ảnh đại diện là nhân vật game con thích. Con nên làm gì?',
          'option_a': 'Đồng ý kết bạn ngay để nói chuyện về game.',
          'option_b': 'Từ chối kết bạn và hỏi ý kiến bố mẹ/thầy cô.',
          'option_c': 'Gửi số điện thoại của con để kết bạn Zalo.',
          'correct_option': 'B',
          'explanation':
              'Người lạ có thể dùng ảnh đại diện giả mạo để tiếp cận con. Con không nên tự ý kết bạn với người không quen biết.',
        },
        {
          'id': 'q_s2',
          'question':
              'Người lạ trên mạng hỏi con học trường nào và nhà ở đâu. Câu trả lời nào là an toàn?',
          'option_a': 'Trả lời đầy đủ tên trường và địa chỉ nhà.',
          'option_b': 'Nói dối một địa chỉ khác.',
          'option_c': 'Từ chối trả lời và kể với bố mẹ.',
          'correct_option': 'C',
          'explanation':
              'Tuyệt đối không tiết lộ thông tin cá nhân như địa chỉ nhà hay tên trường học cho người lạ trên mạng nhé.',
        },
      ],
      'phishing': [
        {
          'id': 'q_p1',
          'question':
              'Con nhận được tin nhắn: "Chúc mừng! Bạn đã trúng thưởng iPhone 15. Bấm vào link quà tặng miễn phí: http://nhan-qua-free.net để nhận". Con nên làm gì?',
          'option_a': 'Bấm vào đường link ngay lập tức để không bỏ lỡ quà.',
          'option_b':
              'Không bấm vào link, báo cáo tin nhắn rác hoặc báo cho bố mẹ.',
          'option_c': 'Chia sẻ link này cho các bạn cùng lớp.',
          'correct_option': 'B',
          'explanation':
              'Đây là tin nhắn lừa đảo nhằm dụ dỗ con bấm vào link lạ để đánh cắp thông tin hoặc cài mã độc.',
        },
        {
          'id': 'q_p2',
          'question':
              'Trang web đăng nhập game yêu cầu con nhập số điện thoại của bố mẹ để xác minh tài khoản. Con nên làm gì?',
          'option_a': 'Nhập số điện thoại của bố mẹ vào trang web.',
          'option_b': 'Hỏi ý kiến bố mẹ trước khi nhập bất kỳ thông tin nào.',
          'option_c': 'Tắt trang web và không bao giờ chơi game đó nữa.',
          'correct_option': 'B',
          'explanation':
              'Hỏi ý kiến bố mẹ giúp con tránh các trang web giả mạo muốn thu thập thông tin liên lạc của gia đình.',
        },
      ],
      'password': [
        {
          'id': 'q_pw1',
          'question':
              'Đâu là một mật khẩu mạnh và an toàn nhất cho tài khoản của con?',
          'option_a': '12345678',
          'option_b': 'tenCuaCon2015',
          'option_c': 'CuCu@AnToanSo2026',
          'correct_option': 'C',
          'explanation':
              'Mật khẩu mạnh cần kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt để kẻ xấu không đoán được.',
        },
        {
          'id': 'q_pw2',
          'question':
              'Con nên làm gì nếu bạn thân nhất ở lớp hỏi mượn mật khẩu tài khoản game của con?',
          'option_a': 'Cho mượn vì đó là bạn thân nhất.',
          'option_b':
              'Từ chối khéo léo: "Tớ không được phép chia sẻ mật khẩu để bảo vệ tài khoản".',
          'option_c': 'Cho bạn mượn và bảo bạn không được nói với ai.',
          'correct_option': 'B',
          'explanation':
              'Mật khẩu là thông tin tuyệt mật và duy nhất của riêng con. Không chia sẻ với bất kỳ ai, kể cả bạn thân.',
        },
      ],
      'privacy': [
        {
          'id': 'q_pr1',
          'question':
              'Con có nên đăng ảnh chụp giấy khen học sinh giỏi của con (có ghi rõ họ tên, lớp, trường học) lên mạng xã hội không?',
          'option_a': 'Có, để khoe thành tích với mọi người.',
          'option_b':
              'Không, vì trên giấy khen có chứa nhiều thông tin cá nhân riêng tư của con.',
          'option_c': 'Chỉ đăng nếu che bớt ảnh chân dung của con.',
          'correct_option': 'B',
          'explanation':
              'Kẻ xấu có thể lợi dụng họ tên, trường lớp trên giấy khen để tìm cách liên hệ hoặc tiếp cận con.',
        },
      ],
    };

    final topicQuestions = allQuestions[topicId] ?? allQuestions['password']!;

    return {
      'step_id': stepId,
      'path_id': 'path_demo_01',
      'step_type': 'topic',
      'topic_id': topicId,
      'question_set_id': null,
      'step_order': stepId == 'step_01'
          ? 1
          : (stepId == 'step_02' ? 2 : (stepId == 'step_03' ? 3 : 4)),
      'topic_label': topicId == 'stranger'
          ? 'Người lạ nhắn tin'
          : (topicId == 'phishing'
                ? 'Link lạ và lừa đảo'
                : (topicId == 'password'
                      ? 'Mật khẩu và tài khoản'
                      : 'Bảo vệ thông tin cá nhân')),
      'questions': topicQuestions,
      'question_count': topicQuestions.length,
    };
  }

  // 8. Get Learning Paths (for self-learning or public list)
  Future<List<Map<String, dynamic>>> getLearningPaths() async {
    if (useMock) {
      await Future.delayed(const Duration(milliseconds: 500));
      return _getMockLearningPaths();
    }

    final response = await _dio.get('/api/student/learning-paths');
    final data = Map<String, dynamic>.from(response.data as Map);
    final list = data['data'] as List<dynamic>? ?? [];
    return list.map((item) => Map<String, dynamic>.from(item as Map)).toList();
  }

  List<Map<String, dynamic>> _getMockLearningPaths() {
    return [
      {
        'id': '6a38a64c6052faa14296e329',
        'title': 'Cơ bản',
        'description': 'Lộ trình học tập cơ bản về an toàn số',
        'topic_ids': [
          '6a37fd655f70efbc84b0cf55',
          '6a37fd655f70efbc84b0cf56',
          '6a37fd655f70efbc84b0cf57',
          '6a37fd655f70efbc84b0cf5b',
          '6a37fd655f70efbc84b0cf58',
          '6a37fd655f70efbc84b0cf5f',
        ],
        'is_active': true,
      },
    ];
  }
}
