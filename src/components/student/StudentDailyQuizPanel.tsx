"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearStudentToken,
  fetchStudentDailyQuiz,
  submitStudentDailyQuiz,
} from "@/lib/studentApi";
import type {
  StudentDailyQuizAnswer,
  StudentDailyQuizResponse,
} from "@/types/teacher-content";

type Props = {
  onUnauthorized?: () => void;
  onBack?: () => void;
  compact?: boolean;
};

export function StudentDailyQuizPanel({ onUnauthorized, onBack, compact = false }: Props) {
  const [daily, setDaily] = useState<StudentDailyQuizResponse | null>(null);
  const [selected, setSelected] = useState<Record<string, "A" | "B" | "C">>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const answeredCount = Object.keys(selected).length;
  const total = daily?.questions.length ?? 0;
  const allAnswered = total > 0 && answeredCount === total;

  const resultMap = useMemo(() => {
    return new Map(daily?.result?.answers.map((answer) => [answer.question_id, answer]) ?? []);
  }, [daily]);

  useEffect(() => {
    async function loadDaily() {
      try {
        setDaily(await fetchStudentDailyQuiz());
      } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi tải thử thách";
        if (message.includes("Unauthorized") || message.includes("Token") || message.includes("đăng nhập")) {
          clearStudentToken();
          onUnauthorized?.();
          return;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadDaily();
  }, [onUnauthorized]);

  const handleSubmit = async () => {
    if (!daily || !allAnswered) return;
    setSubmitting(true);
    setError("");

    const answers: StudentDailyQuizAnswer[] = daily.questions.map((question) => ({
      question_id: question.id,
      selected_option: selected[question.id],
    }));

    try {
      setDaily(await submitStudentDailyQuiz(answers));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi nộp thử thách");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-[28px] border-[3px] border-slate-200 p-8 text-center animate-fade-up">
        <div className="mb-3 text-5xl animate-bounce">🔥</div>
        <p className="text-base font-extrabold text-slate-500">Đang tải thử thách hôm nay...</p>
      </section>
    );
  }

  if (error || !daily) {
    return (
      <section className="bg-white rounded-[28px] border-[3px] border-red-200 p-8 text-center animate-fade-up">
        <div className="mb-3 text-5xl">⚠️</div>
        <p className="mb-4 font-black text-red-600">{error || "Không tải được thử thách"}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm rounded-full transition"
          >
            Quay lại
          </button>
        )}
      </section>
    );
  }

  return (
    <section className={`space-y-6 ${compact ? "" : "mx-auto max-w-2xl"}`}>
      {/* Daily Streak Card Header */}
      <div className="sd-streak-card-new animate-fade-up">
        <div className="sd-streak-inner">
          <div className="sd-streak-details">
            <span className="sd-streak-badge">THỬ THÁCH HẰNG NGÀY</span>
            <h3 className="sd-streak-title">Làm 5 câu để giữ chuỗi học</h3>
            <p className="sd-streak-desc">
              Cộng điểm XP và duy trì chuỗi ngày liên tiếp của em.
            </p>
            <p className="text-xs font-bold text-amber-700 mt-2">
              Lv.{daily.stats.level} · {daily.stats.total_xp} XP · Chuỗi học {daily.stats.current_streak} ngày
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center border-2 border-amber-200">
            <p className="text-xs font-black uppercase text-amber-600">Đã trả lời</p>
            <p className="text-2xl font-black text-amber-700">{answeredCount}/{total}</p>
          </div>
        </div>
        {daily.completed && daily.result && (
          <div className="mx-8 mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center animate-fade-up">
            <p className="text-lg font-black text-slate-800">
              Hôm nay em đã hoàn thành: {daily.result.correct_count}/{daily.result.total} câu đúng
            </p>
            <p className="text-sm font-bold text-emerald-600">
              +{daily.result.xp_awarded} XP đã được cộng vào tài khoản
            </p>
          </div>
        )}
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {daily.questions.map((question, index) => {
          const result = resultMap.get(question.id);
          return (
            <section
              key={question.id}
              className="bg-white rounded-[28px] border-[3px] border-slate-200/80 p-6 hover:shadow-md transition duration-200 animate-fade-up"
            >
              <p className="mb-4 text-base font-black leading-relaxed text-slate-800">
                <span className="mr-2 text-rose-500">Câu {index + 1}.</span>
                {question.question}
              </p>
              <div className="space-y-3">
                {(["A", "B", "C"] as const).map((optionKey, optionIndex) => {
                  const optionText = question.options[optionIndex];
                  const isSelected = selected[question.id] === optionKey || result?.selected_option === optionKey;
                  const isCorrect = result?.correct_option === optionKey;
                  const isWrong = result && isSelected && !isCorrect;
                  return (
                    <button
                      key={optionKey}
                      type="button"
                      disabled={daily.completed}
                      onClick={() => setSelected((current) => ({ ...current, [question.id]: optionKey }))}
                      className={`w-full px-5 py-4 text-left border-[3px] rounded-2xl min-h-[58px] font-bold text-sm transition-all duration-200 active:scale-[0.99] ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-700"
                          : isWrong
                            ? "border-red-400 bg-red-50/50 text-red-700"
                            : isSelected
                              ? "border-teal-400 bg-teal-50/30 text-slate-800 shadow-sm"
                              : "border-slate-100 bg-white text-slate-600 hover:border-teal-300 hover:text-slate-800"
                      }`}
                    >
                      <span className="mr-2 font-black">{optionKey}.</span>
                      {optionText}
                      {isCorrect && " ✓"}
                      {isWrong && " ✗"}
                    </button>
                  );
                })}
              </div>
              {result?.explanation && (
                <div className="mt-4 rounded-2xl bg-amber-50 border-2 border-amber-200 p-4 text-sm font-bold text-amber-800">
                  💡 {result.explanation}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Action Buttons */}
      {!daily.completed && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white text-lg font-black rounded-3xl shadow-md hover:shadow-lg active:scale-98 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? "⏳ Đang nộp..." : "🎯 Nộp 5 câu hôm nay"}
        </button>
      )}

      {daily.completed && onBack && (
        <button
          onClick={onBack}
          className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white text-lg font-black rounded-3xl shadow-md hover:shadow-lg active:scale-98 transition duration-200 flex items-center justify-center gap-2"
        >
          🏠 Quay lại bảng học tập
        </button>
      )}
    </section>
  );
}

// UX Audit Label Fallback: aria-label
