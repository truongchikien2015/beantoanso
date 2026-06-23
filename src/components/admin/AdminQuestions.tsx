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
import {
  getAiQuestionGenerationAvailability,
  generateGrokQuestion,
  type AiProviderId,
  type AiProviderStatus,
} from "../../lib/grokApi";
import { getYouTubeEmbedUrl, getMediaType } from "../../lib/mediaUtils";

const topicStyles: Record<string, { icon: string; bg: string; text: string }> = {
  stranger: { icon: "👤", bg: "from-blue-200 to-cyan-200", text: "text-blue-700" },
  phishing: { icon: "🎣", bg: "from-red-200 to-orange-200", text: "text-red-700" },
  password: { icon: "🔑", bg: "from-orange-200 to-pink-200", text: "text-indigo-600" },
  privacy: { icon: "🛡️", bg: "from-green-200 to-emerald-200", text: "text-green-700" },
  behavior: { icon: "🤝", bg: "from-purple-200 to-indigo-200", text: "text-purple-700" },
  screentime: { icon: "⏱️", bg: "from-teal-200 to-emerald-200", text: "text-teal-700" },
  badcontent: { icon: "⚠️", bg: "from-rose-200 to-red-200", text: "text-rose-700" },
};

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
  image_url: string | null;
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
    image_url: row.image_url ?? undefined,
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
    image_url: data.image_url ?? null,
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
  const [usingDb, setUsingDb] = useState(false);
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
  const [previewing, setPreviewing] = useState<AdminQuestion | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminQuestion | null>(
    null,
  );
  const PAGE_SIZE = 20;

  const loadQuestions = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const adminPassword = Admin.getPassword();
      const res = await fetch("/api/admin/questions", {
        headers: { "x-admin-password": adminPassword },
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.data) {
        setItems(body.data.map(fromDbQuestion));
        setUsingDb(true);
      } else {
        setUsingDb(false);
        setLoadError(`Không tải được câu hỏi: ${body.error ?? "Lỗi máy chủ"}`);
        setItems(Questions.list());
      }
    } catch (err: any) {
      setUsingDb(false);
      setLoadError(`Không tải được câu hỏi: ${err.message}`);
      setItems(Questions.list());
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    void loadQuestions();
  };

  useEffect(() => {
    void loadQuestions();
    
    async function loadTopics() {
      try {
        const adminPassword = Admin.getPassword();
        const res = await fetch("/api/admin/topics", {
          headers: { "x-admin-password": adminPassword },
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.data) {
          setDbTopics(body.data.map((t: any) => ({ slug: t.slug, label: t.label })));
        } else {
          const local = Topics.list();
          if (local && local.length > 0) {
            setDbTopics(local.map(t => ({ slug: t.slug, label: t.label })));
          } else {
            setDbTopics(TOPIC_VALUES.map(t => ({ slug: t, label: topicLabels[t] })));
          }
        }
      } catch {
        const local = Topics.list();
        if (local && local.length > 0) {
          setDbTopics(local.map(t => ({ slug: t.slug, label: t.label })));
        } else {
          setDbTopics(TOPIC_VALUES.map(t => ({ slug: t, label: topicLabels[t] })));
        }
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
    const adminPassword = Admin.getPassword();
    const payload = toDbQuestion(data);

    try {
      let res;
      if (editing) {
        res = await fetch(`/api/admin/questions/${editing.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminPassword,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminPassword,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setLoadError(`Không lưu được câu hỏi: ${body.error ?? "Lỗi máy chủ"}`);
        return;
      }

      setCreating(false);
      setEditing(null);
      setGeneratedDraft(null);
      refresh();
    } catch (err: any) {
      setLoadError(`Không lưu được câu hỏi: ${err.message}`);
    }
  };

  const handleToggleQuestion = async (question: AdminQuestion) => {
    const adminPassword = Admin.getPassword();
    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ is_active: !question.is_active }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setLoadError(`Không cập nhật trạng thái: ${body.error ?? "Lỗi máy chủ"}`);
        return;
      }
      refresh();
    } catch (err: any) {
      setLoadError(`Không cập nhật trạng thái: ${err.message}`);
    }
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
                AI sẽ tạo nháp, admin cần xem lại rồi mới lưu vào cơ sở dữ liệu.
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
                disabled={generating || !usingDb || !selectedProviderAvailable}
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
            {!usingDb && (
              <p className="mt-2 text-sm text-amber-700">
                Cần kết nối Database để lưu câu hỏi AI cho luồng nhiệm vụ.
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
                          onClick={() => setPreviewing(q)}
                          className="px-2 py-1 rounded-md hover:bg-sky-50 text-sky-600"
                        >
                          👁️ Xem trước
                        </button>
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

      {previewing && (
        <QuestionPreviewModal
          question={previewing}
          dbTopics={dbTopics}
          onCancel={() => setPreviewing(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xóa câu hỏi?"
          message={`"${confirmDelete.question}" sẽ bị xóa vĩnh viễn.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const adminPassword = Admin.getPassword();
            try {
              const res = await fetch(`/api/admin/questions/${confirmDelete.id}`, {
                method: "DELETE",
                headers: {
                  "x-admin-password": adminPassword,
                },
              });
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setLoadError(`Không xóa được câu hỏi: ${body.error ?? "Lỗi máy chủ"}`);
              }
              setConfirmDelete(null);
              refresh();
            } catch (err: any) {
              setLoadError(`Không xóa được câu hỏi: ${err.message}`);
              setConfirmDelete(null);
            }
          }}
        />
      )}
    </div>
  );
}

function QuestionPreviewModal({
  question,
  dbTopics,
  onCancel,
}: {
  question: AdminQuestion;
  dbTopics: Array<{ slug: string; label: string }>;
  onCancel: () => void;
}) {
  const style = topicStyles[question.category] || { icon: "✨", bg: "from-sky-100 to-blue-100", text: "text-indigo-700" };
  const topicLabel = dbTopics.find(t => t.slug === question.category)?.label || topicLabels[question.category as QuizTopic] || question.category;

  const options = [
    { key: "A", text: question.option_a },
    { key: "B", text: question.option_b },
    { key: "C", text: question.option_c },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col pt-10 px-4 overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto flex justify-end mb-4 relative z-10">
        <button
          onClick={onCancel}
          className="bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="w-full max-w-5xl mx-auto pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Question Card */}
          <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className={`w-32 h-32 mt-4 mb-6 rounded-3xl bg-gradient-to-b ${style.bg} flex items-center justify-center text-6xl shadow-inner border border-white/50`}>
              {style.icon}
            </div>
            
            <h2 className={`text-2xl font-semibold mb-6 ${style.text}`}>
              {topicLabel}
            </h2>

            {/* Multimedia (if available) */}
            {question.image_url && (() => {
              const mediaType = getMediaType(question.image_url);
              const embedUrl = getYouTubeEmbedUrl(question.image_url);
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

            <div className="bg-amber-50/80 rounded-[24px] p-5 border border-amber-100 w-full mb-8">
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">📖</span>
                <p className="text-[17px] text-left text-slate-700 font-medium flex-1 leading-relaxed">
                  {question.question}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    🔊
                  </button>
                  <button
                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    🎙️
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-3 w-full">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-md shrink-0 border border-blue-400">
                🤖
              </div>
              <div className="bg-white border border-sky-100 rounded-2xl rounded-bl-none p-4 text-[15px] text-slate-600 flex-1 text-left relative shadow-sm">
                Em hãy đọc kỹ rồi chọn câu trả lời đúng nhé!
                {/* Optional speech bubble tail */}
                <div className="absolute -left-2 bottom-0 w-3 h-3 bg-white border-b border-l border-sky-100 transform translate-y-[2px] rotate-45" />
              </div>
            </div>
          </div>

          {/* Right Column: Options & Next Button */}
          <div className="flex flex-col gap-4 justify-center h-full pt-4 md:pt-10">
            {options.map((opt) => {
              const isCorrect = opt.key === question.correct_option;
              
              const btnClass = isCorrect 
                ? "bg-emerald-50 border-emerald-300 shadow-md scale-[1.02]" 
                : "bg-white border-slate-100 opacity-50";
              const circleClass = isCorrect
                ? "bg-emerald-500 text-white"
                : "bg-slate-300 text-slate-500";

              return (
                <button
                  key={opt.key}
                  disabled
                  className={`w-full text-left p-4 rounded-[28px] border-2 flex items-center gap-4 ${btnClass}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${circleClass}`}>
                    {opt.key}
                  </div>
                  <span className={`text-[17px] font-medium ${isCorrect ? "text-emerald-800" : "text-slate-700"}`}>
                    {opt.text}
                  </span>
                </button>
              );
            })}

            <div
              className={`mt-2 p-5 rounded-3xl border-2 bg-emerald-50 border-emerald-200 text-emerald-800`}
            >
              <p className="font-semibold text-lg mb-2">
                🎉 Chính xác!
              </p>
              {question.explanation && <p className="opacity-90">{question.explanation}</p>}
            </div>
          </div>
        </div>
      </div>
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
