"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { JourneyMap } from "../../components/JourneyMap";
import { useAppStore } from "../../lib/globalStore";
import { Header } from "../../components/Header";
import { totalXpForPlayer } from "../../lib/xp";
import { supabase } from "../../lib/supabase";

function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathId = searchParams?.get("path");

  const nickname = useAppStore((state) => state.nickname);
  const playerId = useAppStore((state) => state.playerId);
  const profileXp = useAppStore((state) => state.profileXp);
  const missionResults = useAppStore((state) => state.missionResults);
  const quiz = useAppStore((state) => state.quiz);

  const topics = useAppStore((state) => state.topics);
  const activePath = useAppStore((state) => state.activePath);
  const setTopics = useAppStore((state) => state.setTopics);
  const setActivePath = useAppStore((state) => state.setActivePath);
  const setActiveTopic = useAppStore((state) => state.setActiveTopic);
  const setActiveQuestion = useAppStore((state) => state.setActiveQuestion);

  const missionScore = Object.values(missionResults).reduce((s, r) => s + r.score, 0);
  const totalScore = missionScore + (quiz?.score ?? 0);

  useEffect(() => {
    if (!nickname) {
      router.push("/");
      return;
    }

    if (pathId && (!activePath || activePath.id !== pathId)) {
      if (!supabase) return;

      Promise.all([
        supabase.from('learning_paths').select('*').eq('id', pathId).single(),
        supabase.from('topics').select('*').eq('is_active', true)
      ]).then(([pathRes, topicsRes]) => {
        if (pathRes.data && topicsRes.data) {
          setActivePath(pathRes.data);
          const filtered = topicsRes.data.filter((t: any) => pathRes.data.topic_ids.includes(t.id));
          const ordered = pathRes.data.topic_ids
            .map((id: string) => filtered.find((t: any) => t.id === id))
            .filter(Boolean);
          setTopics(ordered.length > 0 ? ordered : filtered);
        }
      });
    }
  }, [nickname, pathId, activePath, router, setActivePath, setTopics]);

  const handlePickMission = async (topicId: string) => {
    const topic = topics.find((t: any) => t.id === topicId);
    if (!topic) return;

    const birthYear = useAppStore.getState().birthYear;
    const gender = useAppStore.getState().gender;
    const currentYear = new Date().getFullYear();
    const age = birthYear ? currentYear - birthYear : 99;
    const userGender = gender || 'all';

    if (!supabase) {
      alert("Chưa kết nối Supabase nên chưa thể tải câu hỏi.");
      return;
    }

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_slug', topic.slug)
      .lte('min_age', age)
      .gte('max_age', age)
      .in('target_gender', ['all', userGender]);

    if (error) {
      alert(`Lỗi khi lấy câu hỏi: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      const randomQ = data[Math.floor(Math.random() * data.length)];
      setActiveTopic(topic);
      setActiveQuestion(randomQ);
      router.push("/mission");
    } else {
      const { data: fallbackData } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_slug', topic.slug);

      if (fallbackData && fallbackData.length > 0) {
        const randomQ = fallbackData[Math.floor(Math.random() * fallbackData.length)];
        setActiveTopic(topic);
        setActiveQuestion(randomQ);
        router.push("/mission");
      } else {
        alert(`Chưa có câu hỏi cho chủ đề: ${topic.label}`);
      }
    }
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    useAppStore.getState().logout();
    router.push("/");
  };

  if (!nickname || (!topics.length && pathId)) return null;

  return (
    <>
      <Header
        nickname={nickname}
        totalScore={totalScore}
        xp={profileXp || totalXpForPlayer(playerId)}
        onHome={() => router.push("/")}
        onLogout={handleLogout}
      />
      <JourneyMap
        topics={topics}
        results={missionResults}
        onPickMission={handlePickMission}
        onGoQuiz={() => router.push("/quiz")}
      />
    </>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-lg font-bold text-sky-600">Đang tải...</div>
    </div>}>
      <MapPageContent />
    </Suspense>
  );
}
