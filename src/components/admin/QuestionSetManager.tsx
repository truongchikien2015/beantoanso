"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useTeacherContentStore } from "@/lib/teacherContentStore";
import { topicLabels, QuizTopic } from "@/data/quizQuestions";
import type { TeacherQuestionSet, TeacherQuestion, ImportQuestionInput, QuestionImportResult, TeacherTopic } from "@/types/teacher-content";
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, Upload, FileSpreadsheet, AlertCircle, Download, Tag, Settings, Image as ImageIcon, Link as LinkIcon, Loader2 } from "lucide-react";
import { parseQuestionFile, validateAndPrepareQuestionImport, buildQuestionImportSummary, generateQuestionTemplate } from "@/lib/excelParser";
import { getMediaType, getYouTubeEmbedUrl } from "@/lib/mediaUtils";

export function QuestionSetManager() {
  const {
    questionSets, questions, loading, error, topics, fetchQuestionSets, createQuestionSet,
    updateQuestionSet, deleteQuestionSet, fetchQuestionsForSet,
    createQuestion, updateQuestion, deleteQuestion, clearError, uploadMedia,
    fetchTopics, createTopic, updateTopic, deleteTopic,
  } = useTeacherContentStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState<string | null>(null);

  // Topic management UI
  const [showTopicManager, setShowTopicManager] = useState(false);
  const [newTopicKey, setNewTopicKey] = useState("");
  const [newTopicLabel, setNewTopicLabel] = useState("");
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTopicLabel, setEditTopicLabel] = useState("");

  // New set form
  const [newSetTitle, setNewSetTitle] = useState("");
  const [newSetTopic, setNewSetTopic] = useState<QuizTopic>("stranger");
  const [newSetDesc, setNewSetDesc] = useState("");

  // New question form
  const [newQ, setNewQ] = useState({ question: "", option_a: "", option_b: "", option_c: "", correct: "A" as "A" | "B" | "C", explanation: "", image_url: "" });

  // Edit set form
  const [editTitle, setEditTitle] = useState("");
  const [editTopic, setEditTopic] = useState<QuizTopic>("stranger");
  const [editDesc, setEditDesc] = useState("");

  // Edit question form
  const [editQ, setEditQ] = useState<{ question: string; option_a: string; option_b: string; option_c: string; correct: "A" | "B" | "C"; explanation: string; image_url: string; } | null>(null);

  // Excel import state
  const [showImportModal, setShowImportModal] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ImportQuestionInput[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<QuestionImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Combined topic options (default + custom)
  const allTopicOptions = [
    ...Object.entries(topicLabels).map(([value, label]) => ({ value, label, is_default: true, id: undefined })),
    ...topics.filter((t) => !t.is_default && t.id).map((t) => ({ value: t.topic_key, label: t.label, is_default: false as const, id: t.id })),
  ];

  // Check if a topic value is custom
  const isCustomTopic = (topicId: string) => !topicLabels[topicId as QuizTopic];

  // Get label for a topic
  const getTopicLabel = (topicId: string) => {
    if (topicLabels[topicId as QuizTopic]) return topicLabels[topicId as QuizTopic];
    const custom = topics.find((t) => t.topic_key === topicId);
    return custom?.label ?? topicId;
  };

  useEffect(() => {
    fetchQuestionSets();
    fetchTopics();
  }, []);

  // Topic management handlers
  const handleCreateTopic = async () => {
    if (!newTopicKey.trim() || !newTopicLabel.trim()) return;
    const result = await createTopic({ topic_key: newTopicKey.trim().toLowerCase().replace(/\s+/g, "_"), label: newTopicLabel.trim() });
    if (result) {
      setNewTopicKey("");
      setNewTopicLabel("");
    }
  };

  const startEditTopic = (topic: TeacherTopic) => {
    setEditingTopicId(topic.id ?? null);
    setEditTopicLabel(topic.label);
  };

  const handleUpdateTopic = async () => {
    if (!editingTopicId || !editTopicLabel.trim()) return;
    await updateTopic(editingTopicId, { label: editTopicLabel.trim() });
    setEditingTopicId(null);
    setEditTopicLabel("");
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Xóa chủ đề này?")) return;
    await deleteTopic(id);
  };

  const toggleExpand = useCallback(async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    await fetchQuestionsForSet(id);
  }, [expandedId, fetchQuestionsForSet]);

  const handleCreateSet = async () => {
    if (!newSetTitle.trim()) return;
    await createQuestionSet({ title: newSetTitle.trim(), topic_id: newSetTopic, description: newSetDesc.trim() || undefined });
    setNewSetTitle(""); setNewSetDesc(""); setShowCreateForm(false);
  };

  const startEditSet = (s: TeacherQuestionSet) => {
    setEditingSetId(s.id);
    setEditTitle(s.title);
    setEditTopic(s.topic_id as QuizTopic);
    setEditDesc(s.description ?? "");
  };

  const handleUpdateSet = async () => {
    if (!editingSetId || !editTitle.trim()) return;
    await updateQuestionSet(editingSetId, { title: editTitle.trim(), topic_id: editTopic, description: editDesc.trim() || undefined });
    setEditingSetId(null);
  };

  const handleDeleteSet = async (id: string) => {
    if (!confirm("Xóa bộ câu hỏi này?")) return;
    await deleteQuestionSet(id);
  };

  const handleCreateQuestion = async (setId: string) => {
    if (!newQ.question.trim() || !newQ.option_a.trim() || !newQ.option_b.trim() || !newQ.option_c.trim()) return;
    await createQuestion(setId, {
      question: newQ.question.trim(),
      option_a: newQ.option_a.trim(),
      option_b: newQ.option_b.trim(),
      option_c: newQ.option_c.trim(),
      correct_option: newQ.correct,
      explanation: newQ.explanation.trim() || undefined,
      image_url: newQ.image_url.trim() || undefined,
    });
    setNewQ({ question: "", option_a: "", option_b: "", option_c: "", correct: "A", explanation: "", image_url: "" });
    setShowQuestionForm(null);
  };

  const startEditQuestion = (q: TeacherQuestion) => {
    setEditingQuestionId(q.id);
    setEditQ({ question: q.question, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, correct: q.correct_option, explanation: q.explanation ?? "", image_url: q.image_url ?? "" });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestionId || !editQ) return;
    await updateQuestion(editingQuestionId, {
      question: editQ.question.trim(),
      option_a: editQ.option_a.trim(),
      option_b: editQ.option_b.trim(),
      option_c: editQ.option_c.trim(),
      correct_option: editQ.correct,
      explanation: editQ.explanation.trim() || undefined,
      image_url: editQ.image_url.trim() || undefined,
    });
    setEditingQuestionId(null);
    setEditQ(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Xóa câu hỏi này?")) return;
    await deleteQuestion(id);
  };

  const getSetQuestions = (setId: string) => questions.filter(q => q.set_id === setId);

  const handleNewQOptionA = (v: string) => setNewQ(q => ({ ...q, option_a: v }));
  const handleNewQOptionB = (v: string) => setNewQ(q => ({ ...q, option_b: v }));
  const handleNewQOptionC = (v: string) => setNewQ(q => ({ ...q, option_c: v }));
  const handleNewQCorrect = (v: "A" | "B" | "C") => setNewQ(q => ({ ...q, correct: v }));
  const handleNewQExplanation = (v: string) => setNewQ(q => ({ ...q, explanation: v }));
  const handleNewQQuestion = (v: string) => setNewQ(q => ({ ...q, question: v }));
  const handleNewQImageUrl = (v: string) => setNewQ(q => ({ ...q, image_url: v }));

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const result = await uploadMedia(file);
      if (result && result.url) {
        if (isEdit && editQ) {
          setEditQ({ ...editQ, image_url: result.url });
        } else {
          handleNewQImageUrl(result.url);
        }
      }
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  const renderMediaPreview = (url: string | undefined | null) => {
    if (!url) return null;
    const type = getMediaType(url);
    
    if (type === "youtube") {
      const embedUrl = getYouTubeEmbedUrl(url);
      if (!embedUrl) return <div className="text-xs text-red-500">Link YouTube không hợp lệ</div>;
      return (
        <div className="relative pt-[56.25%] bg-slate-100 rounded overflow-hidden">
          <iframe className="absolute inset-0 w-full h-full" src={embedUrl} allowFullScreen />
        </div>
      );
    }
    if (type === "video") return <video src={url} controls className="max-h-40 max-w-full rounded" />;
    if (type === "audio") return <audio src={url} controls className="w-full" />;
    return <img src={url} alt="Media" className="max-h-40 max-w-full object-contain rounded bg-slate-50" />;
  };

  // Excel import handlers
  const handleDownloadTemplate = () => {
    const csv = generateQuestionTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_cau_hoi.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);

    try {
      const rows = await parseQuestionFile(file);
      const { valid, errors } = validateAndPrepareQuestionImport(rows);
      setParsedQuestions(valid);
      setParseErrors(errors);
    } catch (err) {
      setParsedQuestions([]);
      setParseErrors([{ row: 0, message: err instanceof Error ? err.message : "Lỗi khi đọc file" }]);
    }
  };

  const handleImport = async (setId: string) => {
    if (parsedQuestions.length === 0) return;

    setImportLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
      const res = await fetch(`/api/teacher/question-sets/${setId}/import-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ questions: parsedQuestions }),
      });

      const result: QuestionImportResult | { error: string } = await res.json();

      if (!res.ok || "error" in result) {
        setParseErrors([{ row: 0, message: "error" in result ? result.error : "Lỗi khi nhập câu hỏi" }]);
        return;
      }

      setImportResult(result as QuestionImportResult);
      if (result.created > 0) {
        await fetchQuestionsForSet(setId);
      }
    } catch (err) {
      setParseErrors([{ row: 0, message: err instanceof Error ? err.message : "Lỗi kết nối" }]);
    } finally {
      setImportLoading(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(null);
    setImportFile(null);
    setParsedQuestions([]);
    setParseErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-sky-900">Bộ câu hỏi tùy chỉnh</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTopicManager(true)} className="Btn Btn--outline Btn--sm flex items-center gap-1">
            <Settings size={14} /> Quản lý chủ đề
          </button>
          <button onClick={() => setShowCreateForm(true)} className="Btn Btn--primary Btn--sm flex items-center gap-1">
            <Plus size={14} /> Tạo bộ mới
          </button>
        </div>
      </div>

      {/* Topic Manager Modal */}
      {showTopicManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-sky-900 flex items-center gap-2">
                <Tag size={18} /> Quản lý chủ đề
              </h3>
              <button onClick={() => setShowTopicManager(false)} className="Btn Btn--ghost Btn--sm"><X size={18} /></button>
            </div>
            <div className="p-4 flex-1 overflow-auto space-y-4">
              {/* Default topics (read-only) */}
              <div>
                <h4 className="text-sm font-bold text-gray-600 mb-2">Chủ đề mặc định</h4>
                <div className="space-y-1">
                  {Object.entries(topicLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded text-sm">
                      <span>{label}</span>
                      <span className="text-xs text-gray-400">Mặc định</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom topics */}
              <div>
                <h4 className="text-sm font-bold text-gray-600 mb-2">Chủ đề tùy chỉnh của bạn</h4>
                {topics.filter(t => !t.is_default).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Chưa có chủ đề tùy chỉnh</p>
                ) : (
                  <div className="space-y-1">
                    {topics.filter(t => !t.is_default).map(topic => (
                      <div key={topic.id} className="flex items-center justify-between py-1.5 px-3 bg-blue-50 rounded text-sm">
                        {editingTopicId === topic.id ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              className="Input w-full text-sm"
                              value={editTopicLabel}
                              onChange={e => setEditTopicLabel(e.target.value)}
                              placeholder="Tên chủ đề"
                            />
                            <button onClick={handleUpdateTopic} className="Btn Btn--primary Btn--sm"><Check size={12} /></button>
                            <button onClick={() => setEditingTopicId(null)} className="Btn Btn--secondary Btn--sm"><X size={12} /></button>
                          </div>
                        ) : (
                          <>
                            <span>{topic.label}</span>
                            <div className="flex gap-1">
                              <button onClick={() => startEditTopic(topic)} className="Btn Btn--ghost Btn--sm"><Edit2 size={12} /></button>
                              <button onClick={() => handleDeleteTopic(topic.id!)} className="Btn Btn--ghost Btn--sm text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add new topic */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-bold text-gray-600 mb-2">Thêm chủ đề mới</h4>
                <div className="space-y-2">
                  <input
                    className="Input w-full text-sm"
                    placeholder="Mã chủ đề (vd: an-toan-mang)"
                    value={newTopicKey}
                    onChange={e => setNewTopicKey(e.target.value)}
                  />
                  <input
                    className="Input w-full text-sm"
                    placeholder="Tên hiển thị (vd: An toàn mạng)"
                    value={newTopicLabel}
                    onChange={e => setNewTopicLabel(e.target.value)}
                  />
                  <button onClick={handleCreateTopic} className="Btn Btn--primary Btn--sm w-full flex items-center justify-center gap-1">
                    <Plus size={14} /> Thêm chủ đề
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="animate-spin">⟳</span> Đang tải...
        </div>
      )}

      {error && (
        <div className="Card p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError}><X size={14} /></button>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="Card p-4 border border-blue-300 bg-blue-50/50 space-y-3">
          <h3 className="font-bold text-sm text-sky-900">Tạo bộ câu hỏi mới</h3>
          <input className="Input w-full" placeholder="Tên bộ câu hỏi" value={newSetTitle} onChange={e => setNewSetTitle(e.target.value)} />
          <select className="Input w-full" value={newSetTopic} onChange={e => setNewSetTopic(e.target.value as QuizTopic)}>
            {allTopicOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <textarea className="Input w-full" placeholder="Mô tả (tùy chọn)" rows={2} value={newSetDesc} onChange={e => setNewSetDesc(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleCreateSet} className="Btn Btn--primary Btn--sm">Lưu</button>
            <button onClick={() => setShowCreateForm(false)} className="Btn Btn--secondary Btn--sm">Hủy</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {questionSets.length === 0 && !showCreateForm && (
          <div className="Card p-8 text-center text-gray-500 text-sm">
            Chưa có bộ câu hỏi nào. Nhấn &ldquo;Tạo bộ mới&rdquo; để bắt đầu.
          </div>
        )}
        {questionSets.map(set => (
          <div key={set.id} className="Card overflow-hidden">
            {/* Set header */}
            <div className="p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {editingSetId === set.id ? (
                  <div className="space-y-2">
                    <input className="Input w-full" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    <select className="Input w-full" value={editTopic} onChange={e => setEditTopic(e.target.value as QuizTopic)}>
                      {allTopicOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <textarea className="Input w-full" rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                    <div className="flex gap-1">
                      <button onClick={handleUpdateSet} className="Btn Btn--primary Btn--sm"><Check size={12} /></button>
                      <button onClick={() => setEditingSetId(null)} className="Btn Btn--secondary Btn--sm"><X size={12} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-gray-900 truncate">{set.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {getTopicLabel(set.topic_id)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getSetQuestions(set.id).length} câu
                      </span>
                    </div>
                    {set.description && <p className="text-xs text-gray-500 mt-1">{set.description}</p>}
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEditSet(set)} className="Btn Btn--ghost Btn--sm" title="Sửa"><Edit2 size={14} /></button>
                <button onClick={() => handleDeleteSet(set.id)} className="Btn Btn--ghost Btn--sm text-red-500" title="Xóa"><Trash2 size={14} /></button>
                <button onClick={() => toggleExpand(set.id)} className="Btn Btn--ghost Btn--sm">
                  {expandedId === set.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Expanded: Questions list */}
            {expandedId === set.id && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Câu hỏi ({getSetQuestions(set.id).length})</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowImportModal(set.id)}
                      className="Btn Btn--secondary Btn--sm text-xs flex items-center gap-1"
                    >
                      <Upload size={12} /> Nhập Excel
                    </button>
                    <button
                      onClick={() => { setShowQuestionForm(set.id); setNewQ({ question: "", option_a: "", option_b: "", option_c: "", correct: "A", explanation: "", image_url: "" }); }}
                      className="Btn Btn--outline Btn--sm text-xs"
                    >
                      <Plus size={12} /> Thêm câu hỏi
                    </button>
                  </div>
                </div>

                {showQuestionForm === set.id && (
                  <div className="Card p-3 border border-green-300 bg-green-50/50 space-y-2">
                    <textarea className="Input w-full text-sm" rows={2} placeholder="Câu hỏi" value={newQ.question} onChange={e => handleNewQQuestion(e.target.value)} />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input className="Input text-sm" placeholder="Đáp án A" value={newQ.option_a} onChange={e => handleNewQOptionA(e.target.value)} />
                      <input className="Input text-sm" placeholder="Đáp án B" value={newQ.option_b} onChange={e => handleNewQOptionB(e.target.value)} />
                      <input className="Input text-sm" placeholder="Đáp án C" value={newQ.option_c} onChange={e => handleNewQOptionC(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Đáp án đúng:</span>
                      {(["A", "B", "C"] as const).map(o => (
                        <button key={o} onClick={() => handleNewQCorrect(o)}
                          className={"text-xs px-2 py-1 rounded border " + (newQ.correct === o ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 text-gray-600")}>
                          {o}
                        </button>
                      ))}
                    </div>
                    <input className="Input w-full text-sm" placeholder="Giải thích (tùy chọn)" value={newQ.explanation} onChange={e => handleNewQExplanation(e.target.value)} />
                    
                    <div className="space-y-2 p-2 bg-white/50 rounded border border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 flex items-center">
                          <LinkIcon size={14} className="absolute left-2 text-gray-400" />
                          <input className="Input w-full text-sm pl-7" placeholder="URL media (ảnh, audio, YouTube)" value={newQ.image_url} onChange={e => handleNewQImageUrl(e.target.value)} />
                        </div>
                        <label className="Btn Btn--outline Btn--sm flex items-center gap-1 cursor-pointer shrink-0">
                          {uploadingMedia ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          Tải file
                          <input type="file" accept="image/*,audio/*" className="hidden" onChange={e => handleMediaUpload(e)} disabled={uploadingMedia} />
                        </label>
                      </div>
                      {renderMediaPreview(newQ.image_url)}
                    </div>

                    <div className="flex gap-1">
                      <button onClick={() => handleCreateQuestion(set.id)} className="Btn Btn--primary Btn--sm">Thêm</button>
                      <button onClick={() => setShowQuestionForm(null)} className="Btn Btn--secondary Btn--sm">Hủy</button>
                    </div>
                  </div>
                )}

                {getSetQuestions(set.id).map(q => (
                  <div key={q.id} className="Card p-3 bg-white border border-gray-200 text-sm space-y-1">
                    {editingQuestionId === q.id && editQ ? (
                      <div className="space-y-2">
                        <textarea className="Input w-full text-sm" rows={2} value={editQ.question} onChange={e => setEditQ(eq => eq ? { ...eq, question: e.target.value } : null)} />
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input className={"Input text-sm " + (editQ.correct === "A" ? "border-green-500" : "")} placeholder="Đáp án A" value={editQ.option_a} onChange={e => setEditQ(eq => eq ? { ...eq, option_a: e.target.value } : null)} />
                          <input className={"Input text-sm " + (editQ.correct === "B" ? "border-green-500" : "")} placeholder="Đáp án B" value={editQ.option_b} onChange={e => setEditQ(eq => eq ? { ...eq, option_b: e.target.value } : null)} />
                          <input className={"Input text-sm " + (editQ.correct === "C" ? "border-green-500" : "")} placeholder="Đáp án C" value={editQ.option_c} onChange={e => setEditQ(eq => eq ? { ...eq, option_c: e.target.value } : null)} />
                        </div>
                        <div className="space-y-2 p-2 bg-slate-50 rounded border border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 flex items-center">
                              <LinkIcon size={14} className="absolute left-2 text-gray-400" />
                              <input className="Input w-full text-sm pl-7" placeholder="URL media (ảnh, audio, YouTube)" value={editQ.image_url} onChange={e => setEditQ(eq => eq ? { ...eq, image_url: e.target.value } : null)} />
                            </div>
                            <label className="Btn Btn--outline Btn--sm flex items-center gap-1 cursor-pointer shrink-0">
                              {uploadingMedia ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                              Tải file
                              <input type="file" accept="image/*,audio/*" className="hidden" onChange={e => handleMediaUpload(e, true)} disabled={uploadingMedia} />
                            </label>
                          </div>
                          {renderMediaPreview(editQ.image_url)}
                        </div>
                        <div className="flex gap-1">
                          <span className="text-xs text-gray-600">Đúng:</span>
                          {(["A", "B", "C"] as const).map(o => (
                            <button key={o} onClick={() => setEditQ(eq => eq ? { ...eq, correct: o } : null)}
                              className={"text-xs px-2 py-0.5 rounded border " + (editQ.correct === o ? "bg-green-500 text-white" : "border-gray-300")}>{o}</button>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={handleUpdateQuestion} className="Btn Btn--primary Btn--sm"><Check size={12} /></button>
                          <button onClick={() => { setEditingQuestionId(null); setEditQ(null); }} className="Btn Btn--secondary Btn--sm"><X size={12} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            {q.image_url && <ImageIcon size={14} className="text-blue-500 mt-0.5 shrink-0" />}
                            <p className="font-medium text-gray-900 text-xs leading-relaxed">{q.question}</p>
                          </div>
                          <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                            <p className={q.correct_option === "A" ? "text-green-600 font-medium" : ""}>A. {q.option_a}</p>
                            <p className={q.correct_option === "B" ? "text-green-600 font-medium" : ""}>B. {q.option_b}</p>
                            <p className={q.correct_option === "C" ? "text-green-600 font-medium" : ""}>C. {q.option_c}</p>
                          </div>
                          {q.explanation && <p className="text-xs text-gray-400 italic mt-1">Giải thích: {q.explanation}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">{q.correct_option}</span>
                          <button onClick={() => startEditQuestion(q)} className="Btn Btn--ghost Btn--sm"><Edit2 size={12} /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="Btn Btn--ghost Btn--sm text-red-500"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {getSetQuestions(set.id).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Chưa có câu hỏi nào.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-green-600" size={20} />
                <h3 className="font-bold">Nhập câu hỏi từ Excel</h3>
              </div>
              <button onClick={closeImportModal} className="Btn Btn--ghost Btn--sm"><X size={16} /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Template download */}
              <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Tải file mẫu</p>
                  <p className="text-xs text-blue-700">Cột: question, option_a, option_b, option_c, correct_option, explanation</p>
                </div>
                <button onClick={handleDownloadTemplate} className="Btn Btn--secondary Btn--sm flex items-center gap-1">
                  <Download size={14} /> CSV
                </button>
              </div>
              {/* File input */}
              <div>
                <label className="block text-sm font-medium mb-2">Chọn file Excel hoặc CSV</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {/* Parse errors */}
              {parseErrors.filter(e => e.row > 0).length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="text-red-500" size={16} />
                    <span className="font-medium text-red-700 text-sm">Lỗi ({parseErrors.filter(e => e.row > 0).length})</span>
                  </div>
                  <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                    {parseErrors.filter(e => e.row > 0).map((err, i) => (
                      <li key={i}>Dòng {err.row}: {err.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Import result */}
              {importResult && (
                <div className={`p-3 rounded-lg ${importResult.failed === 0 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
                  <p className={`font-medium text-sm ${importResult.failed === 0 ? "text-green-700" : "text-yellow-700"}`}>
                    {buildQuestionImportSummary(importResult.total, importResult.created, importResult.failed)}
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="text-xs text-yellow-600 mt-2 space-y-1">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>Dòng {err.row}: {err.message}</li>
                      ))}
                      {importResult.errors.length > 5 && <li>...và {importResult.errors.length - 5} lỗi khác</li>}
                    </ul>
                  )}
                </div>
              )}
              {/* Preview */}
              {parsedQuestions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Xem trước ({parsedQuestions.length} câu hỏi)</span>
                    {parseErrors.filter(e => e.row > 0).length > 0 && (
                      <span className="text-xs text-orange-600">{parseErrors.filter(e => e.row > 0).length} dòng lỗi (sẽ bị bỏ qua)</span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto border rounded divide-y">
                    {parsedQuestions.slice(0, 20).map((q, i) => (
                      <div key={i} className="p-2 text-xs">
                        <p className="font-medium truncate">{i + 1}. {q.question}</p>
                        <p className="text-gray-500">
                          A. {q.option_a} | B. {q.option_b} | C. {q.option_c}
                          <span className="ml-2 px-1 rounded bg-green-100 text-green-700">✓ {q.correct_option}</span>
                        </p>
                      </div>
                    ))}
                    {parsedQuestions.length > 20 && (
                      <div className="p-2 text-xs text-gray-500 text-center">...và {parsedQuestions.length - 20} câu hỏi khác</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button onClick={closeImportModal} className="Btn Btn--secondary Btn--sm">Đóng</button>
              {parsedQuestions.length > 0 && !importResult && (
                <button
                  onClick={() => handleImport(showImportModal)}
                  disabled={importLoading}
                  className="Btn Btn--primary Btn--sm flex items-center gap-1"
                >
                  {importLoading ? <><span className="animate-spin">⟳</span> Đang nhập...</> : <><Upload size={14} /> Nhập {parsedQuestions.length} câu hỏi</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
