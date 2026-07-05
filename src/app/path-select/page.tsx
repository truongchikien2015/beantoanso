"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LearningPathSelector } from "../../components/LearningPathSelector";
import { useAppStore } from "../../lib/globalStore";
import { StudentChatbot } from "../../components/student/StudentChatbot";
import { totalXpForPlayer, levelInfo } from "../../lib/xp";
import { clearStudentToken, getStudentToken } from "../../lib/studentApi";
import type { StudentDashboardData } from "../../types/teacher-content";

export default function PathSelectPage() {
  const router = useRouter();
  const nickname = useAppStore((state) => state.nickname);
  const playerId = useAppStore((state) => state.playerId);
  const profileXp = useAppStore((state) => state.profileXp);
  const missionResults = useAppStore((state) => state.missionResults);
  const quiz = useAppStore((state) => state.quiz);
  const [studentData, setStudentData] = useState<StudentDashboardData | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [isSelfStudent, setIsSelfStudent] = useState(false);

  const missionScore = Object.values(missionResults).reduce((s, r) => s + r.score, 0);
  const totalScore = missionScore + (quiz?.score ?? 0);

  useEffect(() => {
    if (!nickname) {
      router.push("/");
    } else if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pathId = params.get("path");
      if (pathId) {
        router.push(`/map?path=${pathId}`);
      }
    }
  }, [nickname, router]);

  useEffect(() => {
    async function loadAssignedPath() {
      const token = getStudentToken();

      if (token) {
        try {
          const res = await fetch(`/api/student/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.status === 401) {
            clearStudentToken();
            setStudentData(null);
            return;
          }

          if (res.ok) {
            const data: StudentDashboardData = await res.json();
            setStudentData(data);
            if (data.student.student_code === "" || data.student.class_name === "Tự do") {
              setIsSelfStudent(true);
            }
          }
        } catch (err) {
          console.error("Lỗi khi tải dữ liệu học sinh:", err);
        } finally {
          setStudentLoading(false);
        }
        return;
      }

      setStudentLoading(false);
    }

    loadAssignedPath();
  }, []);

  const handleSelectPath = (path: any) => {
    router.push(`/map?path=${path.id}`);
  };

  const handleLogout = async () => {
    clearStudentToken();
    useAppStore.getState().logout();
    router.push("/");
  };

  if (!nickname) {
    return null;
  }

  const showStudentFeatures = !!(studentData?.assigned_paths && studentData.assigned_paths.length > 0) || isSelfStudent;

  const rewardXp = studentData?.stats?.total_xp ?? 0;
  const headerTotalScore = rewardXp || totalScore;
  const headerXp = rewardXp ? 0 : (profileXp || totalXpForPlayer(playerId));

  const guestLevel = levelInfo(headerTotalScore + headerXp).level;
  const playerLevel = studentData?.stats?.level ?? guestLevel;
  const playerXp = studentData?.stats?.total_xp ?? (headerTotalScore + headerXp);
  const currentStreak = studentData?.stats?.current_streak ?? 0;
  const longestStreak = studentData?.stats?.longest_streak ?? 0;

  return (
    <>
      <LearningPathSelector
        nickname={studentData?.student.nickname ?? nickname}
        assignedPath={(studentData?.assigned_paths && studentData.assigned_paths.length > 0) ? studentData.assigned_paths[0] : null}
        assignedPaths={studentData?.assigned_paths ?? []}
        assignedStudent={studentData?.student ?? null}
        assignedLoading={studentLoading}
        showDailyQuiz={showStudentFeatures}
        onOpenDailyQuiz={() => router.push("/student/daily")}
        onSelect={handleSelectPath}
        onSelectAssigned={(path) => router.push(`/student/dashboard?view=1&path=${path?.id ?? ""}`)}
        onBack={() => router.push("/")}
        onSelectChatSim={() => router.push("/chat-sim")}
        onSelectEmailSim={() => router.push("/email-sim")}
        onSelectClassify={() => router.push("/classify")}
        playerLevel={playerLevel}
        playerXp={playerXp}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        onLogout={handleLogout}
      />
      {showStudentFeatures && <StudentChatbot />}
    </>
  );
}
