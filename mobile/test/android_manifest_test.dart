import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('release Android manifest declares internet permission', () {
    final manifest = File(
      'android/app/src/main/AndroidManifest.xml',
    ).readAsStringSync();

    expect(
      manifest,
      contains('android.permission.INTERNET'),
      reason: 'Release builds need network access for student login API calls.',
    );
  });
}
