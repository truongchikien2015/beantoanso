import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTextStyles {
  static TextStyle get displayLarge => GoogleFonts.beVietnamPro(
        fontSize: 48,
        fontWeight: FontWeight.w800,
        height: 1.1,
        letterSpacing: -0.96,
        color: AppColors.onSurface,
      );

  static TextStyle get displayMobile => GoogleFonts.beVietnamPro(
        fontSize: 32,
        fontWeight: FontWeight.w800,
        height: 1.2,
        letterSpacing: -0.32,
        color: AppColors.onSurface,
      );

  static TextStyle get headlineLarge => GoogleFonts.beVietnamPro(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        height: 1.2,
        color: AppColors.onSurface,
      );

  static TextStyle get headlineMedium => GoogleFonts.beVietnamPro(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        height: 1.3,
        color: AppColors.onSurface,
      );

  static TextStyle get bodyLarge => GoogleFonts.beVietnamPro(
        fontSize: 18,
        fontWeight: FontWeight.w500,
        height: 1.6,
        color: AppColors.onSurface,
      );

  static TextStyle get bodyMedium => GoogleFonts.beVietnamPro(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.6,
        color: AppColors.onSurface,
      );

  static TextStyle get labelBold => GoogleFonts.beVietnamPro(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        height: 1.0,
        color: AppColors.onSurface,
      );

  static TextStyle get labelMedium => GoogleFonts.beVietnamPro(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.0,
        color: AppColors.onSurface,
      );
}
