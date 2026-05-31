"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStudentToken, clearStudentToken } from "@/lib/studentApi";
import type { StudentStepContent, TeacherQuestion } from "@/types/teacher-content";
import { topicLabels } from "@/data/quizQuestions";
import { StudentChatbot } from "@/components/student/StudentChatbot";



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
    <div className="Card p-8 text-center">
      <div className="text-6xl mb-4 animate-bounce-in">📖</div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">{label}</h2>
      <p className="text-slate-500 text-base">Nội dung bài học sẽ được cập nhật sau.</p>
      <div className="mt-6 p-5 bg-[var(--kid-teal-new)]/10 rounded-2xl text-base text-slate-700">
        📚 Bài học này giúp bạn hiểu về chủ đề <span className="font-bold text-[var(--kid-coral-new)]">"{label}"</span>
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
    <div className="card-kid p-6">
      <p className="text-slate-800 font-black text-xl leading-relaxed mb-5">
        <span className="text-[var(--kid-coral-new)] mr-2">Câu {index + 1}.</span>
        {question.question}
      </p>
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selected === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className={`kid-choice w-full text-left px-5 py-4 transition-all
                ${bounceSelected === opt.key ? "animate-pop" : ""}
                ${isSelected
                  ? "border-[var(--kid-teal-new)] bg-[var(--kid-teal-new)]/10 text-slate-800 font-bold shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[var(--kid-coral-new)] hover:bg-[var(--kid-coral-new)]/5"
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
      <div className="kid-paper-page flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">📝</div>
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kid-paper-page flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push("/student/dashboard?view=1")} className="btn-kid btn-kid-coral">
            Quay lại
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
    const isGood = score >= 70 && score < 90;

    return (
      <div className="kid-paper-page">
        {passed && <Confetti />}
        <header className="kid-paper-header px-4 py-5">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div />
            <h1 className="font-black text-white text-lg">✨ Kết quả bài kiểm tra ✨</h1>
            <div />
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
          {/* Score card - Celebration Style */}
          <div className={`Card text-center p-8 ${passed ? "border-4 border-[var(--kid-success)] animate-bounce-in" : "animate-shake"}`}>
            {/* Trophy/Emoji */}
            <div className={`text-8xl mb-4 ${passed ? "animate-bounce-in" : "animate-shake"}`}>
              {isExcellent ? "🏆" : passed ? "🎉" : "💪"}
            </div>
            
            {/* Message */}
            <h1 className="text-2xl font-black text-slate-800 mb-4">
              {isExcellent ? "Xuất sắc lắm!" : passed ? "Chúc mừng bạn!" : "Cố gắng hơn nhé!"}
            </h1>
            
            {/* Score - Big & Bold */}
            <div className={`text-7xl font-black mb-2
              ${isExcellent ? "text-[var(--kid-success)]" : passed ? "text-[var(--kid-teal-new)]" : "text-[var(--kid-coral-new)]"}`}>
              {score}%
            </div>
            
            {/* Stats */}
            <div className="flex justify-center gap-4 text-base">
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--kid-success)]/10 text-[var(--kid-success)] font-bold">
                ✓ {correctCount} đúng
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-bold">
                📝 {totalCount} câu
              </span>
            </div>
            
            {unansweredCount > 0 && (
              <p className="text-sm text-slate-400 mt-2">
                ({unansweredCount} câu chưa trả lời)
              </p>
            )}
            
            {/* Encouragement */}
            <p className="text-base text-slate-500 mt-4">
              {isExcellent ? "🌟 Bạn là ngôi sao sáng nhất!" : 
               passed ? "🎊 Bạn đã hoàn thành bài quiz này!" : 
               "📚 Học lại bài và thử lại nhé!"}
            </p>
            {xpAwarded > 0 && (
              <p className="mt-3 inline-flex rounded-full bg-[var(--kid-yellow-new)]/30 px-4 py-2 text-base font-black text-amber-800">
                +{xpAwarded} XP tích lũy
              </p>
            )}
          </div>

          {/* Answer breakdown - Kid Friendly */}
          {answerBreakdown.length > 0 && (
            <div className="Card p-6">
              <h2 className="flex items-center gap-2 font-black text-slate-800 text-lg mb-4">
                📋 Xem lại đáp án
              </h2>
              <div className="space-y-4">
                {answerBreakdown.map((item, index) => (
                  <div
                    key={item.question_id}
                    className={`p-5 rounded-2xl border-[3px] animate-fade-up ${
                      item.is_correct
                        ? "bg-[var(--kid-success)]/10 border-[var(--kid-success)]"
                        : "bg-[var(--kid-coral-new)]/10 border-[var(--kid-coral-new)]/50"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white
                        ${item.is_correct ? "bg-[var(--kid-success)]" : "bg-[var(--kid-coral-new)]"}`}>
                        {item.is_correct ? "✓" : "✗"}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-base">
                          <span className="text-[var(--kid-teal-new)] mr-1">Câu {index + 1}.</span>
                          {item.question}
                        </p>
                      </div>
                      {item.is_correct && (
                        <span className="text-2xl animate-sparkle">⭐</span>
                      )}
                    </div>

                    {/* Options display - Kid Friendly */}
                    <div className="space-y-2 sm:pl-13">
                      {(["A", "B", "C"] as const).map((opt) => {
                        const optionText = opt === "A" ? item.option_a : opt === "B" ? item.option_b : item.option_c;
                        const isSelected = item.selected_option === opt;
                        const isCorrect = item.correct_option === opt;

                        let style = "bg-slate-100 text-slate-500";
                        let icon = "";
                        if (isCorrect) {
                          style = "bg-[var(--kid-success)]/20 text-[var(--kid-success)] font-bold";
                          icon = " ✓";
                        } else if (isSelected && !isCorrect) {
                          style = "bg-[var(--kid-coral-new)]/20 text-[var(--kid-coral-new)] line-through";
                          icon = " ✗";
                        }

                        return (
                          <div key={opt} className={`px-4 py-3 rounded-xl text-base ${style}`}>
                            <span className="font-black mr-2">{opt}.</span>
                            {optionText}{icon}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation - Friendly Style */}
                    {item.explanation && (
                      <div className={`mt-4 p-4 rounded-xl text-base ${
                        item.is_correct 
                          ? "bg-[var(--kid-success)]/20 text-[var(--kid-success)]" 
                          : "bg-[var(--kid-yellow-new)]/30 text-amber-800"
                      }`}>
                        <p className="font-bold mb-1 flex items-center gap-2">
                          <span className="text-xl">💡</span> Giải thích:
                        </p>
                        <p className="leading-relaxed">{item.explanation}</p>
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
              className="btn-kid btn-kid-coral w-full justify-center py-4 text-lg"
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
                className="btn-kid btn-kid-teal w-full justify-center py-4 text-lg"
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
      <div className="kid-paper-page">
        <header className="kid-paper-header px-4 py-4">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <button onClick={() => router.push("/student/dashboard?view=1")} className="min-h-12 text-white/85 hover:text-white font-bold">
              ← Quay lại
            </button>
            <h1 className="font-semibold">{step.topic_label ?? "Bài học"}</h1>
            <div className="w-16" />
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 py-6">
          <TopicContent step={step} />
          <button
            onClick={handleCompleteTopic}
            disabled={submitting}
            className="btn-kid btn-kid-teal w-full justify-center mt-4 py-3"
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
    <div className="kid-paper-page">
      {/* Header - Adventure Theme */}
      <header className="kid-paper-header px-4 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.push("/student/dashboard?view=1")}
            className="min-h-12 text-white/85 hover:text-white font-bold text-sm flex items-center gap-1"
          >
            ← Thoát
          </button>
          <h1 className="font-black text-white text-lg flex items-center gap-2">
            📝 Bài kiểm tra
          </h1>
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
            {answeredCount}/{totalQ}
          </span>
        </div>
        {/* Progress - Star Style */}
        <div className="max-w-xl mx-auto mt-3">
          <div className="w-full h-3 bg-white/30 rounded-full overflow-hidden flex">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className={`flex-1 h-full transition-all
                  ${selectedAnswers[q.id] ? "bg-[var(--kid-success)]" : "bg-white/30"}
                  ${idx === 0 ? "rounded-l-full" : ""}
                  ${idx === questions.length - 1 ? "rounded-r-full" : ""}
                `}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Current question */}
        {questions[currentQ] && (
          <QuizQuestion
            question={questions[currentQ]}
            index={currentQ}
            selected={selectedAnswers[questions[currentQ].id] ?? null}
            onSelect={(opt) => handleSelectAnswer(questions[currentQ].id, opt)}
          />
        )}

        {/* Navigation - Kid Friendly */}
        <div className="flex gap-3">
          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ((q) => q - 1)}
              className="btn-kid btn-kid-yellow flex-1 justify-center py-4 text-base"
            >
              ← Câu trước
            </button>
          )}
          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              disabled={!selectedAnswers[questions[currentQ]?.id]}
              className="btn-kid btn-kid-coral flex-1 justify-center py-4 text-base disabled:opacity-50"
            >
              Câu tiếp →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="btn-kid btn-kid-teal flex-1 justify-center py-4 text-base disabled:opacity-50"
            >
              {submitting ? "⏳ Đang nộp..." : "🎯 Nộp bài!"}
            </button>
          )}
        </div>

        {/* Question dots - Star Navigation */}
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQ(i)}
              className={`w-10 h-10 rounded-full text-sm font-black transition-all shadow-md
                ${i === currentQ ? "bg-[var(--kid-coral-new)] text-white scale-110" :
                  selectedAnswers[q.id] ? "bg-[var(--kid-success)] text-white" :
                  "bg-white text-slate-500 hover:scale-105"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <StudentChatbot />
      </main>
    </div>
  );
}
