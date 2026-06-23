import { useMemo, useState } from "react";
import { Results, Questions, topicLabels, Paths, Topics, StudentAnswers, CustomTopic, LearningPath, TOPIC_VALUES } from "../lib/store";
import { Admin } from "../lib/store";
import { AdminQuestions } from "./admin/AdminQuestions";
import { TopicManager } from "./admin/TopicManager";
import { PathManager } from "./admin/PathManager";

type TeacherTab = "overview" | "students" | "paths" | "topics";

export function TeacherDashboard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TeacherTab>("overview");

  if (tab === "topics") {
    return (
      <TopicManager
        onLogout={() => setTab("overview")}
        onHome={onBack}
      />
    );
  }

  if (tab === "paths") {
    return (
      <PathManager
        onLogout={() => setTab("overview")}
        onHome={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👩‍🏫</span>
            <span className="text-slate-800 font-medium">Trang giáo viên</span>
          </div>
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm"
          >
            🏠 Trang chủ
          </button>
        </div>
        {/* Tab navigation */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {(
            [
              { key: "overview", label: "📊 Tổng quan" },
              { key: "students", label: "👨‍🎓 Học sinh" },
              { key: "topics", label: "📚 Chủ đề" },
              { key: "paths", label: "🗺️ Lộ trình" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === t.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {tab === "overview" && <OverviewTab />}
        {tab === "students" && <StudentsTab />}
      </main>
    </div>
  );
}

// === Overview Tab ===
function OverviewTab() {
  const results = Results.list();
  const paths = Paths.list();
  const topics = Topics.list();
  const answers = StudentAnswers.list();
  const questions = Questions.list();

  const stats = useMemo(() => {
    const players = new Set(results.map((r) => r.player_id));
    const totalScore = results.reduce((s, r) => s + r.total_score, 0);
    const avg = results.length ? Math.round(totalScore / results.length) : 0;
    const top = [...results].sort((a, b) => b.total_score - a.total_score)[0];

    // Worst Topic (most failed)
    const incorrect = answers.filter((a) => !a.isCorrect);
    const failedCounts: Record<string, number> = {};
    for (const ans of incorrect) {
      failedCounts[ans.topicLabel] = (failedCounts[ans.topicLabel] || 0) + 1;
    }
    const sortedFailed = Object.entries(failedCounts).sort((a, b) => b[1] - a[1]);
    const worstTopic = sortedFailed[0]?.[0] || "Không có";

    // Students at risk (accuracy < 60%)
    const studentAccuracies: Record<string, { total: number; correct: number }> = {};
    for (const a of answers) {
      if (!studentAccuracies[a.nickname]) {
        studentAccuracies[a.nickname] = { total: 0, correct: 0 };
      }
      studentAccuracies[a.nickname].total++;
      if (a.isCorrect) studentAccuracies[a.nickname].correct++;
    }
    const atRisk = Object.entries(studentAccuracies)
      .map(([name, s]) => ({ name, rate: Math.round((s.correct / s.total) * 100) }))
      .filter((s) => s.rate < 60)
      .map((s) => `${s.name} (${s.rate}%)`)
      .join(", ") || "Không có";

    return {
      attempts: results.length,
      players: players.size,
      avg,
      topPlayer: top?.nickname,
      topScore: top?.total_score,
      pathsCount: paths.length,
      topicsCount: topics.length > 0 ? topics.length : TOPIC_VALUES.length,
      answerRecords: answers.length,
      worstTopic,
      atRisk,
    };
  }, [results, paths, topics, answers]);

  const topicStats = useMemo(() => {
    const byTopic: Record<string, number> = {};
    const active = questions.filter((q) => q.is_active);
    for (const q of active) {
      byTopic[q.category] = (byTopic[q.category] || 0) + 1;
    }
    return { total: active.length, byTopic };
  }, [questions]);

  const exportCsv = () => {
    const header = "nickname,mission_score,quiz_score,total_score,title,completed_at\n";
    const rows = results
      .map(
        (r) =>
          `"${r.nickname}",${r.mission_score},${r.quiz_score},${r.total_score},"${r.title}","${r.completed_at}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bats-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h2 className="text-xl font-bold text-slate-800">📊 Thống kê tình hình học tập</h2>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition text-sm font-semibold cursor-pointer"
          >
            🖨️ Xuất báo cáo PDF / In
          </button>
          <button
            onClick={exportCsv}
            disabled={results.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-sm font-semibold cursor-pointer"
          >
            ⬇️ Xuất dữ liệu Excel/CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Lượt hoàn thành" value={`${stats.attempts}`} />
        <Stat label="Học sinh" value={`${stats.players}`} accent="emerald" />
        <Stat label="Điểm TB" value={`${stats.avg}`} accent="amber" />
        <Stat
          label="Top"
          value={stats.topPlayer ? `${stats.topPlayer} (${stats.topScore})` : "—"}
          accent="rose"
          small
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Lộ trình" value={`${stats.pathsCount}`} accent="sky" />
        <Stat label="Chủ đề" value={`${stats.topicsCount}`} accent="violet" />
        <Stat label="Câu trả lời" value={`${stats.answerRecords}`} accent="teal" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Worst Topic card */}
        <div className="bg-rose-50 rounded-2xl border-2 border-rose-150 p-4">
          <p className="text-rose-800 font-bold text-sm">⚠️ Chủ đề học sinh yếu nhất (sai nhiều nhất)</p>
          <p className="text-xl font-extrabold text-rose-900 mt-1">{stats.worstTopic}</p>
        </div>

        {/* At risk student card */}
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-150 p-4">
          <p className="text-amber-800 font-bold text-sm">🚨 Học sinh có nguy cơ thiếu kỹ năng (độ chính xác &lt; 60%)</p>
          <p className="text-sm font-extrabold text-amber-900 mt-1 truncate" title={stats.atRisk}>{stats.atRisk}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow border border-slate-200 p-4">
        <p className="text-slate-700 mb-3 font-medium">📊 Câu hỏi theo chủ đề (active)</p>
        <div className="space-y-2">
          {Object.entries(topicStats.byTopic).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="w-52 text-slate-600 text-sm">
                {topicLabels[k as keyof typeof topicLabels]}
              </span>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{
                    width: `${
                      topicStats.total ? (v / topicStats.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <span className="w-10 text-right text-slate-600 text-sm">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {paths.length > 0 && (
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-4">
          <p className="text-slate-700 mb-3 font-medium">🗺️ Lộ trình học tập</p>
          <div className="space-y-2">
            {paths.filter((p) => p.isActive).map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="w-52 text-slate-600 text-sm font-medium truncate">{p.title}</span>
                <span className="text-slate-400 text-xs">{p.topicIds.length} chủ đề</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// === Students Tab ===
function StudentsTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const results = Results.list();
  const answers = StudentAnswers.list();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    const sorted = [...results].sort(
      (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
    );
    if (!t) return sorted;
    return sorted.filter((r) => r.nickname.toLowerCase().includes(t));
  }, [results, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const playerAnswers = useMemo(() => {
    if (!selectedPlayer) return [];
    return answers
      .filter((a) => a.playerId === selectedPlayer)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedPlayer, answers]);

  const exportCsv = () => {
    const header = "nickname,mission_score,quiz_score,total_score,title,completed_at\n";
    const rows = results
      .map(
        (r) =>
          `"${r.nickname}",${r.mission_score},${r.quiz_score},${r.total_score},"${r.title}","${r.completed_at}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bats-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow border border-slate-200">
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-slate-100">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="🔎 Tìm theo tên học sinh..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400"
          />
          <button
            onClick={exportCsv}
            disabled={results.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            ⬇️ Xuất CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2">Học sinh</th>
                <th className="text-left px-4 py-2">Nhiệm vụ</th>
                <th className="text-left px-4 py-2">Bài kiểm tra</th>
                <th className="text-left px-4 py-2">Tổng</th>
                <th className="text-left px-4 py-2">Danh hiệu</th>
                <th className="text-left px-4 py-2 hidden md:table-cell">Hoàn thành</th>
                <th className="text-left px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3 text-slate-800 font-medium">{r.nickname}</td>
                  <td className="px-4 py-3 text-slate-600">{r.mission_score}</td>
                  <td className="px-4 py-3 text-slate-600">{r.quiz_score}</td>
                  <td className="px-4 py-3 text-amber-600">⭐ {r.total_score}</td>
                  <td className="px-4 py-3 text-slate-600">{r.badge} {r.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-sm">
                    {new Date(r.completed_at).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedPlayer(r.player_id);
                        setShowAnswers(true);
                      }}
                      className="px-2 py-1 rounded-md hover:bg-indigo-50 text-indigo-600 text-sm"
                    >
                      📋 Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Chưa có dữ liệu học sinh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} học sinh
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
              >
                ←
              </button>
              <span className="px-3 py-1.5 text-slate-600 text-sm">
                Trang {page}/{totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Answer History Modal */}
      {showAnswers && selectedPlayer && (
        <StudentAnswerModal
          playerId={selectedPlayer}
          answers={playerAnswers}
          onClose={() => {
            setShowAnswers(false);
            setSelectedPlayer(null);
          }}
        />
      )}
    </>
  );
}

// === Student Answer History Modal ===
function StudentAnswerModal({
  playerId,
  answers,
  onClose,
}: {
  playerId: string;
  answers: ReturnType<typeof StudentAnswers.byPlayer>;
  onClose: () => void;
}) {
  const playerName = answers[0]?.nickname ?? playerId;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  const byTopic = useMemo(() => {
    const map: Record<string, { total: number; correct: number }> = {};
    for (const a of answers) {
      if (!map[a.topicId]) map[a.topicId] = { total: 0, correct: 0 };
      map[a.topicId].total++;
      if (a.isCorrect) map[a.topicId].correct++;
    }
    return map;
  }, [answers]);

  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-slate-800 font-semibold">📋 Lịch sử trả lời</h3>
            <p className="text-slate-500 text-sm">{playerName}</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            ✕ Đóng
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-indigo-50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600">{answers.length}</p>
            <p className="text-xs text-indigo-500">Câu trả lời</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600">{correctCount}</p>
            <p className="text-xs text-emerald-500">Đúng</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <p className="text-2xl font-bold text-amber-600">{accuracy}%</p>
            <p className="text-xs text-amber-500">Độ chính xác</p>
          </div>
        </div>

        {answers.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-600 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-sm">Chủ đề</th>
                  <th className="text-left px-4 py-2 text-sm">Câu trả lời</th>
                  <th className="text-left px-4 py-2 text-sm">Đúng</th>
                  <th className="text-left px-4 py-2 text-sm hidden sm:table-cell">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-700 text-sm">{a.topicLabel}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                        a.selectedOption === "A" ? "bg-blue-50 text-blue-700" :
                        a.selectedOption === "B" ? "bg-green-50 text-green-700" :
                        "bg-purple-50 text-purple-700"
                      }`}>
                        {a.selectedOption}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {a.isCorrect ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-rose-600">✗ ({a.correctOption})</span>
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
            <p>Chưa có lịch sử trả lời</p>
          </div>
        )}
      </div>
    </div>
  );
}

// === Stat Card ===
function Stat({
  label,
  value,
  accent = "indigo",
  small,
}: {
  label: string;
  value: string;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "teal";
  small?: boolean;
}) {
  const map: Record<string, string> = {
    indigo: "from-indigo-500 to-purple-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-400 to-orange-500",
    rose: "from-rose-500 to-pink-500",
    sky: "from-sky-400 to-blue-500",
    violet: "from-violet-500 to-purple-500",
    teal: "from-teal-500 to-cyan-500",
  };
  return (
    <div
      className={`rounded-2xl p-4 text-white bg-gradient-to-br ${map[accent]} shadow-sm`}
    >
      <p className="opacity-80 text-sm">{label}</p>
      <p className={small ? "text-sm font-medium" : "text-2xl"}>{value}</p>
    </div>
  );
}
