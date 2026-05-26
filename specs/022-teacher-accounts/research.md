# Research: Teacher Accounts in Supabase

**Feature**: 022-teacher-accounts
**Date**: 2026-05-17

---

## Decision: Supabase Auth for Teacher Accounts

**Chosen**: Use Supabase Auth (email/password) for teacher authentication, managed by admin.

**Rationale**: Project already uses Supabase Auth for student accounts. Leveraging existing infrastructure:
- `src/lib/supabase.ts` already configured
- `profiles` table already demonstrates the pattern
- Admin Dashboard already uses Supabase client
- No new auth provider to configure

**Alternatives considered**:
- Magic link / email OTP: rejected — extra complexity, teachers may not have consistent email access
- OAuth (Google, Microsoft): rejected — overkill for internal tool, adds OAuth consent complexity
- Custom JWT with `teachers` table: rejected — reinventing auth when Supabase handles it
- Keep shared password: rejected — does not meet requirements (per-teacher accounts, revocation)

---

## Decision: Service Role Client for Admin Operations

**Chosen**: Use `SUPABASE_SERVICE_ROLE_KEY` in server API routes for teacher CRUD.

**Rationale**: Teacher management requires privileged operations (create auth users, update passwords) that the anon key cannot do. The service role client in API routes is the standard Supabase pattern for admin operations. It is never exposed to the browser.

**Pattern**:
```typescript
// src/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// Used ONLY in server-side API routes
```

**Security**: The service role key is server-only. No `NEXT_PUBLIC_` prefix.

---

## Decision: Soft Delete (is_active flag)

**Chosen**: Deactivate teachers by setting `is_active = false`, not deleting rows.

**Rationale**:
- Preserves audit trail and historical association with student data
- Easier to reactivate if teacher returns
- Supabase Auth users are also deactivated (not deleted) to maintain referential integrity
- Matches the `is_active` pattern already used for topics and learning paths

---

## Decision: Single-tenant (no school_id scoping)

**Chosen**: All teachers see all student data. No school/class filtering.

**Rationale**: The app is currently deployed as a single school product. Adding school scoping adds significant complexity (school management, RLS policies, teacher assignment). This can be added in a future feature. For now, teacher accounts are per-user credentials with full read access.

**Alternatives considered**:
- `school_id` on teachers table: rejected — requires school management UI, out of scope
- `class_id` on teachers: rejected — same reason
- All data visible to all teachers: chosen — meets minimum viable requirement

---

## Decision: Migration Path (Zero-Breaking)

**Chosen**: Phase 1 adds new functionality; Phase 2 switches login. `NEXT_PUBLIC_TEACHER_PASSWORD` kept during transition.

**Rationale**: Existing teachers using the shared password must not be locked out. Migration:
1. Phase 1: Admin creates teacher accounts, old password still works
2. Phase 2: Switch login to Supabase Auth, old password ignored
3. Phase 3: Remove old password

---

## Decision: API Routes vs Server Actions

**Chosen**: API routes (`src/app/api/teachers/route.ts`).

**Rationale**: The codebase uses API routes throughout (`/api/grok/generate-question`, `/api/grok/explain`). Consistent pattern. Server Actions would require marking all teacher pages as server components.

---

## Decision: Client-Side Teacher Session

**Chosen**: Teacher session stored by Supabase Auth client (not localStorage).

**Rationale**:
- Supabase Auth handles session refresh automatically
- No need to manage `bats:teacher_auth` key
- Aligns with how student auth (`profiles`) works
- Teacher can log in on any device

---

## Decision: Password Reset Flow

**Chosen**: Admin resets teacher password only. No self-service forgot password.

**Rationale**: This is an internal school tool. Teachers contact admin to reset. Self-service adds email configuration complexity (SMTP). Simple and secure.

---

*Research version: 1.0 | Feature: 022-teacher-accounts*
