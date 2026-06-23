"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuizScreen } from "../../components/QuizScreen";
import { useAppStore } from "../../lib/globalStore";
import { totalXpForPlayer } from "../../lib/xp";
import { getBadge } from "../../data/gameData";
import { Results, FinalResult } from "../../lib/store";

export default function QuizPage() {
  const router = useRouter();
  
  const nickname = useAppStore((state) => state.nickname);
  const playerId = useAppStore((state) => state.playerId);
  const profileXp = useAppStore((state) => state.profileXp);
  const missionResults = useAppStore((state) => state.missionResults);
  const setQuiz = useAppStore((state) => state.setQuiz);
  const setLastResultId = useAppStore((state) => state.setLastResultId);
  const setProfileXp = useAppStore((state) => state.setProfileXp);

  const missionScore = Object.values(missionResults).reduce((s, r) => s + r.score, 0);

  useEffect(() => {
    if (!nickname) {
      router.push("/");
    }
  }, [nickname, router]);

  const handleFinishQuiz = async (correct: number, score: number, total: number) => {
    setQuiz({ correct, score, total });
    const total_score = missionScore + score;
    const badge = getBadge(total_score);
    
    const saved: FinalResult = Results.add({
      player_id: playerId,
      nickname,
      mission_score: missionScore,
      quiz_score: score,
      total_score,
      title: badge.title,
      badge: badge.emoji,
    });
    setLastResultId(saved.id);

    try {
      const res = await fetch("/api/student/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: saved.id,
          player_id: saved.player_id,
          nickname: saved.nickname,
          mission_score: saved.mission_score,
          quiz_score: saved.quiz_score,
          total_score: saved.total_score,
          title: saved.title,
          badge: saved.badge,
        }),
      });
      if (!res.ok) {
        console.warn("Failed to publish share result");
      }
    } catch (err) {
      console.warn("Failed to publish share result:", err);
    }

    // Sync XP to MongoDB for logged in students
    const token = typeof window !== "undefined" ? localStorage.getItem("student_token") : null;
    if (token) {
      try {
        const res = await fetch("/api/student/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ xp: total_score, source: "quiz" }),
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.stats) {
          setProfileXp(body.stats.total_xp);
        }
      } catch (err) {
        console.error("Failed to sync progress:", err);
      }
    }

    router.push("/result");
  };

  const handleLogout = async () => {
    localStorage.removeItem("student_token");
    useAppStore.getState().logout();
    router.push("/");
  };

  if (!nickname) return null;

  return (
    <QuizScreen onFinish={handleFinishQuiz} />
  );
}
