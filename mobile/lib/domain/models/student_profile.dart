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

  factory StudentProfile.fromJson(Map<String, dynamic> json) {
    return StudentProfile(
      id: json['id'] as String? ?? '',
      displayName: json['displayName'] as String? ?? 'Bạn nhỏ',
      age: json['age'] as int? ?? 8,
      level: json['level'] as int? ?? 1,
      totalPoints: json['totalPoints'] as int? ?? 0,
      streakDays: json['streakDays'] as int? ?? 0,
      unlockedSkills: (json['unlockedSkills'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'displayName': displayName,
      'age': age,
      'level': level,
      'totalPoints': totalPoints,
      'streakDays': streakDays,
      'unlockedSkills': unlockedSkills,
    };
  }

  StudentProfile copyWith({
    String? displayName,
    int? age,
    int? level,
    int? totalPoints,
    int? streakDays,
    List<String>? unlockedSkills,
  }) {
    return StudentProfile(
      id: id,
      displayName: displayName ?? this.displayName,
      age: age ?? this.age,
      level: level ?? this.level,
      totalPoints: totalPoints ?? this.totalPoints,
      streakDays: streakDays ?? this.streakDays,
      unlockedSkills: unlockedSkills ?? this.unlockedSkills,
    );
  }
}
