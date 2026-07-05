import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:mobile/data/repositories/safety_repository.dart';
import 'package:mobile/domain/models/safety_analysis.dart';

void main() {
  group('SafetyRepository Unit Tests', () {
    late SafetyRepository repository;

    setUp(() {
      repository = SafetyRepository(Dio(), useMock: true);
    });

    test('should classify message requesting OTP as danger', () async {
      final result = await repository.analyzeText("Gửi cho anh mã OTP để nhận kim cương free nha em");
      
      expect(result.riskLevel, RiskLevel.danger);
      expect(result.riskScore, greaterThanOrEqualTo(90));
      expect(result.suggestNotifyAdult, isTrue);
      expect(result.suggestOpenSos, isTrue);
      expect(result.detectedSignals, contains("Yêu cầu mã bí mật (OTP)"));
    });

    test('should classify suspicious link messages as danger', () async {
      final result = await repository.analyzeText("Con bấm vào link http://nhanquafree.com này nhận quà nè");
      
      expect(result.riskLevel, RiskLevel.danger);
      expect(result.riskScore, 90);
      expect(result.suggestNotifyAdult, isTrue);
      expect(result.suggestOpenSos, isFalse);
    });

    test('should classify bullying messages as caution', () async {
      final result = await repository.analyzeText("Mày lo mà nộp tiền không tao sẽ chửi và đánh mày");
      
      expect(result.riskLevel, RiskLevel.caution);
      expect(result.riskTypes, contains(RiskType.bullying));
    });

    test('should classify normal greeting message as safe', () async {
      final result = await repository.analyzeText("Chào buổi sáng, hôm nay con đi học vui không?");
      
      expect(result.riskLevel, RiskLevel.safe);
      expect(result.riskScore, lessThanOrEqualTo(20));
      expect(result.suggestNotifyAdult, isFalse);
    });
  });
}
