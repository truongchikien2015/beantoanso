# SPEC.md — Teacher Accounts in Supabase

**Feature**: 022-teacher-accounts
**Version**: 1.0
**Date**: 2026-05-17
**Status**: Draft

---

## 1. Overview & Motivation

### Current State

Teacher dashboard (`/teacher`) uses a **shared password** (`NEXT_PUBLIC_TEACHER_PASSWORD`) stored in localStorage (`bats:teacher_auth`). All teachers share the same code. This is:
- ✅ Simple to set up
- ❌ No per-teacher visibility — all teachers see all student data
- ❌ Cannot revoke access for individual teachers
- ❌ Cannot assign teachers to classes/groups
- ❌ No audit trail of who accessed the dashboard

### Desired State

Teacher accounts created and managed by **admin** in Supabase. Each teacher:
- Has individual credentials (email/password via Supabase Auth)
- Can log in at `/teacher` with their own account
- Access is **per-school or per-teacher** (visibility scoping TBD)
- Admin can create/deactivate accounts

---

## 2. Scope

### In Scope

1. **New Supabase table** `teachers` — stores teacher profiles
2. **Teacher Supabase Auth** — email/password sign-up/sign-in
3. **Teacher login page** at `/teacher` — replaces shared password form with Supabase auth
4. **Admin management UI** — CRUD teachers in Admin Dashboard (create, edit, deactivate)
5. **Teacher session persistence** — session stored in Supabase, not localStorage
6. **RLS policies** — teachers can only read data scoped to their school (if school field exists)

### Out of Scope

- Teacher profile page (future)
- Per-teacher data filtering (requires school/class field — future feature)
- Email invitations for teachers (future)
- Password reset flow (future)
- Two-factor auth (future)

---

## 3. User Stories

### FR-1: Admin creates teacher account
**As** an admin,
**I want** to create a teacher account with email and password,
**So that** the teacher can log in to their dashboard.

**Acceptance criteria:**
- [ ] Admin clicks "Thêm giáo viên" in `/admin` Teachers tab
- [ ] Admin enters: name, email, password (or generates temporary password)
- [ ] Account is created in `teachers` table + Supabase Auth
- [ ] Confirmation shown with generated credentials
- [ ] Teacher can immediately log in at `/teacher`

### FR-2: Teacher logs in with email/password
**As** a teacher,
**I want** to log in with my email and password,
**So that** I can access my dashboard.

**Acceptance criteria:**
- [ ] `/teacher` shows email/password form (not shared code)
- [ ] Valid credentials → redirect to teacher dashboard
- [ ] Invalid credentials → show error "Email hoặc mật khẩu không đúng"
- [ ] Loading state during auth
- [ ] Session persists across page refresh

### FR-3: Admin deactivates teacher account
**As** an admin,
**I want** to deactivate a teacher account,
**So that** the teacher can no longer log in.

**Acceptance criteria:**
- [ ] Admin clicks "Vô hiệu hóa" on teacher row
- [ ] Confirmation dialog shown
- [ ] `is_active = false` in `teachers` table
- [ ] Teacher is immediately logged out and redirected to login
- [ ] Teacher cannot log in while account is inactive

### FR-4: Admin lists all teachers
**As** an admin,
**I want** to see all teacher accounts,
**So that** I can manage them.

**Acceptance criteria:**
- [ ] New "Giáo viên" tab in Admin Dashboard
- [ ] Table shows: name, email, created date, status (active/inactive)
- [ ] Search by name or email
- [ ] Sort by name, email, date

### FR-5: Admin resets teacher password
**As** an admin,
**I want** to reset a teacher's password,
**So that** I can help a teacher who forgot their password.

**Acceptance criteria:**
- [ ] Admin clicks "Đặt lại mật khẩu" on teacher row
- [ ] Admin enters new password
- [ ] Password updated in Supabase Auth
- [ ] Confirmation shown

### FR-6: Teacher session expires
**As** a teacher,
**I want** my session to expire after inactivity,
**So that** the dashboard is secure.

**Acceptance criteria:**
- [ ] Session expires after 7 days (Supabase default)
- [ ] Expired session → redirect to login with message "Phiên đã hết hạn"

---

## 4. System Architecture

### 4.1 New Database Table: `teachers`

```sql
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,          -- Supabase Auth stores this
  school_id TEXT,                        -- future: for per-school filtering
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Only admin can manage teachers (service role key used server-side)
-- Teachers can read their own profile
CREATE POLICY "Admin manages teachers" ON public.teachers
  FOR ALL USING (true) WITH CHECK (true);

-- Everyone can read active teachers (for login lookup)
CREATE POLICY "Read active teachers" ON public.teachers
  FOR SELECT USING (is_active = true);
```

### 4.2 Authentication Flow

```
Teacher Login (/teacher)
  → Supabase Auth: email/password
  → On success: store session (Supabase handles this)
  → Redirect to /teacher/dashboard
  → Fetch teacher profile from `teachers` table

Admin Creates Teacher (/admin → Teachers tab)
  → Server action or API route
  → Creates user in Supabase Auth (admin API)
  → Inserts record in `teachers` table
  → Returns credentials to admin
```

### 4.3 Migration: Shared Password → Supabase Auth

The current `NEXT_PUBLIC_TEACHER_PASSWORD` and `bats:teacher_auth` localStorage key are **deprecated** after this feature. The admin dashboard's existing "Teacher" tab (if any) or new tab will manage accounts.

### 4.4 Route Changes

| Route | Change |
|---|---|
| `/teacher` | Replace login form (shared code) → Supabase email/password login |
| `/teacher` (authenticated) | Redirect to `/teacher/dashboard` |
| `/teacher/dashboard` | NEW — teacher dashboard (read-only, same as current) |
| `/admin` | New "Giáo viên" tab for CRUD teachers |

---

## 5. UI/UX

### 5.1 Teacher Login Page (`/teacher`)

**Visual**: Same layout as current login form, but with email + password fields.

```
┌─────────────────────────────────────┐
│  👩‍🏫 Trang Giáo Viên                 │
│                                     │
│  [Email input]                      │
│  [Mật khẩu input]                   │
│                                     │
│  [Đăng nhập button]                 │
│                                     │
│  [Error message if any]              │
│                                     │
│  ── Hoặc ──                        │
│  [Quên mật khẩu? Liên hệ admin]    │
└─────────────────────────────────────┘
```

### 5.2 Admin Teachers Tab (`/admin`)

**Visual**: Table with CRUD actions.

```
┌─────────────────────────────────────────────────────────┐
│ 👩‍🏫 Giáo viên                        [+ Thêm giáo viên]   │
│                                                         │
│ [🔎 Tìm kiếm...]                     [name ▼] [date] │
│                                                         │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Name          │ Email         │ Date   │ Status │ Act │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ Nguyễn Văn A │ nguyena@...   │ 2026-0 │ Active │ ✏️ 🗑️│ │
│ │ Trần Thị B    │ tranb@...     │ 2026-0 │ Active │ ✏️ 🗑️│ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ < Trang 1 / 3 >                                        │
└─────────────────────────────────────────────────────┘
```

### 5.3 Create/Edit Teacher Dialog

```
┌─────────────────────────────────┐
│ Thêm giáo viên              [✕] │
│─────────────────────────────────  │
│ Họ và tên                       │
│ [________________________]         │
│                                 │
│ Email                           │
│ [________________________]         │
│                                 │
│ Mật khẩu tạm (để trống = auto) │
│ [________________________]         │
│                                 │
│ [Hủy]            [Tạo tài khoản] │
└─────────────────────────────────┘
```

---

## 6. API / Server Actions

### 6.1 `POST /api/teachers`

Create a teacher account.

**Request:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "nguyena@school.edu.vn",
  "password": "TempPass123"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Nguyễn Văn A",
  "email": "nguyena@school.edu.vn",
  "createdAt": "2026-05-17T..."
}
```

**Errors:**
- `400` — Missing fields
- `409` — Email already exists
- `401` — Admin not authenticated
- `500` — Supabase Auth error

### 6.2 `GET /api/teachers`

List all teachers (admin only).

**Response:**
```json
{
  "teachers": [
    {
      "id": "uuid",
      "name": "Nguyễn Văn A",
      "email": "nguyena@school.edu.vn",
      "isActive": true,
      "createdAt": "2026-05-17T..."
    }
  ]
}
```

### 6.3 `PATCH /api/teachers/[id]`

Update teacher (name, is_active) or reset password.

**Request (reset password):**
```json
{
  "password": "NewPass456"
}
```

**Request (deactivate):**
```json
{
  "isActive": false
}
```

### 6.4 `DELETE /api/teachers/[id]`

Soft-delete (set `is_active = false`).

---

## 7. Security

### 7.1 Authentication
- Teacher auth via Supabase Auth (email/password)
- Session stored in Supabase, not localStorage
- Admin uses `SUPABASE_SERVICE_ROLE_KEY` for server-side operations (teacher CRUD)

### 7.2 Authorization
- Teacher dashboard (`/teacher`) checks Supabase session
- Admin dashboard (`/admin`) still uses `NEXT_PUBLIC_ADMIN_PASSWORD` (localStorage)
- RLS policies on `teachers` table restrict access

### 7.3 Password Requirements
- Minimum 8 characters
- Admin sets initial password (teacher can change after first login — future)

### 7.4 Data Safety
- Teacher credentials are never logged
- Passwords hashed by Supabase Auth (bcrypt/argon2)
- Service role key only used in server API routes, never exposed to client

---

## 8. Migration Plan

### Phase 1: Zero-breaking addition
1. Add `teachers` table to Supabase (via migration SQL)
2. Add `POST /api/teachers` + `GET /api/teachers` routes
3. Add "Giáo viên" tab to Admin Dashboard (admin creates teachers)
4. Keep existing `/teacher` shared-password form working

### Phase 2: Switch teacher login
5. Replace `/teacher` login with Supabase auth form
6. Old `bats:teacher_auth` localStorage key ignored
7. Existing teachers (created by admin) can log in

### Phase 3: Cleanup
8. Remove `NEXT_PUBLIC_TEACHER_PASSWORD` from env vars
9. Remove `Teacher` namespace from `store.ts`
10. Update all documentation

---

## 9. Open Questions (NEEDS CLARIFICATION)

| # | Question | Impact |
|---|---|---|
| Q1 | Should each teacher see **all student data** or only their **own students**? If per-teacher filtering: do we add a `school_id` or `class_id` field? | Affects data model and RLS policies |
| Q2 | Can teachers **reset their own password** (forgot password flow)? Or must they contact admin? | Affects UX and auth flow |
| Q3 | Should existing `bats:teacher_auth` users be **grandfathered in** with a migration, or do all existing teachers need new accounts? | Affects migration scope |
| Q4 | Do we keep `NEXT_PUBLIC_TEACHER_PASSWORD` as a **fallback** for a transition period? | Affects UX migration |

---

## 10. Dependencies

- Supabase Auth (already configured)
- `SUPABASE_SERVICE_ROLE_KEY` env var (already exists)
- `src/lib/supabase.ts` (already exists, but needs admin client)
- Admin Dashboard (existing, needs new tab)

---

## 11. Files to Create/Modify

### New Files
- `specs/022-teacher-accounts/SPEC.md` — this file
- `specs/022-teacher-accounts/research.md`
- `specs/022-teacher-accounts/data-model.md`
- `specs/022-teacher-accounts/quickstart.md`
- `specs/022-teacher-accounts/plan.md`
- `scripts/migration/022_add_teachers_table.sql` — Supabase migration
- `src/app/api/teachers/route.ts` — GET, POST teachers
- `src/app/api/teachers/[id]/route.ts` — PATCH, DELETE teacher
- `src/app/teacher/page.tsx` — Replace login form
- `src/components/admin/TeacherManager.tsx` — Admin CRUD UI
- `src/lib/supabase-admin.ts` — Service role client (new)

### Modify
- `src/app/teacher/page.tsx` — Replace shared password with Supabase auth
- `src/components/admin/AdminDashboard.tsx` — Add "Giáo viên" tab
- `src/lib/store.ts` — Remove `Teacher` namespace (or deprecate)
- `SPEC.md` — Add teacher auth section
- `docs/PROJECT_DOCUMENTATION.md` — Update auth section
- `.env.example` — Remove `NEXT_PUBLIC_TEACHER_PASSWORD`

---

*Spec version: 1.0 | Feature: 022-teacher-accounts | Author: Claude | Date: 2026-05-17*
