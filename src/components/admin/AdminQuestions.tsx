import { useEffect, useMemo, useState } from "react";
import {
  AdminQuestion,
  Admin,
  Questions,
  TOPIC_VALUES,
  topicLabels,
  Topics,
} from "../../lib/store";
import { QuizTopic } from "../../data/quizQuestions";
import { QuestionForm } from "./QuestionForm";
import { supabase } from "../../lib/supabase";
import {
  getAiQuestionGenerationAvailability,
  generateGrokQuestion,
  type AiProviderId,
  type AiProviderStatus,
} from "../../lib/grokApi";

type QuestionDraft = Omit<AdminQuestion, "id" | "created_at" | "updated_at">;

type DbQuestion = {
  id: string;
  topic_slug: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string | null;
  is_active: boolean;
  min_age: number | null;
  max_age: number | null;
  target_gender: "all" | "male" | "female" | null;
  created_at: string;
  updated_at: string;
};

function fromDbQuestion(row: DbQuestion): AdminQuestion {
  return {
    id: row.id,
    question: row.question,
    category: row.topic_slug,
    option_a: row.option_a,
    option_b: row.option_b,
    option_c: row.option_c,
    correct_option: row.correct_option,
    explanation: row.explanation ?? "",
    is_active: row.is_active,
    min_age: row.min_age ?? 6,
    max_age: row.max_age ?? 99,
    target_gender: row.target_gender ?? "all",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toDbQuestion(data: QuestionDraft) {
  return {
    topic_slug: data.category,
    question: data.question.trim(),
    option_a: data.option_a.trim(),
    option_b: data.option_b.trim(),
    option_c: data.option_c.trim(),
    correct_option: data.correct_option,
    explanation: data.explanation.trim(),
    is_active: data.is_active,
    min_age: data.min_age ?? 6,
    max_age: data.max_age ?? 99,
    target_gender: data.target_gender ?? "all",
    updated_at: new Date().toISOString(),
  };
}

export function AdminQuestions({
  onLogout,
  onHome,
}: {
  onLogout: () => void;
  onHome: () => void;
}) {
  const [items, setItems] = useState<AdminQuestion[]>(() => Questions.list());
  const [loading, setLoading] = useState(false);
  const [usingSupabase, setUsingSupabase] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [dbTopics, setDbTopics] = useState<Array<{ slug: string; label: string }>>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [creating, setCreating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<QuestionDraft | null>(null);
  const [grokAvailable, setGrokAvailable] = useState(false);
  const [aiProviders, setAiProviders] = useState<AiProviderStatus[]>([]);
  const [selectedAiProvider, setSelectedAiProvider] = useState<AiProviderId>("grok");
  const [generating, setGenerating] = useState(false);
  const [generatorTopic, setGeneratorTopic] = useState<string>("stranger");
  const [generatorMinAge, setGeneratorMinAge] = useState(6);
  const [generatorMaxAge, setGeneratorMaxAge] = useState(99);
  const [generatorGender, setGeneratorGender] = useState<"all" | "male" | "female">("all");
  const [generatorPrompt, setGeneratorPrompt] = useState("");
  const [generatorError, setGeneratorError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminQuestion | null>(
    null,
  );
  const PAGE_SIZE = 20;

  const loadQuestions = async () => {
    if (!supabase) {
      setUsingSupabase(false);
      setItems(Questions.list());
      return;
    }

    setLoading(true);
    setLoadError("");
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);
    if (error) {
      setUsingSupabase(false);
      setLoadError(`Không tải được Supabase: ${error.message}`);
      setItems(Questions.list());
      return;
    }

    setUsingSupabase(true);
    setItems(((data || []) as DbQuestion[]).map(fromDbQuestion));
  };

  const refresh = () => {
    void loadQuestions();
  };

  useEffect(() => {
    void loadQuestions();
    
    async function loadTopics() {
      if (supabase) {
        const { data } = await supabase
          .from("topics")
          .select("slug, label")
          .order("topic_order", { ascending: true });
        if (data) {
          setDbTopics(data);
          return;
        }
      }
      const local = Topics.list();
      if (local && local.length > 0) {
        setDbTopics(local.map(t => ({ slug: t.slug, label: t.label })));
      } else {
        setDbTopics(TOPIC_VALUES.map(t => ({ slug: t, label: topicLabels[t] })));
      }
    }
    void loadTopics();
  }, []);

  useEffect(() => {
    let alive = true;
    getAiQuestionGenerationAvailability()
      .then((availability) => {
        if (!alive) return;
        setGrokAvailable(availability.available);
        setAiProviders(availability.providers);
        setSelectedAiProvider(availability.defaultProvider);
      })
      .catch(() => {
        if (!alive) return;
        setGrokAvailable(false);
        setAiProviders([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((q) => {
      if (filter !== "all" && q.category !== filter) return false;
      if (!term) return true;
      return (
        q.question.toLowerCase().includes(term) ||
        q.option_a.toLowerCase().includes(term) ||
        q.option_b.toLowerCase().includes(term) ||
        q.option_c.toLowerCase().includes(term)
      );
    });
  }, [items, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleFilterChange = (val: string) => {
    setFilter(val);
    setPage(1);
  };

  const activeCount = items.filter((i) => i.is_active).length;

  const handleGenerateQuestion = async () => {
    setGeneratorError("");
    setGenerating(true);
    try {
      const minAge = Math.min(generatorMinAge, generatorMaxAge);
      const maxAge = Math.max(generatorMinAge, generatorMaxAge);
      const topicLabel = dbTopics.find(t => t.slug === generatorTopic)?.label || topicLabels[generatorTopic as QuizTopic] || generatorTopic;
      const generated = await generateGrokQuestion({
        provider: selectedAiProvider,
        topicSlug: generatorTopic,
        topicLabel,
        minAge,
        maxAge,
        targetGender: generatorGender,
        teacherPrompt: generatorPrompt,
      });

      setGeneratedDraft({
        question: generated.question,
        category: generatorTopic,
        option_a: generated.option_a,
        option_b: generated.option_b,
        option_c: generated.option_c,
        correct_option: generated.correct_option,
        explanation: generated.explanation,
        is_active: true,
        min_age: generated.min_age,
        max_age: generated.max_age,
        target_gender: generated.target_gender,
      });
      setEditing(null);
      setCreating(true);
    } catch (err) {
      setGeneratorError(
        err instanceof Error ? err.message : "AI chưa tạo được câu hỏi",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveQuestion = async (data: QuestionDraft) => {
    if (!supabase) {
      if (editing) Questions.update(editing.id, data);
      else Questions.create(data);
      setCreating(false);
      setEditing(null);
      setGeneratedDraft(null);
      refresh();
      return;
    }

    const payload = toDbQuestion(data);
    const { error } = editing
      ? await supabase.from("questions").update(payload).eq("id", editing.id)
      : await supabase.from("questions").insert(payload);

    if (error) {
      setLoadError(`Không lưu được câu hỏi: ${error.message}`);
      return;
    }

    setCreating(false);
    setEditing(null);
    setGeneratedDraft(null);
    refresh();
  };

  const handleToggleQuestion = async (question: AdminQuestion) => {
    if (!supabase) {
      Questions.toggle(question.id, !question.is_active);
      refresh();
      return;
    }

    const { error } = await supabase
      .from("questions")
      .update({
        is_active: !question.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", question.id);

    if (error) {
      setLoadError(`Không cập nhật trạng thái: ${error.message}`);
      return;
    }
    refresh();
  };

  const selectedProviderAvailable = aiProviders.some(
    (provider) => provider.id === selectedAiProvider && provider.available,
  );
  const availableProviderCount = aiProviders.filter((provider) => provider.available).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛠️</span>
            <span className="text-slate-800">Quản lý câu hỏi quiz</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onHome}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              🏠 Trang chủ
            </button>
            <button
              onClick={() => {
                Admin.logout();
                onLogout();
              }}
              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <Stat label="Tổng câu hỏi" value={items.length} />
          <Stat label="Đang active" value={activeCount} accent="emerald" />
          <Stat
            label="Inactive"
            value={items.length - activeCount}
            accent="slate"
          />
        </div>

        {loadError && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            {loadError}
          </div>
        )}

        {grokAvailable && (
          <div className="mb-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1">
                <p className="text-slate-800 font-semibold">✨ AI tạo câu hỏi</p>
                <p className="text-sm text-slate-500">
                  AI sẽ tạo nháp, admin cần xem lại rồi mới lưu vào Supabase.
                </p>
              </div>
              {availableProviderCount > 1 && (
                <select
                  value={selectedAiProvider}
                  onChange={(e) => setSelectedAiProvider(e.target.value as AiProviderId)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-white outline-none focus:border-indigo-400"
                >
                  {aiProviders.map((provider) => (
                    <option
                      key={provider.id}
                      value={provider.id}
                      disabled={!provider.available}
                    >
                      {provider.label}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={generatorTopic}
                onChange={(e) => setGeneratorTopic(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white outline-none focus:border-indigo-400"
              >
                {dbTopics.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={5}
                max={99}
                value={generatorMinAge}
                onChange={(e) => setGeneratorMinAge(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400"
                aria-label="Tuổi tối thiểu"
              />
              <input
                type="number"
                min={5}
                max={99}
                value={generatorMaxAge}
                onChange={(e) => setGeneratorMaxAge(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400"
                aria-label="Tuổi tối đa"
              />
              <select
                value={generatorGender}
                onChange={(e) =>
                  setGeneratorGender(e.target.value as "all" | "male" | "female")
                }
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white outline-none focus:border-indigo-400"
              >
                <option value="all">Tất cả</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
              <button
                onClick={handleGenerateQuestion}
                disabled={generating || !usingSupabase || !selectedProviderAvailable}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {generating ? "Đang tạo..." : "AI tạo câu hỏi"}
              </button>
            </div>
            <textarea
              value={generatorPrompt}
              onChange={(e) => setGeneratorPrompt(e.target.value)}
              placeholder="Yêu cầu thêm cho AI (không bắt buộc), ví dụ: tập trung vào lừa đảo qua tin nhắn..."
              rows={2}
              className="mt-3 w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400"
            />
            {!usingSupabase && (
              <p className="mt-2 text-sm text-amber-700">
                Cần kết nối Supabase để lưu câu hỏi AI cho luồng nhiệm vụ.
              </p>
            )}
            {generatorError && (
              <p className="mt-2 text-sm text-rose-600">{generatorError}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-slate-100">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="🔎 Tìm kiếm câu hỏi..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400"
              />
              <select
                value={filter}
                onChange={(e) =>
                  handleFilterChange(e.target.value)
                }
                className="px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-indigo-400 bg-white"
              >
                <option value="all">Tất cả chủ đề</option>
                {dbTopics.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setGeneratedDraft(null);
                setCreating(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              ➕ Thêm câu hỏi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <Th>#</Th>
                  <Th>Câu hỏi</Th>
                  <Th>Chủ đề</Th>
                  <Th>Đáp án</Th>
                  <Th>Trạng thái</Th>
                  <Th>Hành động</Th>
                </tr>
              </thead>
              <tbody>
                {paged.map((q, idx) => (
                  <tr
                    key={q.id}
                    className="border-t border-slate-100 hover:bg-slate-50/50"
                  >
                    <Td>{(page - 1) * PAGE_SIZE + idx + 1}</Td>
                    <Td>
                      <div className="max-w-md">
                        <p className="text-slate-800 line-clamp-2">
                          {q.question}
                        </p>
                        {q.explanation && (
                          <p className="text-slate-500 line-clamp-1 mt-0.5">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap">
                        {dbTopics.find(t => t.slug === q.category)?.label || topicLabels[q.category as QuizTopic] || q.category}
                      </span>
                    </Td>
                    <Td>
                      <span className="inline-block px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">
                        Đúng: {q.correct_option}
                      </span>
                    </Td>
                    <Td>
                      <button
                        onClick={() => {
                          void handleToggleQuestion(q);
                        }}
                        className={`px-2 py-1 rounded-full ${
                          q.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {q.is_active ? "● Active" : "○ Inactive"}
                      </button>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setGeneratedDraft(null);
                            setEditing(q);
                          }}
                          className="px-2 py-1 rounded-md hover:bg-indigo-50 text-indigo-600"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => setConfirmDelete(q)}
                          className="px-2 py-1 rounded-md hover:bg-rose-50 text-rose-600"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-slate-500"
                    >
                      {loading ? "Đang tải câu hỏi..." : "Không tìm thấy câu hỏi nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} câu hỏi
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                      p === page
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {(creating || editing) && (
        <QuestionForm
          initial={editing}
          draft={generatedDraft}
          topics={dbTopics}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
            setGeneratedDraft(null);
          }}
          onSave={(data) => {
            void handleSaveQuestion(data);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xóa câu hỏi?"
          message={`"${confirmDelete.question}" sẽ bị xóa vĩnh viễn.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (!supabase) {
              Questions.remove(confirmDelete.id);
              setConfirmDelete(null);
              refresh();
              return;
            }
            supabase
              .from("questions")
              .delete()
              .eq("id", confirmDelete.id)
              .then(({ error }) => {
                if (error) setLoadError(`Không xóa được câu hỏi: ${error.message}`);
                setConfirmDelete(null);
                refresh();
              });
          }}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "indigo",
}: {
  label: string;
  value: number;
  accent?: "indigo" | "emerald" | "slate";
}) {
  const map = {
    indigo: "from-indigo-500 to-purple-500",
    emerald: "from-emerald-500 to-teal-500",
    slate: "from-slate-400 to-slate-500",
  };
  return (
    <div
      className={`rounded-2xl p-4 text-white bg-gradient-to-br ${map[accent]} shadow-sm`}
    >
      <p className="opacity-80">{label}</p>
      <p className="text-2xl">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-2">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-4">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
