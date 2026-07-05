# Data Model: Teacher Accounts in Supabase

**Feature**: 022-teacher-accounts
**Date**: 2026-05-17

---

## Entities

### 1. Teacher (database table)

```typescript
type Teacher = {
  id: string;           // UUID, primary key
  name: string;         // Display name (not from Auth)
  email: string;        // Unique, from Supabase Auth
  authUid: string;      // Supabase Auth user ID (UUID)
  schoolId?: string;    // Reserved for future per-school filtering
  isActive: boolean;    // Soft delete flag
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
};
```

**Key**: `public.teachers` (Supabase)

**RLS Policies**:
- `SELECT`: Anyone (for login email lookup)
- `INSERT/UPDATE/DELETE`: Admin only (service role key)

---

### 2. TeacherSession (client-side)

```typescript
type TeacherSession = {
  id: string;          // UUID
  email: string;
  name: string;
  expiresAt: string;     // ISO timestamp
};
```

**Storage**: Supabase Auth session (not localStorage)

---

## API Request/Response Shapes

### Create Teacher

```typescript
// POST /api/teachers
// Request
type CreateTeacherRequest = {
  name: string;         // required, min 2 chars
  email: string;        // required, valid email format
  password: string;     // optional, min 8 chars
};

// Response
type CreateTeacherResponse =
  | { teacher: Teacher }
  | { error: string };
```

### List Teachers

```typescript
// GET /api/teachers
// Response
type ListTeachersResponse = {
  teachers: Teacher[];
};
```

### Update Teacher

```typescript
// PATCH /api/teachers/[id]
type UpdateTeacherRequest = {
  name?: string;
  isActive?: boolean;
  password?: string;      // reset password
};

type UpdateTeacherResponse =
  | { teacher: Teacher }
  | { error: string };
```

### Delete Teacher

```typescript
// DELETE /api/teachers/[id]
// Soft delete: sets isActive = false
type DeleteTeacherResponse =
  | { success: true }
  | { error: string };
```

---

## Database Schema (Supabase SQL)

```sql
-- teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID UNIQUE NOT NULL,          -- links to auth.users
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  school_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Admin-only management (service role bypasses RLS anyway)
CREATE POLICY "Manage teachers" ON public.teachers
  FOR ALL USING (true);

-- Public read for login lookup (email verification)
CREATE POLICY "Read teachers for auth" ON public.teachers
  FOR SELECT USING (is_active = true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Validation Rules

| Field | Rule |
|---|---|
| `name` | Required, 2–100 chars |
| `email` | Required, valid email format, unique in `teachers` |
| `password` | Min 8 chars (Supabase enforces) |
| `isActive` | Boolean, default `true` |

---

## Relationships

```
Supabase Auth (auth.users)
  └── 1:1 ──→ teachers (auth_uid → id)

teachers
  └── read access ──→ student data (future: school_id scoping)
```

---

## Existing Entities Reused

| Entity | Used For |
|---|---|
| Supabase Auth (auth.users) | Teacher authentication |
| `profiles` table pattern | Teacher table design |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations |

---

## Deprecation

The following are deprecated after this feature:

| Old | Replacement |
|---|---|
| `NEXT_PUBLIC_TEACHER_PASSWORD` env var | Removed |
| `bats:teacher_auth` localStorage key | Supabase Auth session |
| `Teacher` namespace in `store.ts` | Removed |

---

*Data model version: 1.0 | Feature: 022-teacher-accounts*
