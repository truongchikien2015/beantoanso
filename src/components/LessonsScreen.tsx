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
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => {
            stopSpeaking();
            setActive(null);
          }}
          className="text-indigo-600 hover:underline mb-4"
        >
          ← Quay lại danh sách
        </button>
        <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-sky-100">
          <div className="text-center mb-4">
            <div className="text-6xl">{lesson.emoji}</div>
            <h2 className="text-indigo-700 mt-2">{lesson.title}</h2>
          </div>
          <p className="text-slate-700 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            {lesson.intro}
          </p>
          <h3 className="text-slate-800 mt-5 mb-2">💡 Bí kíp của Robot</h3>
          <ul className="space-y-2">
            {lesson.tips.map((t, i) => (
              <li
                key={i}
                className="flex gap-2 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2"
              >
                <span>✅</span>
                <span className="text-slate-700">{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 border border-rose-200 text-rose-700">
            🛡️ <span>{lesson.rule}</span>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            {ttsAvailable() && (
              <button
                onClick={() => {
                  sfx.click();
                  speak(fullText);
                }}
                className="flex-1 py-3 rounded-2xl border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
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
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
            >
              {active + 1 < lessons.length
                ? "Bài tiếp theo →"
                : "Hoàn thành 🎉"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="text-indigo-600 hover:underline mb-4"
      >
        ← Trang chủ
      </button>
      <div className="text-center mb-6">
        <h2 className="text-indigo-700">📚 Học cùng Robot An Toàn</h2>
        <p className="text-slate-600">
          Đọc trước các bí kíp rồi vào quiz để chinh phục điểm cao!
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {lessons.map((l, idx) => (
          <button
            key={l.topic}
            onClick={() => {
              sfx.click();
              setActive(idx);
            }}
            className="text-left bg-white rounded-2xl p-4 shadow border-2 border-sky-100 hover:border-sky-300 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-200 to-pink-200 flex items-center justify-center text-2xl">
                {l.emoji}
              </div>
              <div className="flex-1">
                <p className="text-slate-500">Bài {idx + 1}</p>
                <p className="text-slate-800">{l.title}</p>
              </div>
              <span className="text-indigo-500">→</span>
            </div>
            <p className="mt-2 text-slate-600 line-clamp-2">{l.intro}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
