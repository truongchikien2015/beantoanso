import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../data/repositories/safety_repository.dart';
import '../domain/models/student_profile.dart';

// 1. Base Dio client provider
final dioProvider = Provider<Dio>((ref) {
  const String baseUrl = 'https://climbing-grouper-mildly.ngrok-free.app';
  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
      headers: {'ngrok-skip-browser-warning': 'true'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        try {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('bats:student_token');
          if (token != null && token.isNotEmpty) {
            options.headers['authorization'] = 'Bearer $token';
          }
        } catch (_) {
          // SharedPreferences might fail in widget tests
        }
        return handler.next(options);
      },
    ),
  );

  return dio;
});

// 2. Safety repository provider
final safetyRepositoryProvider = Provider<SafetyRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return SafetyRepository(
    dio,
    useMock: false,
  ); // Set to false to hit server with local fallback
});

// 3. Reactive Notifier for Student Profile
class StudentProfileNotifier extends Notifier<StudentProfile?> {
  @override
  StudentProfile? build() => null;

  Future<bool> autoLogin() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('bats:student_token');
      if (token == null || token.isEmpty) return false;

      final dio = ref.read(dioProvider);
      final response = await dio.get('/api/student/login');
      final studentJson = response.data['student'] as Map<String, dynamic>;

      state = StudentProfile(
        id: studentJson['id'] as String? ?? '',
        displayName: studentJson['nickname'] as String? ?? 'Bạn nhỏ',
        age: studentJson['age'] as int? ?? 10,
        level: studentJson['level'] as int? ?? 1,
        totalPoints: studentJson['xp'] as int? ?? 0,
        streakDays: 5,
        unlockedSkills: [],
      );
      return true;
    } catch (_) {
      await logout();
      return false;
    }
  }

  Future<void> login(String studentCode, String password) async {
    final dio = ref.read(dioProvider);
    final response = await dio.post(
      '/api/student/login',
      data: {'student_code': studentCode, 'password': password},
    );
    debugPrint('ℹ️ ${response.data}');
    final String token = response.data['token'] as String;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('bats:student_token', token);

    final infoRes = await dio.get('/api/student/login');
    final studentJson = infoRes.data['student'] as Map<String, dynamic>;

    state = StudentProfile(
      id: studentJson['id'] as String? ?? '',
      displayName: studentJson['nickname'] as String? ?? 'Bạn nhỏ',
      age: studentJson['age'] as int? ?? 10,
      level: studentJson['level'] as int? ?? 1,
      totalPoints: studentJson['xp'] as int? ?? 0,
      streakDays: 5,
      unlockedSkills: [],
    );
  }

  void loginLocal(String displayName, int age) {
    state = StudentProfile(
      id: 'student_demo_01',
      displayName: displayName,
      age: age,
      level: 1,
      totalPoints: 0,
      streakDays: 5,
      unlockedSkills: [],
    );
  }

  void skipOnboarding() {
    state = const StudentProfile(
      id: 'student_demo_01',
      displayName: 'Sơn',
      age: 10,
      level: 3,
      totalPoints: 1250,
      streakDays: 5,
      unlockedSkills: ['Nhận diện link lừa đảo', 'Bảo vệ thông tin cá nhân'],
    );
  }

  Future<void> addPoints(int points) async {
    if (state == null) return;

    // Optimistic local update
    final int nextPoints = state!.totalPoints + points;
    final int nextLevel = (nextPoints ~/ 500) + 1;
    state = state!.copyWith(
      totalPoints: nextPoints,
      level: nextLevel > state!.level ? nextLevel : state!.level,
    );

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('bats:student_token');
      if (token != null && token.isNotEmpty) {
        final dio = ref.read(dioProvider);
        final response = await dio.post(
          '/api/student/progress',
          data: {'xp': points, 'source': 'simulation_chat'},
        );
        if (response.statusCode == 200) {
          final stats = response.data['stats'] as Map<String, dynamic>?;
          if (stats != null) {
            final serverXp = stats['total_xp'] as int? ?? nextPoints;
            final serverLevel = stats['level'] as int? ?? nextLevel;
            state = state!.copyWith(totalPoints: serverXp, level: serverLevel);
          }
        }
      }
    } catch (_) {
      // Offline fallback
    }
  }

  void applyServerStats(Map<String, dynamic>? stats, {int fallbackXp = 0}) {
    if (state == null) return;

    final serverXp = stats?['total_xp'] as int?;
    final serverLevel = stats?['level'] as int?;
    if (serverXp != null || serverLevel != null) {
      state = state!.copyWith(
        totalPoints: serverXp ?? state!.totalPoints,
        level: serverLevel ?? state!.level,
      );
      return;
    }

    if (fallbackXp > 0) {
      final nextPoints = state!.totalPoints + fallbackXp;
      final nextLevel = (nextPoints ~/ 500) + 1;
      state = state!.copyWith(
        totalPoints: nextPoints,
        level: nextLevel > state!.level ? nextLevel : state!.level,
      );
    }
  }

  void unlockSkill(String skillName) {
    if (state == null) return;
    if (state!.unlockedSkills.contains(skillName)) return;
    state = state!.copyWith(
      unlockedSkills: [...state!.unlockedSkills, skillName],
    );
  }

  Future<void> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('bats:student_token');
    } catch (_) {}
    state = null;
  }
}

final studentProfileProvider =
    NotifierProvider<StudentProfileNotifier, StudentProfile?>(() {
      return StudentProfileNotifier();
    });
