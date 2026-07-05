---
description: "Task list for Bé An Toàn Số feature 023 — Teacher Content & Student Import"
---

# Tasks: Teacher Content & Student Import

> Bé An Toàn Số — Educational Internet Safety Game

**Input**: Design documents from `specs/023-teacher-content/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Constitution**: All tasks MUST comply with Bé An Toàn Số Constitution:
- TypeScript strict (no implicit `any`)
- Vietnamese UI text only
- Voice/TTS included where answers are displayed
- localStorage persistence for client game state
- AI content safety filter (for AI-generated content)
- No server-side secrets on client bundle

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Foundation

**Purpose**: Database migrations, type definitions, and shared utilities that all user stories depend on.

- [ ] T001 [P] Create `scripts/migration/023_teacher_content.sql` with all new tables: `teacher_question_sets`, `teacher_questions`, `teacher_learning_paths`, `teacher_learning_path_steps`, `teacher_students`, `teacher_student_progress`
- [ ] T002 [P] Create `scripts/migration/024_teacher_rls.sql` with RLS policies for all new tables (`created_by = auth.uid()` policy on each table)
- [ ] T003 [P] Define TypeScript interfaces in `src/types/teacher-content.ts`: `TeacherQuestionSet`, `TeacherQuestion`, `TeacherQuestionSetWithQuestions`, `TeacherLearningPath`, `TeacherLearningPathStep`, `TeacherLearningPathWithSteps`, `TeacherStudent`, `StudentProgress`, `ImportedStudentRow`
- [ ] T004 [P] Add `excelParser.ts` pure function in `src/lib/excelParser.ts` with: `parseExcelFile(file: File): Promise<ImportedStudentRow[]>`, `downloadTemplate()`, `generateStudentCode(): string`, `generateTempPassword(): string`
- [ ] T005 [P] Add `src/lib/teacherStore.ts` Zustand store with state: `questionSets`, `learningPaths`, `students`, `selectedTab`, `isLoading`

**Checkpoint**: Database and shared utilities ready — user story implementation can begin.

---

## Phase 2: User Story 1 — Tạo Bộ Câu Hỏi Riêng (Priority: P1)

**Goal**: Teacher can create, view, and edit custom question sets with multiple questions.

**Independent Test**: Teacher logs in → creates question set "Bộ AN TOÀN MẠNG" with 3 questions → saves → edits one question → sees updated set in list.

### Implementation

- [ ] T010 [P] [US1] Create API route `src/app/api/teacher/questions/route.ts` with GET (list own sets) and POST (create set + questions) handlers. Require teacher session via Supabase Auth. Use `supabaseServer` client. Return 401 if not authenticated.
- [ ] T011 [P] [US1] Create API route `src/app/api/teacher/questions/[id]/route.ts` with GET (one set with questions), PATCH (update set/question), DELETE (soft-deactivate `is_active = false`) handlers
- [ ] T012 [US1] Create `src/components/teacher/QuestionSetTab.tsx` — tab UI with: list of own question sets (empty state, loading, error), "Tạo bộ câu hỏi" button, click on set → detail view
- [ ] T013 [US1] Create `src/components/teacher/QuestionSetForm.tsx` — create/edit form with: title input, topic dropdown (from `topics` table), dynamic question list (add/remove questions), each question: content textarea, option A/B/C text inputs, correct answer radio (A/B/C), explanation textarea. Use Vietnamese labels throughout.
- [ ] T014 [US1] Wire `QuestionSetForm` to API via `fetch` calls with teacher session token. Show loading state during save. Show success toast on save.
- [ ] T015 [US1] Add `topic_label` field to question set response by joining with `topics` table
- [ ] T016 [US1] Verify RLS: query same API with different teacher token → should see only their own sets
- [ ] T017 [US1] Run `tsc --strict` — zero errors

**Checkpoint**: US1 independently testable and working.

---

## Phase 3: User Story 2 — Tạo Lộ Trình Học Tập Riêng (Priority: P1)

**Goal**: Teacher can create and manage learning paths with ordered steps (topic or custom question set per step).

**Independent Test**: Teacher creates path "LỘ TRÌNH AN TOÀN LỚP 3" with 3 steps (2 topics + 1 custom question set) → saves → sees path in list with step count.

### Implementation

- [ ] T020 [P] [US2] Create API route `src/app/api/teacher/paths/route.ts` with GET (list own paths) and POST (create path + steps) handlers
- [ ] T021 [P] [US2] Create API route `src/app/api/teacher/paths/[id]/route.ts` with GET (one path with steps), PATCH (update path/step), DELETE (soft-deactivate) handlers
- [ ] T022 [US2] Create `src/components/teacher/LearningPathTab.tsx` — tab UI with: list of own paths (empty state, loading), "Tạo lộ trình" button, each row shows title, step count, topic names
- [ ] T023 [US2] Create `src/components/teacher/LearningPathForm.tsx` — create/edit form with: title input, description textarea, dynamic step list (add/remove/reorder), each step: step type selector (Chủ đề / Bộ câu hỏi), topic dropdown (from `topics`) or question set dropdown (from `teacher_question_sets`), up/down arrows for reorder
- [ ] T024 [US2] Wire `LearningPathForm` to API. Show loading state during save. Validate at least 1 step before saving.
- [ ] T025 [US2] Add step type indicator (topic icon vs question-set icon) in the step list
- [ ] T026 [US2] Verify RLS: same teacher token check
- [ ] T027 [US2] Run `tsc --strict` — zero errors

**Checkpoint**: US2 independently testable and working.

---

## Phase 4: User Story 3 — Import Danh Sách Học Sinh Bằng Excel (Priority: P1)

**Goal**: Teacher can upload Excel/CSV file, preview students, confirm import, and download credentials.

**Independent Test**: Teacher downloads template → fills 5 rows → uploads → preview shows all 5 → confirms → downloads credentials CSV with 5 student accounts.

### Implementation

- [ ] T030 [P] [US3] Create API route `src/app/api/teacher/students/route.ts` with GET (list own students, paginated) handler
- [ ] T031 [P] [US3] Create API route `src/app/api/teacher/students/import/route.ts` with POST (bulk create students from parsed rows) handler. Generate unique `student_code`, bcrypt hash password, insert into `teacher_students` table. Return credentials array.
- [ ] T032 [P] [US3] Create API route `src/app/api/teacher/students/[id]/route.ts` with PATCH (edit student: nickname, class_name, email) and DELETE (soft-deactivate) handlers
- [ ] T033 [P] [US3] Create API route `src/app/api/teacher/students/[id]/assign-path/route.ts` with POST (assign `assigned_path_id`, set `assigned_at`) handler. Accept `{ student_ids: string[], path_id: string }` body.
- [ ] T034 [US3] Create `src/components/teacher/StudentTab.tsx` — tab UI with: student count stat, "Tải mẫu Excel" button, "Import Excel" button, student table with columns: họ tên, lớp, mã HS, assigned path, ngày tạo. Multi-select checkboxes.
- [ ] T035 [US3] Create `src/components/teacher/StudentImport.tsx` — import flow: (1) "Tải mẫu" button calls `downloadTemplate()` from `excelParser.ts` → downloads `.xlsx` template. (2) File input accepts `.xlsx`, `.xls`, `.csv`. (3) On file select: `parseExcelFile()` → show preview table with status column. (4) Invalid rows highlighted red with error messages. Teacher can remove invalid rows. (5) "Xác nhận import" → POST to `/api/teacher/students/import`. (6) On success: show credentials table + "Tải credentials CSV" button.
- [ ] T036 [US3] Wire `StudentImport` to API. Handle file parse errors gracefully. Show total valid / invalid count in preview.
- [ ] T037 [US3] Add "Gán lộ trình" action: select students → "Gán lộ trình" button appears → modal with path list → POST to assign-path API
- [ ] T038 [US3] Verify: import 10 students → Supabase has 10 records with `created_by` matching teacher
- [ ] T039 [US3] Run `tsc --strict` — zero errors

**Checkpoint**: US3 independently testable and working.

---

## Phase 5: User Story 4 — Gán Lộ Trình Cho Học Sinh (Priority: P2)

**Goal**: Teacher can assign a learning path to selected students.

**Independent Test**: Teacher selects 3 students → clicks "Gán lộ trình" → selects "LỘ TRÌNH AN TOÀN LỚP 3" → confirms → students' `assigned_path_id` updated in database.

### Implementation

- [ ] T040 [P] [US4] Create API route `src/app/api/teacher/students/assign-path/route.ts` with POST handler accepting `{ student_ids: string[], path_id: string }`. Update all matching students in `teacher_students` table. Set `assigned_at = now()`.
- [ ] T041 [US4] Add assign-path modal to `StudentTab.tsx`: radio-button path list, confirm button, success toast
- [ ] T042 [US4] Update student table to show assigned path name (join with `teacher_learning_paths`) when viewing students
- [ ] T043 [US4] Verify: assign path to 3 students → database shows all 3 with same `assigned_path_id`
- [ ] T044 [US4] Run `tsc --strict` — zero errors

**Checkpoint**: US4 independently testable and working.

---

## Phase 6: User Story 5 — Xem Kết Quả Học Sinh Theo Lộ Trình (Priority: P2)

**Goal**: Teacher can view student progress on assigned learning paths.

**Independent Test**: Teacher clicks on a student → detail view shows assigned path with step completion status.

### Implementation

- [ ] T050 [P] [US5] Create API route `src/app/api/teacher/students/[id]/progress/route.ts` with GET handler returning student's progress on their assigned path (join `teacher_student_progress` with `teacher_learning_path_steps`)
- [ ] T051 [US5] Create `src/components/teacher/StudentDetail.tsx` — detail view showing: student info card, assigned path with step list, completion status per step (checkmark icon for completed steps)
- [ ] T052 [US5] Wire `StudentDetail` into `StudentTab.tsx`: click on student row → open detail modal
- [ ] T053 [US5] Run `tsc --strict` — zero errors

**Checkpoint**: US5 independently testable and working.

---

## Phase 7: Student Login & Game (Priority: P1)

**Goal**: Students can log in with teacher-assigned credentials and play their assigned path.

### Implementation

- [ ] T060 [P] [Student] Create student login page at `src/app/student/login/page.tsx` with: mã học sinh input, mật khẩu input, "Đăng nhập" button, Vietnamese error messages
- [ ] T061 [P] [Student] Create `src/components/student/StudentLoginForm.tsx` — login form with validation, loading state, error display
- [ ] T062 [Student] Create API route `src/app/api/student/login/route.ts` with POST handler: lookup student by `student_code`, verify bcrypt password, return student session (store `created_by` teacher UUID + `student_id` in Zustand)
- [ ] T063 [Student] Create `src/app/student/game/page.tsx` — student game page that reads from student Zustand store. Loads assigned path + questions. Records progress to `teacher_student_progress` via API.
- [ ] T064 [Student] Wire student game results → POST to `/api/student/progress/route.ts` on completion. Save step score and `completed_at` timestamp.
- [ ] T065 [Student] Add logout button to student game page → clears student Zustand store → redirects to `/student/login`
- [ ] T066 [Student] Handle edge case: student has no assigned path → show "Chưa có lộ trình được gán. Liên hệ giáo viên." message
- [ ] T067 [Student] Run `tsc --strict` — zero errors

**Checkpoint**: Student login and game flow end-to-end testable.

---

## Phase 8: Teacher Page Integration

**Goal**: Add content management tabs to the teacher page.

### Implementation

- [ ] T070 [P] [US1-US3] Update `src/app/teacher/page.tsx` — add tab navigation: "Tổng quan" (existing), "Bộ câu hỏi" (→ QuestionSetTab), "Lộ trình" (→ LearningPathTab), "Học sinh" (→ StudentTab). Import and render tab components.
- [ ] T071 [P] [US1-US3] Add route for student login: `src/app/student/` directory with login and game pages
- [ ] T072 Run `pnpm dev` — verify no runtime errors on teacher page with all tabs
- [ ] T073 Run `tsc --strict` — zero errors

**Checkpoint**: All tabs render and navigate correctly.

---

## Phase 9: Polish

- [ ] T080 [P] Update `SPEC.md` with completed acceptance criteria checked
- [ ] T081 [P] Update `.env.example` if any new env vars needed
- [ ] T082 Verify `pnpm build` passes with zero errors
- [ ] T083 Keyboard navigation test: Tab through all new forms, Enter to submit, Escape to close modals
- [ ] T084 Final `tsc --strict` check — zero errors

---

## Dependencies & Execution Order

| Phase | Depends On | Blocking |
|-------|-----------|---------|
| Phase 1: Foundation | None | All user stories |
| Phase 2: US1 (Question Sets) | Foundation | — |
| Phase 3: US2 (Learning Paths) | Foundation | — |
| Phase 4: US3 (Student Import) | Foundation | — |
| Phase 5: US4 (Assign Path) | Foundation + US2 + US3 | — |
| Phase 6: US5 (View Progress) | Foundation + US4 | — |
| Phase 7: Student Login | Phase 1 (types) | — |
| Phase 8: Integration | US1, US2, US3, US7 | — |
| Phase 9: Polish | All phases | — |

### Within Each User Story

- Database/API first → then UI components
- Types/interfaces before business logic
- Business logic in `lib/` (pure functions)
- Components last (orchestration only)

### Parallel Opportunities

- [P] tasks within same phase can run in parallel
- US1, US2, US3 can run in parallel after Phase 1
- Phase 7 (Student Login) can start after Phase 1
- Different API routes within same phase can run in parallel

---

## Key Utility Reference

| Task | Utility File | Notes |
|------|-------------|-------|
| Excel parsing | `src/lib/excelParser.ts` | `parseExcelFile()`, `downloadTemplate()` |
| Teacher state | `src/lib/teacherStore.ts` | Zustand + localStorage |
| Type definitions | `src/types/teacher-content.ts` | All interfaces |
| Supabase client | `src/lib/supabase.ts` | Client singleton |
| Supabase server | `src/lib/supabase-admin.ts` | Service role key |

---

## Task Summary

| ID | Task | Story | Priority |
|----|------|-------|----------|
| T001 | Migration: new tables | — | P1 |
| T002 | Migration: RLS policies | — | P1 |
| T003 | TypeScript interfaces | — | P1 |
| T004 | Excel parser utility | — | P1 |
| T005 | Teacher Zustand store | — | P1 |
| T006 | Question Set API (CRUD routes) | US1 | P1 |
| T007 | Question Set UI (Tab + Form) | US1 | P1 |
| T008 | Learning Path API (CRUD routes) | US2 | P1 |
| T009 | Learning Path UI (Tab + Form) | US2 | P1 |
| T010 | Student API (list, import, CRUD, assign-path) | US3 | P1 |
| T011 | Student Import UI (tab, modal, template download) | US3 | P1 |
| T012 | Student Login API | Student | P1 |
| T013 | Student Login UI | Student | P1 |
| T014 | Student Game page + progress recording | Student | P1 |
| T015 | Teacher page integration (tabs) | US1-US3 | P1 |
| T016 | Polish & TypeScript strict | — | P1 |

**Total**: 16 task groups (expanding to ~84 individual checklist items across all phases)

---

## Suggested MVP Scope

**MVP = Phases 1-4 (Foundation + US1 + US2 + US3)**
- T001–T005 (Foundation)
- T006–T007 (Question Sets API + UI)
- T008–T009 (Learning Paths API + UI)
- T010–T011 (Student Import API + UI)

This gives teachers the core ability to create content and import students in one cohesive delivery.

---

*Tasks version: 1.0 | Feature: 023-teacher-content | Constitution: 1.0.0*
