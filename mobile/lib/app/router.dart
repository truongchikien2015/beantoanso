import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/home/home_screen.dart';
import '../features/onboarding/login_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/simulation/simulation_screen.dart';
import '../features/safety_scan/safety_scan_screen.dart';
import '../features/ai_assistant/ai_assistant_screen.dart';
import '../features/sos/sos_screen.dart';
import '../features/passport/passport_screen.dart';
import '../core/constants/app_colors.dart';

import '../features/simulation/learn_screen.dart';
import '../features/simulation/learning_path_detail_screen.dart';
import '../features/simulation/quiz_screen.dart';

// Key for root navigator
final rootNavigatorKey = GlobalKey<NavigatorState>();

// Router Config
final router = GoRouter(
  initialLocation: '/login',
  navigatorKey: rootNavigatorKey,
  routes: [
    // 1. Login Screen
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    // 2. Onboarding Screen
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    // 3. SOS Screen (No Navbar)
    GoRoute(
      path: '/sos',
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state) => const SosScreen(),
    ),
    // 4. AI Assistant Screen (No Navbar)
    GoRoute(
      path: '/assistant',
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state) => const AiAssistantScreen(),
    ),
    // 5. Simulation Screen (No Navbar)
    GoRoute(
      path: '/simulation/:scenarioId',
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state) {
        final scenarioId = state.pathParameters['scenarioId'] ?? '';
        return SimulationScreen(scenarioId: scenarioId);
      },
    ),
    // 7. Learning Path Detail Screen (No Navbar)
    GoRoute(
      path: '/learning-path/:pathId',
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state) {
        final pathId = state.pathParameters['pathId'] ?? '';
        return LearningPathDetailScreen(pathId: pathId);
      },
    ),
    // 8. Quiz Screen (No Navbar)
    GoRoute(
      path: '/quiz/:stepId',
      parentNavigatorKey: rootNavigatorKey,
      builder: (context, state) {
        final stepId = state.pathParameters['stepId'] ?? '';
        return QuizScreen(stepId: stepId);
      },
    ),
    
    // 6. Navigation Shell (Main Screens)
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ScaffoldWithNavBar(navigationShell: navigationShell);
      },
      branches: [
        // Tab 1: Trang chủ
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        // Tab 2: Luyện kỹ năng (Scenario list)
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/learn',
              builder: (context, state) => const LearnScreen(),
            ),
          ],
        ),
        // Tab 3: Quét nguy hiểm
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/scan',
              builder: (context, state) => const SafetyScanScreen(),
            ),
          ],
        ),
        // Tab 4: Hồ sơ / Passport
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/passport',
              builder: (context, state) => const PassportScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);

// Shell Widget holding the Navigation Bar and Red SOS overlay
class ScaffoldWithNavBar extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const ScaffoldWithNavBar({
    required this.navigationShell,
    super.key,
  });

  void _goBranch(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          navigationShell,
          // Fixed Floating SOS Warning button on the bottom right (Contextual)
          Positioned(
            bottom: 90,
            right: 16,
            child: FloatingActionButton(
              heroTag: 'sos_fab',
              backgroundColor: AppColors.error,
              foregroundColor: AppColors.onError,
              shape: const CircleBorder(),
              elevation: 4,
              onPressed: () => context.push('/sos'),
              child: const Text(
                'SOS',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: AppColors.surfaceVariant, width: 4),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: navigationShell.currentIndex,
          onTap: _goBranch,
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppColors.surfaceContainer,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.onSurfaceVariant,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 11),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home),
              label: 'Trang chủ',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.school),
              label: 'Kỹ năng',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.security),
              label: 'Quét nguy hiểm',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person),
              label: 'Hồ sơ',
            ),
          ],
        ),
      ),
    );
  }
}
