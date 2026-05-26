"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuizScreen } from "../../components/QuizScreen";
import { useAppStore } from "../../lib/globalStore";
import { Header } from "../../components/Header";
import { totalXpForPlayer } from "../../lib/xp";
import { supabase } from "../../lib/supabase";
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
      const { error } =
        (await supabase?.from("results").upsert(saved, { onConflict: "id" })) ??
        {};
      if (error) {
        console.warn("Failed to publish share result:", error);
      }
    } catch (err) {
      console.warn("Failed to publish share result:", err);
    }

    // Sync XP to Supabase for logged in members
    supabase?.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user;
      if (user) {
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (profile) {
            const newXp = (profile.xp || 0) + total_score;
            const newLevel = Math.floor(newXp / 100) + 1;
            const newTotalScore = (profile.total_score || 0) + total_score;

            await supabase.from('profiles').update({
              xp: newXp,
              level: newLevel,
              total_score: newTotalScore,
              updated_at: new Date().toISOString()
            }).eq('id', user.id);
            setProfileXp(newXp);
          }
        } catch (err) {
          console.error("Failed to sync progress:", err);
        }
      }
    });

    router.push("/result");
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    useAppStore.getState().logout();
    router.push("/");
  };

  if (!nickname) return null;

  return (
    <>
      <Header
        nickname={nickname}
        totalScore={missionScore}
        xp={profileXp || totalXpForPlayer(playerId)}
        onHome={() => router.push("/")}
        onLogout={handleLogout}
      />
      <QuizScreen onFinish={handleFinishQuiz} />
    </>
  );
}
