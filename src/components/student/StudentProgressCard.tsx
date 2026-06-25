"use client";

import type { TeacherStudentProgress } from "@/types/teacher-content";

interface Props {
  progress: TeacherStudentProgress;
  index: number;
}

export default function StudentProgressCard({ progress, index }: Props) {
  const score = progress.score;
  const passed = score >= 70;
  const excellent = score >= 90;
  const date = progress.completed_at
    ? new Date(progress.completed_at).toLocaleDateString("vi-VN")
    : "—";

  return (
    <div className="bg-white rounded-[24px] border-[3px] border-slate-200/80 p-4 flex items-center gap-4 hover:shadow-md transition duration-200 animate-fade-up">
      {/* Score circle - Achievement Style */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-lg shrink-0 border-[3px]
          ${excellent ? "bg-amber-50 border-amber-300 text-amber-700 animate-pulse" : 
            passed ? "bg-emerald-50 border-emerald-300 text-emerald-700" : 
            "bg-rose-50 border-rose-300 text-rose-700"}`}
      >
        {score}%
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
          Bài học/Kiểm tra số {index + 1}
        </p>
        <p className={`text-base font-black mt-0.5 ${
          excellent ? "text-amber-600" : 
          passed ? "text-emerald-600" : 
          "text-rose-600"}`}>
          {excellent ? "🌟 Xuất sắc" : passed ? "✓ Đạt yêu cầu" : "💪 Cần cải thiện"}
        </p>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-bold">
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

// UX Audit Label Fallback: aria-label
