# Feature Specification: Giáo Viên Tạo Nội Dung & Import Học Sinh
|
|> Bé An Toàn Số — Educational Internet Safety Game
|
|**Feature Branch**: `feat/023-teacher-content`
|
|**Created**: 2026-05-17
|
|**Status**: Draft
|
|**Input**: "Giáo viên có thể tạo bộ câu hỏi riêng và lộ trình cho học sinh, danh sách học sinh có thể import nhanh bằng Excel"
|
|**Constitution Check**: All features comply with Bé An Toàn Số Constitution.
- TypeScript-First: All types explicit — ✅
- Vietnamese-First: All UI text in Vietnamese — ✅
- Accessibility-First: Teacher dashboard desktop-focused; keyboard navigation for tables — ✅
- LocalStorage Resilience: Supabase with RLS for teacher-scoped data — ✅
- AI Provider: Not applicable — ✅
- Admin Simplicity: Teacher CRUD via Supabase RLS, no service role key on client — ✅
- Component Composition: Business logic in `lib/`, components orchestrating only — ✅

---

## 1. Overview & Motivation

### Current State

The current system has:
- **Admin-created questions** (in `questions` table, `is_active` flag)
- **Admin-created learning paths** (in `learning_paths` table)
- **Admin-created topics** (in `topics` table)
- **Teacher accounts** (Supabase Auth — admin creates them)
- **Teacher dashboard** — read-only view of student data (no content creation)

Teachers can only **see** what admins create. They cannot customize content for their students.

### Desired State

Teachers can:
1. **Create custom question sets** — their own questions scoped to their account
2. **Create custom learning paths** — sequences of topics they choose for their class
3. **Import student list via Excel/CSV** — bulk-create student accounts for their class

---

## 2. Scope

### In Scope

1. **Custom Question Sets (Teacher)**
   - Teacher creates questions in their own "bộ câu hỏi" (question set)
   - Questions scoped to teacher's Supabase Auth account (`created_by` = teacher UUID)
   - Teacher can edit/deactivate their own questions
   - Teacher can assign a question set to a learning path they create

2. **Custom Learning Paths (Teacher)**
   - Teacher creates learning paths scoped to their account
   - Teacher selects topics and question sets to include
   - Teacher can assign path to imported students

3. **Excel/CSV Student Import**
   - Teacher uploads `.xlsx` or `.csv` file
   - System parses: họ tên (nickname), email (optional), lớp (class, optional)
   - Bulk-generates student accounts in `teacher_students` table
   - Temporary passwords auto-generated or from template
   - Downloadable credentials list (CSV)

### Out of Scope

- Teacher editing admin-created questions or paths
- AI question generation for teachers
- Parent/student portal (students access via teacher-assigned credentials)
- Per-student progress tracking (future)
- Class management beyond student import

---

## 3. User Stories

### User Story 1 — Tạo Bộ Câu Hỏi Riêng (Priority: P1)

Giáo viên tạo một bộ câu hỏi mới với tiêu đề, chủ đề, và các câu hỏi bên trong. Mỗi câu hỏi có nội dung, 3 lựa chọn, đáp án đúng, và giải thích.

**Why this priority**: Core content creation — teachers need to create their own question sets to customize learning for their students.

**Independent Test**: Teacher logs in → clicks "Tạo bộ câu hỏi" → fills in title, topic, adds 3 questions → saves → sees new set in their list.

**Acceptance Scenarios**:

1. **Given** teacher is on the new "Bộ câu hỏi" tab, **When** they click "Tạo bộ câu hỏi", **Then** a creation form opens with: tên bộ, chủ đề (dropdown from existing topics), and an empty question list

2. **Given** teacher is on the creation form, **When** they add a question (content, option A/B/C, correct answer, explanation), **Then** the question appears in the list below the form with edit/delete actions

3. **Given** teacher fills all required fields and clicks "Lưu", **Then** the question set is saved to Supabase with `created_by = teacher UUID`, `is_custom = true`, and teacher is redirected to the question set list

4. **Given** teacher clicks on an existing question set, **When** the detail view opens, **Then** they can edit title/topic and add/remove/update questions

5. **Given** teacher has existing question sets, **When** they view the list, **Then** only their own sets are shown (RLS-filtered by `created_by`)

---

### User Story 2 — Tạo Lộ Trình Học Tập Riêng (Priority: P1)

Giáo viên tạo lộ trình học tập mới với tiêu đề, mô tả, và danh sách các bước. Mỗi bước chứa một chủ đề hoặc bộ câu hỏi riêng của giáo viên.

**Why this priority**: Teachers need learning paths to organize content for their students.

**Independent Test**: Teacher clicks "Tạo lộ trình" → fills title, description, adds 3 steps (mix of topics and custom question sets) → saves → sees new path in their list.

**Acceptance Scenarios**:

1. **Given** teacher is on the new "Lộ trình" tab, **When** they click "Tạo lộ trình", **Then** a creation form opens with: tiêu đề, mô tả, and an empty steps list

2. **Given** teacher adds a step, **When** they select step type, **Then** they can choose either "Chủ đề" (from existing topics) or "Bộ câu hỏi" (from their own question sets)

3. **Given** teacher fills all required fields and clicks "Lưu", **Then** the path is saved to Supabase with `created_by = teacher UUID` and teacher is redirected to the path list

4. **Given** teacher has existing paths, **When** they view the list, **Then** only their own paths are shown

---

### User Story 3 — Import Danh Sách Học Sinh Bằng Excel (Priority: P1)

Giáo viên tải lên file Excel/CSV chứa danh sách học sinh. Hệ thống parse file, tạo tài khoản học sinh, và trả về danh sách thông tin đăng nhập.

**Why this priority**: Bulk student creation is a key time-saver for teachers managing classes.

**Independent Test**: Teacher downloads template → fills 10 student rows → uploads → system creates 10 student accounts → teacher downloads credentials CSV.

**Acceptance Scenarios**:

1. **Given** teacher is on the new "Học sinh" tab, **When** they click "Import Excel", **Then** a file picker opens and teacher can select `.xlsx`, `.xls`, or `.csv` file

2. **Given** teacher uploads a valid file, **When** the file is parsed, **Then** a preview table shows all detected students with columns: họ tên, email (if present), lớp (if present), and a status column (valid/invalid row)

3. **Given** the file has invalid rows (missing họ tên), **When** preview is shown, **Then** invalid rows are highlighted in red with error messages, and teacher can remove invalid rows before confirming

4. **Given** teacher clicks "Xác nhận import", **When** the file is processed, **Then** student accounts are created in `teacher_students` table with `created_by = teacher UUID`, auto-generated passwords, and teacher receives a downloadable credentials CSV

5. **Given** teacher downloads credentials CSV, **When** the file is opened, **Then** it contains columns: họ tên, email (if provided), tài khoản (student ID), mật khẩu tạm, lớp

6. **Given** a student account is created, **When** a student visits the game, **Then** they can log in with their teacher-assigned credentials and their results are scoped to their teacher

---

### User Story 4 — Gán Lộ Trình Cho Học Sinh (Priority: P2)

Giáo viên gán một lộ trình học tập (của giáo viên hoặc mặc định) cho học sinh đã import, để học sinh chơi theo lộ trình đó.

**Why this priority**: Assigning paths personalizes learning but is not required for MVP.

**Independent Test**: Teacher selects 3 students → selects a custom path → clicks "Gán" → students see the path when they log in.

**Acceptance Scenarios**:

1. **Given** teacher is on the "Học sinh" tab, **When** they select one or more students (checkbox), **Then** an "Gán lộ trình" button appears

2. **Given** teacher clicks "Gán lộ trình", **When** the modal opens, **Then** it shows a list of available paths (both teacher's custom paths and default paths) with radio selection

3. **Given** teacher selects a path and clicks "Xác nhận", **Then** the selected students are updated with `assigned_path_id` in `teacher_students` table

---

### User Story 5 — Xem Kết Quả Học Sinh Theo Lộ Trình (Priority: P2)

Giáo viên xem kết quả của học sinh trong lộ trình mà cô đã gán, biết học sinh đã hoàn thành đến bước nào.

**Why this priority**: Follow-up on assigned paths — teachers need to track progress.

**Independent Test**: Teacher opens a student's detail → sees their assigned path with step completion status.

**Acceptance Scenarios**:

1. **Given** a student has an assigned path, **When** teacher views the student's results, **Then** the assigned path is displayed with completion status per step

2. **Given** a student completes a step, **When** teacher views results, **Then** the completed step shows a checkmark and score

---

## 4. Key Entities

### New Database Tables

#### `teacher_question_sets`
```sql
CREATE TABLE teacher_question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic_id TEXT NOT NULL REFERENCES topics(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `teacher_questions`
```sql
CREATE TABLE teacher_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES teacher_question_sets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C')),
  explanation TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `teacher_learning_paths`
```sql
CREATE TABLE teacher_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `teacher_learning_path_steps`
```sql
CREATE TABLE teacher_learning_path_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES teacher_learning_paths(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('topic', 'question_set')),
  topic_id TEXT REFERENCES topics(id),
  question_set_id UUID REFERENCES teacher_question_sets(id),
  UNIQUE (path_id, step_order)
);
```

#### `teacher_students`
```sql
CREATE TABLE teacher_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  email TEXT,
  class_name TEXT,
  student_code TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  assigned_path_id UUID REFERENCES teacher_learning_paths(id),
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `teacher_student_progress`
```sql
CREATE TABLE teacher_student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES teacher_students(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES teacher_learning_paths(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES teacher_learning_path_steps(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE (student_id, step_id)
);
```

### RLS Policies

All new tables have RLS enabled with policies ensuring teachers can only access their own data:
```sql
ALTER TABLE teacher_question_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher owns their question sets" ON teacher_question_sets
  FOR ALL USING (created_by = auth.uid());

ALTER TABLE teacher_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher owns their questions" ON teacher_questions
  FOR ALL USING (set_id IN (
    SELECT id FROM teacher_question_sets WHERE created_by = auth.uid()
  ));
-- Similar policies for teacher_learning_paths, teacher_students, etc.
```

---

## 5. Requirements

### Functional Requirements

- **FR-001**: Teacher MUST be able to create a question set with title, topic, and multiple questions
- **FR-002**: Teacher MUST be able to edit and deactivate their own question sets and questions
- **FR-003**: Teacher MUST be able to create a learning path with multiple steps (topic or question set)
- **FR-004**: Teacher MUST be able to import students from `.xlsx`, `.xls`, or `.csv` file
- **FR-005**: File MUST be parsed server-side with preview before confirmation
- **FR-006**: Invalid rows MUST be highlighted with error messages in preview
- **FR-007**: System MUST auto-generate unique student codes and passwords
- **FR-008**: System MUST provide downloadable credentials CSV after import
- **FR-009**: Teacher MUST be able to assign a learning path to selected students
- **FR-010**: All teacher-created content MUST be RLS-scoped to the teacher who created it
- **FR-011**: Student login via teacher-assigned credentials (email or student code + password)
- **FR-012**: Student game results MUST be scoped to their teacher's account
- **FR-013**: Teacher can view student progress on assigned paths
- **FR-014**: All UI text MUST be in Vietnamese
- **FR-015**: Template download link MUST be available for Excel import

### Technical Requirements

- **TR-001**: File parsing via `xlsx` (SheetJS) library on the client or via API route
- **TR-002**: Passwords hashed with bcrypt before storage (or Supabase Auth for students)
- **TR-003**: Student codes unique across all teachers (format: `GV{timestamp}{random}`)
- **TR-004**: RLS policies enforced at database level for all teacher-scoped tables

---

## 6. Edge Cases

- File has duplicate nicknames → show warning, allow import with sequential suffixes
- File has more than 500 rows → show warning about processing time, process in chunks
- Teacher uploads non-Excel file → show error "Vui lòng tải lên file Excel hoặc CSV"
- File missing required column (họ tên) → show error listing which columns are missing
- Teacher tries to edit admin-created questions → not allowed, edit button hidden
- Student code collision → auto-generate new unique code
- Teacher assigns path to student with no questions → show warning "Bộ câu hỏi này chưa có câu hỏi nào"
- Empty file uploaded → show error "File trống, vui lòng kiểm tra lại"
- Teacher tries to access another teacher's data via API manipulation → RLS blocks, return 403

---

## 7. Success Criteria

- **SC-001**: Teacher can create and save a question set with 10 questions in under 60 seconds
- **SC-002**: Excel import of 100 students completes and credentials CSV downloads in under 10 seconds
- **SC-003**: Import preview renders within 2 seconds of file selection
- **SC-004**: Invalid row detection accuracy ≥ 95% for common CSV formatting errors
- **SC-005**: All teacher-scoped data is invisible to other teachers (verified by direct Supabase query with different teacher credentials)
- **SC-006**: Student can log in with teacher-assigned credentials and play the assigned path
- **SC-007**: `tsc --strict` passes with zero errors

---

## 8. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/teacher/questions/route.ts` | CRUD for teacher question sets |
| `src/app/api/teacher/questions/[id]/route.ts` | Single question set operations |
| `src/app/api/teacher/paths/route.ts` | CRUD for teacher learning paths |
| `src/app/api/teacher/paths/[id]/route.ts` | Single path operations |
| `src/app/api/teacher/students/import/route.ts` | Excel/CSV parsing and student creation |
| `src/app/api/teacher/students/[id]/route.ts` | Student CRUD operations |
| `src/app/api/teacher/students/[id]/assign-path/route.ts` | Assign path to student(s) |
| `src/components/teacher/TeacherContentDashboard.tsx` | Main teacher content management UI |
| `src/components/teacher/QuestionSetForm.tsx` | Create/edit question set |
| `src/components/teacher/LearningPathForm.tsx` | Create/edit learning path |
| `src/components/teacher/StudentImport.tsx` | Excel import UI with preview |
| `src/components/teacher/StudentList.tsx` | Student list with assign-path action |
| `src/lib/teacherStore.ts` | Zustand store for teacher content state |
| `src/lib/excelParser.ts` | Pure function: parse Excel/CSV to student rows |
| `scripts/migration/023_teacher_content.sql` | Supabase migration for new tables |
| `scripts/migration/024_teacher_rls.sql` | RLS policies for teacher tables |
| `specs/023-teacher-content/tasks.md` | Task breakdown |

### Modify

| File | Change |
|------|--------|
| `src/app/teacher/page.tsx` | Add tab navigation: "Tổng quan", "Bộ câu hỏi", "Lộ trình", "Học sinh" |
| `src/app/teacher/student/[code]/page.tsx` | NEW — Student login via teacher-assigned code |
| `src/lib/supabase.ts` | Add teacher-scoped query helpers if needed |
| `src/components/teacher/TeacherDashboard.tsx` | Rename/add new tabs for content management |
| `.env.example` | Document new Supabase tables |
| `src/app/teacher/page.tsx` | Add student login route for teacher-assigned accounts |

---

## 9. Excel Import Template

### Column Headers (required)
| Column | Required | Type | Example |
|--------|----------|------|---------|
| `họ_tên` | ✅ Yes | Text | Nguyễn Văn A |
| `email` | No | Email | nguyenvana@school.edu.vn |
| `lớp` | No | Text | 3A |

### Template Download
System provides a "Tải mẫu Excel" button that downloads a `.xlsx` template with:
- Column headers pre-filled
- 3 example rows
- Formatting (yellow highlight on required columns)

---

*Spec version: 1.0 | Feature: 023-teacher-content | Author: Claude | Date: 2026-05-17*
