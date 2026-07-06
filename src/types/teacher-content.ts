// ============================================================
// Feature 023: Teacher Content & Student Import
// TypeScript interfaces for teacher content management
// ============================================================

import type { QuizTopic } from "@/data/quizQuestions";

// ============================================================
// Database entity types (match Supabase schema)
// ============================================================

export interface TeacherQuestionSet {
  id: string;
  created_by: string;
  title: string;
  topic_id: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherQuestion {
  id: string;
  set_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherLearningPath {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  step_count?: number;
}

export type LearningPathStepType = "topic" | "question_set";

export interface TeacherLearningPathStep {
  id: string;
  path_id: string;
  step_order: number;
  step_type: LearningPathStepType;
  topic_id: string | null;
  question_set_id: string | null;
  question_count?: number;
}

export interface TeacherStudent {
  id: string;
  created_by: string;
  nickname: string;
  email: string | null;
  class_name: string | null;
  student_code: string;
  parent_access_code: string | null;
  password_hash: string;
  assigned_path_ids: string[];
  assigned_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // "teacher" = created by this teacher via bulk import / manual add.
  // "self" = self-registered student assigned to this teacher by admin.
  // Some fields (student_code, parent_access_code) are empty for "self".
  source?: "teacher" | "self";
  xp?: number;
  level?: number;
  total_score?: number;
}

export interface TeacherStudentProgress {
  id: string;
  student_id: string;
  path_id: string;
  step_id: string;
  score: number;
  completed_at: string | null;
  topic_slug?: string | null;
}

export interface StudentRewardStats {
  total_xp: number;
  level: number;
  xp_in_level: number;
  xp_for_next: number;
  current_streak: number;
  longest_streak: number;
  last_daily_completed_on: string | null;
}

// ============================================================
// API request/response DTOs
// ============================================================

// --- Question Sets ---

export interface CreateQuestionSetInput {
  title: string;
  topic_id: string;
  description?: string;
}

export interface UpdateQuestionSetInput {
  title?: string;
  topic_id?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateQuestionInput {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation?: string;
  image_url?: string | null;
}

export interface UpdateQuestionInput {
  question?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  correct_option?: "A" | "B" | "C";
  explanation?: string;
  image_url?: string | null;
  is_active?: boolean;
}

// --- Learning Paths ---

export interface CreateLearningPathInput {
  title: string;
  description?: string;
}

export interface UpdateLearningPathInput {
  title?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreatePathStepInput {
  step_order: number;
  step_type: LearningPathStepType;
  topic_id?: string;
  question_set_id?: string;
  question_count?: number;
}

export interface ReorderStepsInput {
  steps: { id: string; step_order: number }[];
}

// --- Students ---

export interface StudentLoginInput {
  student_code: string;
  password: string;
}

export interface StudentLoginResponse {
  student: Omit<TeacherStudent, "password_hash">;
  token: string;
}

export interface AssignPathInput {
  student_id: string;
  path_id: string;
}

// --- Excel Import ---

export interface ExcelStudentRow {
  nickname: string;
  email?: string;
  class_name?: string;
  student_code?: string;
  password?: string;
}

export interface ImportStudentInput {
  nickname: string;
  email?: string;
  class_name?: string;
  student_code?: string;
  password?: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

// --- Excel Question Import ---

export interface ExcelQuestionRow {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
  explanation?: string;
  image_url?: string;
}

export interface ImportQuestionInput {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation?: string;
  image_url?: string | null;
}

export interface QuestionImportResult {
  total: number;
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

// ============================================================
// UI state types
// ============================================================

export interface QuestionSetWithQuestions extends TeacherQuestionSet {
  questions: TeacherQuestion[];
  question_count?: number;
}

export interface LearningPathWithSteps extends TeacherLearningPath {
  steps: TeacherLearningPathStep[];
  step_count?: number;
}

export interface StudentWithProgress extends TeacherStudent {
  progress?: TeacherStudentProgress[];
  assigned_path?: TeacherLearningPath;
}

// ============================================================
// Student quiz state (for student-facing quiz flow)
// ============================================================

export interface StudentQuizQuestion {
  id: string;
  set_id: string;
  question: string;
  options: [string, string, string];
  correct_option: "A" | "B" | "C";
  explanation: string | null;
  image_url?: string | null;
}

export interface StudentQuizAnswer {
  question_id: string;
  selected_option: "A" | "B" | "C";
  is_correct: boolean;
  submitted_at: string;
}

export interface StudentQuizResult {
  path_id: string;
  step_id: string;
  score: number;
  total: number;
  answers: StudentQuizAnswer[];
  completed_at: string;
}

// ============================================================
// Topic mapping (reuse existing topic data)
// ============================================================

export type TeacherContentTopicId = QuizTopic;

export interface TopicOption {
  value: TeacherContentTopicId;
  label: string;
}

// ============================================================
// Feature 025: Teacher Custom Topics
// ============================================================

export interface TeacherTopic {
  id?: string;
  topic_key: string;
  label: string;
  is_default?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTopicInput {
  topic_key: string;
  label: string;
}

export interface UpdateTopicInput {
  label?: string;
  is_active?: boolean;
}

// ============================================================
// Student-facing types (024-student-content)
// ============================================================

export interface StudentSession {
  id: string;
  nickname: string;
  email: string | null;
  class_name: string | null;
  student_code: string;
  assigned_path_ids: string[];
  parent_access_code?: string | null;
}

export interface StudentDashboardData {
  student: StudentSession;
  assigned_paths: StudentLearningPathWithSteps[];
  progress: TeacherStudentProgress[];
  stats: StudentRewardStats;
}

export interface StudentLearningPathWithSteps extends TeacherLearningPath {
  steps: TeacherLearningPathStep[];
  step_count: number;
}

export interface StudentStepContent {
  step_id: string;
  path_id: string;
  step_type: LearningPathStepType;
  topic_id: string | null;
  question_set_id: string | null;
  step_order: number;
  // For topic type
  topic?: QuizTopic;
  topic_label?: string;
  // For question_set type
  questions?: TeacherQuestion[];
  question_count?: number;
}

export interface StudentQuizSubmission {
  step_id: string;
  path_id: string;
  answers: { question_id: string; selected_option: "A" | "B" | "C" }[];
}

export interface StudentProgressResponse {
  progress: TeacherStudentProgress[];
  stats: StudentRewardStats;
}

export interface StudentDailyQuizQuestion {
  id: string;
  question: string;
  options: [string, string, string];
}

export interface StudentDailyQuizAnswer {
  question_id: string;
  selected_option: "A" | "B" | "C";
}

export interface StudentDailyQuizResult {
  question_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  selected_option: "A" | "B" | "C" | null;
  correct_option: "A" | "B" | "C";
  is_correct: boolean;
  explanation: string | null;
}

export interface StudentDailyQuizResponse {
  date: string;
  completed: boolean;
  stats: StudentRewardStats;
  questions: StudentDailyQuizQuestion[];
  result?: {
    correct_count: number;
    total: number;
    xp_awarded: number;
    answers: StudentDailyQuizResult[];
    completed_at: string;
  };
}
