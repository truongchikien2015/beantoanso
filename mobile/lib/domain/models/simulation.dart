class SimulationChoice {
  final String id;
  final String label;
  final bool isSafe;
  final String feedback;
  final int pointDelta;

  const SimulationChoice({
    required this.id,
    required this.label,
    required this.isSafe,
    required this.feedback,
    required this.pointDelta,
  });

  factory SimulationChoice.fromJson(Map<String, dynamic> json) {
    return SimulationChoice(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      isSafe: json['isSafe'] as bool? ?? false,
      feedback: json['feedback'] as String? ?? '',
      pointDelta: json['pointDelta'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'isSafe': isSafe,
      'feedback': feedback,
      'pointDelta': pointDelta,
    };
  }
}

class SimulationStep {
  final String senderName;
  final String message;
  final List<SimulationChoice> choices;

  const SimulationStep({
    required this.senderName,
    required this.message,
    required this.choices,
  });

  factory SimulationStep.fromJson(Map<String, dynamic> json) {
    final List<dynamic> choicesList = json['choices'] as List<dynamic>? ?? [];
    final List<SimulationChoice> parsedChoices =
        choicesList.map((c) => SimulationChoice.fromJson(c as Map<String, dynamic>)).toList();

    return SimulationStep(
      senderName: json['senderName'] as String? ?? '',
      message: json['message'] as String? ?? '',
      choices: parsedChoices,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'senderName': senderName,
      'message': message,
      'choices': choices.map((c) => c.toJson()).toList(),
    };
  }
}

class SimulationScenario {
  final String id;
  final String title;
  final List<SimulationStep> steps;

  const SimulationScenario({
    required this.id,
    required this.title,
    required this.steps,
  });

  factory SimulationScenario.fromJson(Map<String, dynamic> json) {
    final List<dynamic> stepsList = json['steps'] as List<dynamic>? ?? [];
    final List<SimulationStep> parsedSteps =
        stepsList.map((s) => SimulationStep.fromJson(s as Map<String, dynamic>)).toList();

    return SimulationScenario(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      steps: parsedSteps,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'steps': steps.map((s) => s.toJson()).toList(),
    };
  }
}
