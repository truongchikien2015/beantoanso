"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StudentChatbot } from "@/components/student/StudentChatbot";
import { StudentDailyQuizPanel } from "@/components/student/StudentDailyQuizPanel";
import { getStudentToken } from "@/lib/studentApi";

export default function StudentDailyPage() {
  const router = useRouter();
  // Teacher-created students have a student_token and a teacher dashboard.
  // Self-registered students authenticate via Supabase Auth (no student_token)
  // and belong on the path-select screen instead.
  const [isTeacherStudent, setIsTeacherStudent] = useState(false);

  useEffect(() => {
    setIsTeacherStudent(!!getStudentToken());
  }, []);

  const backHref = isTeacherStudent ? "/student/dashboard?view=1" : "/path-select";

  return (
    <div className="kid-paper-page">
      <header className="kid-paper-header px-4 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button onClick={() => router.push(backHref)} className="min-h-12 font-bold text-white/85 hover:text-white">
            ← {isTeacherStudent ? "Bảng học tập" : "Chọn lộ trình"}
          </button>
          <h1 className="text-lg font-black text-white">🔥 Thử thách hôm nay</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <StudentDailyQuizPanel
          onUnauthorized={() => router.replace(isTeacherStudent ? "/student/login" : "/")}
          onBack={() => router.push(backHref)}
        />
        <StudentChatbot />
      </main>
    </div>
  );
}
