# Feature Specification: Giáo Viên Thêm Chủ Đề Tùy Chỉnh

> Bé An Toàn Số — Educational Internet Safety Game

**Feature Branch**: `feat/025-teacher-topics`

**Created**: 2026-05-17

**Status**: Draft

**Input**: "Giáo viên có thể thêm chủ đề tùy chỉnh để phân loại bộ câu hỏi"

---

## 1. Overview & Motivation

### Current State

The system has 7 default topics hardcoded in `src/data/quizQuestions.ts`:
- Stranger (Người lạ nhắn tin)
- Phishing (Link lạ và lừa đảo)
- Password (Mật khẩu và tài khoản)
- Privacy (Bảo vệ thông tin cá nhân)
- Behavior (Ứng xử văn minh trên mạng)
- Screentime (Thời gian dùng màn hình)
- BadContent (Nội dung xấu và tin giả)

Teachers can only use these 7 topics for their question sets.

### Desired State

Teachers can:
1. View all default topics (read-only)
2. Create custom topics with a key and label
3. Edit their custom topics
4. Delete their custom topics
5. Use custom topics in question sets (alongside default topics)

---

## 2. Scope

### In Scope

1. **View Default Topics** — Teachers can see all 7 default topics
2. **Create Custom Topic** — Teacher provides key (slug) and label
3. **Edit Custom Topic** — Teacher can update the label
4. **Delete Custom Topic** — Teacher can delete their custom topic
5. **Use Custom Topics in Question Sets** — Custom topics appear in topic dropdowns

### Out of Scope

- Teachers editing default topics (read-only)
- Custom topics for learning paths (future)
- Topic assignment to students (future)

---

## 3. User Stories

### User Story 1 — Xem Danh Sách Chủ Đề

Giáo viên mở modal quản lý chủ đề và thấy danh sách chủ đề mặc định (chỉ đọc) cùng với chủ đề tùy chỉnh của cô.

**Acceptance Scenarios**:
1. **Given** teacher clicks "Quản lý chủ đề", **When** the modal opens, **Then** it shows default topics with "Mặc định" badge and custom topics with edit/delete buttons

---

### User Story 2 — Tạo Chủ Đề Mới

Giáo viên tạo chủ đề mới với mã và tên hiển thị.

**Acceptance Scenarios**:
1. **Given** teacher is on the topic manager, **When** they enter a topic key and label and click "Thêm chủ đề", **Then** the topic is saved and appears in the custom topics list
2. **Given** teacher enters a topic key that conflicts with default topics, **When** they click "Thêm chủ đề", **Then** an error message shows "Mã chủ đề đã tồn tại trong hệ thống"
3. **Given** teacher enters a topic key they already created, **When** they click "Thêm chủ đề", **Then** an error message shows "Bạn đã tạo chủ đề này rồi"

---

### User Story 3 — Sửa Chủ Đề Tùy Chỉnh

Giáo viên có thể cập nhật tên hiển thị của chủ đề tùy chỉnh.

**Acceptance Scenarios**:
1. **Given** teacher clicks the edit button on a custom topic, **When** they change the label and click save, **Then** the topic is updated

---

### User Story 4 — Xóa Chủ Đề Tùy Chỉnh

Giáo viên có thể xóa chủ đề tùy chỉnh của cô.

**Acceptance Scenarios**:
1. **Given** teacher clicks delete on a custom topic, **When** they confirm, **Then** the topic is removed and no longer appears in dropdowns

---

### User Story 5 — Sử Dụng Chủ Đề Trong Bộ Câu Hỏi

Chủ đề tùy chỉnh xuất hiện trong dropdown khi tạo hoặc sửa bộ câu hỏi.

**Acceptance Scenarios**:
1. **Given** teacher opens the question set form, **When** the topic dropdown is shown, **Then** it includes both default topics and custom topics
2. **Given** teacher selects a custom topic and saves the question set, **When** they view the question set, **Then** the custom topic label is displayed

---

## 4. Database Design

### New Table: `teacher_topics`

```sql
CREATE TABLE IF NOT EXISTS public.teacher_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_key TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (created_by, topic_key)
);
```

### RLS Policy

```sql
ALTER TABLE public.teacher_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own topics"
  ON public.teacher_topics
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

---

## 5. API Endpoints

### `GET /api/teacher/topics`

Returns all topics (default + custom).

**Response**:
```json
[
  { "topic_key": "stranger", "label": "Người lạ nhắn tin", "is_default": true },
  { "topic_key": "custom_key", "label": "An toàn mạng", "is_default": false, "id": "uuid" }
]
```

### `POST /api/teacher/topics`

Creates a custom topic.

**Request**:
```json
{ "topic_key": "custom_key", "label": "An toàn mạng" }
```

### `PATCH /api/teacher/topics/[id]`

Updates a custom topic.

**Request**:
```json
{ "label": "Tên mới" }
```

### `DELETE /api/teacher/topics/[id]`

Deletes a custom topic.

---

## 6. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `scripts/migration/025_teacher_topics.sql` | Creates `teacher_topics` table and RLS policies |
| `src/app/api/teacher/topics/route.ts` | GET and POST endpoints |
| `src/app/api/teacher/topics/[id]/route.ts` | PATCH and DELETE endpoints |
| `specs/025-teacher-topics/SPEC.md` | This specification |
| `specs/025-teacher-topics/tasks.md` | Task breakdown |

### Modify Files

| File | Change |
|------|--------|
| `src/types/teacher-content.ts` | Add `TeacherTopic`, `CreateTopicInput`, `UpdateTopicInput` interfaces |
| `src/lib/teacherContentStore.ts` | Add topic state and CRUD actions |
| `src/components/admin/QuestionSetManager.tsx` | Add topic manager UI and custom topic support |

---

## 7. UI Design

### Topic Manager Modal

- Accessed via "Quản lý chủ đề" button in QuestionSetManager header
- Two sections: Default topics (read-only) and Custom topics (editable)
- Custom topics section includes add form with key + label inputs
- Each custom topic row has edit and delete buttons

### Topic Selector Dropdown

- Includes all default topics + custom topics
- Custom topics marked visually (optional badge)

---

## 8. Acceptance Criteria

- **AC-001**: Teacher can open topic manager modal
- **AC-002**: Default topics display with "Mặc định" badge
- **AC-003**: Teacher can create a custom topic with unique key and label
- **AC-004**: Teacher cannot create topic with key that conflicts with default
- **AC-005**: Teacher can edit custom topic label
- **AC-006**: Teacher can delete custom topic
- **AC-007**: Custom topics appear in question set topic dropdown
- **AC-008**: Custom topics display correctly in question set list
- **AC-009**: `tsc --strict` passes with zero errors

---

*Spec version: 1.0 | Feature: 025-teacher-topics | Author: Claude | Date: 2026-05-17*
