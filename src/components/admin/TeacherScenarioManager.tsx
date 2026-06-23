"use client";

import { useEffect, useState, useCallback } from "react";
import { useTeacherContentStore } from "@/lib/teacherContentStore";
import { topicLabels, QuizTopic } from "@/data/quizQuestions";
import { generateGrokQuestion, getAiQuestionGenerationAvailability, AiProviderId, AiAvailability } from "@/lib/grokApi";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Tag,
  Search,
  RefreshCw,
  Eye
} from "lucide-react";

export function TeacherScenarioManager() {
  const {
    questionSets,
    questions,
    loading,
    error,
    topics,
    fetchQuestionSets,
    createQuestionSet,
    fetchQuestionsForSet,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    fetchTopics,
    clearError,
    setError
  } = useTeacherContentStore();

  // Search, filter, edit states
  const [search, setSearch] = useState("");
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"manual" | "ai">("manual");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // AI Generation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTopic, setAiTopic] = useState<string>("stranger");
  const [aiMinAge, setAiMinAge] = useState<number>(6);
  const [aiMaxAge, setAiMaxAge] = useState<number>(11);
  const [aiGender, setAiGender] = useState<"all" | "male" | "female">("all");
  const [aiProvider, setAiProvider] = useState<AiProviderId>("grok");
  const [aiAvailability, setAiAvailability] = useState<AiAvailability | null>(null);

  // Question Form State (for both manual and AI-edited)
  const [formTopic, setFormTopic] = useState<string>("stranger");
  const [formQuestion, setFormQuestion] = useState("");
  const [formOptionA, setFormOptionA] = useState("");
  const [formOptionB, setFormOptionB] = useState("");
  const [formOptionC, setFormOptionC] = useState("");
  const [formCorrectOption, setFormCorrectOption] = useState<"A" | "B" | "C">("A");
  const [formExplanation, setFormExplanation] = useState("");

  // All topic options (default + custom)
  const allTopicOptions = [
    ...Object.entries(topicLabels).map(([value, label]) => ({ value, label })),
    ...topics.filter((t) => !t.is_default && t.id).map((t) => ({ value: t.topic_key, label: t.label })),
  ];

  // Get label for a topic
  const getTopicLabel = (topicId: string) => {
    if (topicLabels[topicId as QuizTopic]) return topicLabels[topicId as QuizTopic];
    const custom = topics.find((t) => t.topic_key === topicId);
    return custom?.label ?? topicId;
  };

  // Load initial data
  useEffect(() => {
    const init = async () => {
      await fetchTopics();
      await fetchQuestionSets();
      
      // Load availability of AI generator
      try {
        const avail = await getAiQuestionGenerationAvailability();
        setAiAvailability(avail);
        if (avail?.defaultProvider) {
          setAiProvider(avail.defaultProvider);
        }
      } catch (err) {
        console.error("Lỗi kiểm tra trạng thái AI:", err);
      }
    };
    init();
  }, []);

  // Filter scenario question sets (prefixed with "Kho tình huống - ")
  const scenarioSets = questionSets.filter((s) => s.title.startsWith("Kho tình huống - "));

  // Fetch questions for all scenario sets when sets are fetched
  useEffect(() => {
    if (scenarioSets.length > 0) {
      scenarioSets.forEach((set) => {
        fetchQuestionsForSet(set.id);
      });
    }
  }, [questionSets]);

  // Combined list of scenario questions
  const scenarioQuestions = questions.filter((q) =>
    scenarioSets.some((set) => set.id === q.set_id)
  );

  // Apply filters and search
  const filteredQuestions = scenarioQuestions.filter((q) => {
    const set = scenarioSets.find((s) => s.id === q.set_id);
    if (!set) return false;
    const matchTopic = selectedTopicFilter === "all" || set.topic_id === selectedTopicFilter;
    const matchSearch =
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.option_a.toLowerCase().includes(search.toLowerCase()) ||
      q.option_b.toLowerCase().includes(search.toLowerCase()) ||
      q.option_c.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchSearch;
  });

  // Handle AI Question Generation
  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) {
      setError("Vui lòng nhập mô tả tình huống để AI tạo câu hỏi.");
      return;
    }
    
    setAiLoading(true);
    clearError();

    const selectedTopicObj = allTopicOptions.find((o) => o.value === aiTopic);
    const topicLabel = selectedTopicObj?.label ?? aiTopic;

    try {
      const generated = await generateGrokQuestion({
        provider: aiProvider,
        topicSlug: aiTopic,
        topicLabel,
        minAge: aiMinAge,
        maxAge: aiMaxAge,
        targetGender: aiGender,
        teacherPrompt: aiPrompt.trim(),
      });

      // Populate manual form with AI generated results and switch tab
      setFormTopic(aiTopic);
      setFormQuestion(generated.question);
      setFormOptionA(generated.option_a);
      setFormOptionB(generated.option_b);
      setFormOptionC(generated.option_c);
      setFormCorrectOption(generated.correct_option);
      setFormExplanation(generated.explanation);
      
      setActiveFormTab("manual");
    } catch (err: any) {
      setError(err.message ?? "Lỗi không thể sinh câu hỏi bằng AI. Vui lòng thử lại.");
    } finally {
      setAiLoading(false);
    }
  };

  // Helper to ensure a question set exists for a specific topic, then save the question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formQuestion.trim() ||
      !formOptionA.trim() ||
      !formOptionB.trim() ||
      !formOptionC.trim()
    ) {
      setError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    clearError();

    try {
      // Find or create a scenario question set for the selected topic
      let targetSet = scenarioSets.find((s) => s.topic_id === formTopic);
      if (!targetSet) {
        const topicLabel = getTopicLabel(formTopic);
        const created = await createQuestionSet({
          title: `Kho tình huống - ${topicLabel}`,
          topic_id: formTopic,
          description: `Bộ câu hỏi tình huống tự động thu thập cho chủ đề ${topicLabel}`,
        });
        if (!created) {
          throw new Error("Không thể khởi tạo Bộ câu hỏi cho chủ đề này.");
        }
        targetSet = created;
      }

      if (editingQuestionId) {
        // Edit mode
        await updateQuestion(editingQuestionId, {
          question: formQuestion.trim(),
          option_a: formOptionA.trim(),
          option_b: formOptionB.trim(),
          option_c: formOptionC.trim(),
          correct_option: formCorrectOption,
          explanation: formExplanation.trim() || undefined,
        });
        setEditingQuestionId(null);
      } else {
        // Create mode
        await createQuestion(targetSet.id, {
          question: formQuestion.trim(),
          option_a: formOptionA.trim(),
          option_b: formOptionB.trim(),
          option_c: formOptionC.trim(),
          correct_option: formCorrectOption,
          explanation: formExplanation.trim() || undefined,
        });
      }

      // Reset form states
      setFormQuestion("");
      setFormOptionA("");
      setFormOptionB("");
      setFormOptionC("");
      setFormCorrectOption("A");
      setFormExplanation("");
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message ?? "Lỗi khi lưu câu hỏi.");
    }
  };

  // Open modal for editing
  const startEdit = (q: typeof questions[0]) => {
    const parentSet = questionSets.find((s) => s.id === q.set_id);
    if (!parentSet) return;

    setEditingQuestionId(q.id);
    setFormTopic(parentSet.topic_id);
    setFormQuestion(q.question);
    setFormOptionA(q.option_a);
    setFormOptionB(q.option_b);
    setFormOptionC(q.option_c);
    setFormCorrectOption(q.correct_option as "A" | "B" | "C");
    setFormExplanation(q.explanation ?? "");
    setActiveFormTab("manual");
    setShowAddModal(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa câu hỏi tình huống này khỏi kho đóng góp không?")) {
      await deleteQuestion(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            💡 Kho tình huống đóng góp
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Đóng góp tình huống thực tế tự biên soạn hoặc sử dụng Grok AI hỗ trợ thiết lập câu hỏi.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingQuestionId(null);
            setFormQuestion("");
            setFormOptionA("");
            setFormOptionB("");
            setFormOptionC("");
            setFormCorrectOption("A");
            setFormExplanation("");
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
        >
          <Plus size={16} /> Đóng góp tình huống
        </button>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            📚
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Tổng số tình huống</p>
            <p className="text-xl font-bold text-slate-800">{scenarioQuestions.length} câu hỏi</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🎒
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Chủ đề đóng góp</p>
            <p className="text-xl font-bold text-slate-800">{scenarioSets.length} chủ đề</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            🌐
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Trạng thái phát hành</p>
            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đã nạp vào Daily Quiz học sinh
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nội dung câu hỏi hoặc phương án..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-400 text-sm"
          />
        </div>
        <div className="w-full md:w-60">
          <select
            value={selectedTopicFilter}
            onChange={(e) => setSelectedTopicFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-400 text-sm bg-white"
          >
            <option value="all">Tất cả chủ đề</option>
            {allTopicOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-start justify-between gap-3">
          <div className="flex gap-2">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="hover:text-rose-900">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Questions list */}
      <div className="grid grid-cols-1 gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <HelpCircle className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium">Không tìm thấy câu hỏi tình huống phù hợp.</p>
            <p className="text-xs text-slate-400 mt-1">Hãy nhấn nút &ldquo;Đóng góp tình huống&rdquo; ở góc trên để bắt đầu soạn bài.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const set = questionSets.find((s) => s.id === q.set_id);
            const topicLabel = set ? getTopicLabel(set.topic_id) : "";

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      {topicLabel}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-relaxed">
                    {q.question}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className={`p-2.5 rounded-xl border ${q.correct_option === "A" ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-bold" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                      <span className="opacity-60 mr-1.5 font-bold">A.</span> {q.option_a}
                      {q.correct_option === "A" && <span className="float-right text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">ĐÚNG</span>}
                    </div>
                    <div className={`p-2.5 rounded-xl border ${q.correct_option === "B" ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-bold" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                      <span className="opacity-60 mr-1.5 font-bold">B.</span> {q.option_b}
                      {q.correct_option === "B" && <span className="float-right text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">ĐÚNG</span>}
                    </div>
                    <div className={`p-2.5 rounded-xl border ${q.correct_option === "C" ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-bold" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                      <span className="opacity-60 mr-1.5 font-bold">C.</span> {q.option_c}
                      {q.correct_option === "C" && <span className="float-right text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">ĐÚNG</span>}
                    </div>
                  </div>
                  {q.explanation && (
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed">
                      <span className="font-bold flex items-center gap-1 mb-0.5">ℹ️ Giải thích đáp án:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
                <div className="flex md:flex-col items-center justify-end gap-1 flex-shrink-0 pt-2 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => startEdit(q)}
                    className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="Chỉnh sửa"
                  >
                    <Edit2 size={15} /> <span className="md:hidden">Sửa</span>
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="Xóa tình huống"
                  >
                    <Trash2 size={15} /> <span className="md:hidden">Xóa</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                {editingQuestionId ? "📝 Chỉnh sửa câu hỏi tình huống" : "💡 Đóng góp tình huống mới"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form tabs */}
            {!editingQuestionId && (
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => {
                    setActiveFormTab("manual");
                    clearError();
                  }}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition ${
                    activeFormTab === "manual"
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  ✍️ Tự biên soạn thủ công
                </button>
                <button
                  onClick={() => {
                    setActiveFormTab("ai");
                    clearError();
                  }}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
                    activeFormTab === "ai"
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Sparkles size={16} /> Sinh tự động bằng AI (Grok)
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeFormTab === "ai" ? (
                /* AI Generation Tab */
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs text-indigo-900 leading-relaxed">
                    <p className="font-bold mb-1 flex items-center gap-1">🤖 Hướng dẫn sinh tình huống bằng AI:</p>
                    Nhập chủ đề và gợi ý tình huống thực tế bạn muốn học sinh học. AI Grok sẽ tự động soạn câu hỏi 3 đáp án kèm giải thích sinh động phù hợp nhất với tâm lý lứa tuổi tiểu học.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Chủ đề an toàn số</label>
                      <select
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400 bg-white"
                      >
                        {allTopicOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Trí tuệ nhân tạo (Mô hình)</label>
                      <select
                        value={aiProvider}
                        onChange={(e) => setAiProvider(e.target.value as AiProviderId)}
                        disabled={!aiAvailability?.available}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400 bg-white"
                      >
                        {aiAvailability?.providers.map((p) => (
                          <option key={p.id} value={p.id} disabled={!p.available}>
                            {p.label} {!p.available ? "(Không khả dụng)" : ""}
                          </option>
                        )) ?? <option value="grok">Grok AI</option>}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Tuổi tối thiểu</label>
                      <input
                        type="number"
                        min={5}
                        max={99}
                        value={aiMinAge}
                        onChange={(e) => setAiMinAge(parseInt(e.target.value) || 6)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Tuổi tối đa</label>
                      <input
                        type="number"
                        min={5}
                        max={99}
                        value={aiMaxAge}
                        onChange={(e) => setAiMaxAge(parseInt(e.target.value) || 11)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Giới tính mục tiêu</label>
                      <select
                        value={aiGender}
                        onChange={(e) => setAiGender(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400 bg-white"
                      >
                        <option value="all">Tất cả</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Yêu cầu / Mô tả tình huống chi tiết</label>
                    <textarea
                      rows={4}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ví dụ: Một người bạn tự xưng là Admin gửi tin nhắn cho bé trên Discord bảo trúng thưởng điện thoại iPhone 15, yêu cầu bé bấm vào link lạ để điền thông tin địa chỉ nhà..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={aiLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-md hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} /> Đang nhờ AI soạn câu hỏi...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Tạo câu hỏi ngay bằng AI
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Manual Soạn Thảo Tab / AI Editing Tab */
                <form onSubmit={handleSaveQuestion} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Chủ đề an toàn số</label>
                      <select
                        value={formTopic}
                        onChange={(e) => setFormTopic(e.target.value)}
                        disabled={!!editingQuestionId}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400 bg-white disabled:opacity-50"
                      >
                        {allTopicOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Đáp án đúng</label>
                      <select
                        value={formCorrectOption}
                        onChange={(e) => setFormCorrectOption(e.target.value as "A" | "B" | "C")}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400 bg-white"
                      >
                        <option value="A">Đáp án A</option>
                        <option value="B">Đáp án B</option>
                        <option value="C">Đáp án C</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Nội dung câu hỏi tình huống</label>
                    <textarea
                      rows={3}
                      value={formQuestion}
                      onChange={(e) => setFormQuestion(e.target.value)}
                      placeholder="Nhập nội dung câu hỏi hoặc tình huống thực tế cho trẻ em..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-600">Các phương án trả lời</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">A.</span>
                      <input
                        value={formOptionA}
                        onChange={(e) => setFormOptionA(e.target.value)}
                        placeholder="Phương án A"
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">B.</span>
                      <input
                        value={formOptionB}
                        onChange={(e) => setFormOptionB(e.target.value)}
                        placeholder="Phương án B"
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">C.</span>
                      <input
                        value={formOptionC}
                        onChange={(e) => setFormOptionC(e.target.value)}
                        placeholder="Phương án C"
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Giải thích tại sao đáp án đó là đúng</label>
                    <textarea
                      rows={2}
                      value={formExplanation}
                      onChange={(e) => setFormExplanation(e.target.value)}
                      placeholder="Lời khuyên dành cho bé, vì sao đáp án đó là an toàn nhất..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      Lưu tình huống
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
