"use client";

import type { TeacherStudentProgress } from "@/types/teacher-content";

interface Props {
  progress: TeacherStudentProgress;
}

export default function StudentProgressCard({ progress }: Props) {
  const score = progress.score;
  const passed = score >= 70;
  const excellent = score >= 90;
  const date = progress.completed_at
    ? new Date(progress.completed_at).toLocaleDateString("vi-VN")
    : "—";

  return (
    <div className="card-kid p-4 flex items-center gap-4">
      {/* Score circle - Achievement Style */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl shrink-0
          ${excellent ? "bg-[var(--kid-yellow-new)] text-slate-800 animate-sparkle" : 
            passed ? "bg-[var(--kid-success)] text-white" : 
            "bg-[var(--kid-coral-new)] text-white"}`}
      >
        {score}%
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-base font-bold ${
          excellent ? "text-[var(--kid-success)]" : 
          passed ? "text-[var(--kid-teal-new)]" : 
          "text-[var(--kid-coral-new)]"}`}>
          {excellent ? "🌟 Xuất sắc" : passed ? "✓ Đạt yêu cầu" : "💪 Cần cải thiện"}
        </p>
        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
          📅 Hoàn thành: {date}
        </p>
      </div>

      {/* Status */}
      <div className="shrink-0 text-2xl">
        {excellent ? "🏆" : passed ? "⭐" : "📚"}
      </div>
    </div>
  );
}
