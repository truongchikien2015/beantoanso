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
      <section className="card-kid p-6 text-center">
        <div className="mb-3 text-5xl animate-bounce">🔥</div>
        <p className="text-base font-bold text-slate-500">Đang tải 5 câu hôm nay...</p>
      </section>
    );
  }

  if (error || !daily) {
    return (
      <section className="card-kid p-6 text-center">
        <div className="mb-3 text-5xl">⚠️</div>
        <p className="mb-4 font-bold text-[var(--kid-coral-new)]">{error || "Không tải được thử thách"}</p>
        {onBack && (
          <button onClick={onBack} className="btn-kid btn-kid-coral">
            Về bảng học tập
          </button>
        )}
      </section>
    );
  }

  return (
    <section className={`space-y-4 ${compact ? "" : "mx-auto max-w-2xl"}`}>
      <div className="card-kid p-5 bg-gradient-to-r from-amber-50 to-cyan-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[var(--kid-coral-new)]">🔥 Thử thách hôm nay</p>
            <h2 className="mt-1 text-2xl font-black text-slate-800">
              Làm 5 câu để giữ streak
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Lv.{daily.stats.level} · {daily.stats.total_xp} XP · Streak {daily.stats.current_streak} ngày
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 text-center shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">Đã trả lời</p>
            <p className="text-2xl font-black text-[var(--kid-teal-new)]">{answeredCount}/{total}</p>
          </div>
        </div>
        {daily.completed && daily.result && (
          <div className="mt-4 rounded-2xl bg-white/80 p-4 text-center">
            <p className="text-lg font-black text-slate-800">
              Hôm nay em đã hoàn thành: {daily.result.correct_count}/{daily.result.total} câu đúng
            </p>
            <p className="text-sm font-bold text-[var(--kid-success)]">
              +{daily.result.xp_awarded} XP đã được cộng vào tài khoản
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {daily.questions.map((question, index) => {
          const result = resultMap.get(question.id);
          return (
            <section key={question.id} className="card-kid p-5">
              <p className="mb-4 text-lg font-black leading-relaxed text-slate-800">
                <span className="mr-2 text-[var(--kid-coral-new)]">Câu {index + 1}.</span>
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
                      className={`kid-choice w-full px-5 py-4 text-left transition-all ${
                        isCorrect
                          ? "border-[var(--kid-success)] bg-[var(--kid-success)]/10 text-[var(--kid-success)]"
                          : isWrong
                            ? "border-[var(--kid-coral-new)] bg-[var(--kid-coral-new)]/10 text-[var(--kid-coral-new)]"
                            : isSelected
                              ? "border-[var(--kid-teal-new)] bg-[var(--kid-teal-new)]/10 font-bold text-slate-800"
                              : "border-slate-200 bg-white text-slate-700 hover:border-[var(--kid-coral-new)]"
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
                <div className="mt-4 rounded-2xl bg-[var(--kid-yellow-new)]/25 p-4 text-sm font-bold text-amber-800">
                  💡 {result.explanation}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {!daily.completed && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="btn-kid btn-kid-teal w-full justify-center py-4 text-lg disabled:opacity-50"
        >
          {submitting ? "⏳ Đang nộp..." : "🎯 Nộp 5 câu hôm nay"}
        </button>
      )}

      {daily.completed && onBack && (
        <button
          onClick={onBack}
          className="btn-kid btn-kid-coral w-full justify-center py-4 text-lg"
        >
          🏠 Về bảng học tập
        </button>
      )}
    </section>
  );
}
