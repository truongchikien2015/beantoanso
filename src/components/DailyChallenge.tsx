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
      <div className="sd-page flex items-center justify-center">
        <div className="text-center p-8 bg-white border-[3px] border-slate-200/80 rounded-[28px] shadow-sm max-w-sm w-full animate-bounce-in">
          <button 
            onClick={onBack} 
            className="py-2 px-4 font-black text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-full transition-all text-sm mb-6 cursor-pointer border border-slate-200 inline-block"
          >
            ← Quay lại Trang chủ
          </button>
          <p className="text-slate-600 font-bold text-base">Chưa có câu hỏi cho hôm nay.</p>
        </div>
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
    <div className="sd-page">
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full flex flex-col justify-center">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 font-black text-sm flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Trang chủ
          </button>
          <h1 className="font-black text-slate-800 text-lg flex items-center gap-2">
            ⚡ Thử thách Hằng ngày
          </h1>
          <div className="w-24" />
        </div>
        <div className="bg-white rounded-[32px] border-[3px] border-slate-200/80 p-6 sm:p-8 shadow-sm animate-fade-up relative overflow-hidden">
          {/* Header metadata */}
          <div className="flex items-center justify-between mb-6 gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-black text-xs flex items-center gap-1">
              ⚡ Thử thách hôm nay
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-black text-xs flex items-center gap-1">
              🔥 Streak: {streak} ngày
            </span>
          </div>

          <div className="mb-3">
            <span className="bg-teal-50 border border-teal-100 text-teal-600 px-3 py-0.5 rounded-full text-xs font-black">
              🏷️ {topicLabels[question.category as keyof typeof topicLabels] || "Chung"}
            </span>
          </div>

          <p className="text-slate-800 font-black text-xl mb-6 leading-relaxed">
            ❓ {question.question}
          </p>

          <div className="space-y-3.5">
            {options.map((o) => {
              const showState = picked !== null;
              const isPicked = picked === o.k;
              const isCorrect = o.k === question.correct_option;
              
              let cls = "border-slate-100 bg-white text-slate-600 hover:border-teal-300 hover:text-slate-800";
              let badgeCls = "bg-slate-50 text-slate-500 border-slate-200";

              if (showState) {
                if (isCorrect) {
                  cls = "border-emerald-400 bg-emerald-50/30 text-emerald-800 font-bold";
                  badgeCls = "bg-emerald-500 text-white border-emerald-600";
                } else if (isPicked) {
                  cls = "border-rose-400 bg-rose-50/30 text-rose-800 font-bold line-through";
                  badgeCls = "bg-rose-500 text-white border-rose-600";
                } else {
                  cls = "border-slate-100 bg-white text-slate-400 opacity-60";
                  badgeCls = "bg-slate-50 text-slate-300 border-slate-100";
                }
              }

              return (
                <button
                  key={o.k}
                  onClick={() => handlePick(o.k)}
                  disabled={done || picked !== null}
                  className={`w-full text-left p-4 rounded-2xl border-[3px] transition duration-200 font-bold text-sm cursor-pointer flex items-center ${cls}`}
                >
                  <span className={`w-7 h-7 rounded-full border-[2px] flex items-center justify-center font-black mr-3 text-xs shrink-0 ${badgeCls}`}>
                    {o.k}
                  </span>
                  <span className="flex-1 leading-relaxed">{o.t}</span>
                </button>
              );
            })}
          </div>

          {done && (
            <div className="mt-6 p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-100 text-slate-700 font-bold leading-relaxed text-sm animate-bounce-in">
              <p className="font-black text-slate-800 text-base mb-2 flex items-center gap-1.5">
                <span>💡</span> Giải thích từ Robot:
              </p>
              <p className="mb-3 text-slate-700">
                {picked === question.correct_option
                  ? "🎉 Tuyệt vời! Bạn trả lời rất chính xác. Hãy quay lại vào ngày mai để giữ vững chuỗi nhé!"
                  : stateInit.todayDone
                    ? "Hôm nay bạn đã chơi thử thách này rồi. Hẹn gặp lại bạn vào ngày mai!"
                    : "💡 Đừng buồn nhé, lần sau cố gắng đọc kỹ bí kíp hơn nha!"}
              </p>
              {question.explanation && (
                <p className="text-slate-600 bg-white/60 p-4 rounded-xl border border-amber-100 font-bold">
                  {question.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

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

        /* ─── Animations ─── */
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 0.8; }
          70% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-up {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .animate-fade-up {
          animation: fade-up 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
}
