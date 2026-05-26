# Data Model — Feature 023: Teacher Content & Student Import

**Feature**: `feat/023-teacher-content`
**Date**: 2026-05-17

---

## 1. TypeScript Interfaces

### Teacher Question Sets

```typescript
interface TeacherQuestionSet {
  id: string;          // UUID
  created_by: string;  // auth.users.id (teacher UUID)
  title: string;
  topic_id: string;    // references topics.id
  description?: string;
  is_active: boolean;
  created_at: string;  // ISO timestamp
  updated_at: string;
}

interface TeacherQuestion {
  id: string;
  set_id: string;        // references teacher_question_sets.id
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: 'A' | 'B' | 'C';
  explanation?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TeacherQuestionSetWithQuestions extends TeacherQuestionSet {
  questions: TeacherQuestion[];
  topic_label?: string;
}
```

### Teacher Learning Paths

```typescript
interface TeacherLearningPath {
  id: string;
  created_by: string;  // auth.users.id
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TeacherLearningPathStep {
  id: string;
  path_id: string;              // references teacher_learning_paths.id
  step_order: number;           // 1-based
  step_type: 'topic' | 'question_set';
  topic_id?: string;            // null when step_type = 'question_set'
  question_set_id?: string;     // null when step_type = 'topic'
}

interface TeacherLearningPathWithSteps extends TeacherLearningPath {
  steps: TeacherLearningPathStep[];
  step_count: number;
}
```

### Teacher Students

```typescript
interface TeacherStudent {
  id: string;
  created_by: string;         // auth.users.id (teacher UUID)
  nickname: string;
  email?: string;
  class_name?: string;
  student_code: string;         // unique: GV{timestamp}{random}
  password_hash: string;
  assigned_path_id?: string;   // references teacher_learning_paths.id
  assigned_at?: string;
  created_at: string;
}

interface StudentProgress {
  id: string;
  student_id: string;
  path_id: string;
  step_id: string;
  score: number;
  completed_at?: string;
}

interface ImportedStudentRow {
  họ_tên: string;
  email?: string;
  lớp?: string;
  status: 'valid' | 'invalid';
  error_message?: string;
  generated_code?: string;
  generated_password?: string;
}
```

---

## 2. Supabase Schema

### Tables

| Table | PK | Foreign Keys | RLS |
|-------|-----|-------------|-----|
| `teacher_question_sets` | `id UUID` | `created_by → auth.users`, `topic_id → topics` | ✅ Teacher owns their sets |
| `teacher_questions` | `id UUID` | `set_id → teacher_question_sets` | ✅ Via subquery on set owner |
| `teacher_learning_paths` | `id UUID` | `created_by → auth.users` | ✅ Teacher owns their paths |
| `teacher_learning_path_steps` | `id UUID` | `path_id → teacher_learning_paths`, `topic_id → topics`, `question_set_id → teacher_question_sets` | ✅ Via subquery on path owner |
| `teacher_students` | `id UUID` | `created_by → auth.users`, `assigned_path_id → teacher_learning_paths` | ✅ Teacher owns their students |
| `teacher_student_progress` | `id UUID` | `student_id → teacher_students`, `path_id → teacher_learning_paths`, `step_id → teacher_learning_path_steps` | ✅ Via subquery on student owner |

### Existing Tables Used

| Table | Usage |
|-------|-------|
| `topics` | Source for topic dropdown in question set and path creation |
| `auth.users` | Teacher identity for RLS scoping |

---

## 3. Validation Rules

| Field | Rule |
|-------|------|
| `teacher_question_sets.title` | Required, max 200 chars, trimmed |
| `teacher_question_sets.topic_id` | Required, must exist in `topics` table |
| `teacher_questions.question` | Required, max 1000 chars |
| `teacher_questions.correct_option` | Must be 'A', 'B', or 'C' |
| `teacher_questions.explanation` | Optional, max 500 chars |
| `teacher_learning_paths.title` | Required, max 200 chars |
| `teacher_learning_path_steps` | At least 1 step required |
| `teacher_students.nickname` | Required, max 100 chars, trimmed |
| `teacher_students.student_code` | Unique across all teachers |
| `teacher_students.email` | Optional, but if provided must be valid email format |

---

## 4. State Transitions

### Question Set Lifecycle
```
Draft → Active → (deactivated by teacher)
```

### Student Progress Lifecycle
```
Not Started → In Progress (first step started) → Completed (all steps done)
```

---

## 5. Indexes

```sql
CREATE INDEX idx_tqs_created_by ON teacher_question_sets(created_by);
CREATE INDEX idx_tqs_active ON teacher_question_sets(created_by, is_active) WHERE is_active = true;
CREATE INDEX idx_tq_set_id ON teacher_questions(set_id);
CREATE INDEX idx_tlp_created_by ON teacher_learning_paths(created_by);
CREATE INDEX idx_tlps_path_id ON teacher_learning_path_steps(path_id);
CREATE INDEX idx_ts_created_by ON teacher_students(created_by);
CREATE INDEX idx_ts_student_code ON teacher_students(student_code);
CREATE INDEX idx_tsp_student_id ON teacher_student_progress(student_id);
```

---

*Data model version: 1.0 | Feature: 023-teacher-content*
