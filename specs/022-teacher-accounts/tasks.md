---
description: "Task list for 022-teacher-accounts feature"
---

# Tasks: Teacher Accounts in Supabase

> Bé An Toàn Số — Educational Internet Safety Game

**Input**: Design documents from `/specs/022-teacher-accounts/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Constitution**: All tasks MUST comply with Bé An Toàn Số Constitution:
- TypeScript strict (no implicit `any`)
- Vietnamese UI text only
- Voice/TTS included where answers are displayed
- localStorage persistence for client game state
- AI content safety filter
- Supabase Auth for teacher authentication
- Service role client for server-side admin operations

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

---

## Phase 1: Foundation

**Purpose**: Database migration and shared infrastructure that all user stories depend on.

### Database Migration

- [x] T001 Apply Supabase migration `scripts/migration/022_add_teachers_table.sql` to Supabase dashboard or via `supabase db push`

**Checkpoint**: `teachers` table exists in Supabase with RLS and indexes.

### API Infrastructure

- [x] T002 [P] Create `src/lib/supabase-admin.ts` — service role client (server-side only)

```typescript
// src/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

- [x] T003 [P] Add `Teacher` TypeScript type to `src/lib/store.ts`

```typescript
// Add to src/lib/store.ts
export type Teacher = {
  id: string;
  authUid: string;
  name: string;
  email: string;
  schoolId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

**Checkpoint**: Foundation complete — all user stories can now be implemented.

---

## Phase 2: API Routes (Server-side)

**Purpose**: CRUD endpoints for teacher management. All routes are server-side only.

### Teacher API

- [x] T010 [P] Create `src/app/api/teachers/route.ts` — `GET` (list all teachers) and `POST` (create teacher)

```typescript
// GET /api/teachers — list all teachers (admin only)
// POST /api/teachers — create teacher account
//   1. supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })
//   2. supabaseAdmin.from("teachers").insert({ auth_uid, name, email })
```

- [x] T011 [P] Create `src/app/api/teachers/[id]/route.ts` — `PATCH` (update name, deactivate, reset password) and `DELETE` (soft delete)

```typescript
// PATCH /api/teachers/[id]
//   - Update name: UPDATE teachers SET name = ...
//   - Deactivate: UPDATE teachers SET is_active = false
//   - Reset password: supabaseAdmin.auth.admin.updateUserById(authUid, { password })
// DELETE /api/teachers/[id]
//   - Soft delete: UPDATE teachers SET is_active = false
```

**Checkpoint**: API routes return correct JSON, handle errors with Vietnamese messages.

---

## Phase 3: User Story 1 — Admin Creates Teacher Account (Priority: P1)

**Goal**: Admin can create a teacher account with name, email, and password. Account is created in both Supabase Auth and the `teachers` table.

**Independent Test**: POST to `/api/teachers` returns new teacher record. Teacher can log in at `/teacher` with created credentials.

### Implementation

- [ ] T020 [US1] Create `src/components/admin/TeacherManager.tsx` — main admin UI component
- [ ] T021 [US1] Create `src/components/admin/CreateTeacherDialog.tsx` — modal form with name, email, password fields (or auto-generate)
- [ ] T022 [US1] Implement create logic: `POST /api/teachers` → Supabase Auth → `teachers` table
- [ ] T023 [US1] Handle `409` (duplicate email) error with Vietnamese message: "Email đã được sử dụng"
- [ ] T024 [US1] Show success toast with teacher credentials after creation
- [ ] T025 [US1] Add Vietnamese UI labels throughout (all text in Vietnamese)
- [ ] T026 [US1] Run `tsc --strict` — zero errors

**Checkpoint**: Admin can create a teacher account and the teacher can log in.

---

## Phase 4: User Story 2 — Teacher Logs In with Email/Password (Priority: P1)

**Goal**: `/teacher` shows email/password form. Valid credentials redirect to teacher dashboard.

**Independent Test**: Navigate to `/teacher` → enter valid teacher credentials → redirected to teacher dashboard. Invalid credentials → error "Email hoặc mật khẩu không đúng".

### Implementation

- [ ] T030 [US2] Replace login form in `src/app/teacher/page.tsx` — swap shared password for email/password fields
- [ ] T031 [US2] Implement `signInWithPassword` from `@supabase/supabase-js` with error handling
- [ ] T032 [US2] On successful auth: fetch teacher profile from `teachers` table, verify `is_active = true`
- [ ] T033 [US2] Handle inactive account: `signOut()` and show "Tài khoản đã bị vô hiệu hóa"
- [ ] T034 [US2] Handle invalid credentials: show "Email hoặc mật khẩu không đúng"
- [ ] T035 [US2] Add loading state during auth (button disabled, spinner)
- [ ] T036 [US2] Handle `supabase === null` (config error): show "Supabase chưa được cấu hình"
- [ ] T037 [US2] Run `tsc --strict` — zero errors

**Checkpoint**: Teacher can log in with email/password. Session persists across page refresh.

---

## Phase 5: User Story 3 — Admin Lists All Teachers (Priority: P1)

**Goal**: New "Giáo viên" tab in Admin Dashboard shows all teacher accounts with search and sort.

**Independent Test**: Navigate to `/admin` → click "Giáo viên" tab → table shows all teachers with name, email, date, status.

### Implementation

- [ ] T040 [P] [US3] Add "Giáo viên" tab to `src/components/admin/AdminDashboard.tsx` — add to NAV_ITEMS and render `<TeacherManager />`
- [ ] T041 [P] [US3] Implement teacher list table in `TeacherManager.tsx` — columns: name, email, created date, status
- [ ] T042 [US3] Add search by name or email (case-insensitive partial match) in `TeacherManager.tsx`
- [ ] T043 [US3] Add sort options (name A-Z, name Z-A, date) in `TeacherManager.tsx`
- [ ] T044 [US3] Add pagination (10 per page) in `TeacherManager.tsx`
- [ ] T045 [US3] Fetch teachers via `GET /api/teachers` on tab mount
- [ ] T046 [US3] Add Vietnamese column headers and status badges ("Hoạt động" / "Vô hiệu hóa")
- [ ] T047 [US3] Run `tsc --strict` — zero errors

**Checkpoint**: Admin sees paginated, searchable teacher list.

---

## Phase 6: User Story 4 — Admin Deactivates Teacher Account (Priority: P2)

**Goal**: Admin can deactivate a teacher account. Deactivated teacher cannot log in.

**Independent Test**: Deactivate teacher → attempt to log in → show "Tài khoản đã bị vô hiệu hóa".

### Implementation

- [ ] T050 [US4] Add "Vô hiệu hóa" button to each teacher row in `TeacherManager.tsx`
- [ ] T051 [US4] Create `src/components/admin/DeactivateTeacherDialog.tsx` — confirmation dialog ("Bạn có chắc muốn vô hiệu hóa tài khoản này?")
- [ ] T052 [US4] Implement deactivate: `PATCH /api/teachers/[id]` with `isActive: false` + `supabaseAdmin.auth.admin.updateUserById(authUid, { disabled: true })`
- [ ] T053 [US4] Refresh teacher list after deactivation
- [ ] T054 [US4] Update US2 error handling: check `is_active` on login and show appropriate message
- [ ] T055 [US4] Run `tsc --strict` — zero errors

**Checkpoint**: Deactivated teacher cannot log in. Admin sees updated status.

---

## Phase 7: User Story 5 — Admin Resets Teacher Password (Priority: P2)

**Goal**: Admin can reset a teacher's password to a new value.

**Independent Test**: Reset password → log in with new password → success.

### Implementation

- [ ] T060 [US5] Add "Đặt lại mật khẩu" button to each teacher row in `TeacherManager.tsx`
- [ ] T061 [US5] Create `src/components/admin/ResetPasswordDialog.tsx` — modal with new password input (min 8 chars)
- [ ] T062 [US5] Implement password reset: `PATCH /api/teachers/[id]` with `password` → `supabaseAdmin.auth.admin.updateUserById(authUid, { password })`
- [ ] T063 [US5] Add password validation (min 8 chars) with Vietnamese error message
- [ ] T064 [US5] Show success toast: "Mật khẩu đã được đặt lại"
- [ ] T065 [US5] Run `tsc --strict` — zero errors

**Checkpoint**: Admin can reset teacher password. New password works on next login.

---

## Phase 8: User Story 6 — Teacher Session Expires (Priority: P3)

**Goal**: Expired session redirects teacher to login with message.

**Independent Test**: Clear session → navigate to `/teacher` → redirect to login with "Phiên đã hết hạn".

### Implementation

- [ ] T070 [US6] Add `onAuthStateChange` listener in `src/app/teacher/page.tsx` — listen for `SIGNED_OUT` event
- [ ] T071 [US6] On `SIGNED_OUT` with `token Refresh Token` error → show "Phiên đã hết hạn" toast
- [ ] T072 [US6] On `SIGNED_OUT` → redirect to login form
- [ ] T073 [US6] Verify teacher dashboard (`TeacherDashboard`) already handles auth state via `Teacher.isLoggedIn()` (remove this after switch to Supabase auth)
- [ ] T074 [US6] Run `tsc --strict` — zero errors

**Checkpoint**: Expired session redirects to login with Vietnamese message.

---

## Phase 9: Polish & Cleanup

**Purpose**: Remove old code, update docs, final verification.

- [ ] T080 [P] Remove old `Teacher` namespace from `src/lib/store.ts` — delete `TEACHER_PASSWORD`, `Teacher.isLoggedIn()`, `Teacher.login()`, `Teacher.logout()`, `teacher: "bats:teacher_auth"` from KEYS (keep `TeacherStats` — data helpers)
- [ ] T081 [P] Remove `NEXT_PUBLIC_TEACHER_PASSWORD=` from `.env.example`
- [ ] T082 Update `SPEC.md` (root) — update teacher auth section to reflect Supabase Auth
- [ ] T083 Update `PROJECT_DOCUMENTATION.md` — update teacher authentication section
- [ ] T084 Verify `pnpm build` passes — zero errors
- [ ] T085 Run `tsc --strict` — zero TypeScript errors
- [ ] T086 Manual smoke test: admin creates teacher → teacher logs in → teacher logs out

**Checkpoint**: Old auth code removed. Build green. All docs updated.

---

## Dependencies & Execution Order

| Phase | Depends On | Blocking |
|-------|-----------|---------|
| Foundation (Phase 1) | None | All user stories |
| API Routes (Phase 2) | Foundation | US1, US4, US5 |
| User Story 1 — Create Teacher (Phase 3) | API Routes | — |
| User Story 2 — Teacher Login (Phase 4) | Foundation | US6 |
| User Story 3 — List Teachers (Phase 5) | API Routes | US4, US5 |
| User Story 4 — Deactivate (Phase 6) | US3, US5 | — |
| User Story 5 — Reset Password (Phase 7) | US3, US5 | — |
| User Story 6 — Session Expiry (Phase 8) | US2 | — |
| Polish (Phase 9) | All user stories | — |

### Within Each User Story

1. Types/interfaces first (already in Foundation)
2. API route (already in Phase 2)
3. Components last (orchestration only)
4. Error handling with Vietnamese messages
5. TypeScript strict mode

### Parallel Opportunities

- **T002, T003** (Foundation): Can run in parallel
- **T010, T011** (API Routes): Can run in parallel
- **T020, T021** (US1): Can run in parallel
- **T030, T031** (US2): Can run in parallel
- **T040, T041** (US3): Can run in parallel
- **T050, T051** (US4): Can run in parallel
- **T060, T061** (US5): Can run in parallel
- **T080, T081** (Polish): Can run in parallel

### User Stories That Can Run in Parallel (after Foundation)

- US1 (Create Teacher) and US3 (List Teachers) — both depend on API Routes only
- US4 (Deactivate) and US5 (Reset Password) — both depend on US3 and API Routes
- US2 (Teacher Login) — independent, can run in parallel with US1/US3

---

## Key Utility Reference

| Task | Utility File | Notes |
|------|-------------|-------|
| Supabase Admin client | `src/lib/supabase-admin.ts` | Server-side only, never client |
| Supabase client | `src/lib/supabase.ts` | Client singleton, graceful null |
| Store | `src/lib/store.ts` | TeacherStats kept, old Teacher auth removed |
| Teacher manager UI | `src/components/admin/TeacherManager.tsx` | CRUD table |
| Create teacher dialog | `src/components/admin/CreateTeacherDialog.tsx` | Modal form |
| Deactivate dialog | `src/components/admin/DeactivateTeacherDialog.tsx` | Confirmation |
| Reset password dialog | `src/components/admin/ResetPasswordDialog.tsx` | Password input |
| Teacher login | `src/app/teacher/page.tsx` | Replace shared password form |
| Admin dashboard | `src/components/admin/AdminDashboard.tsx` | Add Giáo viên tab |

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 86 |
| **User Stories** | 6 (FR-1 through FR-6) |
| **Parallelizable Tasks** | 17 |
| **API Routes** | 2 files |
| **New Components** | 5 |
| **Modified Files** | 5 |
| **SQL Migrations** | 1 |
| **Phases** | 9 |

### MVP Scope (Suggested First Iteration)

- Phase 1 (Foundation) + Phase 2 (API) + Phase 3 (US1) + Phase 4 (US2) + Phase 9 (Polish)
- Admin creates teacher → teacher logs in → done
- Remaining stories (US3–US6) can be delivered in second iteration

---

*Tasks version: 1.0 | Feature: 022-teacher-accounts | Constitution: 1.0.0*
