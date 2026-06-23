import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Admin, Questions, Paths, Results, StudentAnswers, TOPIC_VALUES, topicLabels } from "../../lib/store";
import { downloadBackup, restoreBackup } from "../../lib/backupService";
import { AdminQuestions } from "./AdminQuestions";
import { QuestionForm } from "./QuestionForm";
import { TopicManager } from "./TopicManager";
import { PathManager } from "./PathManager";
import { TeacherManager } from "./TeacherManager";
import { FeedbackManager } from "./FeedbackManager";
import { NewsManager } from "./NewsManager";

type AdminTab = "overview" | "questions" | "topics" | "paths" | "students" | "teachers" | "feedbacks" | "news" | "system";

const NAV = [
  { key: "overview", label: "Trang chủ", icon: "🏠" },
  { key: "questions", label: "Câu hỏi", icon: "❓" },
  { key: "topics", label: "Chủ đề", icon: "📚" },
  { key: "paths", label: "Lộ trình", icon: "🗺️" },
  { key: "students", label: "Học sinh", icon: "🧒" },
  { key: "teachers", label: "Giáo viên", icon: "👩‍🏫" },
  { key: "feedbacks", label: "Góp ý", icon: "💡" },
  { key: "news", label: "Tin tức", icon: "📰" },
  { key: "system", label: "Dữ liệu", icon: "💾" },
] as const;

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative" style={{ background: "#f0f9ff" }}>
      {/* Backdrop for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-[240px] flex-shrink-0 flex flex-col overflow-hidden border-r-4 border-sky-200 transition-transform duration-300 lg:static lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background: "linear-gradient(180deg, #bae6fd 0%, #e0f2fe 100%)",
        }}
      >
        {/* Playful background bubbles */}
        <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/40 pointer-events-none" />
        <div className="absolute bottom-20 right-4 w-16 h-16 rounded-full bg-white/30 pointer-events-none" />

        {/* Glow accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[6px]"
          style={{ background: "linear-gradient(90deg, #38bdf8, #34d399, #fbbf24)" }}
        />

        {/* Header */}
        <div className="relative z-10 px-5 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-[16px] flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #0d9488)",
                boxShadow: "0 4px 10px rgba(14,165,233,0.3)",
              }}
            >
              🤖
            </div>
            <div className="min-w-0">
              <p className="text-sky-950 font-black text-[15px] leading-tight truncate">Bé An Toàn Số</p>
              <p className="text-sky-600/80 font-bold text-[11px] mt-0.5">Vùng Đất Quản Trị 🏰</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 px-3">
          <div className="space-y-1.5">
            {NAV.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setTab(item.key);
                    setIsSidebarOpen(false); // Close sidebar on mobile select
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[14px] font-extrabold transition-all duration-200 relative group"
                  style={
                    active
                      ? {
                          background: "#0284c7",
                          color: "#fff",
                          boxShadow: "0 4px 12px rgba(2,132,199,0.25)",
                        }
                      : {
                          color: "#0369a1",
                        }
                  }
                >
                  <span className="text-[16px] flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="relative z-10 px-3 pb-6 space-y-2">
          <button
            onClick={onBack}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-2xl text-[13px] font-bold text-sky-700 hover:bg-white/50 transition-colors"
          >
            <span className="text-[15px]">🏠</span>
            <span className="truncate">Về trang chủ</span>
          </button>
          <button
            onClick={() => { Admin.logout(); onBack(); }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-2xl text-[13px] font-bold text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <span className="text-[15px]">🚪</span>
            <span className="truncate">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b-2 border-sky-100 sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 rounded-xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center text-[20px] font-black text-sky-700 active:scale-95 transition-transform"
        >
          ☰
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🏰</span>
          <span className="text-sky-950 font-black text-base">Bé An Toàn Số</span>
        </div>
        <div className="w-10" /> {/* Visual spacer */}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto min-h-screen min-w-0 w-full">
        {tab === "overview" && <OverviewTab />}
        {tab === "questions" && (
          <AdminContentShell>
            <AdminQuestions onLogout={() => {}} onHome={onBack} />
          </AdminContentShell>
        )}
        {tab === "topics" && (
          <AdminContentShell>
            <TopicManager onLogout={() => {}} onHome={onBack} />
          </AdminContentShell>
        )}
        {tab === "paths" && (
          <AdminContentShell>
            <PathManager onLogout={() => {}} onHome={onBack} />
          </AdminContentShell>
        )}
        {tab === "students" && <StudentsTab />}
        {tab === "teachers" && (
          <AdminContentShell wide>
            <TeacherManager onLogout={() => {}} onHome={onBack} />
          </AdminContentShell>
        )}
        {tab === "feedbacks" && (
          <AdminContentShell>
            <FeedbackManager onHome={onBack} />
          </AdminContentShell>
        )}
        {tab === "news" && (
          <AdminContentShell wide>
            <NewsManager onHome={onBack} />
          </AdminContentShell>
        )}
        {tab === "system" && (
          <AdminContentShell>
            <SystemTab />
          </AdminContentShell>
        )}
      </main>
    </div>
  );
}

function AdminContentShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className={`mx-auto space-y-6 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
        {children}
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const results = Results.list();
  const questions = Questions.list();
  const answers = StudentAnswers.list();
  const [dbPaths, setDbPaths] = useState<any[]>([]);
  const [dbTopicsCount, setDbTopicsCount] = useState(0);

  useEffect(() => {
    const adminPassword = Admin.getPassword();
    fetch("/api/admin/learning-paths", {
      headers: { "x-admin-password": adminPassword },
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.data) setDbPaths(body.data);
      })
      .catch((err) => console.error("Failed to load paths for dashboard overview:", err));

    fetch("/api/admin/topics", {
      headers: { "x-admin-password": adminPassword },
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.data) setDbTopicsCount(body.data.length);
      })
      .catch((err) => console.error("Failed to load topics count for dashboard overview:", err));
  }, []);

  const stats = useMemo(() => {
    const players = new Set(results.map((r) => r.player_id));
    const totalScore = results.reduce((s, r) => s + r.total_score, 0);
    const avg = results.length ? Math.round(totalScore / results.length) : 0;
    const top = [...results].sort((a, b) => b.total_score - a.total_score)[0];
    return {
      attempts: results.length, players: players.size, avg,
      topPlayer: top?.nickname ?? "—", topScore: top?.total_score ?? 0,
      active: questions.filter((q) => q.is_active).length,
      total: questions.length,
      pathsActive: dbPaths.filter((p: any) => p.is_active).length,
      topicsCount: dbTopicsCount || TOPIC_VALUES.length,
      answers: answers.length,
    };
  }, [results, questions, dbPaths, dbTopicsCount, answers]);

  const questionsByTopic = useMemo(() => {
    const byTopic: Record<string, number> = {};
    for (const q of questions.filter((q) => q.is_active)) {
      byTopic[q.category] = (byTopic[q.category] || 0) + 1;
    }
    return byTopic;
  }, [questions]);

  const totalActiveQuestions = useMemo(() => {
    return Object.values(questionsByTopic).reduce((a, b) => a + b, 0) || 1;
  }, [questionsByTopic]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border-4 border-sky-100 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sky-950 flex items-center gap-2">
            Chào các thầy cô! 👋
          </h1>
          <p className="text-sky-600/90 font-bold text-sm sm:text-base mt-1">
            Cùng theo dõi tiến trình học tập của các bé trên mạng nhé!
          </p>
        </div>
        <div
          className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-black shadow-sm align-self-start sm:align-self-auto border-2 border-sky-100"
          style={{ background: "#e0f2fe", color: "#0369a1" }}
        >
          ● Dữ liệu trực tiếp
        </div>
      </div>

      {/* Stat grid 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Tổng lượt học" value={stats.attempts} icon="🏆" accent="#0284c7" bg="#e0f2fe" />
        <StatCard label="Số bé tham gia" value={stats.players} icon="🧒" accent="#10b981" bg="#d1fae5" />
        <StatCard label="Điểm trung bình" value={stats.avg} icon="🌟" accent="#f59e0b" bg="#fef3c7" />
        <StatCard
          label="Bé xuất sắc nhất"
          value={stats.topPlayer}
          subtitle={`Điểm cao: ${stats.topScore}`}
          icon="🎓" accent="#f43f5e" bg="#ffe4e6"
        />
      </div>

      {/* Stat grid 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Câu hỏi sẵn sàng" value={`${stats.active} / ${stats.total}`} icon="❓" accent="#0ea5e9" bg="#e0f2fe" />
        <StatCard label="Lộ trình hoạt động" value={stats.pathsActive} icon="🗺️" accent="#0d9488" bg="#ccfbf1" />
        <StatCard label="Chủ đề an toàn" value={stats.topicsCount} icon="📚" accent="#f97316" bg="#ffedd5" />
        <StatCard label="Câu trả lời" value={stats.answers} icon="💬" accent="#10b981" bg="#d1fae5" />
      </div>

      {/* Questions by topic */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-sky-100 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-black text-sky-950">📊 Câu hỏi theo chủ đề</h2>
        </div>
        <div className="space-y-4">
          {Object.entries(questionsByTopic).map(([k, v]) => {
            const total = totalActiveQuestions;
            const pct = Math.round((v / total) * 100);
            return (
              <div key={k} className="flex items-center gap-3 sm:gap-4">
                <span className="w-28 sm:w-40 text-xs sm:text-sm font-bold text-sky-900 truncate">
                  {topicLabels[k as keyof typeof topicLabels] ?? k}
                </span>
                <div className="flex-1 h-3 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, #0ea5e9, #0d9488)" }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-bold text-sky-600 w-8 text-right">{v}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning paths */}
      {dbPaths.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-sky-100 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-black text-sky-950">🗺️ Lộ trình học tập của bé</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dbPaths.filter((p: any) => p.is_active).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 border-sky-100 bg-sky-50/50"
              >
                <div>
                  <p className="font-extrabold text-sky-950 text-sm sm:text-base">{p.title}</p>
                  <p className="text-sky-600/80 font-semibold text-[11px] sm:text-xs mt-1">{p.description || "Không có mô tả"}</p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-xl text-[11px] font-black flex-shrink-0 ml-2"
                  style={{ background: "#bae6fd", color: "#0369a1" }}
                >
                  {(p.topic_ids || []).length} chủ đề
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Students Tab (parent with sub-views) ───────────────────────────────────────
function StudentsTab() {
  const [view, setView] = useState<"accounts" | "teacher" | "completed">("accounts");

  const TABS = [
    { key: "accounts", label: "🧒 Học sinh tự đăng ký" },
    { key: "teacher", label: "👩‍🏫 Học sinh do giáo viên tạo" },
    { key: "completed", label: "🏆 Kết quả hoàn thành" },
  ] as const;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Sub-view toggle */}
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border-2 border-sky-100 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-black transition ${view === t.key ? "bg-sky-600 text-white shadow" : "text-sky-700 hover:bg-sky-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "accounts" && <AllStudentsView />}
      {view === "teacher" && <TeacherStudentsView />}
      {view === "completed" && <CompletedResultsView />}
    </div>
  );
}

// ── All Self-Registered Students (members who signed up themselves) ─────────────
type AdminStudent = {
  id: string;
  fullName: string;
  email: string | null;
  gender: string | null;
  birthYear: number | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
};

function AllStudentsView() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [resetTarget, setResetTarget] = useState<AdminStudent | null>(null);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const pw = Admin.getPassword();
      const res = await fetch("/api/admin/students", {
        headers: { "x-admin-password": pw },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setStudents(body.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải danh sách học sinh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return students;
    return students.filter((s) =>
      s.fullName.toLowerCase().includes(t) ||
      (s.email ?? "").toLowerCase().includes(t)
    );
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const genderLabel = (g: string | null) => g === "male" ? "Nam" : g === "female" ? "Nữ" : g === "other" ? "Khác" : "—";

  const exportCsv = () => {
    const header = "full_name,email,gender,birth_year,level,xp,total_score,created_at\n";
    const rows = students
      .map((s) =>
        `"${s.fullName}","${s.email ?? ""}","${genderLabel(s.gender)}",${s.birthYear ?? ""},${s.level},${s.xp},${s.totalScore},"${s.createdAt}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bats-all-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sky-950">🧒 Học sinh tự đăng ký</h1>
          <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">
            Tổng {students.length} tài khoản đã tự đăng ký thành viên
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={load} className="Btn BtnSm rounded-2xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">🔄 Tải lại</button>
          <button onClick={exportCsv} disabled={students.length === 0} className="Btn BtnPrimary font-black rounded-2xl shadow-md flex-1 sm:flex-none">📥 Xuất CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-4 border-sky-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-sky-100 bg-sky-50/30 flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Tìm theo tên hoặc email..."
            className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
            style={{ maxWidth: 360 }}
          />
        </div>

        {loading ? (
          <div className="py-20 text-center font-bold text-slate-400">⏳ Đang tải danh sách học sinh...</div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-rose-500 font-bold mb-4">{error}</p>
            <button onClick={load} className="Btn BtnSm rounded-xl font-bold bg-sky-100 text-sky-700">Thử lại</button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-sky-50/50">
                  {["Học sinh", "Email", "Giới tính", "Năm sinh", "Cấp độ", "Điểm", "Ngày đăng ký", "Thao tác"].map((h, i) => (
                    <th key={i} className="TableTh text-sky-950 font-black py-4 px-3 text-left text-xs sm:text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => (
                  <tr key={s.id} className="TableTr hover:bg-sky-50/20 border-b border-sky-100">
                    <td className="TableTd font-black text-sky-950 px-3 py-3.5 text-xs sm:text-sm">{s.fullName}</td>
                    <td className="TableTd text-slate-600 font-semibold px-3 py-3.5 text-xs sm:text-sm">{s.email || "—"}</td>
                    <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{genderLabel(s.gender)}</td>
                    <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{s.birthYear || "—"}</td>
                    <td className="TableTd px-3 py-3.5 text-xs sm:text-sm">
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] sm:text-xs font-black text-sky-700">Lv {s.level}</span>
                    </td>
                    <td className="TableTd font-black px-3 py-3.5 text-xs sm:text-sm" style={{ color: "#f59e0b" }}>★ {s.totalScore}</td>
                    <td className="TableTd text-slate-400 font-semibold text-[10px] sm:text-xs px-3 py-3.5">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="TableTd px-3 py-3.5">
                      <button onClick={() => setResetTarget(s)} className="Btn BtnSm rounded-xl font-bold bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs py-1 px-2.5">
                        🔑 Đổi mật khẩu
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16 font-bold text-slate-400">
                    {students.length === 0 ? "Chưa có học sinh nào tự đăng ký." : "Không có học sinh nào phù hợp với tìm kiếm."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t-2 border-sky-100 bg-sky-50/30 gap-3">
            <p className="text-xs sm:text-sm font-bold text-sky-800">
              Đang xem {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trên tổng {filtered.length} bé
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">← Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">Sau →</button>
            </div>
          </div>
        )}
      </div>

      {resetTarget && (
        <ResetStudentPasswordModal
          student={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

// ── Reset Student Password Modal (admin) ────────────────────────────────────────
function ResetStudentPasswordModal({ student, onClose }: { student: AdminStudent; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try {
      const pw = Admin.getPassword();
      const res = await fetch(`/api/admin/students/${student.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Lỗi đặt lại mật khẩu");
      setSuccess("Đã đặt lại mật khẩu thành công!");
      setTimeout(onClose, 1300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ModalOverlay p-2 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="ModalBox w-full rounded-3xl border-4 border-sky-200 shadow-2xl overflow-hidden" style={{ maxWidth: 440 }}>
        <div className="ModalHeader bg-amber-50 border-b-2 border-amber-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-amber-900 text-lg sm:text-xl flex items-center gap-1.5">🔑 Đổi mật khẩu</h3>
            <p className="text-amber-700 font-bold text-xs sm:text-sm mt-0.5">Học sinh: {student.fullName}</p>
          </div>
          <button onClick={onClose} disabled={loading} className="Btn BtnSm rounded-xl font-black bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1 text-xs">✕ Đóng</button>
        </div>
        <form onSubmit={submit} className="p-4 sm:p-5 space-y-4 bg-white">
          <div>
            <label className="block text-sky-950 font-black text-xs sm:text-sm mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-sm font-semibold"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sky-950 font-black text-xs sm:text-sm mb-1.5">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-sm font-semibold"
            />
          </div>
          {error && <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold text-xs sm:text-sm">❌ {error}</div>}
          {success && <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-bold text-xs sm:text-sm">🎉 {success}</div>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="Btn BtnPrimary font-black rounded-2xl shadow-md flex-1 justify-center">
              {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="Btn BtnSm rounded-2xl font-bold bg-white border-2 border-sky-100">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Teacher-Created Students (imported / created by teachers) ───────────────────
type AdminTeacherStudent = {
  id: string;
  nickname: string;
  email: string | null;
  className: string | null;
  studentCode: string;
  assignedPathId: string | null;
  assignedPathTitle: string | null;
  assignedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teacherName: string | null;
  teacherEmail: string | null;
};

function TeacherStudentsView() {
  const [students, setStudents] = useState<AdminTeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [resetTarget, setResetTarget] = useState<AdminTeacherStudent | null>(null);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const pw = Admin.getPassword();
      const res = await fetch("/api/admin/teacher-students", {
        headers: { "x-admin-password": pw },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setStudents(body.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải danh sách học sinh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const classOptions = useMemo(() => {
    return [...new Set(students.map((s) => s.className).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "vi"));
  }, [students]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter && s.className !== classFilter) return false;
      if (!t) return true;
      return (
        s.nickname.toLowerCase().includes(t) ||
        s.studentCode.toLowerCase().includes(t) ||
        (s.teacherName ?? "").toLowerCase().includes(t)
      );
    });
  }, [students, search, classFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const header = "nickname,student_code,class_name,email,teacher,assigned_path,is_active,created_at\n";
    const rows = students
      .map((s) =>
        `"${s.nickname}","${s.studentCode}","${s.className ?? ""}","${s.email ?? ""}","${s.teacherName ?? ""}","${s.assignedPathTitle ?? ""}",${s.isActive ? "active" : "inactive"},"${s.createdAt}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bats-teacher-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const activeCount = students.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sky-950">👩‍🏫 Học sinh do giáo viên tạo</h1>
          <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">
            Tổng {students.length} tài khoản · {activeCount} đang hoạt động
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={load} className="Btn BtnSm rounded-2xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">🔄 Tải lại</button>
          <button onClick={exportCsv} disabled={students.length === 0} className="Btn BtnPrimary font-black rounded-2xl shadow-md flex-1 sm:flex-none">📥 Xuất CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-4 border-sky-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-sky-100 bg-sky-50/30 flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Tìm theo tên, mã học sinh, giáo viên..."
            className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
            style={{ maxWidth: 360 }}
          />
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
            className="Input rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
            style={{ maxWidth: 200 }}
          >
            <option value="">Tất cả lớp</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center font-bold text-slate-400">⏳ Đang tải danh sách học sinh...</div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-rose-500 font-bold mb-4">{error}</p>
            <button onClick={load} className="Btn BtnSm rounded-xl font-bold bg-sky-100 text-sky-700">Thử lại</button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="bg-sky-50/50">
                  {["Học sinh", "Mã", "Lớp", "Giáo viên", "Lộ trình", "Trạng thái", "Ngày tạo", "Thao tác"].map((h, i) => (
                    <th key={i} className="TableTh text-sky-950 font-black py-4 px-3 text-left text-xs sm:text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => (
                  <tr key={s.id} className="TableTr hover:bg-sky-50/20 border-b border-sky-100">
                    <td className="TableTd font-black text-sky-950 px-3 py-3.5 text-xs sm:text-sm">{s.nickname}</td>
                    <td className="TableTd px-3 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] sm:text-xs text-slate-600">{s.studentCode}</span>
                    </td>
                    <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{s.className || "—"}</td>
                    <td className="TableTd text-slate-600 font-semibold px-3 py-3.5 text-xs sm:text-sm">{s.teacherName || "—"}</td>
                    <td className="TableTd px-3 py-3.5 text-xs sm:text-sm">
                      {s.assignedPathTitle
                        ? <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-sky-700">{s.assignedPathTitle}</span>
                        : <span className="text-slate-400 text-[10px] sm:text-xs">Chưa gán</span>}
                    </td>
                    <td className="TableTd px-3 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-xl text-[10px] sm:text-xs font-black ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {s.isActive ? "● Hoạt động" : "○ Đã khóa"}
                      </span>
                    </td>
                    <td className="TableTd text-slate-400 font-semibold text-[10px] sm:text-xs px-3 py-3.5">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="TableTd px-3 py-3.5">
                      <button onClick={() => setResetTarget(s)} className="Btn BtnSm rounded-xl font-bold bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs py-1 px-2.5">
                        🔑 Đổi mật khẩu
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16 font-bold text-slate-400">
                    {students.length === 0 ? "Chưa có học sinh nào được giáo viên tạo." : "Không có học sinh nào phù hợp với bộ lọc."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t-2 border-sky-100 bg-sky-50/30 gap-3">
            <p className="text-xs sm:text-sm font-bold text-sky-800">
              Đang xem {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trên tổng {filtered.length} bé
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">← Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">Sau →</button>
            </div>
          </div>
        )}
      </div>

      {resetTarget && (
        <ResetTeacherStudentPasswordModal
          student={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

// ── Reset Teacher-Student Password Modal (admin) ────────────────────────────────
function ResetTeacherStudentPasswordModal({ student, onClose }: { student: AdminTeacherStudent; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try {
      const pw = Admin.getPassword();
      const res = await fetch(`/api/admin/teacher-students/${student.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Lỗi đặt lại mật khẩu");
      setSuccess("Đã đặt lại mật khẩu thành công!");
      setTimeout(onClose, 1300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ModalOverlay p-2 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="ModalBox w-full rounded-3xl border-4 border-sky-200 shadow-2xl overflow-hidden" style={{ maxWidth: 440 }}>
        <div className="ModalHeader bg-amber-50 border-b-2 border-amber-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-amber-900 text-lg sm:text-xl flex items-center gap-1.5">🔑 Đổi mật khẩu</h3>
            <p className="text-amber-700 font-bold text-xs sm:text-sm mt-0.5">Học sinh: {student.nickname} ({student.studentCode})</p>
          </div>
          <button onClick={onClose} disabled={loading} className="Btn BtnSm rounded-xl font-black bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1 text-xs">✕ Đóng</button>
        </div>
        <form onSubmit={submit} className="p-4 sm:p-5 space-y-4 bg-white">
          <div>
            <label className="block text-sky-950 font-black text-xs sm:text-sm mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-sm font-semibold"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sky-950 font-black text-xs sm:text-sm mb-1.5">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-sm font-semibold"
            />
          </div>
          {error && <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold text-xs sm:text-sm">❌ {error}</div>}
          {success && <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-bold text-xs sm:text-sm">🎉 {success}</div>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="Btn BtnPrimary font-black rounded-2xl shadow-md flex-1 justify-center">
              {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="Btn BtnSm rounded-2xl font-bold bg-white border-2 border-sky-100">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Completed Results View (journeys finished, from localStorage) ───────────────
function CompletedResultsView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const PAGE_SIZE = 20;
  const results = Results.list();
  const answers = StudentAnswers.list();

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    const sorted = [...results].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    return t ? sorted.filter((r) => r.nickname.toLowerCase().includes(t)) : sorted;
  }, [results, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const blob = new Blob(
      ["nickname,mission_score,quiz_score,total_score,title,completed_at\n" +
        results.map((r) => `"${r.nickname}",${r.mission_score},${r.quiz_score},${r.total_score},"${r.title}","${r.completed_at}"`).join("\n")],
      { type: "text/csv;charset=utf-8" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bats-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sky-950">🏆 Kết quả hoàn thành</h1>
          <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">Đã có {results.length} bé hoàn thành hành trình an toàn số</p>
        </div>
        <button onClick={exportCsv} disabled={results.length === 0} className="Btn BtnPrimary font-black rounded-2xl shadow-md w-full sm:w-auto">
          📥 Xuất file Excel (CSV)
        </button>
      </div>

      <div className="bg-white rounded-3xl border-4 border-sky-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-sky-100 bg-sky-50/30">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Tìm theo tên của bé..."
            className="Input w-full rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
            style={{ maxWidth: 360 }}
          />
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-sky-50/50">
                {["Học sinh","Nhiệm vụ","Bài kiểm tra","Tổng điểm","Danh hiệu đạt được","Ngày hoàn thành","Xem chi tiết"].map((h, i) => (
                  <th key={i} className="TableTh text-sky-950 font-black py-4 px-3 text-left text-xs sm:text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="TableTr hover:bg-sky-50/20 border-b border-sky-100">
                  <td className="TableTd font-black text-sky-950 px-3 py-3.5 text-xs sm:text-sm">{r.nickname}</td>
                  <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{r.mission_score}</td>
                  <td className="TableTd text-slate-600 font-bold px-3 py-3.5 text-xs sm:text-sm">{r.quiz_score}</td>
                  <td className="TableTd font-black px-3 py-3.5 text-xs sm:text-sm" style={{ color: "#f59e0b" }}>★ {r.total_score}</td>
                  <td className="TableTd text-sky-800 font-extrabold text-xs sm:text-sm px-3 py-3.5">{r.badge} {r.title}</td>
                  <td className="TableTd text-slate-400 font-semibold text-[10px] sm:text-xs px-3 py-3.5">{new Date(r.completed_at).toLocaleDateString("vi-VN")}</td>
                  <td className="TableTd px-3 py-3.5">
                    <button onClick={() => { setSelectedPlayer(r.player_id); setShowModal(true); }} className="Btn BtnSm rounded-xl font-bold bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs py-1 px-2.5">
                      👁️ Xem bài
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 font-bold text-slate-400">Chưa có bé nào tham gia học tập.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t-2 border-sky-100 bg-sky-50/30 gap-3">
            <p className="text-xs sm:text-sm font-bold text-sky-800">
              Đang xem {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trên tổng {filtered.length} bé
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">← Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="Btn BtnSm rounded-xl font-bold bg-white border-2 border-sky-100 hover:bg-sky-50 text-xs">Sau →</button>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedPlayer && (
        <StudentModal
          playerId={selectedPlayer}
          answers={answers.filter((a) => a.playerId === selectedPlayer)}
          onClose={() => { setShowModal(false); setSelectedPlayer(null); }}
        />
      )}
    </div>
  );
}

function StudentModal({ playerId, answers, onClose }: {
  playerId: string;
  answers: ReturnType<typeof StudentAnswers.list>;
  onClose: () => void;
}) {
  const name = answers[0]?.nickname ?? playerId;
  const correct = answers.filter((a) => a.isCorrect).length;
  const accuracy = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0;

  return (
    <div className="ModalOverlay p-2 sm:p-4">
      <div
        className="ModalBox w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden rounded-3xl border-4 border-sky-200 shadow-2xl"
        style={{ maxWidth: 672 }}
      >
        <div className="ModalHeader bg-sky-50 border-b-2 border-sky-100 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sky-950 text-lg sm:text-xl flex items-center gap-1.5">📝 Lịch sử trả lời</h3>
            <p className="text-sky-600 font-bold text-xs sm:text-sm mt-0.5">Học sinh: {name}</p>
          </div>
          <button onClick={onClose} className="Btn BtnSm rounded-xl font-black bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1 text-xs">✕ Đóng</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-white border-b-2 border-sky-100">
          {([[answers.length, "Tổng số câu", "#0284c7"], [correct, "Trả lời đúng", "#10b981"], [accuracy + "%", "Độ chính xác", "#f97316"]] as [number|string, string, string][]).map(([v, l, c]) => (
            <div key={l} className="text-center p-3 rounded-2xl" style={{ background: `${c}10`, border: `2px solid ${c}20` }}>
              <p className="text-2xl font-black" style={{ color: c }}>{v}</p>
              <p className="text-[10px] font-black mt-0.5" style={{ color: c }}>{l}</p>
            </div>
          ))}
        </div>
        {answers.length > 0 ? (
          <div className="flex-1 overflow-y-auto bg-white">
            <table className="w-full min-w-[500px]">
              <thead className="sticky top-0 bg-sky-50/90 backdrop-blur-sm z-10">
                <tr className="border-b-2 border-sky-100">
                  {["Chủ đề học", "Đáp án bé chọn", "Đánh giá", "Thời gian làm bài"].map((h, i) => (
                    <th key={i} className="TableTh text-[11px] sm:text-xs font-black text-sky-950 py-3 px-3 uppercase text-left" style={{ letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...answers].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((a) => (
                  <tr key={a.id} className="TableTr hover:bg-sky-50/10 border-b border-sky-50">
                    <td className="TableTd text-xs sm:text-sm font-bold text-sky-900 px-3 py-3">{a.topicLabel}</td>
                    <td className="TableTd px-3 py-3">
                      <span className={`px-2.5 py-0.5 rounded-xl text-[10px] sm:text-xs font-black ${
                        a.selectedOption === "A" ? "bg-blue-100 text-blue-700 border-2 border-blue-200" :
                        a.selectedOption === "B" ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200" :
                        "bg-amber-100 text-amber-800 border-2 border-amber-200"
                      }`}>{a.selectedOption}</span>
                    </td>
                    <td className="TableTd px-3 py-3">
                      {a.isCorrect
                        ? <span className="text-emerald-600 font-extrabold text-xs sm:text-sm">✓ Chính xác</span>
                        : <span className="text-rose-500 font-extrabold text-[10px] sm:text-xs">✕ Đúng: {a.correctOption}</span>
                      }
                    </td>
                    <td className="TableTd text-slate-400 font-semibold text-[10px] sm:text-xs px-3 py-3">{new Date(a.timestamp).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center font-bold text-slate-400 bg-white">Chưa có lịch sử làm bài kiểm tra.</div>
        )}
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, bg, subtitle }: {
  label: string; value: string | number; icon: string; accent: string; bg?: string; subtitle?: string;
}) {
  return (
    <div
      className="rounded-3xl p-5 min-w-0 border-4 border-white shadow-sm hover:scale-[1.03] transition-all duration-300 relative overflow-hidden"
      style={{
        background: bg || "#fff",
        boxShadow: "0 8px 24px rgba(3,105,161,0.04)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-black text-sky-950 uppercase tracking-wider">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="font-black text-sky-950 leading-tight text-2xl sm:text-3xl break-words">
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] font-bold mt-1.5" style={{ color: accent }}>{subtitle}</p>
      )}
    </div>
  );
}

// ── System Backup/Restore Tab ──────────────────────────────────────────────────
function SystemTab() {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    // Read cached admin password if available
    const cached = Admin.getPassword();
    setPassword(cached);
  }, []);

  const handleBackup = async () => {
    if (!password) {
      setMessage({ text: "Vui lòng nhập mật khẩu quản trị trước!", isError: true });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await downloadBackup(password);
      setMessage({ text: "Sao lưu thành công! File JSON đã tải về máy của bạn.", isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi khi sao lưu dữ liệu.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setMessage({ text: "Vui lòng nhập mật khẩu quản trị!", isError: true });
      return;
    }
    if (!file) {
      setMessage({ text: "Vui lòng chọn file sao lưu (.json) cần khôi phục!", isError: true });
      return;
    }

    const confirmRestore = window.confirm(
      "CẢNH BÁO: Hành động này sẽ ghi đè dữ liệu cục bộ và thêm/cập nhật dữ liệu trên database. Bạn có chắc chắn muốn thực hiện?"
    );
    if (!confirmRestore) return;

    setLoading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const res = await restoreBackup(content, password);
        if (res.success) {
          setMessage({
            text: `Khôi phục thành công! Trang web sẽ tự động tải lại sau vài giây...`,
            isError: false,
          });
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setMessage({ text: res.message, isError: true });
        }
      } catch (err: any) {
        setMessage({ text: err.message || "Lỗi không xác định khi khôi phục.", isError: true });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4 px-2 sm:px-4">
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-sky-100 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-black text-sky-950 flex items-center gap-2">
          💾 Quản lý Dữ liệu & Hệ thống
        </h2>
        <p className="text-sky-600/80 font-bold text-xs sm:text-sm mt-1">
          Xuất tệp sao lưu hoặc khôi phục dữ liệu để di chuyển toàn bộ câu hỏi, kết quả học tập sang một máy chủ/hệ thống khác.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 sm:p-5 rounded-2xl font-bold border-2 text-xs sm:text-sm shadow-sm ${
            message.isError
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {message.isError ? "❌ " : "🎉 "} {message.text}
        </div>
      )}

      {/* Admin Password Input */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-sky-100 shadow-sm space-y-3">
        <label className="block text-sky-950 font-black text-xs sm:text-sm">
          🔑 Xác nhận mật khẩu quản trị (Admin Password)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu để thao tác dữ liệu..."
          className="Input w-full max-w-md rounded-2xl border-2 border-sky-100 focus:border-sky-300 outline-none text-xs sm:text-sm font-semibold"
        />
        <p className="text-[10px] sm:text-xs text-slate-400 font-semibold">
          Dùng để xác thực quyền sao lưu và khôi phục của tài khoản admin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-sky-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-3xl">📥</span>
            <h3 className="text-base sm:text-lg font-black text-sky-950 mt-3 mb-2">Tải file sao lưu</h3>
            <p className="text-slate-500 font-bold text-xs leading-relaxed">
              Tải xuống toàn bộ cơ sở dữ liệu (Database collections) và các thiết lập cục bộ (LocalStorage) trong một file JSON duy nhất để lưu trữ an toàn.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl shadow-md transition disabled:opacity-50 text-xs sm:text-sm"
            >
              {loading ? "Đang tải dữ liệu..." : "Tạo và Tải bản sao lưu"}
            </button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-4 border-sky-100 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleRestore} className="flex flex-col h-full justify-between">
            <div>
              <span className="text-3xl">📤</span>
              <h3 className="text-base sm:text-lg font-black text-sky-950 mt-3 mb-2">Khôi phục từ file</h3>
              <p className="text-slate-500 font-bold text-xs leading-relaxed mb-4">
                Chọn tệp sao lưu dạng `.json` đã tải xuống trước đó để khôi phục toàn bộ cấu hình hệ thống hiện tại.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-xs file:font-black
                  file:bg-sky-100 file:text-sky-700
                  hover:file:bg-sky-200"
              />
            </div>
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading || !file}
                className="w-full py-2.5 sm:py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md transition disabled:opacity-50 text-xs sm:text-sm"
              >
                {loading ? "Đang ghi dữ liệu..." : "Khôi phục dữ liệu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
