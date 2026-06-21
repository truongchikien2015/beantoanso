import { useState } from "react";
import { Results } from "../lib/store";

export function Leaderboard({
  currentResultId,
  onHome,
  onReplay,
}: {
  currentResultId?: string;
  onHome: () => void;
  onReplay: () => void;
}) {
  const [limit, setLimit] = useState(10);
  const all = Results.leaderboard(limit);
  const top3 = all.slice(0, 3);
  const rest = all.slice(3);

  return (
    <div className="kid-paper-page min-h-screen pb-12">
      <header className="kid-paper-header px-4 py-5 mb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl animate-float">🏆</span>
            <h1 className="font-black text-white text-lg">Bảng xếp hạng</h1>
          </div>
          <button
            onClick={onHome}
            className="min-h-12 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-bold transition-all"
          >
            🏠 Trang chủ
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {all.length === 0 ? (
          <div className="card-kid p-10 text-center bg-white animate-bounce-in">
            <div className="text-7xl mb-4 animate-float">🎯</div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Chưa có ai hoàn thành hành trình</h2>
            <p className="text-[var(--kid-muted)] font-bold mb-5">
              Hãy là người đầu tiên ghi danh trên bảng vàng nhé!
            </p>
            <button
              onClick={onReplay}
              className="btn-kid btn-kid-coral px-8 py-3 text-lg"
            >
              🚀 Chơi ngay thôi!
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="animate-bounce-in">
              <Podium top3={top3} highlightId={currentResultId} />
            </div>

            {rest.length > 0 && (
              <div className="card-kid bg-white overflow-hidden animate-fade-up">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-100">
                        <th className="TableTh px-5 py-3">Hạng</th>
                        <th className="TableTh px-5 py-3">Tên</th>
                        <th className="TableTh px-5 py-3">Tổng điểm</th>
                        <th className="TableTh px-5 py-3 hidden sm:table-cell">Nhiệm vụ</th>
                        <th className="TableTh px-5 py-3 hidden sm:table-cell">Bài kiểm tra</th>
                        <th className="TableTh px-5 py-3 hidden md:table-cell">Danh hiệu</th>
                        <th className="TableTh px-5 py-3 hidden md:table-cell">Ngày</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                      {rest.map((r, idx) => {
                        const rank = idx + 4;
                        const isMe = r.id === currentResultId;
                        return (
                          <tr
                            key={r.id}
                            className={`transition-colors ${
                              isMe ? "bg-amber-50" : "hover:bg-slate-50/50"
                            }`}
                          >
                            <td className="TableTd px-5 py-3">
                              <RankBadge rank={rank} />
                            </td>
                            <td className="TableTd px-5 py-3 text-slate-800">
                              {r.nickname} {isMe && "👈"}
                            </td>
                            <td className="TableTd px-5 py-3 text-amber-600">
                              ⭐ {r.total_score}
                            </td>
                            <td className="TableTd px-5 py-3 hidden sm:table-cell text-slate-500">
                              {r.mission_score}
                            </td>
                            <td className="TableTd px-5 py-3 hidden sm:table-cell text-slate-500">
                              {r.quiz_score}
                            </td>
                            <td className="TableTd px-5 py-3 hidden md:table-cell text-slate-500">
                              {r.badge} {r.title}
                            </td>
                            <td className="TableTd px-5 py-3 hidden md:table-cell text-slate-400">
                              {new Date(r.completed_at).toLocaleDateString("vi-VN")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              {limit < 50 && (
                <button
                  onClick={() => setLimit(50)}
                  className="btn-kid bg-white text-slate-700 border-slate-200 hover:border-slate-300 px-6 py-3"
                >
                  👀 Xem thêm Top 50
                </button>
              )}
              <button
                onClick={onReplay}
                className="btn-kid btn-kid-coral px-6 py-3"
              >
                🔄 Chơi lại để cải thiện điểm
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Podium({
  top3,
  highlightId,
}: {
  top3: ReturnType<typeof Results.leaderboard>;
  highlightId?: string;
}) {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const ranks: Record<string, number> = {};
  top3.forEach((r, i) => (ranks[r.id] = i + 1));

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-2xl mx-auto pt-6">
      {order.map((r) => {
        const rank = ranks[r.id];
        const isMe = r.id === highlightId;
        const heights = { 1: "h-40", 2: "h-32", 3: "h-24" } as const;
        const colors = {
          1: "from-yellow-400 to-amber-500 border-yellow-300",
          2: "from-slate-200 to-slate-400 border-slate-300",
          3: "from-orange-300 to-amber-600 border-orange-400",
        } as const;
        const medal = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;
        return (
          <div key={r.id} className="text-center">
            <div
              className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-3 flex items-center justify-center text-3xl shadow-md transition-transform hover:scale-105 ${
                rank === 1
                  ? "border-yellow-400"
                  : rank === 2
                    ? "border-slate-300"
                    : "border-orange-400"
              } ${isMe ? "ring-4 ring-pink-400 animate-pulse" : ""}`}
            >
              {medal[rank as 1 | 2 | 3]}
            </div>
            <p className="mt-2 text-slate-800 font-black text-sm sm:text-base truncate px-1">
              {r.nickname} {isMe && "👈"}
            </p>
            <p className="text-amber-600 font-black text-sm sm:text-base">⭐ {r.total_score}</p>
            <div
              className={`mt-2 rounded-t-3xl border-3 bg-gradient-to-t shadow-inner flex items-start justify-center pt-3 text-white font-black text-lg ${
                colors[rank as 1 | 2 | 3]
              } ${heights[rank as 1 | 2 | 3]}`}
            >
              <span>#{rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black">
      {rank}
    </span>
  );
}
