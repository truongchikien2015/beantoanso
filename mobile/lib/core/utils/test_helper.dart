import 'dart:io';

class TestHelper {
  static bool get isTesting {
    try {
      return Platform.environment.containsKey('FLUTTER_TEST');
    } catch (_) {
      return false; // fallback for web or other environments where Platform.environment is unsupported
    }
  }
}
