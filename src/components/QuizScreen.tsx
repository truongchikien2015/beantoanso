import { useEffect, useMemo, useState } from "react";
import { topicLabels } from "../data/quizQuestions";
import { QUIZ_QUESTIONS_PER_ROUND } from "../data/gameData";
import { Questions, AdminQuestion } from "../lib/store";
import { sfx } from "../lib/sound";
import { speak, ttsAvailable } from "../lib/tts";
import {
  listenForVoiceAnswer,
  matchSpokenAnswer,
  voiceAnswerAvailable,
  type VoiceAnswerOption,
} from "../lib/voiceAnswer";

type Props = {
  onFinish: (correct: number, score: number, total: number) => void;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizScreen({ onFinish }: Props) {
  const questions = useMemo<AdminQuestion[]>(() => {
    const active = Questions.active();
    return shuffle(active).slice(
      0,
      Math.min(QUIZ_QUESTIONS_PER_ROUND, active.length),
    );
  }, []);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<"A" | "B" | "C" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "listening" | "matched" | "no-match" | "error" | "unsupported"
  >("idle");

  useEffect(() => {
    sfx.start();
  }, []);

  const q = questions[index];
  const isLast = index === questions.length - 1;

  if (!q) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-slate-700">
          Chưa có câu hỏi active nào. Vui lòng vào trang quản trị để thêm câu
          hỏi.
        </p>
      </div>
    );
  }

  const options: VoiceAnswerOption<"A" | "B" | "C">[] = [
    { key: "A", text: q.option_a },
    { key: "B", text: q.option_b },
    { key: "C", text: q.option_c },
  ];

  const handlePick = (key: "A" | "B" | "C") => {
    if (picked !== null) return;
    setPicked(key);
    if (key === q.correct_option) {
      setCorrectCount((c) => c + 1);
      sfx.correct();
    } else {
      sfx.wrong();
    }
  };

  const handleNext = () => {
    if (picked === null) return;
    sfx.click();
    if (isLast) {
      const score = correctCount * 10;
      sfx.complete();
      onFinish(correctCount, score, questions.length);
    } else {
      setIndex((n) => n + 1);
      setPicked(null);
      setVoiceStatus("idle");
    }
  };

  const readQuestion = () => {
    speak(`${q.question}. A: ${q.option_a}. B: ${q.option_b}. C: ${q.option_c}.`);
  };

  const handleVoiceAnswer = async () => {
    if (picked !== null || voiceStatus === "listening") return;
    if (!voiceAnswerAvailable()) {
      setVoiceStatus("unsupported");
      return;
    }

    setVoiceStatus("listening");
    try {
      const transcript = await listenForVoiceAnswer();
      const match = matchSpokenAnswer(transcript, options);
      if (!match) {
        setVoiceStatus("no-match");
        return;
      }

      setVoiceStatus("matched");
      handlePick(match.key);
    } catch {
      setVoiceStatus("error");
    }
  };

  const isCorrectPick = picked !== null && picked === q.correct_option;
  const voiceMessage =
    voiceStatus === "listening"
      ? "🎙️ Robot đang nghe..."
      : voiceStatus === "matched"
        ? "✅ Robot đã nhận câu trả lời!"
        : voiceStatus === "no-match"
          ? "Robot chưa nghe rõ, em thử nói lại đáp án nhé."
          : voiceStatus === "unsupported"
            ? "Trình duyệt chưa hỗ trợ trả lời bằng giọng nói."
            : voiceStatus === "error"
              ? "Robot chưa nghe được, em thử lại hoặc bấm đáp án nhé."
              : "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <div className="flex justify-between mb-1 text-slate-600">
          <span>
            Câu {index + 1}/{questions.length}
          </span>
          <span>✅ Đúng: {correctCount}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
            style={{
              width: `${((index + (picked !== null ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-sky-100">
        <div className="mb-3">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
            🏷️ {topicLabels[q.category]}
          </span>
        </div>
        <div className="flex items-start gap-2 mb-4">
          <p className="text-indigo-700 flex-1">❓ {q.question}</p>
          {ttsAvailable() && (
            <button
              onClick={readQuestion}
              title="Nghe đọc câu hỏi"
              className="shrink-0 w-9 h-9 rounded-full border border-indigo-200 hover:bg-indigo-50 text-indigo-700"
            >
              🔊
            </button>
          )}
          <button
            onClick={handleVoiceAnswer}
            disabled={picked !== null || voiceStatus === "listening"}
            title="Trả lời bằng giọng nói"
            className="shrink-0 w-9 h-9 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {voiceStatus === "listening" ? "…" : "🎙️"}
          </button>
        </div>
        {voiceMessage && (
          <p className="mb-3 rounded-2xl bg-sky-50 px-3 py-2 text-sm text-slate-600">
            {voiceMessage}
          </p>
        )}
        <div className="space-y-3">
          {options.map((opt) => {
            const showState = picked !== null;
            const isPicked = picked === opt.key;
            const isCorrect = opt.key === q.correct_option;
            const cls = !showState
              ? "bg-white border-sky-200 hover:border-sky-400 hover:bg-sky-50"
              : isCorrect
                ? "bg-emerald-100 border-emerald-400 animate-pulse"
                : isPicked
                  ? "bg-rose-100 border-rose-400"
                  : "bg-white border-slate-200 opacity-70";
            return (
              <button
                key={opt.key}
                onClick={() => handlePick(opt.key)}
                disabled={picked !== null}
                className={`w-full text-left p-4 rounded-2xl border-2 transition ${cls}`}
              >
                <span className="inline-block w-7 h-7 rounded-full bg-indigo-500 text-white text-center mr-3">
                  {opt.key}
                </span>
                {opt.text}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div
            className={`mt-4 p-4 rounded-2xl border-2 ${
              isCorrectPick
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}
          >
            <p className="mb-1">
              {isCorrectPick ? "🎉 Chính xác!" : "💡 Chưa đúng rồi!"}
            </p>
            {q.explanation && <p>{q.explanation}</p>}
          </div>
        )}

        {picked !== null && (
          <button
            onClick={handleNext}
            className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:scale-[1.02] active:scale-95 transition"
          >
            {isLast ? "Xem kết quả 🎉" : "Câu tiếp theo →"}
          </button>
        )}
      </div>
    </div>
  );
}
