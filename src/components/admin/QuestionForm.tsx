import { useState } from "react";
import { AdminQuestion, TOPIC_VALUES, topicLabels } from "../../lib/store";
import { QuizTopic } from "../../data/quizQuestions";

type Draft = Omit<AdminQuestion, "id" | "created_at" | "updated_at">;

type Props = {
  initial?: AdminQuestion | null;
  draft?: Draft | null;
  onSave: (data: Draft) => void;
  onCancel: () => void;
  topics?: Array<{ slug: string; label: string }>;
};

const empty: Draft = {
  question: "",
  category: "stranger",
  option_a: "",
  option_b: "",
  option_c: "",
  correct_option: "A",
  explanation: "",
  is_active: true,
  min_age: 6,
  max_age: 99,
  target_gender: "all",
  image_url: "",
};

export function QuestionForm({ initial, draft: initialDraft, onSave, onCancel, topics }: Props) {
  const [draft, setDraft] = useState<Draft>(
    initial
      ? {
          question: initial.question,
          category: initial.category,
          option_a: initial.option_a,
          option_b: initial.option_b,
          option_c: initial.option_c,
          correct_option: initial.correct_option,
          explanation: initial.explanation,
          is_active: initial.is_active,
          min_age: initial.min_age ?? 6,
          max_age: initial.max_age ?? 99,
          target_gender: initial.target_gender ?? "all",
          image_url: initial.image_url ?? "",
        }
      : initialDraft ?? empty,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!draft.question.trim()) e.question = "Câu hỏi không được trống";
    if (!draft.option_a.trim()) e.option_a = "Bắt buộc";
    if (!draft.option_b.trim()) e.option_b = "Bắt buộc";
    if (!draft.option_c.trim()) e.option_c = "Bắt buộc";
    if (!["A", "B", "C"].includes(draft.correct_option))
      e.correct_option = "Chọn A/B/C";
    if (!draft.category) e.category = "Bắt buộc";
    const minAge = Number(draft.min_age ?? 6);
    const maxAge = Number(draft.max_age ?? 99);
    if (!Number.isFinite(minAge) || minAge < 5) e.min_age = "Tuổi tối thiểu không hợp lệ";
    if (!Number.isFinite(maxAge) || maxAge > 99) e.max_age = "Tuổi tối đa không hợp lệ";
    if (Number.isFinite(minAge) && Number.isFinite(maxAge) && minAge > maxAge) {
      e.max_age = "Tuổi tối đa phải lớn hơn hoặc bằng tuổi tối thiểu";
    }
    if (!["all", "male", "female"].includes(draft.target_gender ?? "all")) {
      e.target_gender = "Chọn nhóm phù hợp";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(draft);
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-800 font-semibold text-lg">
            {initial ? "Sửa câu hỏi" : "Thêm câu hỏi"}
          </h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Câu hỏi" error={errors.question}>
            <textarea
              value={draft.question}
              onChange={(e) => set("question", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none"
            />
          </Field>

          <Field label="Đường dẫn ảnh/video/âm thanh đa phương tiện (không bắt buộc)">
            <input
              type="text"
              placeholder="Ví dụ: https://example.com/audio.mp3"
              value={draft.image_url ?? ""}
              onChange={(e) => set("image_url", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none"
            />
          </Field>

          <Field label="Chủ đề" error={errors.category}>
            <select
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none bg-white"
            >
              {topics && topics.length > 0 ? (
                topics.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))
              ) : (
                TOPIC_VALUES.map((t) => (
                  <option key={t} value={t}>
                    {topicLabels[t as QuizTopic]}
                  </option>
                ))
              )}
            </select>
          </Field>

          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Đáp án A" error={errors.option_a}>
              <input
                value={draft.option_a}
                onChange={(e) => set("option_a", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none"
              />
            </Field>
            <Field label="Đáp án B" error={errors.option_b}>
              <input
                value={draft.option_b}
                onChange={(e) => set("option_b", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none"
              />
            </Field>
            <Field label="Đáp án C" error={errors.option_c}>
              <input
                value={draft.option_c}
                onChange={(e) => set("option_c", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Đáp án đúng" error={errors.correct_option}>
              <div className="flex gap-2">
                {(["A", "B", "C"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("correct_option", c)}
                    className={`flex-1 py-2 rounded-xl border-2 transition ${
                      draft.correct_option === c
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Trạng thái">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                  className="w-5 h-5"
                />
                <span>{draft.is_active ? "Active" : "Inactive"}</span>
              </label>
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Tuổi tối thiểu" error={errors.min_age}>
              <input
                type="number"
                min={5}
                max={99}
                value={draft.min_age ?? 6}
                onChange={(e) => set("min_age", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none"
              />
            </Field>
            <Field label="Tuổi tối đa" error={errors.max_age}>
              <input
                type="number"
                min={5}
                max={99}
                value={draft.max_age ?? 99}
                onChange={(e) => set("max_age", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none"
              />
            </Field>
            <Field label="Nhóm học sinh" error={errors.target_gender}>
              <select
                value={draft.target_gender ?? "all"}
                onChange={(e) =>
                  set("target_gender", e.target.value as "all" | "male" | "female")
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none bg-white"
              >
                <option value="all">Tất cả</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </Field>
          </div>

          <Field label="Giải thích (không bắt buộc)">
            <textarea
              value={draft.explanation}
              onChange={(e) => set("explanation", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 outline-none"
            />
          </Field>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {initial ? "Lưu thay đổi" : "Tạo câu hỏi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-rose-600">{error}</p>}
    </div>
  );
}
