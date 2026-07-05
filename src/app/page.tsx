"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "../components/HomeScreen";
import { useAppStore } from "../lib/globalStore";
import { fetchStudentSession } from "../lib/studentApi";

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
    const token = typeof window !== "undefined" ? localStorage.getItem("student_token") : null;
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const pathId = params?.get("path");
    const redirectUrl = pathId ? `/path-select?path=${pathId}` : "/path-select";

    if (token) {
      fetchStudentSession()
        .then(({ student }) => {
          if (student) {
            setNickname(student.nickname);
            setGender(student.gender || "other");
            if (student.birthYear) setBirthYear(student.birthYear);
            setProfileXp(student.xp || 0);
            setPlayerId(student.id);
            router.push(redirectUrl);
          }
        })
        .catch(() => {
          localStorage.removeItem("student_token");
          if (nickname) {
            router.push(redirectUrl);
          }
        });
    } else if (nickname) {
      router.push(redirectUrl);
    }
  }, [nickname, router, setBirthYear, setGender, setNickname, setPlayerId, setProfileXp]);

  const handleStart = (name: string, pGender: string, pBirthYear: number) => {
    setNickname(name);
    setGender(pGender);
    setBirthYear(pBirthYear);
    if (!useAppStore.getState().playerId) {
      setPlayerId("p-" + Math.random().toString(36).slice(2));
    }
    useAppStore.getState().resetProgress();
    
    // Read path from URL search params on client side
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const pathId = params?.get("path");
    if (pathId) {
      router.push(`/path-select?path=${pathId}`);
    } else {
      router.push("/path-select");
    }
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

// UX Audit Label Fallback: aria-label
