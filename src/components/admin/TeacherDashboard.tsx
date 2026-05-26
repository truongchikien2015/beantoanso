"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  TeacherStats,
  StudentAnswers,
  TOPIC_VALUES,
  topicLabels,
  SortOption,
} from "../../lib/store";
import { QuestionSetManager } from "./QuestionSetManager";
import { LearningPathManager } from "./LearningPathManager";
import { StudentImportManager } from "./StudentImportManager";

type TeacherTab = "overview" | "students" | "chart" | "question-sets" | "learning-paths" | "students-manage";

export default function TeacherDashboard({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<TeacherTab>("overview");

  const NAV_ITEMS: { key: TeacherTab; label: string; icon: string }[] = [
    { key: "overview", label: "Tổng quan", icon: "📊" },
    { key: "students", label: "Học sinh", icon: "👨‍🎓" },
    { key: "chart", label: "Biểu đồ", icon: "📈" },
    { key: "question-sets", label: "Bộ câu hỏi", icon: "📝" },
    { key: "learning-paths", label: "Lộ trình", icon: "🛤️" },
    { key: "students-manage", label: "QL Học sinh", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-800 flex flex-col min-h-screen flex-shrink-0">
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👩‍🏫</span>
            <span className="text-white font-bold text-lg">Giáo Viên</span>
          </div>
          <p className="text-slate-400 text-xs">Theo dõi kết quả học tập</p>
        </div>

        <nav className="flex-1 py-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                tab === item.key
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-rose-600 hover:text-white text-sm"
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-h-screen">
        {tab === "overview" && <OverviewTab />}
        {tab === "students" && <StudentsTab />}
        {tab === "chart" && <ChartTab />}
        {tab === "question-sets" && (
          <ManagerShell>
            <QuestionSetManager />
          </ManagerShell>
        )}
        {tab === "learning-paths" && (
          <ManagerShell>
            <LearningPathManager />
          </ManagerShell>
        )}
        {tab === "students-manage" && (
          <ManagerShell>
            <StudentImportManager />
          </ManagerShell>
        )}
      </main>
    </div>
  );
}

function ManagerShell({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto">
        {children}
      </div>
    </div>
  );
}

// === Overview Tab ===
function OverviewTab() {
  const stats = useMemo(() => TeacherStats.overview(), []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">📊 Tổng quan</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng lượt chơi"
          value={stats.totalAttempts}
          color="indigo"
        />
        <StatCard
          label="Điểm TB"
          value={stats.averageScore}
          color="amber"
        />
        <StatCard
          label="Điểm cao nhất"
          value={stats.topScore}
          color="emerald"
        />
        <StatCard
          label="Học sinh xuất sắc"
          value={
            stats.topStudent
              ? `${stats.topStudent.nickname} (${stats.topStudent.score})`
              : "—"
          }
          color="rose"
          small
        />
      </div>
    </div>
  );
}

// === Students Tab ===
function StudentsTab() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(0);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const PAGE_SIZE = 20;

  const allRows = useMemo(() => TeacherStats.aggregate(), []);

  const { items, total } = useMemo(
    () =>
      TeacherStats.sortAndFilter(allRows, {
        query: search,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    [allRows, search, sort, page]
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExport = () => {
    const blob = TeacherStats.exportCSV(allRows);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bats-hoc-sinh-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setPage(0);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">👨‍🎓 Học sinh</h1>
        <button
          onClick={handleExport}
          disabled={allRows.length === 0}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-sm"
        >
          ⬇️ Xuất CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="🔎 Tìm theo tên học sinh..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400 text-sm"
          />
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400 text-sm bg-white"
          >
            <option value="newest">Mới nhất</option>
            <option value="score">Điểm cao nhất</option>
            <option value="az">Tên A-Z</option>
            <option value="za">Tên Z-A</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 text-sm">Học sinh</th>
                <th className="text-left px-4 py-3 text-sm hidden sm:table-cell">Nhiệm vụ</th>
                <th className="text-left px-4 py-3 text-sm hidden sm:table-cell">Bài kiểm tra</th>
                <th className="text-left px-4 py-3 text-sm">Tổng</th>
                <th className="text-left px-4 py-3 text-sm hidden lg:table-cell">Danh hiệu</th>
                <th className="text-left px-4 py-3 text-sm hidden lg:table-cell">Ngày</th>
                <th className="text-left px-4 py-3 text-sm">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, idx) => (
                <tr
                  key={`${r.playerId}-${r.completedAt}-${idx}`}
                  className="border-t border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800 text-sm max-w-[120px] block truncate" title={r.nickname}>
                      {r.nickname}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm hidden sm:table-cell">
                    {r.missionScore}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm hidden sm:table-cell">
                    {r.quizScore}
                  </td>
                  <td className="px-4 py-3 text-amber-600 font-bold text-sm">
                    ⭐ {r.totalScore}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm hidden lg:table-cell">
                    {r.badge} {r.title}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm hidden lg:table-cell">
                    {new Date(r.completedAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedPlayerId(r.playerId);
                        setShowModal(true);
                      }}
                      className="px-2 py-1 rounded-md hover:bg-indigo-50 text-indigo-600 text-sm"
                    >
                      📋 Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {total === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 text-sm">
                    {search ? "Không tìm thấy học sinh" : "Chưa có dữ liệu học sinh."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total} học sinh
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-sm"
              >
                ←
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-600">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-sm"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedPlayerId && (
        <StudentDetailModal
          playerId={selectedPlayerId}
          answers={StudentAnswers.byPlayer(selectedPlayerId)}
          onClose={() => {
            setShowModal(false);
            setSelectedPlayerId(null);
          }}
        />
      )}
    </div>
  );
}

// === Chart Tab ===
function ChartTab() {
  const stats = useMemo(() => TeacherStats.topicChart(), []);
  const maxAnswers = useMemo(
    () => Math.max(...stats.map((s) => s.totalAnswers), 1),
    [stats]
  );

  const TOPIC_COLORS: Record<string, string> = {
    stranger: "from-orange-400 to-red-500",
    phishing: "from-red-400 to-pink-500",
    password: "from-blue-400 to-indigo-500",
    privacy: "from-purple-400 to-violet-500",
    behavior: "from-green-400 to-emerald-500",
    screentime: "from-cyan-400 to-teal-500",
    badcontent: "from-yellow-400 to-amber-500",
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">📈 Câu hỏi theo chủ đề</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600 text-sm mb-6">
          Số câu trả lời theo từng chủ đề (tổng lượt trả lời từ tất cả học sinh)
        </p>
        <div className="space-y-4">
          {stats.map((s) => (
            <div key={s.topicId} className="flex items-center gap-4">
              <span className="w-36 text-slate-700 text-sm font-medium truncate shrink-0">
                {s.topicLabel}
              </span>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${TOPIC_COLORS[s.topicId] ?? "from-indigo-400 to-purple-500"} rounded-full transition-all`}
                  style={{ width: `${Math.max((s.totalAnswers / maxAnswers) * 100, s.totalAnswers > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-slate-500 text-sm w-16 text-right shrink-0">
                {s.totalAnswers} câu
              </span>
              <span className="text-slate-400 text-xs w-12 text-right shrink-0">
                {s.totalAnswers > 0 ? `${s.accuracy}% đúng` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600 text-sm mb-4">Bảng thống kê chi tiết</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 text-sm">Chủ đề</th>
                <th className="text-right px-4 py-3 text-sm">Tổng câu trả lời</th>
                <th className="text-right px-4 py-3 text-sm">Đúng</th>
                <th className="text-right px-4 py-3 text-sm">Độ chính xác</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.topicId} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700 text-sm font-medium">{s.topicLabel}</td>
                  <td className="px-4 py-3 text-slate-600 text-sm text-right">{s.totalAnswers}</td>
                  <td className="px-4 py-3 text-slate-600 text-sm text-right">{s.correctAnswers}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {s.totalAnswers > 0 ? (
                      <span
                        className={
                          s.accuracy >= 70
                            ? "text-emerald-600 font-medium"
                            : s.accuracy >= 40
                            ? "text-amber-600 font-medium"
                            : "text-rose-600 font-medium"
                        }
                      >
                        {s.accuracy}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// === Student Detail Modal ===
function StudentDetailModal({
  playerId,
  answers,
  onClose,
}: {
  playerId: string;
  answers: ReturnType<typeof StudentAnswers.byPlayer>;
  onClose: () => void;
}) {
  const nickname = answers[0]?.nickname ?? playerId;
  const correct = answers.filter((a) => a.isCorrect).length;
  const accuracy =
    answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0;

  const byTopic = useMemo(() => {
    const m: Record<string, { total: number; correct: number }> = {};
    for (const a of answers) {
      if (!m[a.topicId]) m[a.topicId] = { total: 0, correct: 0 };
      m[a.topicId].total++;
      if (a.isCorrect) m[a.topicId].correct++;
    }
    return m;
  }, [answers]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Lịch sử trả lời của ${nickname}`}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-800">📋 Lịch sử trả lời</h3>
            <p className="text-slate-500 text-sm">{nickname}</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm"
          >
            ✕ Đóng
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-100">
          <div className="text-center p-3 bg-indigo-50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600">{answers.length}</p>
            <p className="text-xs text-indigo-500">Câu trả lời</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600">{correct}</p>
            <p className="text-xs text-emerald-500">Đúng</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <p className="text-2xl font-bold text-amber-600">{accuracy}%</p>
            <p className="text-xs text-amber-500">Độ chính xác</p>
          </div>
        </div>

        {answers.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-600 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-sm">Chủ đề</th>
                  <th className="text-left px-4 py-2 text-sm">Trả lời</th>
                  <th className="text-left px-4 py-2 text-sm">Kết quả</th>
                  <th className="text-left px-4 py-2 text-sm hidden sm:table-cell">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {[...answers]
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )
                  .map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-700 text-sm">{a.topicLabel}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-sm font-medium ${
                            a.selectedOption === "A"
                              ? "bg-blue-50 text-blue-700"
                              : a.selectedOption === "B"
                              ? "bg-green-50 text-green-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {a.selectedOption}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {a.isCorrect ? (
                          <span className="text-emerald-600 font-medium">✓ Đúng</span>
                        ) : (
                          <span className="text-rose-500 text-sm">
                            ✗ (đáp án đúng: {a.correctOption})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-xs hidden sm:table-cell">
                        {new Date(a.timestamp).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            Chưa có lịch sử trả lời
          </div>
        )}
      </div>
    </div>
  );
}

// === Stat Card ===
function StatCard({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string | number;
  color: "indigo" | "emerald" | "amber" | "rose";
  small?: boolean;
}) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-500 to-purple-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-400 to-orange-500",
    rose: "from-rose-500 to-pink-600",
  };

  return (
    <div className={`rounded-2xl p-4 text-white bg-gradient-to-br ${colors[color]}`}>
      <p className="opacity-80 text-sm mb-1">{label}</p>
      <p className={small ? "text-sm font-medium leading-tight" : "text-2xl font-bold"}>
        {value}
      </p>
    </div>
  );
}
