# Tasks: Giáo Viên Thêm Chủ Đề Tùy Chỉnh (025)

## Overview

This feature allows teachers to create and manage custom topics for organizing their question sets.

## Database Setup

- [x] T001 — Create `025_teacher_topics.sql` migration with table, indexes, and RLS policies

## Backend

- [x] T002 — Create `GET /api/teacher/topics` endpoint returning default + custom topics
- [x] T003 — Create `POST /api/teacher/topics` endpoint for creating custom topics
- [x] T004 — Create `PATCH /api/teacher/topics/[id]` endpoint for updating topics
- [x] T005 — Create `DELETE /api/teacher/topics/[id]` endpoint for deleting topics

## Types & Store

- [x] T006 — Add `TeacherTopic`, `CreateTopicInput`, `UpdateTopicInput` to `src/types/teacher-content.ts`
- [x] T007 — Add topic state and CRUD actions to `teacherContentStore.ts`

## UI

- [x] T008 — Add topic manager button and modal to `QuestionSetManager.tsx`
- [x] T009 — Update topic dropdown to include custom topics
- [x] T010 — Update topic display to use `getTopicLabel()` helper

## Documentation

- [x] T011 — Create `specs/025-teacher-topics/SPEC.md`
