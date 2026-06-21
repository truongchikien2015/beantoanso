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
      <div className="kid-paper-page min-h-screen pb-12">
        <header className="kid-paper-header px-4 py-5 mb-6">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="min-h-12 text-white/85 hover:text-white font-bold text-sm flex items-center gap-1"
            >
              ← Trang chủ
            </button>
            <h1 className="font-black text-white text-lg flex items-center gap-2">
              ⚡ Thử thách hôm nay
            </h1>
            <div className="w-16" />
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4">
          <div className="card-kid p-8 text-center bg-white">
            <p className="text-slate-600 font-bold text-lg">Chưa có câu hỏi cho hôm nay. Quay lại sau nhé! 😉</p>
          </div>
        </main>
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

  const options: { k: "A" | "B" | "C"; t: string; emoji: string }[] = [
    { k: "A", t: question.option_a, emoji: "🌟" },
    { k: "B", t: question.option_b, emoji: "✨" },
    { k: "C", t: question.option_c, emoji: "💫" },
  ];

  return (
    <div className="kid-paper-page min-h-screen pb-12">
      {/* Header */}
      <header className="kid-paper-header px-4 py-5 mb-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="min-h-12 text-white/85 hover:text-white font-bold text-sm flex items-center gap-1"
          >
            ← Trang chủ
          </button>
          <h1 className="font-black text-white text-lg flex items-center gap-2">
            ⚡ Thử thách mỗi ngày
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 animate-bounce-in">
        <div className="card-kid p-6 bg-white space-y-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--kid-yellow-new)]/30 text-amber-800 font-black text-sm">
              🎯 Thử thách hôm nay
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--kid-coral-new)]/20 text-[var(--kid-coral-new)] font-black text-sm animate-sparkle">
              🔥 Streak: {streak} ngày
            </span>
          </div>

          <div>
            <p className="text-sm font-black text-[var(--kid-teal-new)] mb-1">
              🏷️ Chủ đề: {topicLabels[question.category] ?? question.category}
            </p>
            <p className="text-slate-800 font-black text-xl leading-relaxed">
              ❓ {question.question}
            </p>
          </div>

          <div className="space-y-3">
            {options.map((o) => {
              const showState = picked !== null;
              const isPicked = picked === o.k;
              const isCorrect = o.k === question.correct_option;

              let btnStyle = "border-slate-200 bg-white text-slate-700 hover:border-[var(--kid-coral-new)] hover:bg-[var(--kid-coral-new)]/5";
              if (showState) {
                if (isCorrect) {
                  btnStyle = "border-[var(--kid-success)] bg-[var(--kid-success)]/10 text-slate-800 font-bold";
                } else if (isPicked) {
                  btnStyle = "border-[var(--kid-error)] bg-[var(--kid-error)]/10 text-slate-800 font-bold";
                } else {
                  btnStyle = "border-slate-100 bg-white text-slate-400 opacity-60";
                }
              }

              return (
                <button
                  key={o.k}
                  onClick={() => handlePick(o.k)}
                  disabled={done || picked !== null}
                  className={`kid-choice w-full text-left px-5 py-4 transition-all ${btnStyle}`}
                >
                  <span className="mr-3">{o.emoji}</span>
                  <span className="font-black mr-2">{o.k}.</span>
                  {o.t}
                </button>
              );
            })}
          </div>

          {done && (
            <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 text-slate-800 font-semibold space-y-2 animate-fade-up">
              <p className="font-black text-lg text-amber-800">
                {picked === question.correct_option
                  ? "🎉 Tuyệt vời! Bạn nhỏ đã trả lời đúng rồi!"
                  : stateInit.todayDone
                    ? "Hôm nay em đã tham gia thử thách rồi. Hẹn gặp lại ngày mai nhé!"
                    : "💡 Câu trả lời chưa chính xác rồi, hãy đọc giải thích bên dưới nhé!"}
              </p>
              {question.explanation && (
                <p className="leading-relaxed text-sm text-slate-700 bg-white/70 p-3 rounded-xl border border-amber-100">
                  {question.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
