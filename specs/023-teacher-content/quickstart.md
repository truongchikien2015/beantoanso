# Feature 023: Teacher Content & Student Import

**Branch**: `feat/023-teacher-content`
**Spec**: `/Applications/work/Websiteantoanso/specs/023-teacher-content/SPEC.md`
**Status**: Ready for implementation

## What to Build

Teachers can create custom question sets, learning paths, and import students via Excel/CSV. Student results are scoped to the teacher.

## Quick Start

1. **New database tables**: `teacher_question_sets`, `teacher_questions`, `teacher_learning_paths`, `teacher_learning_path_steps`, `teacher_students`, `teacher_student_progress`
2. **New API routes** under `/api/teacher/`: questions, paths, students/import
3. **New teacher UI tabs**: Bộ câu hỏi, Lộ trình, Học sinh (in `/teacher` page)
4. **Excel import**: `xlsx` library for client-side parsing, preview before confirm
5. **Student login**: `/student/[code]` route for teacher-assigned student accounts

## Key Types

All interfaces defined in `specs/023-teacher-content/data-model.md`.

## Key Constraints

- All new tables have RLS with `created_by = auth.uid()`
- Teachers cannot see or modify other teachers' data
- All UI text in Vietnamese
- `tsc --strict` must pass

## Related Specs

- `specs/022-teacher-accounts/` — Teacher Supabase Auth (dependency)
- `specs/021-teacher-dashboard/` — Teacher read-only dashboard
