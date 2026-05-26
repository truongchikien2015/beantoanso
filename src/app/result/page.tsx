"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultScreen } from "../../components/ResultScreen";
import { Certificate } from "../../components/Certificate";
import { useAppStore } from "../../lib/globalStore";
import { Header } from "../../components/Header";
import { totalXpForPlayer } from "../../lib/xp";
import { supabase } from "../../lib/supabase";
import { Results } from "../../lib/store";

export default function ResultPage() {
  const router = useRouter();
  const [showCert, setShowCert] = useState(false);
  
  const nickname = useAppStore((state) => state.nickname);
  const playerId = useAppStore((state) => state.playerId);
  const profileXp = useAppStore((state) => state.profileXp);
  const missionResults = useAppStore((state) => state.missionResults);
  const quiz = useAppStore((state) => state.quiz);
  const lastResultId = useAppStore((state) => state.lastResultId);

  const missionScore = Object.values(missionResults).reduce((s, r) => s + r.score, 0);
  const totalScore = missionScore + (quiz?.score ?? 0);

  useEffect(() => {
    if (!nickname || !quiz) {
      router.push("/");
    }
  }, [nickname, quiz, router]);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    useAppStore.getState().logout();
    router.push("/");
  };

  if (!nickname || !quiz) return null;

  if (showCert) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-pink-50 to-amber-50">
        <Certificate
          nickname={nickname}
          totalScore={totalScore}
          onBack={() => setShowCert(false)}
        />
      </div>
    );
  }

  return (
    <>
      <Header
        nickname={nickname}
        totalScore={totalScore}
        xp={profileXp || totalXpForPlayer(playerId)}
        onHome={() => router.push("/")}
        onLogout={handleLogout}
      />
      <ResultScreen
        nickname={nickname}
        missionScore={missionScore}
        missionsDone={Object.keys(missionResults).length}
        quizCorrect={quiz.correct}
        quizScore={quiz.score}
        quizTotal={quiz.total}
        rank={lastResultId ? Results.rankOf(lastResultId) : -1}
        resultId={lastResultId}
        onCertificate={() => setShowCert(true)}
        onLeaderboard={() => router.push("/leaderboard")}
        onReplay={() => {
          useAppStore.getState().resetProgress();
          router.push("/path-select");
        }}
      />
    </>
  );
}
