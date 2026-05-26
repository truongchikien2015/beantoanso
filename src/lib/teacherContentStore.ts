// ============================================================
// Feature 023: Teacher Content Zustand Store
// Client-side state management for question sets, learning paths, and students
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import type {
  TeacherQuestionSet,
  TeacherQuestion,
  TeacherLearningPath,
  TeacherLearningPathStep,
  TeacherStudent,
  TeacherStudentProgress,
  QuestionSetWithQuestions,
  LearningPathWithSteps,
  CreateQuestionSetInput,
  CreateQuestionInput,
  CreateLearningPathInput,
  CreatePathStepInput,
  ImportStudentInput,
  TeacherTopic,
} from "@/types/teacher-content";

// ============================================================
// Store state types
// ============================================================

interface TeacherContentState {
  // Data
  questionSets: TeacherQuestionSet[];
  questions: TeacherQuestion[];
  learningPaths: TeacherLearningPath[];
  pathSteps: TeacherLearningPathStep[];
  students: TeacherStudent[];
  studentProgress: TeacherStudentProgress[];
  topics: TeacherTopic[];

  // UI state
  activeTab: "question-sets" | "learning-paths" | "students";
  loading: boolean;
  error: string | null;

  // Question Sets
  fetchQuestionSets: () => Promise<void>;
  createQuestionSet: (input: CreateQuestionSetInput) => Promise<TeacherQuestionSet | null>;
  updateQuestionSet: (id: string, input: Partial<CreateQuestionSetInput>) => Promise<void>;
  deleteQuestionSet: (id: string) => Promise<void>;
  getQuestionSetWithQuestions: (id: string) => QuestionSetWithQuestions | null;
  fetchQuestionsForSet: (setId: string) => Promise<TeacherQuestion[]>;
  createQuestion: (setId: string, input: CreateQuestionInput) => Promise<TeacherQuestion | null>;
  updateQuestion: (id: string, input: Partial<CreateQuestionInput>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;

  // Learning Paths
  fetchLearningPaths: () => Promise<void>;
  createLearningPath: (input: CreateLearningPathInput) => Promise<TeacherLearningPath | null>;
  updateLearningPath: (id: string, input: Partial<CreateLearningPathInput>) => Promise<void>;
  deleteLearningPath: (id: string) => Promise<void>;
  getLearningPathWithSteps: (id: string) => LearningPathWithSteps | null;
  fetchStepsForPath: (pathId: string) => Promise<TeacherLearningPathStep[]>;
  addPathStep: (pathId: string, input: CreatePathStepInput) => Promise<TeacherLearningPathStep | null>;
  removePathStep: (stepId: string) => Promise<void>;
  reorderPathSteps: (pathId: string, steps: { id: string; step_order: number }[]) => Promise<void>;

  // Students
  fetchStudents: () => Promise<void>;
  importStudents: (students: ImportStudentInput[]) => Promise<TeacherStudent[]>;
  assignPathToStudent: (studentId: string, pathId: string) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  fetchStudentProgress: (studentId: string) => Promise<TeacherStudentProgress[]>;

  // UI actions
  setActiveTab: (tab: TeacherContentState["activeTab"]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Topics (025)
  fetchTopics: () => Promise<TeacherTopic[]>;
  createTopic: (input: { topic_key: string; label: string }) => Promise<TeacherTopic | null>;
  updateTopic: (id: string, input: { label?: string }) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
}

// ============================================================
// Helper: get auth headers for teacher API calls
// ============================================================

async function teacherFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers["Authorization"] = `Bearer ${data.session.access_token}`;
    }
  }
  const base = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });
  return res;
}

// ============================================================
// Store
// ============================================================

export const useTeacherContentStore = create<TeacherContentState>()(
  persist(
    (set, get) => ({
      // Initial state
      questionSets: [],
      questions: [],
      learningPaths: [],
      pathSteps: [],
      students: [],
      studentProgress: [],
      topics: [],
      activeTab: "question-sets",
      loading: false,
      error: null,

      // ============================================================
      // Question Sets
      // ============================================================

      fetchQuestionSets: async () => {
        set({ loading: true, error: null });
        try {
          const res = await teacherFetch("/api/teacher/question-sets");
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Lỗi ${res.status}`);
          }
          const data: TeacherQuestionSet[] = await res.json();
          set({ questionSets: data, loading: false });
        } catch (e) {
          set({ error: e instanceof Error ? e.message : "Lỗi tải bộ câu hỏi", loading: false });
        }
      },

      createQuestionSet: async (input) => {
        const res = await teacherFetch("/api/teacher/question-sets", {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi tạo bộ câu hỏi" });
          return null;
        }
        const created: TeacherQuestionSet = await res.json();
        set((s) => ({ questionSets: [created, ...s.questionSets] }));
        return created;
      },

      updateQuestionSet: async (id, input) => {
        const res = await teacherFetch(`/api/teacher/question-sets/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi cập nhật" });
          return;
        }
        const updated: TeacherQuestionSet = await res.json();
        set((s) => ({
          questionSets: s.questionSets.map((qs) => (qs.id === id ? updated : qs)),
        }));
      },

      deleteQuestionSet: async (id) => {
        const res = await teacherFetch(`/api/teacher/question-sets/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi xóa" });
          return;
        }
        set((s) => ({
          questionSets: s.questionSets.filter((qs) => qs.id !== id),
          questions: s.questions.filter((q) => q.set_id !== id),
        }));
      },

      getQuestionSetWithQuestions: (id) => {
        const s = get();
        const qs = s.questionSets.find((q) => q.id === id);
        if (!qs) return null;
        const qsQuestions = s.questions.filter((q) => q.set_id === id);
        return { ...qs, questions: qsQuestions, question_count: qsQuestions.length };
      },

      fetchQuestionsForSet: async (setId) => {
        const res = await teacherFetch(`/api/teacher/question-sets/${setId}/questions`);
        if (!res.ok) return [];
        const data: TeacherQuestion[] = await res.json();
        set((s) => {
          const others = s.questions.filter((q) => q.set_id !== setId);
          return { questions: [...others, ...data] };
        });
        return data;
      },

      createQuestion: async (setId, input) => {
        const res = await teacherFetch(`/api/teacher/question-sets/${setId}/questions`, {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi tạo câu hỏi" });
          return null;
        }
        const created: TeacherQuestion = await res.json();
        set((s) => ({ questions: [created, ...s.questions] }));
        return created;
      },

      updateQuestion: async (id, input) => {
        const res = await teacherFetch(`/api/teacher/questions/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi cập nhật câu hỏi" });
          return;
        }
        const updated: TeacherQuestion = await res.json();
        set((s) => ({
          questions: s.questions.map((q) => (q.id === id ? updated : q)),
        }));
      },

      deleteQuestion: async (id) => {
        const res = await teacherFetch(`/api/teacher/questions/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi xóa câu hỏi" });
          return;
        }
        set((s) => ({ questions: s.questions.filter((q) => q.id !== id) }));
      },

      // ============================================================
      // Learning Paths
      // ============================================================

      fetchLearningPaths: async () => {
        set({ loading: true, error: null });
        try {
          const res = await teacherFetch("/api/teacher/learning-paths");
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Lỗi ${res.status}`);
          }
          const data: TeacherLearningPath[] = await res.json();
          set({ learningPaths: data, loading: false });
        } catch (e) {
          set({ error: e instanceof Error ? e.message : "Lỗi tải lộ trình", loading: false });
        }
      },

      createLearningPath: async (input) => {
        const res = await teacherFetch("/api/teacher/learning-paths", {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi tạo lộ trình" });
          return null;
        }
        const created: TeacherLearningPath = await res.json();
        set((s) => ({ learningPaths: [created, ...s.learningPaths] }));
        return created;
      },

      updateLearningPath: async (id, input) => {
        const res = await teacherFetch(`/api/teacher/learning-paths/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi cập nhật" });
          return;
        }
        const updated: TeacherLearningPath = await res.json();
        set((s) => ({
          learningPaths: s.learningPaths.map((lp) => (lp.id === id ? updated : lp)),
        }));
      },

      deleteLearningPath: async (id) => {
        const res = await teacherFetch(`/api/teacher/learning-paths/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi xóa" });
          return;
        }
        set((s) => ({
          learningPaths: s.learningPaths.filter((lp) => lp.id !== id),
          pathSteps: s.pathSteps.filter((st) => st.path_id !== id),
        }));
      },

      getLearningPathWithSteps: (id) => {
        const s = get();
        const lp = s.learningPaths.find((l) => l.id === id);
        if (!lp) return null;
        const steps = s.pathSteps.filter((st) => st.path_id === id).sort((a, b) => a.step_order - b.step_order);
        return { ...lp, steps, step_count: steps.length };
      },

      fetchStepsForPath: async (pathId) => {
        const res = await teacherFetch(`/api/teacher/learning-paths/${pathId}/steps`);
        if (!res.ok) return [];
        const data: TeacherLearningPathStep[] = await res.json();
        set((s) => {
          const others = s.pathSteps.filter((st) => st.path_id !== pathId);
          return { pathSteps: [...others, ...data] };
        });
        return data;
      },

      addPathStep: async (pathId, input) => {
        const res = await teacherFetch(`/api/teacher/learning-paths/${pathId}/steps`, {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi thêm bước" });
          return null;
        }
        const created: TeacherLearningPathStep = await res.json();
        set((s) => ({ pathSteps: [...s.pathSteps, created] }));
        return created;
      },

      removePathStep: async (stepId) => {
        const res = await teacherFetch(`/api/teacher/steps/${stepId}`, { method: "DELETE" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi xóa bước" });
          return;
        }
        set((s) => ({ pathSteps: s.pathSteps.filter((st) => st.id !== stepId) }));
      },

      reorderPathSteps: async (pathId, steps) => {
        const res = await teacherFetch(`/api/teacher/learning-paths/${pathId}/steps/reorder`, {
          method: "PUT",
          body: JSON.stringify({ steps }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          set({ error: body.error || "Lỗi sắp xếp" });
          return;
        }
        set((s) => ({
          pathSteps: s.pathSteps.map((st) => {
            const found = steps.find((s) => s.id === st.id);
            return found ? { ...st, step_order: found.step_order } : st;
          }),
        }));
      },

      // ============================================================
      // Students
      // ============================================================

  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const res = await teacherFetch("/api/teacher/students");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Lỗi ${res.status}`);
      }
      const data: TeacherStudent[] = await res.json();
      set({ students: data, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Lỗi tải học sinh", loading: false });
    }
  },

  importStudents: async (students) => {
    const res = await teacherFetch("/api/teacher/students", {
      method: "POST",
      body: JSON.stringify({ students }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      set({ error: body.error || "Lỗi nhập học sinh" });
      return [];
    }
    const imported: TeacherStudent[] = await res.json();
    set((s) => ({ students: [...imported, ...s.students] }));
    return imported;
  },

  assignPathToStudent: async (studentId, pathId) => {
    const res = await teacherFetch(`/api/teacher/students/${studentId}/assign`, {
      method: "POST",
      body: JSON.stringify({ path_id: pathId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      set({ error: body.error || "Lỗi gán lộ trình" });
      return;
    }
    const updated: TeacherStudent = await res.json();
    set((s) => ({
      students: s.students.map((st) => (st.id === studentId ? updated : st)),
    }));
  },

  deleteStudent: async (id) => {
    const res = await teacherFetch(`/api/teacher/students/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      set({ error: body.error || "Lỗi xóa học sinh" });
      return;
    }
    set((s) => ({
      students: s.students.map((st) => (st.id === id ? { ...st, is_active: false } : st)),
    }));
  },

  fetchStudentProgress: async (studentId) => {
    const res = await teacherFetch(`/api/teacher/students/${studentId}/progress`);
    if (!res.ok) return [];
    const data: TeacherStudentProgress[] = await res.json();
    set((s) => {
      const others = s.studentProgress.filter((p) => p.student_id !== studentId);
      return { studentProgress: [...others, ...data] };
    });
    return data;
  },

  // ============================================================
  // Topics (025: Custom Teacher Topics)
  // ============================================================

  fetchTopics: async () => {
    const res = await teacherFetch("/api/teacher/topics");
    if (!res.ok) return [];
    const data: TeacherTopic[] = await res.json();
    set({ topics: data });
    return data;
  },

  createTopic: async (input) => {
    const res = await teacherFetch("/api/teacher/topics", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      set({ error: body.error || "Lỗi tạo chủ đề" });
      return null;
    }
    const created: TeacherTopic = await res.json();
    set((s) => ({ topics: [...s.topics, created] }));
    return created;
  },

  updateTopic: async (id, input) => {
    const res = await teacherFetch(`/api/teacher/topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      set({ error: body.error || "Lỗi cập nhật chủ đề" });
      return;
    }
    const updated: TeacherTopic = await res.json();
    set((s) => ({
      topics: s.topics.map((t) => (t.id === id ? { ...t, ...updated } : t)),
    }));
  },

  deleteTopic: async (id) => {
    const res = await teacherFetch(`/api/teacher/topics/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      set({ error: body.error || "Lỗi xóa chủ đề" });
      return;
    }
    set((s) => ({
      topics: s.topics.filter((t) => t.id !== id),
    }));
  },

      // ============================================================
      // UI actions
      // ============================================================

      setActiveTab: (tab) => set({ activeTab: tab }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "teacher-content-v1",
      partialize: (state) => ({
        activeTab: state.activeTab,
      }),
    }
  )
);
