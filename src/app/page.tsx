"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "../components/HomeScreen";
import { useAppStore } from "../lib/globalStore";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const setNickname = useAppStore((state) => state.setNickname);
  const setGender = useAppStore((state) => state.setGender);
  const setBirthYear = useAppStore((state) => state.setBirthYear);
  const setPlayerId = useAppStore((state) => state.setPlayerId);
  const setProfileXp = useAppStore((state) => state.setProfileXp);
  const setMissionResult = useAppStore((state) => state.setMissionResult);
  const setQuiz = useAppStore((state) => state.setQuiz);
  const setLastResultId = useAppStore((state) => state.setLastResultId);

  const nickname = useAppStore((state) => state.nickname);

  useEffect(() => {
    if (!supabase) {
      if (nickname) {
        router.push("/path-select");
      }
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data: profile }) => {
          setNickname(profile?.full_name || session.user.email);
          setGender(profile?.gender || "other");
          if (profile?.birth_year) setBirthYear(profile.birth_year);
          setProfileXp(profile?.xp || 0);
          setPlayerId(session.user.id);
          router.push("/path-select");
        });
      } else if (nickname) {
        router.push("/path-select");
      }
    });
  }, [nickname, router, setBirthYear, setGender, setNickname, setPlayerId, setProfileXp]);

  const handleStart = (name: string, pGender: string, pBirthYear: number) => {
    setNickname(name);
    setGender(pGender);
    setBirthYear(pBirthYear);
    if (!useAppStore.getState().playerId) {
      setPlayerId("p-" + Math.random().toString(36).slice(2));
    }
    useAppStore.getState().resetProgress();
    router.push("/path-select");
  };

  return (
    <HomeScreen
      onStart={handleStart}
      onLeaderboard={() => router.push("/leaderboard")}
      onAdmin={() => router.push("/admin")}
      onLessons={() => router.push("/lessons")}
      onDaily={() => router.push("/daily")}
      onClassify={() => router.push("/classify")}
      onTeacher={() => router.push("/teacher")}
    />
  );
}
