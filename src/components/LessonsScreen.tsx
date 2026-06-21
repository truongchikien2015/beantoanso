import { useState, useEffect } from "react";
import { lessons } from "../data/lessons";
import { speak, stopSpeaking, ttsAvailable } from "../lib/tts";
import { sfx } from "../lib/sound";

export function LessonsScreen({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get("topic");
      if (topic) {
        const idx = lessons.findIndex((l) => l.topic === topic);
        if (idx !== -1) {
          setActive(idx);
        }
      }
    }
  }, []);

  if (active !== null) {
    const lesson = lessons[active];
    const fullText = `${lesson.title}. ${lesson.intro} ${lesson.tips.join(" ")} ${lesson.rule}`;
    return (
      <div className="kid-paper-page min-h-screen pb-12">
        {/* Header */}
        <header className="kid-paper-header px-4 py-5 mb-6">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                stopSpeaking();
                setActive(null);
              }}
              className="min-h-12 text-white/85 hover:text-white font-bold text-sm flex items-center gap-1"
            >
              ← Quay lại danh sách
            </button>
            <h1 className="font-black text-white text-lg flex items-center gap-2">
              📖 Chi tiết bài học
            </h1>
            <div className="w-16" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 space-y-5 animate-bounce-in">
          <div className="card-kid p-6 bg-white">
            <div className="text-center mb-6">
              <div className="text-7xl animate-float mb-2">{lesson.emoji}</div>
              <h2 className="text-2xl font-black text-[var(--kid-coral-new)] mt-2">{lesson.title}</h2>
            </div>
            
            <p className="text-slate-700 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 font-bold leading-relaxed text-base">
              {lesson.intro}
            </p>
            
            <h3 className="text-slate-800 font-black text-lg mt-6 mb-3 flex items-center gap-2">
              💡 Bí kíp của Robot
            </h3>
            
            <ul className="space-y-3">
              {lesson.tips.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 bg-[var(--kid-teal-new)]/10 border-2 border-[var(--kid-teal-new)]/20 rounded-2xl px-4 py-3 font-semibold text-slate-700"
                >
                  <span className="text-xl">⭐</span>
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-red-100 to-rose-100 border-2 border-rose-200 text-rose-700 font-black text-base flex items-center gap-2">
              <span>🛡️ Quy tắc:</span>
              <span>{lesson.rule}</span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {ttsAvailable() && (
                <button
                  onClick={() => {
                    sfx.click();
                    speak(fullText);
                  }}
                  className="btn-kid btn-kid-yellow flex-1 justify-center py-3 text-base"
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
                className="btn-kid btn-kid-coral flex-1 justify-center py-3 text-base"
              >
                {active + 1 < lessons.length
                  ? "Bài tiếp theo →"
                  : "Hoàn thành 🎉"}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            📚 Thư viện bí kíp
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8 animate-bounce-in">
          <h2 className="text-3xl font-black text-[var(--kid-ink)]">📚 Học cùng Robot An Toàn</h2>
          <p className="text-[var(--kid-muted)] font-bold mt-2">
            Đọc trước các bí kíp rồi vào làm bài để chinh phục điểm cao nhé!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {lessons.map((l, idx) => (
            <button
              key={l.topic}
              onClick={() => {
                sfx.click();
                setActive(idx);
              }}
              className="card-kid text-left p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center text-3xl shrink-0">
                    {l.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[var(--kid-coral-new)]">Bài {idx + 1}</p>
                    <p className="text-base font-black text-slate-800 truncate">{l.title}</p>
                  </div>
                  <span className="text-2xl text-[var(--kid-teal-new)]">➔</span>
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--kid-muted)] line-clamp-3 leading-relaxed">
                  {l.intro}
                </p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
