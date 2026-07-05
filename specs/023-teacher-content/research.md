# Research Notes — Feature 023: Teacher Content & Student Import

**Feature**: `feat/023-teacher-content`
**Date**: 2026-05-17

---

## 1. Technology Decisions

### Decision: Excel/CSV Parsing Strategy

**Choice**: Client-side parsing with `xlsx` (SheetJS) library + server-side validation

**Rationale**:
- `xlsx` is a well-maintained, browser-compatible library that handles `.xlsx`, `.xls`, and `.csv` natively
- Client-side parsing avoids sending potentially large files to the server before validation
- Preview UI can show parsing results instantly without a server round-trip
- Server-side API route still validates and sanitizes data before writing to Supabase

**Alternatives considered**:
- Server-side parsing only: More secure but slower UX, requires file upload before preview
- PapaParse: Good for CSV but doesn't handle `.xlsx` natively — would need conversion layer
- Dedicated parsing service: Overkill for this use case

**Library**: `xlsx` (npm: `xlsx`, ~800KB gzipped, works in browser and Node.js)

### Decision: Student Authentication Strategy

**Choice**: Supabase Auth with `teacher_students` table mirroring the `teachers` pattern

**Rationale**:
- Consistent with teacher authentication (already using Supabase Auth)
- RLS policies naturally scope student data to creating teacher
- Password reset flow can be built on top (teacher-initiated reset)
- Student login at `/student/[code]` route

**Alternatives considered**:
- Magic link email: Too complex for primary school students
- Simple localStorage code: Not persistent enough for tracking progress

### Decision: Question Set vs Topic Distinction

**Choice**: Teacher question sets are separate from admin topics

**Rationale**:
- Topics are the 7 educational themes (Internet Safety categories) — admin-defined
- Teacher question sets are custom question banks scoped to a teacher
- A question set belongs to one topic (so it fits within the existing learning path structure)
- This keeps the existing topic model intact while allowing teacher customization

---

## 2. RLS Strategy

All new tables use `created_by = auth.uid()` as the primary RLS filter. This leverages Supabase Auth's built-in session management — the teacher's Supabase session token is automatically available server-side.

```sql
-- Example: Teacher question sets
CREATE POLICY "Teacher manages own question sets"
  ON teacher_question_sets
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

Student data inherits: `teacher_students.created_by` is set to the teacher's UUID at insert time. Students themselves don't have Supabase Auth accounts — they log in via a simple code+password check in a server API route.

---

## 3. File Parsing Flow

```
1. Teacher clicks "Import Excel" → file picker opens
2. Teacher selects file → xlsx (client) parses → preview table shown
3. Teacher reviews, removes invalid rows
4. Teacher clicks "Xác nhận import"
5. Client sends { rows: ValidRow[] } to /api/teacher/students/import
6. Server validates each row, generates student_code + password
7. Server bulk-inserts into teacher_students (with password_hash)
8. Server returns { credentials: Credential[] }
9. Client shows success + download button
```

---

## 4. Assumptions Resolved

| Assumption | Resolution |
|-----------|-----------|
| Excel parsing library | `xlsx` (SheetJS) — browser-compatible |
| Student auth | Supabase Auth or server-validated code+hash |
| RLS scoping | `created_by = auth.uid()` on all tables |
| Student login URL | `/student/[code]` or `/student/login` |
| Template format | `.xlsx` with pre-formatted headers |

---

*Research version: 1.0 | Feature: 023-teacher-content*
