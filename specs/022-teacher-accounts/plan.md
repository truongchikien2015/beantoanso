# Plan: Teacher Accounts in Supabase

**Feature**: 022-teacher-accounts
**Version**: 1.0
**Date**: 2026-05-17
**Branch**: `feat/teacher-accounts`
**Spec**: `specs/022-teacher-accounts/SPEC.md`

---

## Technical Context

### Current State
- Teacher dashboard (`/teacher`) uses `NEXT_PUBLIC_TEACHER_PASSWORD` env var + `bats:teacher_auth` localStorage
- `Teacher` namespace in `src/lib/store.ts` handles auth
- No teacher accounts table in Supabase
- Admin creates teachers by sharing the same password

### Components to Create/Modify
- `src/lib/supabase-admin.ts` — service role client (NEW)
- `src/app/api/teachers/route.ts` — GET/POST (NEW)
- `src/app/api/teachers/[id]/route.ts` — PATCH/DELETE (NEW)
- `src/app/teacher/page.tsx` — Replace login with Supabase auth (MODIFY)
- `src/components/admin/TeacherManager.tsx` — Admin CRUD UI (NEW)
- `src/components/admin/AdminDashboard.tsx` — Add tab (MODIFY)
- `src/lib/store.ts` — Remove `Teacher` namespace (MODIFY)
- `scripts/migration/022_add_teachers_table.sql` — DB migration (NEW)

### Constitution Alignment
- **TypeScript-First**: All types defined, strict mode, no `any`
- **Vietnamese-First**: All UI text in Vietnamese
- **No Breaking Changes**: Migration path keeps old auth working during transition

---

## Phase 0: Research & Setup

### Tasks
- [x] Create `specs/022-teacher-accounts/` directory
- [x] Create `SPEC.md`
- [x] Create `research.md`
- [x] Create `data-model.md`
- [x] Create `quickstart.md`
- [x] Create `plan.md`
- [ ] Run `git checkout -b feat/teacher-accounts`

---

## Phase 1: Database Migration & API Routes

### Tasks

#### Task 1: Create Supabase migration script

```bash
scripts/migration/022_add_teachers_table.sql
```

SQL:
- `CREATE TABLE public.teachers (id, auth_uid, name, email, school_id, is_active, created_at, updated_at)`
- RLS policies
- Updated_at trigger
- Indexes on `email`, `auth_uid`

**Files**: `scripts/migration/022_add_teachers_table.sql`

#### Task 2: Create supabase-admin client

```typescript
// src/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

Only used in server-side API routes. Never imported in client components.

**Files**: `src/lib/supabase-admin.ts` (NEW)

#### Task 3: Create GET/POST /api/teachers route

```typescript
// GET /api/teachers — list all teachers (admin only)
// POST /api/teachers — create teacher account
//   1. supabaseAdmin.auth.admin.createUser({ email, password })
//   2. supabaseAdmin.from("teachers").insert({ auth_uid, name, email })
```

**Files**: `src/app/api/teachers/route.ts` (NEW)

#### Task 4: Create PATCH/DELETE /api/teachers/[id] route

```typescript
// PATCH /api/teachers/[id]
//   - Update name: UPDATE teachers SET name = ...
//   - Update password: supabaseAdmin.auth.admin.updateUserById(authUid, { password })
//   - Deactivate: UPDATE teachers SET is_active = false
// DELETE /api/teachers/[id]
//   - Soft delete: UPDATE teachers SET is_active = false
//   - Optionally disable auth: supabaseAdmin.auth.admin.updateUserById(authUid, { disabled: true })
```

**Files**: `src/app/api/teachers/[id]/route.ts` (NEW)

#### Task 5: Create migration file

```bash
mkdir -p scripts/migration
# scripts/migration/022_add_teachers_table.sql already created in Task 1
```

---

## Phase 2: Admin Teacher Management UI

### Tasks

#### Task 6: Add "Giáo viên" tab to AdminDashboard

Modify `src/components/admin/AdminDashboard.tsx`:
- Add new `TeacherTab` tab to NAV_ITEMS
- Render `<TeacherManager />` component
- Same sidebar layout as other tabs

**Files**: `src/components/admin/AdminDashboard.tsx` (MODIFY)

#### Task 7: Create TeacherManager component

Full CRUD UI for admin:

```typescript
// src/components/admin/TeacherManager.tsx
// - TeacherTable: paginated, searchable, sortable
// - CreateTeacherDialog: form with name, email, password (or auto-generate)
// - EditTeacherDialog: name, is_active toggle
// - ResetPasswordDialog: new password input
// - DeactivateConfirmDialog: confirmation before deactivating
```

**Files**: `src/components/admin/TeacherManager.tsx` (NEW)

#### Task 8: Add Teacher type to store.ts

```typescript
// src/lib/store.ts
export type Teacher = {
  id: string;
  authUid: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

**Files**: `src/lib/store.ts` (MODIFY — add type only)

---

## Phase 3: Teacher Login (Supabase Auth)

### Tasks

#### Task 9: Replace teacher login form

Modify `src/app/teacher/page.tsx`:
- Replace `Teacher` namespace login with Supabase Auth email/password
- Use `signInWithPassword` from `@supabase/supabase-js`
- If `supabase` is null, show config error
- On success: redirect to teacher dashboard
- On failure: show error message
- Track session with `onAuthStateChange` listener

**Files**: `src/app/teacher/page.tsx` (MODIFY)

```typescript
// Key changes to src/app/teacher/page.tsx
import { supabase } from "@/lib/supabase";  // or relative path

async function handleLogin(email: string, password: string) {
  if (!supabase) throw new Error("Supabase chưa được cấu hình");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  // redirect to dashboard
}
```

#### Task 10: Fetch teacher profile on login

On successful auth, fetch teacher record from `teachers` table:
```typescript
const { data: teacher } = await supabase
  .from("teachers")
  .select("*")
  .eq("auth_uid", session.user.id)
  .single();

if (!teacher?.is_active) {
  await supabase.auth.signOut();
  throw new Error("Tài khoản đã bị vô hiệu hóa");
}
```

**Files**: `src/app/teacher/page.tsx` (MODIFY)

---

## Phase 4: Cleanup & Documentation

### Tasks

#### Task 11: Remove old Teacher namespace from store.ts

Remove (or mark deprecated):
- `export const TEACHER_PASSWORD = ...`
- `export const Teacher = { isLoggedIn, login, logout }`
- Remove `teacher: "bats:teacher_auth"` from KEYS

Keep `TeacherStats` — those are data helpers for displaying student data.

**Files**: `src/lib/store.ts` (MODIFY)

#### Task 12: Update .env.example

Remove `NEXT_PUBLIC_TEACHER_PASSWORD=` line.

**Files**: `.env.example` (MODIFY)

#### Task 13: Update SPEC.md

Update section 6 (Authentication Mechanisms) to reflect new teacher auth.

**Files**: `SPEC.md` (MODIFY)

#### Task 14: Update PROJECT_DOCUMENTATION.md

Update teacher authentication section.

**Files**: `PROJECT_DOCUMENTATION.md` (MODIFY)

#### Task 15: Run build

```bash
pnpm build
```

Fix any TypeScript errors.

**Verification**: `pnpm build` passes with zero errors.

---

## Task Summary

| Phase | Task | File | Status |
|---|---|---|---|
| 0 | Create spec files | specs/022-teacher-accounts/* | ✅ |
| 1 | Migration SQL | scripts/migration/022_add_teachers_table.sql | ⬜ |
| 1 | supabase-admin client | src/lib/supabase-admin.ts | ⬜ |
| 1 | API: GET/POST /api/teachers | src/app/api/teachers/route.ts | ⬜ |
| 1 | API: PATCH/DELETE /api/teachers/[id] | src/app/api/teachers/[id]/route.ts | ⬜ |
| 2 | Add tab to AdminDashboard | src/components/admin/AdminDashboard.tsx | ⬜ |
| 2 | TeacherManager component | src/components/admin/TeacherManager.tsx | ⬜ |
| 2 | Add Teacher type | src/lib/store.ts | ⬜ |
| 3 | Replace teacher login | src/app/teacher/page.tsx | ⬜ |
| 3 | Fetch teacher profile | src/app/teacher/page.tsx | ⬜ |
| 4 | Remove old Teacher namespace | src/lib/store.ts | ⬜ |
| 4 | Update .env.example | .env.example | ⬜ |
| 4 | Update SPEC.md | SPEC.md | ⬜ |
| 4 | Update PROJECT_DOCUMENTATION.md | PROJECT_DOCUMENTATION.md | ⬜ |
| 4 | Run build | — | ⬜ |

**Total: 15 tasks**

---

## Open Questions (must resolve before Phase 1)

1. Q1: Per-teacher data filtering? → Current plan: all teachers see all data
2. Q2: Self-service password reset? → Current plan: admin only
3. Q3: Existing shared-password teachers migrated? → Current plan: new accounts only
4. Q4: Shared password kept as fallback? → Current plan: yes, during Phase 1→2 transition

---

## Verification Checklist

- [ ] `pnpm build` passes with zero errors
- [ ] All TypeScript strict mode checks pass
- [ ] Teacher can log in with email/password
- [ ] Admin can create a teacher account
- [ ] Admin can deactivate a teacher account
- [ ] Deactivated teacher cannot log in
- [ ] Old shared password no longer works (after Phase 2)
- [ ] Student data dashboard still works (unchanged)

---

*Plan version: 1.0 | Feature: 022-teacher-accounts*
