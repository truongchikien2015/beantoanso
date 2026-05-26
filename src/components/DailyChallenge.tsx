import { useMemo, useState } from "react";
import { getDailyQuestion, getDailyState, recordDailyAnswer } from "../lib/daily";
import { topicLabels } from "../data/quizQuestions";
import { sfx } from "../lib/sound";

export function DailyChallenge({ onBack }: { onBack: () => void }) {
  const question = useMemo(() => getDailyQuestion(), []);
  const stateInit = useMemo(() => getDailyState(), []);
  const [picked, setPicked] = useState<"A" | "B" | "C" | null>(null);
  const [done, setDone] = useState(stateInit.todayDone);
  const [streak, setStreak] = useState(stateInit.streak);

  if (!question) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <button onClick={onBack} className="text-indigo-600 hover:underline mb-4">
          ← Trang chủ
        </button>
        <p className="text-slate-700">Chưa có câu hỏi cho hôm nay.</p>
      </div>
    );
  }

  const handlePick = (k: "A" | "B" | "C") => {
    if (picked !== null || done) return;
    setPicked(k);
    const correct = k === question.correct_option;
    if (correct) {
      sfx.correct();
      setStreak((s) => s + 1);
    } else {
      sfx.wrong();
      setStreak(0);
    }
    recordDailyAnswer(correct);
    setDone(true);
  };

  const options: { k: "A" | "B" | "C"; t: string }[] = [
    { k: "A", t: question.option_a },
    { k: "B", t: question.option_b },
    { k: "C", t: question.option_c },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={onBack} className="text-indigo-600 hover:underline mb-4">
        ← Trang chủ
      </button>
      <div className="bg-gradient-to-br from-amber-50 to-pink-50 rounded-3xl p-6 shadow-md border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-800">
            ⚡ Thử thách hôm nay
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700">
            🔥 Streak: {streak}
          </span>
        </div>
        <p className="text-slate-500 mb-1">
          🏷️ {topicLabels[question.category]}
        </p>
        <p className="text-indigo-700 mb-4">❓ {question.question}</p>

        <div className="space-y-3">
          {options.map((o) => {
            const showState = picked !== null;
            const isPicked = picked === o.k;
            const isCorrect = o.k === question.correct_option;
            const cls = !showState
              ? "bg-white border-sky-200 hover:border-sky-400"
              : isCorrect
                ? "bg-emerald-100 border-emerald-400"
                : isPicked
                  ? "bg-rose-100 border-rose-400"
                  : "bg-white border-slate-200 opacity-70";
            return (
              <button
                key={o.k}
                onClick={() => handlePick(o.k)}
                disabled={done || picked !== null}
                className={`w-full text-left p-3 rounded-2xl border-2 transition ${cls}`}
              >
                <span className="inline-block w-7 h-7 rounded-full bg-indigo-500 text-white text-center mr-2">
                  {o.k}
                </span>
                {o.t}
              </button>
            );
          })}
        </div>

        {done && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-amber-200 text-slate-700">
            <p className="mb-1">
              {picked === question.correct_option
                ? "🎉 Tuyệt vời! Quay lại ngày mai để giữ chuỗi nhé."
                : stateInit.todayDone
                  ? "Hôm nay em đã chơi rồi. Hẹn gặp lại ngày mai!"
                  : "💡 Lần sau cố gắng hơn nhé!"}
            </p>
            {question.explanation && <p>{question.explanation}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
