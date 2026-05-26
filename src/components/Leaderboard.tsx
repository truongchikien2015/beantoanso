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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-pink-50 to-sky-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className="text-indigo-700">Bảng xếp hạng</span>
          </div>
          <button
            onClick={onHome}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
          >
            🏠 Trang chủ
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {all.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow border border-slate-200">
            <div className="text-6xl mb-2">🎯</div>
            <p className="text-slate-700 mb-3">
              Chưa có ai hoàn thành hành trình.
            </p>
            <p className="text-slate-500 mb-4">
              Hãy là người đầu tiên trên bảng xếp hạng!
            </p>
            <button
              onClick={onReplay}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white"
            >
              Bắt đầu ngay
            </button>
          </div>
        ) : (
          <>
            <Podium top3={top3} highlightId={currentResultId} />

            {rest.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-2">Hạng</th>
                      <th className="text-left px-4 py-2">Tên</th>
                      <th className="text-left px-4 py-2">Tổng</th>
                      <th className="text-left px-4 py-2 hidden sm:table-cell">
                        Nhiệm vụ
                      </th>
                      <th className="text-left px-4 py-2 hidden sm:table-cell">
                        Bài kiểm tra
                      </th>
                      <th className="text-left px-4 py-2 hidden md:table-cell">
                        Danh hiệu
                      </th>
                      <th className="text-left px-4 py-2 hidden md:table-cell">
                        Ngày
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((r, idx) => {
                      const rank = idx + 4;
                      const isMe = r.id === currentResultId;
                      return (
                        <tr
                          key={r.id}
                          className={`border-t border-slate-100 ${
                            isMe ? "bg-amber-50" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <RankBadge rank={rank} />
                          </td>
                          <td className="px-4 py-3 text-slate-800">
                            {r.nickname} {isMe && "👈"}
                          </td>
                          <td className="px-4 py-3 text-amber-600">
                            ⭐ {r.total_score}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                            {r.mission_score}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                            {r.quiz_score}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                            {r.badge} {r.title}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-slate-500">
                            {new Date(r.completed_at).toLocaleDateString(
                              "vi-VN",
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {limit < 50 && (
                <button
                  onClick={() => setLimit(50)}
                  className="px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50"
                >
                  Xem thêm Top 50
                </button>
              )}
              <button
                onClick={onReplay}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
              >
                🔄 Chơi lại để cải thiện điểm
              </button>
            </div>
          </>
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
    <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
      {order.map((r) => {
        const rank = ranks[r.id];
        const isMe = r.id === highlightId;
        const heights = { 1: "h-44", 2: "h-36", 3: "h-28" } as const;
        const colors = {
          1: "from-amber-300 to-yellow-500 border-amber-400",
          2: "from-slate-200 to-slate-400 border-slate-300",
          3: "from-orange-300 to-amber-600 border-orange-400",
        } as const;
        const medal = { 1: "🥇", 2: "🥈", 3: "🥉" } as const;
        return (
          <div key={r.id} className="text-center">
            <div
              className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 flex items-center justify-center text-3xl shadow-md ${
                rank === 1
                  ? "border-amber-400"
                  : rank === 2
                    ? "border-slate-300"
                    : "border-orange-400"
              } ${isMe ? "ring-4 ring-pink-300" : ""}`}
            >
              {medal[rank as 1 | 2 | 3]}
            </div>
            <p className="mt-2 text-slate-800 truncate">
              {r.nickname} {isMe && "👈"}
            </p>
            <p className="text-amber-600">⭐ {r.total_score}</p>
            <div
              className={`mt-2 rounded-t-xl border-2 bg-gradient-to-t shadow-inner ${
                colors[rank as 1 | 2 | 3]
              } ${heights[rank as 1 | 2 | 3]} flex items-start justify-center pt-2 text-white`}
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
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700">
      {rank}
    </span>
  );
}
