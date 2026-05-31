"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStudentToken, clearStudentToken } from "@/lib/studentApi";
import type { StudentProgressResponse, StudentRewardStats, TeacherStudentProgress } from "@/types/teacher-content";
import StudentProgressCard from "@/components/student/StudentProgressCard";
import { StudentChatbot } from "@/components/student/StudentChatbot";



export default function StudentProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<TeacherStudentProgress[]>([]);
  const [stats, setStats] = useState<StudentRewardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);

  const loadProgress = useCallback(async () => {
    const token = getStudentToken();
    if (!token) { router.replace("/student/login"); return; }

    try {
      const res = await fetch(`/api/student/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) { clearStudentToken(); router.replace("/student/login"); return; }
      if (!res.ok) { const b = await res.json(); setError(b.error ?? "Lỗi tải dữ liệu"); return; }

      const json: StudentProgressResponse | TeacherStudentProgress[] = await res.json();
      if (Array.isArray(json)) {
        setProgress(json);
      } else {
        setProgress(json.progress);
        setStats(json.stats);
      }
    } catch {
      setError("Không thể kết nối");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const resetProgress = useCallback(async () => {
    if (!confirm("Xóa toàn bộ tiến độ để làm lại lộ trình?")) return;

    const token = getStudentToken();
    if (!token) { router.replace("/student/login"); return; }

    setResetting(true);
    setError("");
    try {
      const res = await fetch(`/api/student/progress`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) { clearStudentToken(); router.replace("/student/login"); return; }
      if (!res.ok) { const b = await res.json(); setError(b.error ?? "Lỗi đặt lại tiến độ"); return; }

      setProgress([]);
      router.push("/student/dashboard?view=1");
    } catch {
      setError("Không thể đặt lại tiến độ");
    } finally {
      setResetting(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="kid-paper-page flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📊</div>
          <div className="text-4xl animate-wiggle mb-3">🔄</div>
          <p className="text-slate-500 text-lg font-semibold">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kid-paper-page flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-[var(--kid-coral-new)] font-bold text-lg mb-4">{error}</p>
          <button onClick={loadProgress} className="btn-kid btn-kid-coral">
            🔄 Thử lại
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = progress.length > 0 && progress.every(p => p.score >= 70);

  return (
    <div className="kid-paper-page">
      {/* Header - Celebration Style */}
      <header className="kid-paper-header px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/student/dashboard?view=1")} className="min-h-12 text-white/85 hover:text-white font-bold text-sm">
            ← Bảng học tập
          </button>
          <h1 className="font-black text-white text-lg flex items-center gap-2">
            📊 Tiến độ học tập
          </h1>
          <button onClick={() => router.push("/path-select")} className="min-h-12 text-white/85 hover:text-white font-bold text-sm text-right">
            Lộ trình →
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {stats && (
          <div className="card-kid p-5 bg-gradient-to-r from-cyan-50 to-amber-50">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-black uppercase text-slate-400">XP tích lũy</p>
                <p className="text-3xl font-black text-[var(--kid-coral-new)]">{stats.total_xp}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">Cấp độ</p>
                <p className="text-3xl font-black text-[var(--kid-teal-new)]">Lv.{stats.level}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">Streak</p>
                <p className="text-3xl font-black text-[var(--kid-yellow-dark)]">🔥 {stats.current_streak}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-500">
              XP và cấp độ được cộng dồn, không mất khi đặt lại tiến độ để làm lại.
            </p>
          </div>
        )}

        {/* Summary stats - Achievement Style */}
        <div className="grid grid-cols-3 gap-3">
          <div className="Card p-4 text-center">
            <div className="text-3xl mb-1">📝</div>
            <p className="text-3xl font-black text-[var(--kid-coral-new)]">{progress.length}</p>
            <p className="text-xs text-slate-500 font-semibold">Bài đã làm</p>
          </div>
          <div className="Card p-4 text-center">
            <div className="text-3xl mb-1">⭐</div>
            <p className="text-3xl font-black text-[var(--kid-success)]">
              {progress.length > 0
                ? Math.round(progress.reduce((s, p) => s + p.score, 0) / progress.length)
                : 0}%
            </p>
            <p className="text-xs text-slate-500 font-semibold">Điểm TB</p>
          </div>
          <div className="Card p-4 text-center">
            <div className="text-3xl mb-1">🏆</div>
            <p className="text-3xl font-black text-[var(--kid-yellow-dark)]">
              {progress.filter((p) => p.score >= 70).length}
            </p>
            <p className="text-xs text-slate-500 font-semibold">Đạt (70%+)</p>
          </div>
        </div>

        {/* Celebration for completed */}
        {isCompleted && (
          <div className="card-kid p-6 text-center bg-gradient-to-r from-[var(--kid-yellow-new)]/20 to-[var(--kid-success)]/10 border-2 border-[var(--kid-yellow-new)]">
            <div className="text-6xl mb-2 animate-bounce">🎉</div>
            <h2 className="text-xl font-black text-[var(--kid-coral-new)]">Xuất sắc!</h2>
            <p className="text-slate-600 text-sm mt-1">Bạn đã hoàn thành tất cả các bài!</p>
          </div>
        )}

        {/* Progress list */}
        {progress.length === 0 ? (
          <div className="card-kid p-10 text-center">
            <div className="text-7xl mb-4 animate-wiggle">📝</div>
            <h2 className="text-xl font-black text-slate-800">Chưa có tiến độ</h2>
            <p className="text-slate-500 text-base mt-2">
              Hãy bắt đầu làm bài kiểm tra để theo dõi tiến độ nhé! 🚀
            </p>
            <button
              onClick={() => router.push("/student/dashboard?view=1")}
              className="btn-kid btn-kid-coral mt-4"
            >
              🎮 Đi đến bảng học tập
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {progress.map((p) => (
              <StudentProgressCard key={p.id} progress={p} />
            ))}
          </div>
        )}

        {/* Score distribution */}
        {progress.length > 0 && (
          <div className="Card p-6">
            <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
              📈 Phân bố điểm
            </h3>
            <div className="space-y-3">
              {[
                { label: "90–100%", min: 90, max: 101, color: "bg-[var(--kid-success)]", emoji: "🏆" },
                { label: "70–89%", min: 70, max: 90, color: "bg-[var(--kid-teal-new)]", emoji: "⭐" },
                { label: "50–69%", min: 50, max: 70, color: "bg-[var(--kid-yellow)]", emoji: "📚" },
                { label: "Dưới 50%", min: 0, max: 50, color: "bg-[var(--kid-coral-new)]", emoji: "💪" },
              ].map((band) => {
                const count = progress.filter((p) => p.score >= band.min && p.score < band.max).length;
                const pct = progress.length > 0 ? (count / progress.length) * 100 : 0;
                return (
                  <div key={band.label} className="flex items-center gap-3">
                    <span className="text-xl">{band.emoji}</span>
                    <span className="text-sm text-slate-600 w-20 font-semibold">{band.label}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${band.color} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-600 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {progress.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => router.push("/path-select")}
              className="btn-kid btn-kid-yellow w-full justify-center py-3"
            >
              ← Quay lại lộ trình
            </button>
            <button
              onClick={() => router.push("/student/dashboard?view=1")}
              className="btn-kid btn-kid-teal w-full justify-center py-3"
            >
              🎮 Bảng học tập
            </button>
          </div>
        )}

        {progress.length > 0 && (
          <button
            onClick={resetProgress}
            disabled={resetting}
            className="btn-kid btn-kid-orange w-full justify-center py-3"
          >
            {resetting ? "⏳ Đang đặt lại..." : "🔄 Đặt lại tiến độ để làm lại"}
          </button>
        )}

        <StudentChatbot />
      </main>
    </div>
  );
}
