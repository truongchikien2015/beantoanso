import { useState } from "react";
import { lessons } from "../data/lessons";
import { speak, stopSpeaking, ttsAvailable } from "../lib/tts";
import { sfx } from "../lib/sound";

export function LessonsScreen({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState<number | null>(null);

  if (active !== null) {
    const lesson = lessons[active];
    const fullText = `${lesson.title}. ${lesson.intro} ${lesson.tips.join(" ")} ${lesson.rule}`;
    return (
      <div className="sd-page">
        <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full flex flex-col justify-center">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                stopSpeaking();
                setActive(null);
              }}
              className="text-slate-500 hover:text-slate-800 font-black text-sm flex items-center gap-1 transition-colors cursor-pointer"
            >
              ← Danh sách bài học
            </button>
            <h1 className="font-black text-slate-800 text-lg flex items-center gap-2">
              📖 Bài học {active + 1}
            </h1>
            <div className="w-24" />
          </div>
          <div className="bg-white rounded-[32px] border-[3px] border-slate-200/80 p-6 sm:p-8 shadow-sm animate-fade-up relative overflow-hidden">
            {/* Header info */}
            <div className="text-center mb-6">
              <div className="text-7xl mb-4 animate-float inline-block drop-shadow-sm">{lesson.emoji}</div>
              <h2 className="text-2xl font-black text-slate-800">{lesson.title}</h2>
              <div className="mt-1.5 h-[3px] w-16 bg-teal-400 rounded-full mx-auto" />
            </div>

            {/* Intro text */}
            <div className="bg-amber-50/50 border-2 border-amber-100/70 rounded-2xl p-5 text-slate-700 font-bold leading-relaxed text-base shadow-inner">
              {lesson.intro}
            </div>

            {/* Tips Section */}
            <h3 className="text-slate-800 font-black text-lg mt-6 mb-3 flex items-center gap-1.5">
              <span>💡</span> Bí kíp của Robot
            </h3>
            <ul className="space-y-3">
              {lesson.tips.map((t, i) => (
                <li
                  key={i}
                  className="flex gap-3 bg-teal-50/30 border-2 border-teal-100/50 rounded-2xl px-4 py-3 items-center font-bold text-sm text-slate-700"
                >
                  <span className="text-emerald-500 shrink-0 text-base">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            {/* Rule highlight */}
            <div className="mt-6 p-5 rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-700 font-black flex items-start gap-3 text-base shadow-sm">
              <span className="text-2xl shrink-0">🛡️</span>
              <p className="leading-relaxed">{lesson.rule}</p>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {ttsAvailable() && (
                <button
                  onClick={() => {
                    sfx.click();
                    speak(fullText);
                  }}
                  className="flex-1 py-3.5 px-6 font-black text-teal-600 bg-white border-[3px] border-teal-200 hover:bg-teal-50/20 active:scale-[0.98] rounded-full transition-all text-base cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  🔊 Nghe Robot đọc bài
                </button>
              )}
              <button
                onClick={() => {
                  stopSpeaking();
                  sfx.click();
                  const next = active + 1;
                  if (next < lessons.length) setActive(next);
                  else setActive(null);
                }}
                className="flex-1 py-3.5 px-6 font-black text-white bg-teal-500 hover:bg-teal-600 active:scale-[0.98] border-b-[4px] border-teal-700 rounded-full transition-all text-base cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {active + 1 < lessons.length
                  ? "Bài tiếp theo →"
                  : "Hoàn thành 🎉"}
              </button>
            </div>
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
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes fade-up {
            from { transform: translateY(15px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-bounce-in {
            animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-fade-up {
            animation: fade-up 0.4s ease-out both;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="sd-page">
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 font-black text-sm flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Trang chủ
          </button>
          <h1 className="font-black text-slate-800 text-lg flex items-center gap-2">
            📚 Học cùng Robot An Toàn
          </h1>
          <div className="w-24" />
        </div>
        <div className="text-center mb-8 animate-bounce-in">
          <p className="text-slate-500 font-black text-base max-w-md mx-auto">
            🛡️ Đọc trước các bí kíp rồi vào làm Quiz để chinh phục điểm cao nhé!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {lessons.map((l, idx) => (
            <button
              key={l.topic}
              onClick={() => {
                sfx.click();
                setActive(idx);
              }}
              className="text-left bg-white rounded-[28px] p-5 shadow-sm border-[3px] border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {l.emoji}
                  </div>
                  <div>
                    <span className="bg-teal-50 border border-teal-100 text-teal-600 px-3 py-0.5 rounded-full text-xs font-black">
                      Bài {idx + 1}
                    </span>
                    <h3 className="text-slate-800 font-black text-base mt-1 group-hover:text-teal-600 transition-colors">{l.title}</h3>
                  </div>
                </div>
                <p className="text-slate-500 text-sm font-bold leading-relaxed line-clamp-2">{l.intro}</p>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end text-xs font-black text-teal-600 group-hover:translate-x-1 transition-transform">
                Đọc bài 📖 ➔
              </div>
            </button>
          ))}
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
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
      `}</style>
    </div>
  );
}
