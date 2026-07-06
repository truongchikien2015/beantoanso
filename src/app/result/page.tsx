"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultScreen } from "../../components/ResultScreen";
import { Certificate } from "../../components/Certificate";
import { useAppStore } from "../../lib/globalStore";
import { totalXpForPlayer } from "../../lib/xp";
<<<<<<< HEAD
import { supabase } from "../../lib/supabase";
=======
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
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

<<<<<<< HEAD
  const handleLogout = async () => {
    await supabase?.auth.signOut();
=======
  const handleLogout = () => {
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
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
          resultId={lastResultId}
          onBack={() => setShowCert(false)}
        />
      </div>
    );
  }

  return (
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
  );
}
