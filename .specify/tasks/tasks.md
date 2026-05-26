# Feature 025: Bulk Student Path Assignment

**Mô tả:** Cho phép giáo viên chọn nhiều học sinh cùng lúc bằng checkbox và gán (hoặc thu hồi) lộ trình học tập chung.

**Trạng thái:** In Development

---

## Tech Stack

- **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) via `@supabase/supabase-js`
- **Auth**: Supabase Auth JWT (service role key cho server-side bulk operations)

---

## Database Schema (hiện có)

```
teacher_students       — có assigned_path_id (null = chưa gán)
teacher_learning_paths — lộ trình học tập
```

---

## Phase 1: Foundation

**Purpose**: Backend API endpoint và store action dùng chung cho tất cả user stories.

### API Endpoint

- [ ] T001 [P] Create `src/app/api/teacher/students/bulk-assign/route.ts`
  - POST handler nhận `{ student_ids: string[], path_id: string | null }`
  - Sử dụng Supabase Admin client (service role key) để update nhiều rows
  - SQL: `UPDATE teacher_students SET assigned_path_id = $1 WHERE id = ANY($2::uuid[])`
  - Trả về `{ success: true, updated_count: number, updated_students: TeacherStudent[] }`
  - Thêm error handling với Vietnamese error messages

### Store Action

- [ ] T002 [P] Add `assignPathToStudents(studentIds: string[], pathId: string | null): Promise<void>` to `src/lib/teacherContentStore.ts`
  - Gọi POST `/api/teacher/students/bulk-assign`
  - On success: cập nhật students trong store với danh sách `updated_students` từ API
  - On error: throw error để UI xử lý toast

**Checkpoint**: API và store action sẵn sàng — UI implementation có thể bắt đầu.

---

## Phase 2: User Story 1 — Multi-Select Students (Priority: P1)

**Goal**: Mỗi card học sinh có checkbox, header có nút chọn tất cả / bỏ chọn, counter hiển thị số đã chọn.

**Independent Test**: Mở Teacher Dashboard → Students tab → click checkbox → counter tăng → "Chọn tất cả" → tất cả được chọn.

### Implementation

- [ ] T010 [P] [US1] Add selection state to `src/components/admin/StudentImportManager.tsx`
  - `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());`
  - Helper: `toggleSelect(id)`, `selectAll()`, `clearAll()`
  - Computed: `const selectedCount = selectedIds.size;`

- [ ] T011 [P] [US1] Add checkbox to each student card in `src/components/admin/StudentImportManager.tsx`
  - Thêm checkbox ở góc trái trên của mỗi card
  - Click checkbox → gọi `toggleSelect(student.id)`
  - Card đã chọn: thêm class `border-sky-400 bg-sky-50` để nổi bật

- [ ] T012 [P] [US1] Add selection action bar to header of `src/components/admin/StudentImportManager.tsx`
  - Khi `selectedCount > 0`: hiển thị counter "Đã chọn: N học sinh"
  - Nút "Chọn tất cả" → `selectAll()`
  - Nút "Bỏ chọn" → `clearAll()`
  - Nút ẩn khi `selectedCount === 0`

**Checkpoint**: User Story 1 independently testable — checkboxes hoạt động, counter đúng.

---

## Phase 3: User Story 2 — Bulk Assign Learning Path (Priority: P1)

**Goal**: Khi có học sinh được chọn, hiển thị button "Gán lộ trình" → dropdown chọn lộ trình → submit → cập nhật database.

**Independent Test**: Chọn 2 học sinh → "Gán lộ trình" → chọn lộ trình → submit → cả 2 được gán, selection reset.

### Implementation

- [ ] T020 [P] [US2] Add bulk assign action bar button to `src/components/admin/StudentImportManager.tsx`
  - Khi `selectedCount > 0 && learningPaths.length > 0`: hiển thị button "Gán lộ trình" (icon Routes/Map)
  - Khi `learningPaths.length === 0`: disabled + tooltip "Chưa có lộ trình nào"
  - Nút "Thu hồi lộ trình": hiển thị khi `selectedCount > 0`, disabled nếu chưa chọn

- [ ] T021 [P] [US2] Add inline path selector dropdown in action bar of `src/components/admin/StudentImportManager.tsx`
  - Dropdown/select chọn lộ trình (dùng `learningPaths` đã fetch sẵn)
  - Nút "Áp dụng" → gọi `assignPathToStudents(Array.from(selectedIds), selectedPathId)`
  - Loading state trong lúc gọi API
  - On success: reset selection, toast "Đã gán lộ trình cho N học sinh"
  - On error: hiển thị toast lỗi, giữ nguyên selection

**Checkpoint**: User Story 2 independently testable — bulk assign hoạt động đúng.

---

## Phase 4: User Story 3 — Bulk Revoke Learning Path (Priority: P2)

**Goal**: Thu hồi lộ trình (gán `assigned_path_id = null`) cho nhiều học sinh đã chọn.

**Independent Test**: Chọn 2 học sinh đã gán lộ trình → "Thu hồi lộ trình" → confirm → cả 2 được thu hồi.

### Implementation

- [ ] T030 [P] [US3] Add revoke confirmation and bulk revoke to `src/components/admin/StudentImportManager.tsx`
  - Click "Thu hồi lộ trình" → `confirm("Thu hồi lộ trình của N học sinh?")`
  - Nếu confirm: gọi `assignPathToStudents(Array.from(selectedIds), null)`
  - Loading state khi gọi API
  - On success: reset selection, toast "Đã thu hồi lộ trình của N học sinh"
  - On error: hiển thị toast lỗi, giữ nguyên selection

**Checkpoint**: User Story 3 independently testable — bulk revoke hoạt động đúng.

---

## Phase 5: Polish

- [ ] T040 [P] Responsive test on tablet viewport (768px) — grid vẫn hiển thị tốt
- [ ] T041 [P] Keyboard navigation — Tab để di chuyển giữa các checkbox
- [ ] T042 Verify `npm run build` — zero TypeScript errors
- [ ] T043 Remove all `console.log` statements
- [ ] T044 Final smoke test — import students → select → assign → verify student dashboard nhận đúng lộ trình

---

## Dependencies & Execution Order

| Phase | Depends On | Blocking |
|-------|-----------|---------|
| Phase 1: Foundation | None | Phases 2, 3, 4 |
| Phase 2: US1 (Multi-select) | Phase 1 | — |
| Phase 3: US2 (Bulk Assign) | Phase 1 | — |
| Phase 4: US3 (Bulk Revoke) | Phase 1 | — |
| Phase 5: Polish | Phases 2, 3, 4 | — |

### Parallel Opportunities

- **T001 và T002** có thể chạy song song (API và store, không phụ thuộc nhau)
- **T010, T011, T012** có thể chạy song song (3 phần UI khác nhau trong cùng component)
- **T020 và T021** có thể chạy song song (button và dropdown cùng file nhưng logic độc lập)
- **US1, US2, US3** sau Phase 1 có thể chạy song song (3 người khác nhau implement)
- **T040 và T041** có thể chạy song song (responsive và keyboard test)

### Suggested MVP Scope

Chỉ cần **Phase 1 + Phase 2 (US1 + US2)** là đã đủ tính năng cơ bản:
- Chọn nhiều học sinh bằng checkbox
- Gán lộ trình chung cho các học sinh đã chọn
- Thu hồi (US3) và Polish có thể làm sau

---

## Key Utility Reference

| Task | Utility File | Notes |
|------|-------------|-------|
| Store | `src/lib/teacherContentStore.ts` | Zustand store, đã có `assignPathToStudent` (single), cần thêm bulk |
| Student API | `src/app/api/teacher/students/bulk-assign/route.ts` | Mới tạo |
| Component | `src/components/admin/StudentImportManager.tsx` | Thêm multi-select UI |

---

*Tasks version: 1.0*
