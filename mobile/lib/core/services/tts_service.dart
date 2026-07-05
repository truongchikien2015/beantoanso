import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  TtsService._privateConstructor();
  static final TtsService instance = TtsService._privateConstructor();

  final FlutterTts _flutterTts = FlutterTts();
  bool _isInitialized = false;

  Future<void> init() async {
    if (_isInitialized) return;
    try {
      await _flutterTts.setLanguage("vi-VN");
      await _flutterTts.setSpeechRate(0.85); // slightly slower, readable for kids
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.1); // friendly high pitch for Cú Cú Mascot
      _isInitialized = true;
    } catch (e) {
      debugPrint("Failed to initialize TTS: $e");
    }
  }

  Future<void> speak(String text) async {
    if (text.isEmpty) return;
    await init();
    try {
      await _flutterTts.stop();
      await _flutterTts.speak(text);
    } catch (e) {
      debugPrint("TTS error: $e");
    }
  }

  Future<void> stop() async {
    try {
      await _flutterTts.stop();
    } catch (e) {
      debugPrint("TTS stop error: $e");
    }
  }
}
