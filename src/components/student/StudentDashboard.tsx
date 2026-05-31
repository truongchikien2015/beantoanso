"use client";

import { useRouter } from "next/navigation";
import type { StudentDashboardData } from "@/types/teacher-content";
import { topicLabels } from "@/data/quizQuestions";
import { StudentChatbot } from "@/components/student/StudentChatbot";

interface Props {
  data: StudentDashboardData;
  onLogout: () => void;
}

export default function StudentDashboard({ data, onLogout }: Props) {
  const router = useRouter();
  const { student, assigned_path, progress } = data;
  const { stats } = data;

  const progressMap = new Map(progress.map((p) => [p.step_id, p]));

  const nextStep = assigned_path?.steps.find(
    (s) => !progressMap.has(s.id)
  );

  const completedCount = assigned_path?.steps
    ? assigned_path.steps.filter((s) => progressMap.has(s.id)).length
    : 0;

  const totalSteps = assigned_path?.step_count ?? 0;

  const handleStartStep = (stepId: string) => {
    router.push(`/student/quiz/${stepId}`);
  };

  const handleContinue = () => {
    if (nextStep) {
      router.push(`/student/quiz/${nextStep.id}`);
    } else if (assigned_path) {
      router.push("/student/progress");
    }
  };

  const getAvatarEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌤️";
    if (hour < 17) return "☀️";
    return "🌙";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 17) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="kid-paper-page">
      {/* Header */}
      <header className="kid-paper-header px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-3xl animate-float">
                {getAvatarEmoji()}
              </div>
              <div>
                <p className="text-white/80 text-sm font-semibold">{getGreeting()}!</p>
                <h1 className="text-2xl font-black text-white">👋 {student.nickname}</h1>
                {student.class_name && (
                  <p className="text-white/70 text-sm">🏫 {student.class_name}</p>
                )}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="min-h-12 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-bold transition-all"
            >
              🚪 Thoát
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <section className="card-kid p-5 bg-gradient-to-r from-amber-50 to-cyan-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[var(--kid-coral-new)]">🔥 Chuỗi học mỗi ngày</p>
              <h2 className="mt-1 text-2xl font-black text-slate-800">
                {stats.current_streak} ngày liên tục
              </h2>
              <p className="text-sm font-bold text-slate-500">
                Lv.{stats.level} · {stats.total_xp} XP · Kỷ lục {stats.longest_streak} ngày
              </p>
            </div>
            <button
              onClick={() => router.push("/student/daily")}
              className="btn-kid btn-kid-yellow shrink-0 justify-center px-5 py-3"
            >
              🎯 Làm 5 câu hôm nay
            </button>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--kid-coral-new)] to-[var(--kid-teal-new)] transition-all"
              style={{ width: `${Math.min((stats.xp_in_level / stats.xp_for_next) * 100, 100)}%` }}
            />
          </div>
        </section>

        {assigned_path ? (
          <>
            {/* Path Card */}
            <section className="relative">
              <div className="absolute -top-2 -left-2 text-2xl opacity-30">🗺️</div>
              <div className="absolute -bottom-2 -right-2 text-2xl opacity-30">⭐</div>

              <div className="card-kid p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[var(--kid-coral-new)] to-[var(--kid-teal-new)] px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🧭</span>
                    <p className="text-white/80 text-xs uppercase tracking-wider font-bold">Hành trình phiêu lưu</p>
                  </div>
                  <h2 className="text-white text-xl font-black mt-1 flex items-center gap-2">
                    <span>⚔️</span> {assigned_path.title}
                  </h2>
                  {assigned_path.description && (
                    <p className="text-white/80 text-sm mt-1">{assigned_path.description}</p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="px-6 py-4 border-b-2 border-dashed border-[var(--kid-coral-new)]/20">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-semibold">🗓️ Tiến độ</span>
                    <span className="font-black text-[var(--kid-coral-new)]">
                      {completedCount}/{totalSteps} bước
                    </span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                    {assigned_path.steps.map((step, idx) => {
                      const isCompleted = !!progressMap.get(step.id);
                      return (
                        <div
                          key={step.id}
                          className={`flex-1 h-full flex items-center justify-center text-xs
                            ${isCompleted ? "bg-[var(--kid-success)] text-white" : "bg-slate-200"}
                            ${idx === 0 ? "rounded-l-full" : ""}
                            ${idx === assigned_path.steps.length - 1 ? "rounded-r-full" : ""}
                          `}
                        >
                          {isCompleted ? "⭐" : idx + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Steps list */}
                <div className="divide-y divide-dashed divide-slate-200">
                  {assigned_path.steps.map((step, index) => {
                    const prog = progressMap.get(step.id);
                    const isCompleted = !!prog;
                    const isNext = step.id === nextStep?.id;

                    return (
                      <div
                        key={step.id}
                        className={`px-6 py-4 flex items-center gap-4 transition-all
                          ${isNext ? "bg-[var(--kid-teal-new)]/10" : ""}
                          ${isCompleted ? "bg-[var(--kid-success)]/5" : ""}
                        `}
                      >
                        {/* Step number */}
                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shrink-0
                          ${isCompleted ? "bg-[var(--kid-success)] text-white animate-sparkle" :
                            isNext ? "bg-[var(--kid-coral-new)] text-white animate-pulse" :
                            "bg-slate-200 text-slate-500"}`}
                        >
                          {isCompleted ? "✓" : isNext ? "▶️" : index + 1}
                          {index < assigned_path.steps.length - 1 && (
                            <div className={`absolute top-full left-1/2 w-0.5 h-4 -translate-x-1/2
                              ${isCompleted ? "bg-[var(--kid-success)]" : "bg-slate-300"}`}
                            />
                          )}
                        </div>

                        {/* Step info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-bold truncate
                            ${isCompleted ? "text-slate-400" : "text-slate-800"}`}>
                            {step.step_type === "topic"
                              ? topicLabels[step.topic_id as keyof typeof topicLabels] ?? `Bài học ${index + 1}`
                              : step.step_type === "question_set"
                                ? `📝 Bài kiểm tra ${index + 1}`
                                : `⭐ Bước ${index + 1}`}
                          </p>
                          <p className="text-sm text-slate-400">
                            {step.step_type === "topic" ? "📖 Bài học" : "📝 Bài kiểm tra"}
                            {prog && ` · ${prog.score}%`}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="shrink-0">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--kid-success)] text-white text-sm font-bold">
                              ⭐ Hoàn thành
                            </span>
                          ) : isNext ? (
                            <button
                              onClick={() => handleStartStep(step.id)}
                              className="btn-kid btn-kid-coral text-base px-5 py-2"
                            >
                              🎮 Bắt đầu
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-200 text-slate-500 text-sm font-semibold">
                              🔒
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Continue button */}
            {nextStep ? (
              <button
                onClick={handleContinue}
                className="btn-kid btn-kid-coral w-full justify-center py-4 text-xl"
              >
                <span className="flex items-center gap-3">
                  🎮 Tiếp tục hành trình →
                </span>
              </button>
            ) : (
              <div className="card-kid p-6 text-center">
                <div className="text-5xl mb-3 animate-bounce-in">🎉</div>
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-[var(--kid-coral-new)] font-black text-xl">Hoàn thành hành trình!</p>
                <p className="text-slate-500 text-sm mt-1">Bạn đã hoàn thành tất cả các bước</p>
                <button
                  onClick={() => router.push("/student/progress")}
                  className="btn-kid btn-kid-teal mt-4"
                >
                  📊 Xem tiến độ
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => router.push("/student/progress")}
                className="btn-kid btn-kid-yellow justify-center py-3"
              >
                📊 Tiến độ
              </button>
              <button
                onClick={onLogout}
                className="btn-kid btn-kid-teal justify-center py-3"
              >
                🚪 Thoát
              </button>
            </div>

            <StudentChatbot />
          </>
        ) : (
          <>
            <div className="card-kid p-10 text-center">
              <div className="text-6xl mb-4 animate-wiggle">🗺️</div>
              <h2 className="text-xl font-black text-slate-800">Chưa có hành trình</h2>
              <p className="text-slate-500 mt-2 text-base">
                Giáo viên chưa gán lộ trình cho bạn.
                <br />Liên hệ giáo viên để bắt đầu nhé! 📚
              </p>
            </div>

            <StudentChatbot />
          </>
        )}
      </main>
    </div>
  );
}
