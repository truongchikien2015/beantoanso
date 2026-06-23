"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MissionScreen } from "../../components/MissionScreen";
import { useAppStore } from "../../lib/globalStore";
import { totalXpForPlayer } from "../../lib/xp";
import { supabase } from "../../lib/supabase";

export default function MissionPage() {
  const router = useRouter();
  
  const nickname = useAppStore((state) => state.nickname);
  const playerId = useAppStore((state) => state.playerId);
  const profileXp = useAppStore((state) => state.profileXp);
  const missionResults = useAppStore((state) => state.missionResults);
  const quiz = useAppStore((state) => state.quiz);
  
  const activeTopic = useAppStore((state) => state.activeTopic);
  const activeQuestion = useAppStore((state) => state.activeQuestion);
  const activePath = useAppStore((state) => state.activePath);
  const setMissionResult = useAppStore((state) => state.setMissionResult);
  const setActiveTopic = useAppStore((state) => state.setActiveTopic);
  const setActiveQuestion = useAppStore((state) => state.setActiveQuestion);
  const isReturningToMap = useRef(false);

  const missionScore = Object.values(missionResults).reduce((s, r) => s + r.score, 0);
  const totalScore = missionScore + (quiz?.score ?? 0);

  useEffect(() => {
    if (isReturningToMap.current) return;

    if (!nickname || !activeTopic || !activeQuestion) {
      router.push("/");
    }
  }, [nickname, activeTopic, activeQuestion, router]);

  const mapHref = activePath?.id ? `/map?path=${activePath.id}` : "/map";

  const handleFinishMission = (score: number, correct: boolean) => {
    if (!activeTopic) return;
    isReturningToMap.current = true;
    setMissionResult(activeTopic.id, { score, correct });
    setActiveTopic(null);
    setActiveQuestion(null);
    router.push(mapHref);
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    useAppStore.getState().logout();
    router.push("/");
  };

  if (!nickname || !activeTopic || !activeQuestion) return null;

  return (
    <MissionScreen
      topic={activeTopic}
      question={activeQuestion}
      onFinish={handleFinishMission}
      onBack={() => {
        isReturningToMap.current = true;
        setActiveTopic(null);
        setActiveQuestion(null);
        router.push(mapHref);
      }}
    />
  );
}
