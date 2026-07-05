# Quickstart: Teacher Accounts in Supabase

**Feature**: 022-teacher-accounts
**Date**: 2026-05-17

---

## Setup

### 1. Run Supabase Migration

```sql
-- Apply to Supabase dashboard or via CLI:
psql $DATABASE_URL -f scripts/migration/022_add_teachers_table.sql
```

Or run via Supabase CLI:
```bash
supabase db push
```

### 2. Environment Variables

No new env vars needed — uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only, already exists)

**Remove** (after Phase 3):
```env
# DELETE this line
NEXT_PUBLIC_TEACHER_PASSWORD=
```

---

## Run Locally

```bash
pnpm dev
```

---

## Implementation Order

1. **Migration**: Apply `022_add_teachers_table.sql` to Supabase
2. **API Routes**: Create `src/app/api/teachers/route.ts` + `[id]/route.ts`
3. **Admin Tab**: Add "Giáo viên" tab to Admin Dashboard
4. **Teacher Login**: Replace `/teacher` shared password with Supabase auth
5. **Cleanup**: Remove old teacher auth code

---

## Key Files

| Action | File |
|---|---|
| Migration | `scripts/migration/022_add_teachers_table.sql` |
| Admin client | `src/lib/supabase-admin.ts` (new) |
| API: list/create | `src/app/api/teachers/route.ts` |
| API: update/delete | `src/app/api/teachers/[id]/route.ts` |
| Teacher manager UI | `src/components/admin/TeacherManager.tsx` |
| Teacher login | `src/app/teacher/page.tsx` |
| Admin dashboard | `src/components/admin/AdminDashboard.tsx` (add tab) |
| Remove old code | `src/lib/store.ts` (Teacher namespace) |

---

## TypeScript Reference

All types defined in `src/lib/store.ts`:
```typescript
// New type (add to store.ts)
type Teacher = {
  id: string;
  authUid: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

No new external types needed — Supabase Auth handles session.

---

## Test Scenarios

| # | Scenario | Expected |
|---|---|---|
| 1 | Admin clicks "Thêm giáo viên" → modal opens | Modal with name, email, password fields |
| 2 | Admin submits valid form → teacher created | Success toast, table updated |
| 3 | Admin submits duplicate email → error shown | "Email đã được sử dụng" |
| 4 | Admin deactivates teacher → cannot log in | Teacher redirected to login |
| 5 | Teacher logs in at `/teacher` with email/password | Redirected to dashboard |
| 6 | Invalid credentials → error shown | "Email hoặc mật khẩu không đúng" |
| 7 | Admin searches teachers → list filters | Case-insensitive partial match |
| 8 | Admin resets teacher password → can log in with new | New password works |
| 9 | Session expires → redirected to login | "Phiên đã hết hạn" message |
| 10 | Old shared password → no longer works | After Phase 2 switch |

---

## Build & Type Check

```bash
pnpm build
# or
npx tsc --strict --noEmit
```

Zero TypeScript errors expected.

---

## Migration Sequence

### Phase 1 (Non-breaking)
- Add `teachers` table
- Add API routes
- Add admin UI for creating teachers
- **Old `/teacher` login still works**

### Phase 2 (Breaking)
- Switch `/teacher` to Supabase auth
- Old `bats:teacher_auth` ignored
- Old `NEXT_PUBLIC_TEACHER_PASSWORD` ignored

### Phase 3 (Cleanup)
- Remove `Teacher` namespace from `store.ts`
- Remove `NEXT_PUBLIC_TEACHER_PASSWORD` from `.env` and `.env.example`
- Update docs

---

*Quickstart version: 1.0 | Feature: 022-teacher-accounts*
