import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/data/repositories/safety_repository.dart';

void main() {
  test('getLearningPaths parses the API data array exactly', () async {
    final repository = SafetyRepository(
      _dioWithResponses({
        '/api/student/learning-paths': {
          'data': [
            {
              'id': '6a38a64c6052faa14296e329',
              'title': 'Cơ bản',
              'description': 'Cơ bản',
              'topic_ids': ['6a37fd655f70efbc84b0cf55'],
              'is_active': true,
            },
          ],
        },
      }),
      useMock: false,
    );

    final paths = await repository.getLearningPaths();

    expect(paths, hasLength(1));
    expect(paths.first['title'], 'Cơ bản');
    expect(paths.first['description'], 'Cơ bản');
    expect(paths.first['topic_ids'], ['6a37fd655f70efbc84b0cf55']);
  });

  test(
    'getStepContent does not replace empty API questions with demo data',
    () async {
      final repository = SafetyRepository(
        _dioWithResponses({
          '/api/student/steps/topic-1': {
            'step_id': 'topic-1',
            'path_id': 'path-1',
            'step_type': 'topic',
            'topic_id': 'topic-1',
            'question_set_id': null,
            'step_order': 1,
            'questions': [],
            'question_count': 0,
          },
        }),
        useMock: false,
      );

      final step = await repository.getStepContent('topic-1');

      expect(step['questions'], isEmpty);
      expect(step['question_count'], 0);
    },
  );

  test('real API mode surfaces learning path request failures', () async {
    final repository = SafetyRepository(
      _dioWithResponses({}, statusCode: 500),
      useMock: false,
    );

    expect(repository.getLearningPaths(), throwsA(isA<DioException>()));
  });
}

Dio _dioWithResponses(Map<String, Object?> responses, {int statusCode = 200}) {
  return Dio(BaseOptions(baseUrl: 'http://localhost:3000'))
    ..httpClientAdapter = _FakeAdapter(responses, statusCode);
}

class _FakeAdapter implements HttpClientAdapter {
  final Map<String, Object?> responses;
  final int statusCode;

  _FakeAdapter(this.responses, this.statusCode);

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final body = responses[options.path] ?? {'error': 'not found'};
    return ResponseBody.fromString(
      jsonEncode(body),
      statusCode,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
