"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { JourneyMap } from "../../components/JourneyMap";
import { useAppStore } from "../../lib/globalStore";

function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathId = searchParams?.get("path");
  const [pathLoadState, setPathLoadState] = useState<"idle" | "loading" | "ready" | "missing" | "error">("idle");
  const [pathLoadMessage, setPathLoadMessage] = useState("");

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

  useEffect(() => {
    if (!nickname) {
      router.push(pathId ? `/?path=${pathId}` : "/");
      return;
    }

    if (pathId && (!activePath || activePath.id !== pathId)) {
      let cancelled = false;
      setPathLoadState("loading");
      setPathLoadMessage("");

      Promise.all([
        fetch("/api/student/learning-paths").then((res) => {
          if (!res.ok) throw new Error(`Không tải được khóa học (${res.status})`);
          return res.json();
        }),
        fetch("/api/student/topics").then((res) => {
          if (!res.ok) throw new Error(`Không tải được chủ đề (${res.status})`);
          return res.json();
        })
      ]).then(([pathsRes, topicsRes]) => {
        if (cancelled) return;

        const paths = Array.isArray(pathsRes.data) ? pathsRes.data : [];
        const foundPath = paths.find((p: any) => p.id === pathId) ?? paths[0];
        const topicsList = Array.isArray(topicsRes) ? topicsRes : (topicsRes.data || []);

        if (foundPath && topicsList.length > 0) {
          setActivePath(foundPath);
          const filtered = topicsList.filter((t: any) => foundPath.topic_ids.includes(t.id));
          const ordered = foundPath.topic_ids
            .map((id: string) => filtered.find((t: any) => t.id === id))
            .filter(Boolean);
          setTopics(ordered.length > 0 ? ordered : filtered);

          if (foundPath.id !== pathId) {
            router.replace(`/map?path=${foundPath.id}`);
          }

          setPathLoadState("ready");
          return;
        }

        setPathLoadState("missing");
        setPathLoadMessage("Chưa tìm thấy khóa học hoặc chủ đề phù hợp.");
      }).catch((err: any) => {
        if (cancelled) return;
        setPathLoadState("error");
        setPathLoadMessage(err?.message || "Không tải được bản đồ hành trình.");
      });

      return () => {
        cancelled = true;
      };
    }

    if (!pathId || topics.length > 0) {
      setPathLoadState("ready");
      setPathLoadMessage("");
    }
  }, [nickname, pathId, activePath, router, setActivePath, setTopics, topics.length]);

  const handlePickMission = async (topicId: string) => {
    const topic = topics.find((t: any) => t.id === topicId);
    if (!topic) return;

    const birthYear = useAppStore.getState().birthYear;
    const gender = useAppStore.getState().gender;
    const currentYear = new Date().getFullYear();
    const age = birthYear ? currentYear - birthYear : 99;
    const userGender = gender || 'all';

    try {
      const res = await fetch(`/api/student/questions?topic_slug=${topic.slug}&age=${age}&gender=${userGender}`);
      let questions = await res.json();
      if (!res.ok || !Array.isArray(questions)) {
        questions = [];
      }

      if (questions.length > 0) {
        const randomQ = questions[Math.floor(Math.random() * questions.length)];
        setActiveTopic(topic);
        setActiveQuestion(randomQ);
        router.push("/mission");
      } else {
        // Fallback: load any question for this topic
        const fallbackRes = await fetch(`/api/student/questions?topic_slug=${topic.slug}`);
        let fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && Array.isArray(fallbackData) && fallbackData.length > 0) {
          const randomQ = fallbackData[Math.floor(Math.random() * fallbackData.length)];
          setActiveTopic(topic);
          setActiveQuestion(randomQ);
          router.push("/mission");
        } else {
          alert(`Chưa có câu hỏi cho chủ đề: ${topic.label}`);
        }
      }
    } catch (err: any) {
      alert(`Lỗi khi lấy câu hỏi: ${err.message}`);
    }
  };

  if (!nickname) return null;

  if (!topics.length && pathId) {
    const isLoading = pathLoadState === "idle" || pathLoadState === "loading";

    return (
      <main className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
        <section className="w-full max-w-md rounded-3xl border-2 border-sky-100 bg-white p-6 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-3xl">
            {isLoading ? "🗺️" : "⚠️"}
          </div>
          <h1 className="text-xl font-black text-slate-800">
            {isLoading ? "Đang mở bản đồ..." : "Chưa mở được bản đồ"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {isLoading
              ? "Bé đợi một chút để hệ thống tải khóa học nhé."
              : pathLoadMessage || "Đường dẫn khóa học này không còn khả dụng."}
          </p>
          {!isLoading && (
            <button
              className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-md hover:bg-blue-700"
              onClick={() => router.push("/path-select")}
            >
              Chọn khóa học khác
            </button>
          )}
        </section>
      </main>
    );
  }

  return (
    <JourneyMap
      topics={topics}
      results={missionResults}
      onPickMission={handlePickMission}
      onGoQuiz={() => router.push("/quiz")}
    />
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
