# Tasks: Tự Động Chuyển Học Sinh Đến Nội Dung Học Tập

> Bé An Toàn Số — Educational Internet Safety Game

**Input**: Design documents from `/specs/027-student-auto-redirect/`

**Prerequisites**: SPEC.md (user stories)

**Feature Summary**: Tự động redirect học sinh đến nội dung học tập khi đăng nhập thay vì hiển thị dashboard trung gian.

---

## Phase 1: Implementation

**Goal**: Thêm auto-redirect logic vào StudentDashboardPage

**Independent Test**: Login với student có assigned_path → redirect tự động đến quiz/progress

### Implementation

- [x] T001 [US1] Thêm useEffect auto-redirect trong `src/app/student/dashboard/page.tsx`
  - Khi `data` load xong và có `assigned_path`:
    - Nếu có `nextStep` → redirect đến `/student/quiz/${nextStep.id}`
    - Nếu không có `nextStep` (hoàn thành) → redirect đến `/student/progress`
  - Nếu không có `assigned_path` → hiển thị dashboard bình thường

- [x] T002 [US2] Xử lý redirect chỉ khi data thay đổi lần đầu
  - Thêm ref `hasRedirected` để tránh redirect loop khi component re-render

- [x] T003 [US3] Cập nhật loading state trong khi redirect
  - Hiển thị loading indicator ngắn gọn trước khi redirect

- [x] T004 Verify TypeScript: `tsc --noEmit` — zero errors

---

## Phase 2: Testing

**Goal**: Xác minh auto-redirect hoạt động đúng cho tất cả các trường hợp

### Test Cases

- [x] T010 Test US1: Login student đã gán lộ trình + có bước tiếp theo → redirect đến quiz
- [x] T011 Test US2: Login student đã hoàn thành lộ trình → redirect đến /student/progress
- [x] T012 Test US3: Login student chưa gán lộ trình → hiển thị dashboard "Chưa có lộ trình"
- [x] T013 Test: Không có flash màn hình trước khi redirect

---

## Phase 3: Polish

- [x] T020 Cập nhật SPEC.md với implementation details
- [x] T021 Final TypeScript check: `tsc --noEmit` — zero errors

---

## Dependencies & Execution Order

| Phase | Depends On | Description |
|-------|-----------|-------------|
| Implementation (Phase 1) | None | Core redirect logic |
| Testing (Phase 2) | Phase 1 | Verify all user stories |
| Polish (Phase 3) | Phase 1 + 2 | Final polish |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/student/dashboard/page.tsx` | Thêm auto-redirect useEffect |

---

## Key Reference

- `StudentDashboardData` type: `src/types/teacher-content.ts`
- `assigned_path` property: Chứa thông tin lộ trình + steps
- `progress` array: Chứa danh sách step đã hoàn thành

*Tasks version: 1.0*
