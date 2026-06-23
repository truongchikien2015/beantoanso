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
    <div className="sd-page">
      {/* ── 2. Main Content ── */}
      <main className="sd-main max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">📊 Tiến độ học tập</h1>
          <button
            onClick={() => router.push("/student/dashboard?view=1")}
            className="sd-nav-btn-outline"
          >
            ← Bảng học tập
          </button>
        </div>
        {stats && (
          <div className="sd-streak-card-new animate-fade-up">
            <div className="sd-streak-inner">
              <div className="sd-streak-details">
                <span className="sd-streak-badge">THÀNH TÍCH CỦA EM</span>
                <h3 className="sd-streak-title">Cố gắng học tập mỗi ngày nhé!</h3>
                <p className="sd-streak-desc">
                  Tích lũy điểm kinh nghiệm XP và giữ chuỗi streak đều đặn.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t-2 border-amber-100 bg-amber-50/50 p-5 rounded-b-[28px] text-center">
              <div>
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">XP tích lũy</p>
                <p className="text-2xl font-black text-amber-700">{stats.total_xp}</p>
              </div>
              <div className="border-x-2 border-amber-100">
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Cấp độ</p>
                <p className="text-2xl font-black text-teal-700">Lv.{stats.level}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Ngày streak</p>
                <p className="text-2xl font-black text-rose-600">🔥 {stats.current_streak}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bento stats grid */}
        <div className="grid grid-cols-3 gap-4 animate-fade-up">
          <div className="bg-white rounded-[24px] border-[3px] border-slate-200/80 p-4 text-center">
            <div className="text-3xl mb-1">📝</div>
            <p className="text-2xl font-black text-slate-800">{progress.length}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Bài đã làm</p>
          </div>
          <div className="bg-white rounded-[24px] border-[3px] border-slate-200/80 p-4 text-center">
            <div className="text-3xl mb-1">⭐</div>
            <p className="text-2xl font-black text-teal-600">
              {progress.length > 0
                ? Math.round(progress.reduce((s, p) => s + p.score, 0) / progress.length)
                : 0}%
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Điểm TB</p>
          </div>
          <div className="bg-white rounded-[24px] border-[3px] border-slate-200/80 p-4 text-center">
            <div className="text-3xl mb-1">🏆</div>
            <p className="text-2xl font-black text-amber-600">
              {progress.filter((p) => p.score >= 70).length}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Đạt (70%+)</p>
          </div>
        </div>

        {/* Celebration for completed */}
        {isCompleted && (
          <div className="bg-emerald-50 rounded-[28px] border-[3px] border-emerald-300 p-6 text-center animate-fade-up">
            <div className="text-5xl mb-2 animate-bounce">🎉</div>
            <h2 className="text-xl font-black text-slate-800">Xuất sắc hoàn thành!</h2>
            <p className="text-emerald-700 text-sm font-bold mt-1">
              Em đã hoàn thành xuất sắc tất cả các thử thách và bài học!
            </p>
          </div>
        )}

        {/* Progress list */}
        {progress.length === 0 ? (
          <div className="bg-white rounded-[28px] border-[3px] border-slate-200/80 p-10 text-center animate-fade-up">
            <div className="text-6xl mb-4 animate-bounce">📝</div>
            <h2 className="text-xl font-black text-slate-800">Chưa có tiến độ học tập</h2>
            <p className="text-slate-500 text-sm font-bold mt-2">
              Hãy bắt đầu tham gia các bài học và bài kiểm tra trên bảng học tập nhé! 🚀
            </p>
            <button
              onClick={() => router.push("/student/dashboard?view=1")}
              className="mt-6 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-full shadow-md active:scale-98 transition"
            >
              🎮 Đi đến Bảng học tập
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {progress.map((p, index) => (
              <StudentProgressCard key={p.id} progress={p} index={index} />
            ))}
          </div>
        )}

        {/* Score distribution */}
        {progress.length > 0 && (
          <div className="bg-white rounded-[28px] border-[3px] border-slate-200/80 p-6 animate-fade-up">
            <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
              📈 Phân bố điểm số
            </h3>
            <div className="space-y-3">
              {[
                { label: "90–100%", min: 90, max: 101, color: "bg-amber-400", emoji: "🏆" },
                { label: "70–89%", min: 70, max: 90, color: "bg-emerald-400", emoji: "⭐" },
                { label: "50–69%", min: 50, max: 70, color: "bg-teal-400", emoji: "📚" },
                { label: "Dưới 50%", min: 0, max: 50, color: "bg-rose-400", emoji: "💪" },
              ].map((band) => {
                const count = progress.filter((p) => p.score >= band.min && p.score < band.max).length;
                const pct = progress.length > 0 ? (count / progress.length) * 100 : 0;
                return (
                  <div key={band.label} className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{band.emoji}</span>
                    <span className="text-xs text-slate-500 w-16 font-bold shrink-0">{band.label}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className={`h-full ${band.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-black text-slate-700 w-6 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {progress.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 animate-fade-up">
            <button
              onClick={() => router.push("/path-select")}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white text-base font-black rounded-3xl shadow-sm hover:shadow active:scale-98 transition duration-200 flex items-center justify-center gap-2"
            >
              ← Lộ trình học tập
            </button>
            <button
              onClick={() => router.push("/student/dashboard?view=1")}
              className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white text-base font-black rounded-3xl shadow-sm hover:shadow active:scale-98 transition duration-200 flex items-center justify-center gap-2"
            >
              Bảng học tập 🎮
            </button>
          </div>
        )}

        {/* Reset Progress Button */}
        {progress.length > 0 && (
          <button
            onClick={resetProgress}
            disabled={resetting}
            className="w-full py-3.5 border-[3px] border-rose-300 text-rose-600 hover:bg-rose-50/50 text-base font-black rounded-3xl active:scale-98 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 animate-fade-up"
          >
            {resetting ? "⏳ Đang đặt lại..." : "🔄 Đặt lại tiến độ để làm lại"}
          </button>
        )}

        <StudentChatbot />
      </main>

      {/* Footer */}
      <footer className="sd-footer">
        <div className="sd-footer-inner">
          <p className="sd-footer-copy">© 2026 Bé An Toàn Số. Đồng hành cùng trẻ em Việt Nam trên không gian mạng.</p>
          <div className="sd-footer-links">
            <button onClick={() => router.push("/terms")} className="sd-footer-link bg-transparent border-none cursor-pointer">Điều khoản</button>
            <button onClick={() => router.push("/privacy")} className="sd-footer-link bg-transparent border-none cursor-pointer">Bảo mật</button>
            <button onClick={() => router.push("/contact")} className="sd-footer-link bg-transparent border-none cursor-pointer">Liên hệ</button>
            <button onClick={() => router.push("/help")} className="sd-footer-link bg-transparent border-none cursor-pointer">Trợ giúp</button>
          </div>
        </div>
      </footer>

      {/* Scoped CSS Styles */}
      <style>{`
        /* ─── Page Shell ─── */
        .sd-page {
          min-height: 100dvh;
          background-color: #FFF9F0;
          background-image: radial-gradient(#e5e7eb 1.5px, transparent 1.5px);
          background-size: 24px 24px;
          color: #2D3436;
          font-family: var(--font-nunito, 'Nunito'), var(--font-quicksand, 'Quicksand'), sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ─── Sticky Navbar ─── */
        .sd-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #ffffff;
          border-bottom: 2px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01);
        }
        .sd-navbar-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sd-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .sd-logo:hover {
          transform: scale(1.03);
        }
        .sd-logo-icon {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.75rem;
          background-color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2);
        }
        .sd-logo-text {
          color: #1e3a8a;
          font-weight: 900;
          font-size: 1.25rem;
        }
        .sd-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sd-nav-btn-outline {
          border: 2px solid #2563eb;
          color: #2563eb;
          border-radius: 9999px;
          padding: 0.375rem 1.25rem;
          font-weight: 800;
          font-size: 0.875rem;
          cursor: pointer;
          background: transparent;
          transition: all 0.2s;
        }
        .sd-nav-btn-outline:hover {
          background-color: #f8fafc;
          transform: translateY(-1px);
        }

        /* ─── Main ─── */
        .sd-main {
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          flex: 1;
        }

        /* ─── Daily Streak Card ─── */
        .sd-streak-card-new {
          background: #ffffff;
          border-radius: 32px;
          border: 2.5px solid #ffe66d;
          box-shadow: 0 10px 25px -5px rgba(255,230,109,0.1), 0 8px 10px -6px rgba(255,230,109,0.05);
          overflow: hidden;
        }
        .sd-streak-inner {
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .sd-streak-details {
          flex: 1;
          min-width: 250px;
        }
        .sd-streak-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background-color: #fffbeb;
          color: #d97706;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .sd-streak-title {
          font-size: 1.375rem;
          font-weight: 900;
          color: #0f172a;
        }
        .sd-streak-desc {
          font-size: 0.875rem;
          color: #475569;
        }

        /* ─── Footer ─── */
        .sd-footer {
          background-color: #ffffff;
          border-top: 2px solid #f1f5f9;
          padding: 1.5rem;
          margin-top: auto;
        }
        .sd-footer-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
        }
        .sd-footer-links {
          display: flex;
          gap: 1.25rem;
        }
        .sd-footer-link {
          color: #64748b;
          transition: color 0.2s;
          text-decoration: none;
        }
        .sd-footer-link:hover {
          color: #2563eb;
        }
      `}</style>
    </div>
  );
}
