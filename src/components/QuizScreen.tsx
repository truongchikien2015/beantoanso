import { useEffect, useMemo, useState } from "react";
import { topicLabels, QuizTopic } from "../data/quizQuestions";
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
import { getYouTubeEmbedUrl, getMediaType } from "../lib/mediaUtils";

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

const topicStyles: Record<string, { icon: string; bg: string; text: string }> = {
  stranger: { icon: "👤", bg: "from-blue-200 to-cyan-200", text: "text-blue-700" },
  phishing: { icon: "🎣", bg: "from-red-200 to-orange-200", text: "text-red-700" },
  password: { icon: "🔑", bg: "from-orange-200 to-pink-200", text: "text-indigo-600" },
  privacy: { icon: "🛡️", bg: "from-green-200 to-emerald-200", text: "text-green-700" },
  behavior: { icon: "🤝", bg: "from-purple-200 to-indigo-200", text: "text-purple-700" },
  screentime: { icon: "⏱️", bg: "from-teal-200 to-emerald-200", text: "text-teal-700" },
  badcontent: { icon: "⚠️", bg: "from-rose-200 to-red-200", text: "text-rose-700" },
};

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

  const style = topicStyles[q.category] || { icon: "✨", bg: "from-sky-100 to-blue-100", text: "text-indigo-700" };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 max-w-2xl mx-auto">
        <div className="flex justify-between mb-2 text-slate-600 font-medium">
          <span>
            Câu {index + 1}/{questions.length}
          </span>
          <span>✅ Đúng: {correctCount}</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 ease-out"
            style={{
              width: `${((index + (picked !== null ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Question Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className={`w-32 h-32 mt-4 mb-6 rounded-3xl bg-gradient-to-b ${style.bg} flex items-center justify-center text-6xl shadow-inner border border-white/50`}>
            {style.icon}
          </div>
          
          <h2 className={`text-2xl font-semibold mb-6 ${style.text}`}>
            {topicLabels[q.category as QuizTopic] || q.category}
          </h2>

          {/* Multimedia (if available) */}
          {q.image_url && (() => {
            const mediaType = getMediaType(q.image_url);
            const embedUrl = getYouTubeEmbedUrl(q.image_url);
            return (
              <div className="w-full mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 flex justify-center">
                {mediaType === "youtube" && embedUrl ? (
                  <div className="relative w-full pt-[56.25%]">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={embedUrl}
                      title="Video câu hỏi"
                      allowFullScreen
                    />
                  </div>
                ) : mediaType === "video" ? (
                  <video src={q.image_url} controls className="w-full h-auto max-h-60 object-contain" />
                ) : mediaType === "audio" ? (
                  <div className="w-full p-4">
                    <audio src={q.image_url} controls className="w-full" />
                  </div>
                ) : (
                  <img src={q.image_url} alt="Hình ảnh câu hỏi" className="w-full h-auto max-h-60 object-contain" />
                )}
              </div>
            );
          })()}

          <div className="bg-amber-50/80 rounded-[24px] p-5 border border-amber-100 w-full mb-8">
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">📖</span>
              <p className="text-[17px] text-left text-slate-700 font-medium flex-1 leading-relaxed">
                {q.question}
              </p>
              <div className="flex gap-2 shrink-0">
                {ttsAvailable() && (
                  <button
                    onClick={readQuestion}
                    title="Nghe đọc câu hỏi"
                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    🔊
                  </button>
                )}
                <button
                  onClick={handleVoiceAnswer}
                  disabled={picked !== null || voiceStatus === "listening"}
                  title="Trả lời bằng giọng nói"
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {voiceStatus === "listening" ? "…" : "🎙️"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-3 w-full">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-md shrink-0 border border-blue-400">
              🤖
            </div>
            <div className="bg-white border border-sky-100 rounded-2xl rounded-bl-none p-4 text-[15px] text-slate-600 flex-1 text-left relative shadow-sm">
              {voiceMessage || "Em hãy đọc kỹ rồi chọn câu trả lời đúng nhé!"}
              {/* Optional speech bubble tail */}
              <div className="absolute -left-2 bottom-0 w-3 h-3 bg-white border-b border-l border-sky-100 transform translate-y-[2px] rotate-45" />
            </div>
          </div>
        </div>

        {/* Right Column: Options & Next Button */}
        <div className="flex flex-col gap-4 justify-center h-full pt-4 md:pt-10">
          {options.map((opt) => {
            const showState = picked !== null;
            const isPicked = picked === opt.key;
            const isCorrect = opt.key === q.correct_option;
            
            let btnClass = "bg-white border-sky-100 hover:border-sky-300 hover:bg-sky-50/50 shadow-sm";
            let circleClass = "bg-indigo-500 text-white";
            
            if (showState) {
              if (isCorrect) {
                btnClass = "bg-emerald-50 border-emerald-300 shadow-md";
                circleClass = "bg-emerald-500 text-white";
              } else if (isPicked) {
                btnClass = "bg-rose-50 border-rose-300 opacity-70";
                circleClass = "bg-rose-400 text-white";
              } else {
                btnClass = "bg-white border-slate-100 opacity-50";
                circleClass = "bg-slate-300 text-slate-500";
              }
            }

            return (
              <button
                key={opt.key}
                onClick={() => handlePick(opt.key)}
                disabled={picked !== null}
                className={`w-full text-left p-4 rounded-[28px] border-2 transition-all duration-300 flex items-center gap-4 ${btnClass} ${
                  isCorrect && showState ? "scale-[1.02]" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 transition-colors ${circleClass}`}>
                  {opt.key}
                </div>
                <span className={`text-[17px] font-medium ${showState && isCorrect ? "text-emerald-800" : "text-slate-700"}`}>
                  {opt.text}
                </span>
              </button>
            );
          })}

          {picked !== null && (
            <div
              className={`mt-2 p-5 rounded-3xl border-2 animate-in fade-in slide-in-from-bottom-4 ${
                isCorrectPick
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <p className="font-semibold text-lg mb-2">
                {isCorrectPick ? "🎉 Chính xác!" : "💡 Chưa đúng rồi!"}
              </p>
              {q.explanation && <p className="opacity-90">{q.explanation}</p>}
            </div>
          )}

          {picked !== null && (
            <button
              onClick={handleNext}
              className="mt-4 w-full py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all animate-in zoom-in"
            >
              {isLast ? "Xem kết quả 🎉" : "Câu tiếp theo →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
