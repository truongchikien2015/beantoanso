import { useEffect, useState } from "react";
import { RobotGuide } from "./RobotGuide";
import { sfx } from "../lib/sound";
import {
  fetchGrokExplanation,
  getGrokAvailability,
  type GrokExplanation,
} from "../lib/grokApi";
import { speak, ttsAvailable } from "../lib/tts";
import {
  listenForVoiceAnswer,
  matchSpokenAnswer,
  voiceAnswerAvailable,
  type VoiceAnswerOption,
} from "../lib/voiceAnswer";
import { getMediaType, getYouTubeEmbedUrl } from "../lib/mediaUtils";

type Props = {
  topic: any;
  question: any;
  onFinish: (score: number, correct: boolean) => void;
  onBack: () => void;
};

export function MissionScreen({ topic, question, onFinish, onBack }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResponse, setAiResponse] = useState<GrokExplanation | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "listening" | "matched" | "no-match" | "error" | "unsupported"
  >("idle");

  const options: (VoiceAnswerOption<"A" | "B" | "C"> & {
    isCorrect: boolean;
  })[] = [
    { key: "A", text: question.option_a, isCorrect: question.correct_option === 'A' },
    { key: "B", text: question.option_b, isCorrect: question.correct_option === 'B' },
    { key: "C", text: question.option_c, isCorrect: question.correct_option === 'C' },
  ];

  const handlePick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (options[idx].isCorrect) sfx.correct();
    else sfx.wrong();
  };

  const pickedOpt = picked !== null ? options[picked] : null;

  useEffect(() => {
    let active = true;

    getGrokAvailability()
      .then((available) => {
        if (active) setAiAvailable(available);
      })
      .catch(() => {
        if (active) setAiAvailable(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAskGrok = async () => {
    setIsAskingAi(true);
    setAiError("");
    sfx.click();
    try {
      const res = await fetchGrokExplanation(question);
      setAiResponse(res);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "AI chưa sẵn sàng, em đọc giải thích bên trên nhé.";
      setAiError(message);
    } finally {
      setIsAskingAi(false);
    }
  };

  const readQuestion = () => {
    speak(
      `${question.question}. A: ${question.option_a}. B: ${question.option_b}. C: ${question.option_c}.`,
    );
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

      const index = options.findIndex((opt) => opt.key === match.key);
      if (index === -1) {
        setVoiceStatus("no-match");
        return;
      }

      setVoiceStatus("matched");
      handlePick(index);
    } catch {
      setVoiceStatus("error");
    }
  };

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
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="mb-4 text-teal-600 hover:underline"
      >
        ← Quay lại bản đồ
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-sky-100 h-fit">
          <div className="text-center mb-4">
            <div className="inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-200 to-pink-200 items-center justify-center text-5xl shadow-inner">
              {topic.icon}
            </div>
            <h2 className="mt-3 text-teal-700">{topic.label}</h2>
          </div>
          <div className="flex items-start gap-2 bg-amber-50 rounded-2xl p-4 border border-amber-200 text-slate-700">
            <p className="flex-1">📖 {question.question}</p>
            {ttsAvailable() && (
              <button
                onClick={readQuestion}
                title="Nghe đọc câu hỏi"
                className="shrink-0 w-9 h-9 rounded-full border border-teal-200 hover:bg-teal-50 text-teal-700"
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

          {/* Multimedia support */}
          {question.image_url && (() => {
            const mediaType = getMediaType(question.image_url);
            const embedUrl = getYouTubeEmbedUrl(question.image_url);
            return (
              <div className="mt-4 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 flex justify-center">
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
                  <video src={question.image_url} controls className="w-full h-auto max-h-60 object-contain" />
                ) : mediaType === "audio" ? (
                  <div className="w-full p-4">
                    <audio src={question.image_url} controls className="w-full" />
                  </div>
                ) : (
                  <img src={question.image_url} alt="Hình ảnh câu hỏi" className="w-full h-auto max-h-60 object-contain" />
                )}
              </div>
            );
          })()}

          {voiceMessage && (
            <p className="mt-3 rounded-2xl bg-sky-50 px-3 py-2 text-sm text-slate-600">
              {voiceMessage}
            </p>
          )}
          <div className="mt-4">
            <RobotGuide message="Em hãy đọc kỹ rồi chọn câu trả lời đúng nhé!" />
          </div>
        </div>

        <div className="space-y-3">
          {options.map((opt, idx) => {
            const isPicked = picked === idx;
            const showState = picked !== null;
            const cls = !showState
              ? "bg-white border-sky-200 hover:border-sky-400 hover:bg-sky-50"
              : isPicked
                ? opt.isCorrect
                  ? "bg-emerald-100 border-emerald-400"
                  : "bg-rose-100 border-rose-400"
                : opt.isCorrect
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-white border-slate-200 opacity-70";
            return (
              <button
                key={idx}
                onClick={() => handlePick(idx)}
                disabled={picked !== null}
                className={`w-full text-left p-4 rounded-2xl border-2 transition ${cls}`}
              >
                <span className="inline-block w-7 h-7 rounded-full bg-teal-500 text-white text-center mr-3">
                  {opt.key}
                </span>
                {opt.text}
              </button>
            );
          })}

          {pickedOpt && (
            <div
              className={`p-4 rounded-2xl border-2 ${
                pickedOpt.isCorrect
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-rose-50 border-rose-300 text-rose-800"
              }`}
            >
              <p className="mb-1 font-bold">
                {pickedOpt.isCorrect ? "🎉 Tuyệt vời!" : "💡 Chưa đúng rồi!"}
              </p>
              <p>{question.explanation}</p>
              
              {aiAvailable && !aiResponse && (
                <button 
                  onClick={handleAskGrok}
                  disabled={isAskingAi}
                  className="mt-3 text-sm flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                >
                  {isAskingAi ? "⏳ AI đang suy nghĩ..." : "🤖 Hỏi AI giải thích chi tiết"}
                </button>
              )}
              {aiError && (
                <p className="mt-3 text-sm text-rose-700">{aiError}</p>
              )}
              
              {aiResponse && (
                <div className="mt-4 pt-4 border-t border-slate-300/50">
                  <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold">
                    <span>🤖</span> <span>AI nói gì?</span>
                  </div>
                  <p className="text-sm mb-3">{aiResponse.text}</p>
                  {aiResponse.imageUrl && (
                    <img src={aiResponse.imageUrl} alt="AI Illustration" className="w-full rounded-xl shadow-sm border border-slate-200" />
                  )}
                </div>
              )}
            </div>
          )}

          {pickedOpt && (
            <button
              onClick={() => {
                sfx.click();
                onFinish(pickedOpt.isCorrect ? 10 : 0, pickedOpt.isCorrect);
              }}
              className="w-full py-4 mt-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg hover:scale-[1.02] active:scale-95 transition"
            >
              Tiếp tục hành trình →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
