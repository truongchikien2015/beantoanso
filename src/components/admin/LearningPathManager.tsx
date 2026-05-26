"use client";
import { useEffect, useState, useCallback } from "react";
import { useTeacherContentStore } from "@/lib/teacherContentStore";
import { supabase } from "@/lib/supabase";
import { topicLabels } from "@/data/quizQuestions";
import type { TeacherLearningPath, TeacherLearningPathStep, TeacherQuestionSet, TeacherStudent, TeacherTopic } from "@/types/teacher-content";
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, GripVertical, Users } from "lucide-react";

const STEP_TYPES = [
  { value: "topic", label: "Chủ đề học" },
  { value: "question_set", label: "Bộ câu hỏi tùy chỉnh" },
];

export function LearningPathManager() {
  const {
    learningPaths, pathSteps, questionSets, students, topics,
    fetchLearningPaths, fetchStepsForPath, fetchQuestionSets,
    fetchStudents, createLearningPath, updateLearningPath,
    deleteLearningPath, addPathStep, removePathStep, reorderPathSteps,
    fetchTopics, error, clearError,
  } = useTeacherContentStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState<string | null>(null);
  // Bulk assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignPathId, setAssignPathId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");

  // Forms
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [newStep, setNewStep] = useState({ step_type: "topic" as "topic" | "question_set", topic_id: "stranger", question_set_id: "" });
  const [draggedStepIds, setDraggedStepIds] = useState<string[]>([]);
  const topicOptions = topics.length > 0
    ? topics.filter(t => t.is_active !== false)
    : Object.entries(topicLabels).map(([topic_key, label]) => ({ topic_key, label, is_default: true }));

  useEffect(() => {
    fetchLearningPaths();
    fetchQuestionSets();
    fetchTopics();
  }, []);

  const toggleExpand = useCallback(async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    await fetchStepsForPath(id);
  }, [expandedId, fetchStepsForPath]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createLearningPath({ title: newTitle.trim(), description: newDesc.trim() || undefined });
    setNewTitle(""); setNewDesc(""); setShowCreateForm(false);
  };

  const startEdit = (p: TeacherLearningPath) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditDesc(p.description ?? "");
  };

  const handleUpdate = async () => {
    if (!editingId || !editTitle.trim()) return;
    await updateLearningPath(editingId, { title: editTitle.trim(), description: editDesc.trim() || undefined });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa lộ trình này?")) return;
    await deleteLearningPath(id);
  };

  const handleAddStep = async (pathId: string) => {
    if (newStep.step_type === "topic" && !newStep.topic_id) return;
    if (newStep.step_type === "question_set" && !newStep.question_set_id) return;
    const stepOrder = (pathSteps.filter(s => s.path_id === pathId).length + 1);
    await addPathStep(pathId, {
      step_type: newStep.step_type,
      topic_id: newStep.step_type === "topic" ? newStep.topic_id : undefined,
      question_set_id: newStep.step_type === "question_set" ? newStep.question_set_id : undefined,
      step_order: stepOrder,
    });
    setShowStepForm(null);
    setNewStep({ step_type: "topic", topic_id: "stranger", question_set_id: "" });
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("Xóa bước này?")) return;
    await removePathStep(stepId);
  };

  const enterReorder = (pathId: string) => {
    setReorderMode(pathId);
    setDraggedStepIds(pathSteps.filter(s => s.path_id === pathId).map(s => s.id));
  };

  const moveStep = (from: number, to: number) => {
    const list = [...draggedStepIds];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setDraggedStepIds(list);
  };

  const handleReorder = async (pathId: string) => {
    const updates = draggedStepIds.map((id, index) => ({ id, step_order: index + 1 }));
    await reorderPathSteps(pathId, updates);
    setReorderMode(null);
  };

  // Bulk assign handlers
  const openAssignModal = async (pathId: string) => {
    setAssignPathId(pathId);
    setSelectedStudents(new Set());
    setAssignSuccess("");
    await fetchStudents();
    setShowAssignModal(true);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (!assignPathId || selectedStudents.size === 0) return;
    setAssignLoading(true);
    setAssignSuccess("");
    try {
      const { data: sessionData } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/teacher/learning-paths/${assignPathId}/assign-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ studentIds: Array.from(selectedStudents) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi gán lộ trình");
      setAssignSuccess(`Đã gán lộ trình cho ${data.assignedCount} học sinh!`);
      setSelectedStudents(new Set());
      setTimeout(() => setShowAssignModal(false), 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi khi gán lộ trình");
    } finally {
      setAssignLoading(false);
    }
  };

  const pathStepsList = (pathId: string) => pathSteps.filter(s => s.path_id === pathId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-sky-900">Lộ trình học tập</h2>
        <button onClick={() => setShowCreateForm(true)} className="Btn Btn--primary Btn--sm flex items-center gap-1">
          <Plus size={14} /> Tạo lộ trình
        </button>
      </div>

      {error && (
        <div className="Card p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError}><X size={14} /></button>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="Card p-4 border border-blue-300 bg-blue-50/50 space-y-3">
          <h3 className="font-bold text-sm text-sky-900">Tạo lộ trình mới</h3>
          <input className="Input w-full" placeholder="Tên lộ trình" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <textarea className="Input w-full" placeholder="Mô tả (tùy chọn)" rows={2} value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="Btn Btn--primary Btn--sm">Lưu</button>
            <button onClick={() => setShowCreateForm(false)} className="Btn Btn--secondary Btn--sm">Hủy</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {learningPaths.length === 0 && !showCreateForm && (
          <div className="Card p-8 text-center text-gray-500 text-sm">
            Chưa có lộ trình nào.
          </div>
        )}
        {learningPaths.map(path => (
          <div key={path.id} className="Card overflow-hidden">
            {/* Path header */}
            <div className="p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {editingId === path.id ? (
                  <div className="space-y-2">
                    <input className="Input w-full" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    <textarea className="Input w-full" rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                    <div className="flex gap-1">
                      <button onClick={handleUpdate} className="Btn Btn--primary Btn--sm"><Check size={12} /></button>
                      <button onClick={() => setEditingId(null)} className="Btn Btn--secondary Btn--sm"><X size={12} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">{path.title}</p>
                    {path.description && <p className="text-xs text-gray-500 mt-1">{path.description}</p>}
                    <span className="text-xs text-gray-400 mt-1 block">{pathStepsList(path.id).length} bước</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openAssignModal(path.id)}
                  title="Gán cho nhiều học sinh"
                  className="Btn Btn--ghost Btn--sm text-indigo-600"
                >
                  <Users size={14} />
                </button>
                <button onClick={() => startEdit(path)} className="Btn Btn--ghost Btn--sm"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(path.id)} className="Btn Btn--ghost Btn--sm text-red-500"><Trash2 size={14} /></button>
                <button onClick={() => toggleExpand(path.id)} className="Btn Btn--ghost Btn--sm">
                  {expandedId === path.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Expanded: Steps */}
            {expandedId === path.id && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Các bước ({pathStepsList(path.id).length})</span>
                  <div className="flex gap-2">
                    {pathStepsList(path.id).length > 1 && reorderMode !== path.id && (
                      <button onClick={() => enterReorder(path.id)} className="Btn Btn--outline Btn--sm text-xs">Sắp xếp lại</button>
                    )}
                    <button onClick={() => setShowStepForm(path.id)} className="Btn Btn--outline Btn--sm text-xs">
                      <Plus size={12} /> Thêm bước
                    </button>
                  </div>
                </div>

                {reorderMode === path.id ? (
                  <div className="Card p-3 border border-sky-300 bg-sky-50/50 space-y-2">
                    <p className="text-xs font-bold text-sky-700">Dùng nút tiến/lùi để sắp xếp lại thứ tự</p>
                    {draggedStepIds.map((id, i) => {
                      const step = pathSteps.find(s => s.id === id);
                      if (!step) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 bg-white rounded px-3 py-2 border">
                          <GripVertical size={14} className="text-gray-400 cursor-grab" />
                          <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                          <span className="text-sm flex-1">{getStepLabel(step, topicOptions, questionSets)}</span>
                          <div className="flex gap-1">
                            <button disabled={i === 0} onClick={() => moveStep(i, i - 1)} className="Btn Btn--ghost Btn--sm text-xs">Lùi</button>
                            <button disabled={i === draggedStepIds.length - 1} onClick={() => moveStep(i, i + 1)} className="Btn Btn--ghost Btn--sm text-xs">Tiến</button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleReorder(path.id)} className="Btn Btn--primary Btn--sm text-xs">Lưu thứ tự</button>
                      <button onClick={() => setReorderMode(null)} className="Btn Btn--secondary Btn--sm text-xs">Hủy</button>
                    </div>
                  </div>
                ) : (
                  pathStepsList(path.id).map((step, i) => (
                    <div key={step.id} className="flex items-center gap-3 Card p-3 bg-white border border-gray-200">
                      <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">{i + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 flex-shrink-0 capitalize">
                        {step.step_type === "topic" ? "Chủ đề" : "Bộ câu hỏi"}
                      </span>
                      <span className="text-sm flex-1 min-w-0">{getStepLabel(step, topicOptions, questionSets)}</span>
                      <button onClick={() => handleDeleteStep(step.id)} className="Btn Btn--ghost Btn--sm text-red-500 flex-shrink-0"><Trash2 size={12} /></button>
                    </div>
                  ))
                )}

                {/* Add step form */}
                {showStepForm === path.id && (
                  <div className="Card p-3 border border-green-300 bg-green-50/50 space-y-2">
                    <div className="flex gap-2">
                      {STEP_TYPES.map(t => (
                        <button key={t.value} onClick={() => setNewStep(s => ({ ...s, step_type: t.value as "topic" | "question_set" }))}
                          className={"text-xs px-3 py-1.5 rounded border " + (newStep.step_type === t.value ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 text-gray-600")}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {newStep.step_type === "topic" ? (
                      <select className="Input w-full text-sm" value={newStep.topic_id} onChange={e => setNewStep(s => ({ ...s, topic_id: e.target.value }))}>
                        {topicOptions.map(topic => (
                          <option key={topic.topic_key} value={topic.topic_key}>{topic.label}</option>
                        ))}
                      </select>
                    ) : (
                      <select className="Input w-full text-sm" value={newStep.question_set_id} onChange={e => setNewStep(s => ({ ...s, question_set_id: e.target.value }))}>
                        <option value="">-- Chọn bộ câu hỏi --</option>
                        {questionSets.map(qs => <option key={qs.id} value={qs.id}>{qs.title}</option>)}
                      </select>
                    )}
                    <div className="flex gap-1">
                      <button onClick={() => handleAddStep(path.id)} className="Btn Btn--primary Btn--sm text-xs">Thêm</button>
                      <button onClick={() => setShowStepForm(null)} className="Btn Btn--secondary Btn--sm text-xs">Hủy</button>
                    </div>
                  </div>
                )}

                {pathStepsList(path.id).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Chưa có bước nào.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bulk Assign Modal */}
      {showAssignModal && assignPathId && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAssignModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Gán lộ trình cho nhiều học sinh"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900">Gán lộ trình cho nhiều học sinh</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {learningPaths.find(p => p.id === assignPathId)?.title}
                </p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="Btn Btn--ghost Btn--sm">
                <X size={14} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Đã chọn: <strong className="text-indigo-600">{selectedStudents.size}</strong> / {students.length} học sinh
              </span>
              <button onClick={selectAll} className="Btn Btn--outline Btn--sm text-xs">
                {selectedStudents.size === students.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 max-h-64">
              {students.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Chưa có học sinh nào.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {students.map(s => (
                    <li key={s.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.nickname}</p>
                        {s.class_name && <p className="text-xs text-gray-400">{s.class_name}</p>}
                      </div>
                      {s.assigned_path_id && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Đã gán</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {assignSuccess && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm text-center">
                {assignSuccess}
              </div>
            )}

            <div className="p-4 flex gap-3 justify-end border-t border-gray-200">
              <button
                onClick={() => setShowAssignModal(false)}
                className="Btn Btn--secondary Btn--sm"
                disabled={assignLoading}
              >
                Đóng
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={selectedStudents.size === 0 || assignLoading}
                className="Btn Btn--primary Btn--sm"
              >
                {assignLoading ? "Đang gán..." : `Gán cho ${selectedStudents.size} học sinh`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStepLabel(
  step: TeacherLearningPathStep,
  topics: Pick<TeacherTopic, "topic_key" | "label">[],
  sets: TeacherQuestionSet[],
): string {
  if (step.step_type === "topic") {
    const found = topics.find(topic => topic.topic_key === step.topic_id);
    return found?.label ?? step.topic_id ?? "";
  }
  if (step.step_type === "question_set") {
    const found = sets.find(s => s.id === step.question_set_id);
    return found ? found.title : "Bộ câu hỏi";
  }
  return step.step_type;
}
