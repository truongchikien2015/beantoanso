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

  factory SafetyAnalysis.fromJson(Map<String, dynamic> json) {
    // Risk level mapping
    final String riskStr = json['riskLevel'] as String? ?? 'safe';
    RiskLevel level = RiskLevel.safe;
    if (riskStr == 'caution') level = RiskLevel.caution;
    if (riskStr == 'danger') level = RiskLevel.danger;

    // Risk types mapping
    final List<dynamic> typesList = json['riskTypes'] as List<dynamic>? ?? [];
    final List<RiskType> types = typesList.map((t) {
      final String val = t.toString().toLowerCase();
      if (val == 'scam') return RiskType.scam;
      if (val == 'otptheft') return RiskType.otpTheft;
      if (val == 'suspiciouslink') return RiskType.suspiciousLink;
      if (val == 'privacy') return RiskType.privacy;
      if (val == 'bullying') return RiskType.bullying;
      if (val == 'strangercontact') return RiskType.strangerContact;
      if (val == 'grooming') return RiskType.grooming;
      return RiskType.harmfulContent;
    }).toList();

    return SafetyAnalysis(
      riskLevel: level,
      riskScore: json['riskScore'] as int? ?? 0,
      riskTypes: types,
      childFriendlySummary: json['childFriendlySummary'] as String? ?? '',
      detectedSignals: (json['detectedSignals'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      recommendedActions: (json['recommendedActions'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      suggestNotifyAdult: json['suggestNotifyAdult'] as bool? ?? false,
      suggestOpenSos: json['suggestOpenSos'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'riskLevel': riskLevel.name,
      'riskScore': riskScore,
      'riskTypes': riskTypes.map((t) => t.name).toList(),
      'childFriendlySummary': childFriendlySummary,
      'detectedSignals': detectedSignals,
      'recommendedActions': recommendedActions,
      'suggestNotifyAdult': suggestNotifyAdult,
      'suggestOpenSos': suggestOpenSos,
    };
  }
}
