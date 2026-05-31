"use client";

import { useRouter } from "next/navigation";
import { StudentChatbot } from "@/components/student/StudentChatbot";
import { StudentDailyQuizPanel } from "@/components/student/StudentDailyQuizPanel";

export default function StudentDailyPage() {
  const router = useRouter();

  return (
    <div className="kid-paper-page">
      <header className="kid-paper-header px-4 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button onClick={() => router.push("/student/dashboard?view=1")} className="min-h-12 font-bold text-white/85 hover:text-white">
            ← Bảng học tập
          </button>
          <h1 className="text-lg font-black text-white">🔥 Thử thách hôm nay</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <StudentDailyQuizPanel
          onUnauthorized={() => router.replace("/student/login")}
          onBack={() => router.push("/student/dashboard?view=1")}
        />
        <StudentChatbot />
      </main>
    </div>
  );
}
