"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LearningPathSelector } from "../../components/LearningPathSelector";
import { useAppStore } from "../../lib/globalStore";
import { Header } from "../../components/Header";
import { StudentChatbot } from "../../components/student/StudentChatbot";
import { totalXpForPlayer } from "../../lib/xp";
import { supabase } from "../../lib/supabase";
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
    }
  }, [nickname, router]);

  useEffect(() => {
    async function loadAssignedPath() {
      const token = getStudentToken();

      // Teacher-created student: has a student_token → load their assigned path.
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
          }
        } finally {
          setStudentLoading(false);
        }
        return;
      }

      // Self-registered student: authenticated via Supabase Auth (no student_token).
      // They also get the daily streak and AI chatbot.
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setIsSelfStudent(true);
        }
      }
      setStudentLoading(false);
    }

    loadAssignedPath();
  }, []);

  const handleSelectPath = (path: any) => {
    // We would need to set topics here, but let's pass path.id via query params
    // or store activePath in Zustand. Let's add activePath to Zustand!
    router.push(`/map?path=${path.id}`);
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    clearStudentToken();
    useAppStore.getState().logout();
    router.push("/");
  };

  if (!nickname) {
    return null;
  }

  // Show streak + AI chatbot for:
  //  - teacher-created students who have an assigned learning path, OR
  //  - self-registered students (Supabase Auth account).
  const showStudentFeatures = !!studentData?.assigned_path || isSelfStudent;

  return (
    <>
      <Header
        nickname={nickname}
        totalScore={totalScore}
        xp={profileXp || totalXpForPlayer(playerId)}
        onHome={() => router.push("/")}
        onLogout={handleLogout}
      />
      <LearningPathSelector
        nickname={studentData?.student.nickname ?? nickname}
        assignedPath={studentData?.assigned_path ?? null}
        assignedStudent={studentData?.student ?? null}
        assignedLoading={studentLoading}
        showDailyQuiz={showStudentFeatures}
        onOpenDailyQuiz={() => router.push("/student/daily")}
        onSelect={handleSelectPath}
        onSelectAssigned={() => router.push("/student/dashboard")}
        onBack={() => router.push("/")}
      />
      {showStudentFeatures && <StudentChatbot />}
    </>
  );
}
