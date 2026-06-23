"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStudentToken, clearStudentToken } from "@/lib/studentApi";
import type { StudentStepContent, TeacherQuestion } from "@/types/teacher-content";
import { topicLabels } from "@/data/quizQuestions";
import { StudentChatbot } from "@/components/student/StudentChatbot";
import { getMediaType, getYouTubeEmbedUrl } from "@/lib/mediaUtils";



// Type for answer breakdown from API
interface AnswerBreakdown {
  question_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
  explanation: string | null;
}

// Confetti component for celebrations
function Confetti() {
  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#00B894", "#FF7675", "#F59E0B"];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-20px",
            animationDelay: `${Math.random() * 0.8}s`,
            animationDuration: `${0.6 + Math.random() * 0.6}s`,
          }}
        >
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
        </div>
      ))}
    </div>
  );
}

function TopicContent({ step }: { step: StudentStepContent }) {
  const label = step.topic_label ?? step.topic ? topicLabels[step.topic as keyof typeof topicLabels] : "Bài học";
  return (
    <div className="bg-white rounded-[28px] border-[3px] border-slate-200/80 p-8 text-center shadow-sm">
      <div className="text-6xl mb-4 animate-bounce-in">📖</div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">{label}</h2>
      <p className="text-slate-500 text-base">Nội dung bài học sẽ được cập nhật sau.</p>
      <div className="mt-6 p-5 bg-teal-50 border-2 border-teal-100 rounded-2xl text-base text-slate-700 font-bold">
        📚 Bài học này giúp bạn hiểu về chủ đề <span className="font-black text-rose-500">&ldquo;{label}&rdquo;</span>
      </div>
    </div>
  );
}

function QuizQuestion({
  question,
  index,
  selected,
  onSelect,
}: {
  question: TeacherQuestion;
  index: number;
  selected: "A" | "B" | "C" | null;
  onSelect: (opt: "A" | "B" | "C") => void;
}) {
  const [bounceSelected, setBounceSelected] = useState<string | null>(null);
  const options = [
    { key: "A" as const, label: "A", text: question.option_a, emoji: "🌟" },
    { key: "B" as const, label: "B", text: question.option_b, emoji: "✨" },
    { key: "C" as const, label: "C", text: question.option_c, emoji: "💫" },
  ];

  const handleSelect = (key: "A" | "B" | "C") => {
    setBounceSelected(key);
    onSelect(key);
    setTimeout(() => setBounceSelected(null), 300);
  };

  return (
    <div className="bg-white rounded-[28px] border-[3px] border-slate-200/80 p-6 shadow-sm hover:shadow-md transition duration-200 animate-fade-up">
      <p className="text-slate-800 font-black text-xl leading-relaxed mb-5">
        <span className="text-rose-500 mr-2">Câu {index + 1}.</span>
        {question.question}
      </p>

      {question.image_url && (
        <div className="mb-5 overflow-hidden rounded-xl border-[3px] border-slate-100 bg-slate-50 relative flex items-center justify-center min-h-[120px]">
          {(() => {
            const url = question.image_url;
            const type = getMediaType(url);
            if (type === "youtube") {
              const embedUrl = getYouTubeEmbedUrl(url);
              if (!embedUrl) return <p className="text-rose-500 font-bold p-4">Link video bị lỗi</p>;
              return (
                <div className="relative w-full pt-[56.25%]">
                  <iframe className="absolute inset-0 w-full h-full" src={embedUrl} allowFullScreen />
                </div>
              );
            }
            if (type === "video") return <video src={url} controls className="max-w-full max-h-[300px]" />;
            if (type === "audio") return <audio src={url} controls className="w-full m-4" />;
            return <img src={url} alt="Minh họa" className="max-w-full max-h-[300px] object-contain" />;
          })()}
        </div>
      )}

      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selected === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className={`w-full px-5 py-4 text-left border-[3px] rounded-2xl min-h-[58px] font-bold text-sm transition-all duration-200 active:scale-[0.99] cursor-pointer
                ${bounceSelected === opt.key ? "animate-pop" : ""}
                ${isSelected
                  ? "border-teal-400 bg-teal-50/30 text-slate-800 shadow-sm"
                  : "border-slate-100 bg-white text-slate-600 hover:border-teal-300 hover:text-slate-800"
                }`}
            >
              <span className="mr-3">{opt.emoji}</span>
              <span className="font-black mr-2">{opt.label}.</span>
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const stepId = params.stepId as string;

  const [step, setStep] = useState<StudentStepContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [breakdown, setBreakdown] = useState<{ total: number; correct: number; unanswered: number } | null>(null);
  const [answerBreakdown, setAnswerBreakdown] = useState<AnswerBreakdown[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, "A" | "B" | "C">>({});
  const [currentQ, setCurrentQ] = useState(0);

  const loadStep = useCallback(async () => {
    const token = getStudentToken();
    if (!token) { router.replace("/student/login"); return; }

    try {
      const res = await fetch(`/api/student/steps/${stepId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) { clearStudentToken(); router.replace("/student/login"); return; }
      if (res.status === 403) { setError("Bạn không có quyền truy cập bài học này"); setLoading(false); return; }
      if (!res.ok) { const b = await res.json(); setError(b.error ?? "Lỗi tải nội dung"); setLoading(false); return; }

      const json: StudentStepContent = await res.json();
      setStep(json);
    } catch {
      setError("Không thể kết nối");
    } finally {
      setLoading(false);
    }
  }, [stepId, router]);

  useEffect(() => { loadStep(); }, [loadStep]);

  const handleSelectAnswer = (questionId: string, opt: "A" | "B" | "C") => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: opt }));
  };

  const handleSubmit = useCallback(async () => {
    if (!step) return;
    setSubmitting(true);

    try {
      const token = getStudentToken();
      if (!token) { router.replace("/student/login"); return; }

      // Build answers array for question_set steps
      const answers = step.questions
        ? Object.entries(selectedAnswers).map(([question_id, selected_option]) => ({
            question_id,
            selected_option: selected_option as "A" | "B" | "C",
          }))
        : undefined;

      // For question_set: compute score client-side for immediate feedback
      let previewScore = 0;
      if (step.questions) {
        const correct = step.questions.filter(
          (q) => selectedAnswers[q.id] === q.correct_option
        ).length;
        previewScore = step.questions.length > 0
          ? Math.round((correct / step.questions.length) * 100)
          : 0;
        setScore(previewScore);
      }

      const res = await fetch(`/api/student/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path_id: step.path_id,
          step_id: step.step_id,
          score: previewScore,
          answers,
        }),
      });

      if (!res.ok) {
        const b = await res.json();
        setError(b.error ?? "Lỗi lưu kết quả");
        return;
      }

      const json = await res.json();

      // Store detailed breakdown for review
      if (json.breakdown) {
        setBreakdown(json.breakdown);
        setScore(json.breakdown.score);
      }
      if (json.answer_breakdown) {
        setAnswerBreakdown(json.answer_breakdown);
      }
      if (typeof json.xp_awarded === "number") {
        setXpAwarded(json.xp_awarded);
      }

      setSubmitted(true);
    } catch {
      setError("Lỗi lưu kết quả");
    } finally {
      setSubmitting(false);
    }
  }, [step, selectedAnswers, router]);

  const handleCompleteTopic = useCallback(async () => {
    if (!step) return;
    setSubmitting(true);
    setError("");

    try {
      const token = getStudentToken();
      if (!token) { router.replace("/student/login"); return; }

      const res = await fetch(`/api/student/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path_id: step.path_id,
          step_id: step.step_id,
          score: 100,
        }),
      });

      if (!res.ok) {
        const b = await res.json();
        setError(b.error ?? "Lỗi lưu kết quả");
        return;
      }

      const json = await res.json();
      setScore(100);
      setXpAwarded(typeof json.xp_awarded === "number" ? json.xp_awarded : 0);
      setSubmitted(true);
    } catch {
      setError("Lỗi lưu kết quả");
    } finally {
      setSubmitting(false);
    }
  }, [step, router]);

  // Score calculation
  const totalQ = step?.questions?.length ?? 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = totalQ > 0 && answeredCount === totalQ;

  if (loading) {
    return (
      <div className="sd-page flex items-center justify-center">
        <div className="text-center p-8 bg-white border-[3px] border-slate-200/80 rounded-[28px] shadow-sm max-w-xs w-full animate-bounce-in">
          <div className="text-5xl mb-4 animate-bounce">📝</div>
          <p className="text-slate-600 font-black text-lg">Đang tải câu hỏi...</p>
          <div className="mt-4 w-12 h-1.5 bg-teal-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full animate-pulse w-2/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sd-page flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full p-8 bg-white border-[3px] border-slate-200/80 rounded-[28px] shadow-sm animate-bounce-in">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-500 font-black text-lg mb-6">{error}</p>
          <button
            onClick={() => router.push("/student/dashboard?view=1")}
            className="w-full py-3.5 px-6 font-black text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] border-b-[4px] border-rose-700 rounded-full transition-all text-base cursor-pointer"
          >
            Quay lại Bảng học tập
          </button>
        </div>
      </div>
    );
  }

  if (!step) return null;

  if (submitted) {
    const passed = score >= 70;
    const correctCount = breakdown?.correct ?? 0;
    const totalCount = breakdown?.total ?? 0;
    const unansweredCount = breakdown?.unanswered ?? 0;
    const isExcellent = score >= 90;

    return (
      <div className="sd-page">
        {passed && <Confetti />}
        <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/student/dashboard?view=1")}
              className="text-slate-500 hover:text-slate-800 font-black text-sm flex items-center gap-1 transition-colors cursor-pointer"
            >
              ← Thoát
            </button>
            <h1 className="font-black text-slate-800 text-lg flex items-center gap-2">
              ✨ Kết quả bài học ✨
            </h1>
            <div className="w-12" />
          </div>
          {/* Score card - Celebration Style */}
          <div className={`bg-white rounded-[28px] border-[3px] p-8 text-center shadow-sm relative overflow-hidden ${
            passed 
              ? "border-emerald-400 bg-emerald-50/10 animate-bounce-in" 
              : "border-rose-300 bg-rose-50/10 animate-shake"
          }`}>
            {/* Trophy/Emoji */}
            <div className={`text-8xl mb-4 drop-shadow-md ${passed ? "animate-float" : ""}`}>
              {isExcellent ? "🏆" : passed ? "🎉" : "💪"}
            </div>
            
            {/* Message */}
            <h1 className="text-2xl font-black text-slate-800 mb-4">
              {isExcellent ? "Xuất sắc lắm!" : passed ? "Chúc mừng bạn!" : "Cố gắng hơn nhé!"}
            </h1>
            
            {/* Score - Big & Bold */}
            <div className={`text-7xl font-black mb-2 tracking-tight
              ${isExcellent ? "text-emerald-500" : passed ? "text-teal-500" : "text-rose-500"}`}>
              {score}%
            </div>
            
            {/* Stats */}
            <div className="flex justify-center gap-4 text-base mt-4">
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-black text-sm">
                ✓ {correctCount} đúng
              </span>
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100 font-black text-sm">
                📝 {totalCount} câu
              </span>
            </div>
            
            {unansweredCount > 0 && (
              <p className="text-sm text-slate-400 mt-2 font-bold">
                ({unansweredCount} câu chưa trả lời)
              </p>
            )}
            
            {/* Encouragement */}
            <p className="text-base text-slate-500 mt-4 font-bold">
              {isExcellent ? "🌟 Bạn là ngôi sao sáng nhất!" : 
               passed ? "🎊 Bạn đã hoàn thành bài quiz này!" : 
               "📚 Học lại bài và thử lại nhé!"}
            </p>
            {xpAwarded > 0 && (
              <div className="mt-4">
                <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-base font-black text-amber-700 shadow-sm">
                  ⭐ +{xpAwarded} XP tích lũy
                </span>
              </div>
            )}
          </div>

          {/* Answer breakdown - Kid Friendly */}
          {answerBreakdown.length > 0 && (
            <div className="bg-white rounded-[28px] border-[3px] border-slate-200/80 p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-black text-slate-800 text-lg mb-6 border-b-2 border-slate-100 pb-3">
                📋 Xem lại đáp án
              </h2>
              <div className="space-y-6">
                {answerBreakdown.map((item, index) => (
                  <div
                    key={item.question_id}
                    className={`p-5 rounded-[22px] border-[3px] transition-all duration-200 ${
                      item.is_correct
                        ? "bg-emerald-50/20 border-emerald-200"
                        : "bg-rose-50/20 border-rose-200"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm mt-0.5
                        ${item.is_correct ? "bg-emerald-500" : "bg-rose-500"}`}>
                        {item.is_correct ? "✓" : "✗"}
                      </span>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-base leading-relaxed">
                          <span className={`${item.is_correct ? "text-emerald-500" : "text-rose-500"} mr-1`}>Câu {index + 1}.</span>
                          {item.question}
                        </p>
                      </div>
                      {item.is_correct && (
                        <span className="text-2xl animate-sparkle shrink-0">⭐</span>
                      )}
                    </div>

                    {/* Options display */}
                    <div className="space-y-2.5 pl-0 sm:pl-11">
                      {(["A", "B", "C"] as const).map((opt) => {
                        const optionText = opt === "A" ? item.option_a : opt === "B" ? item.option_b : item.option_c;
                        const isSelected = item.selected_option === opt;
                        const isCorrect = item.correct_option === opt;

                        let style = "border-slate-100 bg-slate-50 text-slate-500";
                        let icon = "";
                        if (isCorrect) {
                          style = "border-emerald-300 bg-emerald-50/40 text-emerald-800 font-bold";
                          icon = " ✓ (Đúng)";
                        } else if (isSelected && !isCorrect) {
                          style = "border-rose-300 bg-rose-50/40 text-rose-800 font-bold line-through";
                          icon = " ✗ (Bạn chọn)";
                        }

                        return (
                          <div key={opt} className={`px-4 py-3 rounded-xl border-2 text-sm font-bold flex items-center justify-between ${style}`}>
                            <div>
                              <span className="font-black mr-2">{opt}.</span>
                              {optionText}
                            </div>
                            {icon && <span className="text-xs font-black shrink-0 ml-2">{icon}</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {item.explanation && (
                      <div className={`mt-4 p-4 rounded-xl border-2 text-sm ${
                        item.is_correct 
                          ? "bg-emerald-50/40 border-emerald-100 text-emerald-800 font-bold" 
                          : "bg-amber-50/40 border-amber-100 text-amber-900 font-bold"
                      }`}>
                        <p className="font-black mb-1.5 flex items-center gap-1.5">
                          <span className="text-lg">💡</span> Giải thích:
                        </p>
                        <p className="leading-relaxed font-bold text-slate-600">{item.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <StudentChatbot />

          {/* Actions - Adventure Style */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => router.push("/student/dashboard?view=1")}
              className="w-full py-4 px-6 font-black text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] border-b-[4px] border-rose-700 rounded-full transition-all text-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              🏠 Về bảng học tập
            </button>
            {!passed && (
              <button
                onClick={() => {
                  setSubmitted(false);
                  setSelectedAnswers({});
                  setBreakdown(null);
                  setAnswerBreakdown([]);
                  setXpAwarded(0);
                  setCurrentQ(0);
                }}
                className="w-full py-4 px-6 font-black text-white bg-teal-500 hover:bg-teal-600 active:scale-[0.98] border-b-[4px] border-teal-700 rounded-full transition-all text-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                🔄 Làm lại
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Topic type without teacher questions — show content placeholder
  if (step.step_type === "topic" && totalQ === 0) {
    return (
      <div className="sd-page">
        <main className="max-w-xl mx-auto px-4 py-6 flex-1 flex flex-col justify-center space-y-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/student/dashboard?view=1")}
              className="text-slate-500 hover:text-slate-800 font-black text-sm flex items-center gap-1 transition-colors cursor-pointer"
            >
              ← Quay lại
            </button>
            <h1 className="font-black text-slate-800 text-lg">{step.topic_label ?? "Bài học"}</h1>
            <div className="w-12" />
          </div>
          <TopicContent step={step} />
          <button
            onClick={handleCompleteTopic}
            disabled={submitting}
            className="w-full py-4 px-6 font-black text-white bg-teal-500 hover:bg-teal-600 active:scale-[0.98] border-b-[4px] border-teal-700 rounded-full transition-all text-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {submitting ? "⏳ Đang lưu..." : "Hoàn thành bài học"}
          </button>
          <div className="mt-4">
            <StudentChatbot />
          </div>
        </main>
      </div>
    );
  }

  // Question-set type, or topic type with teacher questions
  const questions = step.questions ?? [];

  return (
    <div className="sd-page">
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6 flex-1 flex flex-col justify-start">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => router.push("/student/dashboard?view=1")}
            className="text-slate-500 hover:text-slate-800 font-black text-sm flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Thoát
          </button>
          <h1 className="font-black text-slate-800 text-lg flex items-center gap-2">
            📝 Bài kiểm tra
          </h1>
          <span className="bg-teal-50 border border-teal-100 text-teal-600 px-3.5 py-1 rounded-full text-xs font-black shrink-0">
            Câu {answeredCount}/{totalQ}
          </span>
        </div>
        {/* Progress - Rounded style */}
        <div className="w-full mt-1">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/50">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className={`flex-1 h-full transition-all duration-300
                  ${selectedAnswers[q.id] ? "bg-emerald-400" : "bg-transparent"}
                  ${idx < questions.length - 1 ? "border-r border-slate-200/40" : ""}
                `}
              />
            ))}
          </div>
        </div>
        {/* Current question */}
        {questions[currentQ] && (
          <QuizQuestion
            question={questions[currentQ]}
            index={currentQ}
            selected={selectedAnswers[questions[currentQ].id] ?? null}
            onSelect={(opt) => handleSelectAnswer(questions[currentQ].id, opt)}
          />
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-2">
          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ((q) => q - 1)}
              className="flex-1 py-4 px-6 font-black text-slate-700 bg-amber-400 hover:bg-amber-500 active:scale-[0.98] border-b-[4px] border-amber-600 rounded-full transition-all text-base flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              ← Câu trước
            </button>
          )}
          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              disabled={!selectedAnswers[questions[currentQ]?.id]}
              className="flex-1 py-4 px-6 font-black text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] border-b-[4px] border-rose-700 rounded-full transition-all text-base flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Câu tiếp →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="flex-1 py-4 px-6 font-black text-white bg-teal-500 hover:bg-teal-600 active:scale-[0.98] border-b-[4px] border-teal-700 rounded-full transition-all text-base flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "⏳ Đang nộp..." : "🎯 Nộp bài!"}
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex flex-wrap gap-2.5 justify-center pt-3 border-t border-slate-200/40">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQ(i)}
              className={`w-11 h-11 rounded-full text-sm font-black transition-all duration-200 shadow-sm flex items-center justify-center cursor-pointer border-[2px]
                ${i === currentQ ? "bg-rose-500 text-white scale-110 border-rose-600 shadow-md" :
                  selectedAnswers[q.id] ? "bg-emerald-500 text-white border-emerald-600" :
                  "bg-white text-slate-500 border-slate-200 hover:scale-105"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <StudentChatbot />
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @keyframes fade-up {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(15deg); opacity: 0.9; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .animate-fade-up {
          animation: fade-up 0.4s ease-out both;
        }
        .animate-pop {
          animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .animate-sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
