# Implementation Plan: Trang Giáo Viên

**Branch**: `feat/021-teacher-dashboard` | **Date**: 2026-05-17 | **Spec**: `specs/021-teacher-dashboard/SPEC.md` (v1.2)

**Input**: Feature specification with 5 clarifications resolved:
1. Student identity → no deduplication, each FinalResult entry = one play session
2. Search → partial match (case-insensitive), filter before sort
3. Sort → 4 options: Mới nhất (default), Điểm cao nhất, Tên A-Z, Tên Z-A
4. Topic chart → total answer counts per topic (StudentAnswer grouped by topicId)
5. Filter + Sort composable, pagination preserves both

---

## Summary

Build a dedicated teacher dashboard at `/teacher` — read-only, simpler than admin — for teachers to track student learning outcomes. Teacher authenticates with a shared code (`NEXT_PUBLIC_TEACHER_PASSWORD`), views stats, student list, answer history, topic charts, and exports CSV. No CRUD, no Supabase auth, no question/topic/path management.

---

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict mode — no implicit `any`)

**Primary Dependencies**: Next.js App Router + Zustand + localStorage (existing stack)

**Storage**: localStorage keys — `bats:final_results:v1` (FinalResult[]), `bats:student_answers:v1` (StudentAnswer[]), `bats:teacher_auth` (TeacherAuth)

**Testing**: Manual testing; `tsc --strict` as gate

**Target Platform**: Browser-based, desktop-first (768px+). Teacher dashboard is read-only.

**Performance Goals**: Stat cards render instantly; search filters within 100ms; CSV export within 3s for 1000 rows

**Scale/Scope**: 1 new page, 1 new component, ~100 new lines of code

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| **I. TypeScript-First** | All types explicit? No implicit `any`? | ✅ All types from existing `store.ts` |
| **II. Vietnamese-First** | All UI labels in Vietnamese? | ✅ |
| **III. Accessibility-First** | Keyboard nav for tables? ARIA labels? | ✅ Tables and modals have standard keyboard support |
| **IV. LocalStorage Resilience** | Data from localStorage? No server dependency? | ✅ |
| **V. AI Provider Resilience** | Not applicable | N/A |
| **VI. Admin Simplicity** | No server secrets? Read-only? | ✅ Teacher auth is simple code; read-only |
| **VII. Component Composition** | Business logic in `lib/`? Components orchestrating? | ✅ |

**Gate Result**: PASS — no violations.

---

## Project Structure

### Documentation (this feature)

```
specs/021-teacher-dashboard/
├── SPEC.md           # ✅ v1.2 (5 clarifications)
├── research.md       # ✅ 5 decisions
├── data-model.md    # ✅ (pending update with clarifications)
├── quickstart.md    # ✅ (pending update)
└── plan.md          # This file
```

### Source Code Changes

```
src/
├── app/
│   └── teacher/
│       └── page.tsx       # REPLACE stub with real dashboard
├── components/
│   └── admin/
│       └── TeacherDashboard.tsx  # NEW — teacher dashboard component
└── lib/
    └── store.ts            # MODIFY — add Teacher auth + stat helpers
```

**Structure Decision**: Teacher dashboard is a new component in `src/components/admin/` (shares layout patterns with AdminDashboard). Auth added to existing `store.ts` under `Teacher` namespace. StudentModal extracted for sharing.

---

## Complexity Tracking

> Fill only if Constitution Check has violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | — |

No violations. Simple feature.

---

## Implementation Phases

### Phase 0: Add Teacher Auth to store.ts

**Purpose**: Add `Teacher` auth CRUD and stat helpers to `lib/store.ts` — matches existing `Admin` pattern.

- [ ] **T001** Add `bats:teacher_auth` to `KEYS` object in `store.ts`
- [ ] **T002** Add `TEACHER_PASSWORD` export from env var
- [ ] **T003** Add `Teacher` namespace: `isLoggedIn()`, `login(code)`, `logout()`
- [ ] **T004** Add computed types: `StudentAggregate`, `TopicStats`, `TeacherOverviewStats`
- [ ] **T005** Add helper: `TeacherStats.overview()` — returns TeacherOverviewStats
- [ ] **T006** Add helper: `TeacherStats.aggregate()` — returns StudentAggregate[] (no dedup)
- [ ] **T007** Add helper: `TeacherStats.topicChart()` — returns TopicStats[] (answer counts)
- [ ] **T008** Add helper: `TeacherStats.exportCSV(rows)` — generates CSV Blob
- [ ] **T009** Verify `tsc --strict` passes with zero errors

**Checkpoint**: Teacher auth + all stat helpers ready — component can now be built.

---

### Phase 1: Replace Teacher Page Stub

**Purpose**: Replace the redirect stub at `src/app/teacher/page.tsx` with conditional rendering: login form or dashboard.

- [ ] **T010** Create `src/app/teacher/page.tsx` with:
  - Check `Teacher.isLoggedIn()` on mount
  - If not logged in → render `<TeacherLoginForm>`
  - If logged in → render `<TeacherDashboard>`
- [ ] **T011** Create `TeacherLoginForm` component (inline in page):
  - Teacher code input (type="password")
  - Submit button
  - Error message on wrong code
  - `Teacher.login(code)` on success → re-renders to dashboard
- [ ] **T012** Handle localStorage unavailable → show warning in Vietnamese
- [ ] **T013** Verify `tsc --strict` — zero errors

**Checkpoint**: Teacher route renders correctly in both states (logged in / logged out).

---

### Phase 2: Build TeacherDashboard Component

**Purpose**: Build the full teacher dashboard component with all tabs.

- [ ] **T020** Create `src/components/admin/TeacherDashboard.tsx` — main orchestrator
- [ ] **T021** Implement sidebar navigation with 4 tabs: Tổng quan, Học sinh, Biểu đồ, Đăng xuất
- [ ] **T022** Implement Overview tab: 4 stat cards (Tổng lượt chơi, Lượt chơi, Điểm TB, Lượt cao nhất) using `TeacherStats.overview()`
- [ ] **T023** Implement Students tab: paginated table (20/page) + search input (partial, case-insensitive) + sort dropdown (4 options) + "Xuất CSV" button
- [ ] **T024** Implement "Xemchi tiết" modal: answer history, accuracy stats, per-topic breakdown for selected row
- [ ] **T025** Implement Chart tab: horizontal CSS bar chart of total answer counts per topic (7 topics) using `TeacherStats.topicChart()`
- [ ] **T026** Implement Đăng xuất: `Teacher.logout()`, redirect to `/`
- [ ] **T027** Filter + Sort composable: filter on full list first, then sort, then paginate
- [ ] **T028** Verify `tsc --strict` — zero errors
- [ ] **T029** Verify all Vietnamese text (no English in UI)
- [ ] **T030** Verify keyboard navigation on table (arrow keys) and modal (Escape to close)

**Checkpoint**: Teacher dashboard fully functional.

---

### Phase 3: Polish & Documentation

**Purpose**: Update docs and test final integration.

- [ ] **T031** Update `.env.example` — add `NEXT_PUBLIC_TEACHER_PASSWORD=GiaoVien2026`
- [ ] **T032** Update `docs/PROJECT_DOCUMENTATION.md` — add teacher dashboard feature section
- [ ] **T033** Run `pnpm build` — verify build succeeds with zero errors

**Checkpoint**: Feature complete and documented.

---

## Dependencies & Execution Order

| Phase | Depends On | Blocking |
|---|---|---|
| Phase 0 (Teacher Auth + Helpers) | None | All |
| Phase 1 (Page Stub) | Phase 0 | — |
| Phase 2 (Dashboard) | Phase 1 | — |
| Phase 3 (Polish) | Phase 2 | — |

### Within Phase 2

T020 (component skeleton) → T021 (sidebar) → T022 (overview) → T023 (students table + search + sort + CSV) → T024 (modal) → T025 (chart) → T026 (logout) → T027-T030 (verify)

### Parallel Opportunities

- T001-T003 (auth) and T004-T008 (helpers) can run in parallel — separate sections of store.ts
- T022 and T025 are independent tabs — build after shared layout in T021
- T023 (students tab) is the most complex — takes the most time

---

## Key Utility Reference

| Utility | File | Used For |
|---|---|---|
| Teacher auth | `lib/store.ts` (Teacher namespace) | Login/logout check |
| Overview stats | `lib/store.ts` (TeacherStats.overview) | 4 stat cards |
| Student aggregates | `lib/store.ts` (TeacherStats.aggregate) | Student table, stats |
| Topic chart data | `lib/store.ts` (TeacherStats.topicChart) | Chart tab bars |
| CSV export | `lib/store.ts` (TeacherStats.exportCSV) | Download CSV |
| Topic labels | `lib/store.ts` (topicLabels) | Chart axis labels |

---

## Clarification Integrations

All 5 clarifications from spec v1.2 are integrated into this plan:

1. **Student identity**: Each FinalResult entry = one row. No deduplication. `totalStudents` = FinalResult[].length, `averageScore` = mean(total_score), `topStudent` = max(total_score).
2. **Search**: `StudentAggregate[]` filtered by `nickname.toLowerCase().includes(query.toLowerCase())` before sort.
3. **Sort**: 4 options — `newest` (completedAt DESC), `score` (totalScore DESC), `az` (nickname ASC), `za` (nickname DESC). Applied after filter, preserved across pagination.
4. **Topic chart**: Each bar = `StudentAnswer[].length` grouped by `topicId` (not questions, not students).
5. **Filter + Sort**: Composable — filter list → apply sort → paginate. Pagination preserves both.

---

## Admin vs Teacher: Shared Patterns

| Pattern | Admin | Teacher |
|---|---|---|
| Stat cards | `StatCard` reused | Same component |
| Student table | Custom table | Same table + search + sort |
| Student modal | `StudentModal` | Extract to `StudentModal.tsx`, reuse |
| CSV export | Inline Blob | Same pattern via `TeacherStats.exportCSV` |
| Sidebar nav | Admin tabs | Teacher tabs |
| Auth | `Admin.isLoggedIn()` | `Teacher.isLoggedIn()` |

> **Note**: `StudentModal` from `AdminDashboard.tsx` should be extracted to `src/components/admin/StudentModal.tsx` so it can be shared between admin and teacher dashboards. This is a small refactor (~50 lines) that improves component composition.

---

## Edge Cases Implemented

- Wrong code → show "Mã giáo viên không đúng" (no lockout)
- localStorage cleared → show login form on next load
- Student with 0 answers → "Chưa có lịch sử trả lời" in modal
- CSV with 1000+ rows → Blob generation (synchronous, fast enough)
- localStorage unavailable → warning: "Trình duyệt không cho phép lưu trữ. Vui lòng bật cookies."
- Long nickname → truncate at 20 chars with ellipsis, full name in modal
- Empty state → all cards show "—" or "0"

---

*Plan version: 1.1 | Feature: 021-teacher-dashboard | Constitution: 1.0.0 | Updated: 2026-05-17*
