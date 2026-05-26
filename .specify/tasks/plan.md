# Feature 025: Bulk Student Path Assignment

## Mục tiêu

Cho phép giáo viên chọn nhiều học sinh cùng lúc (checkbox), sau đó gán một lộ trình chung cho tất cả học sinh đã chọn trong một thao tác.

---

## Architecture

### UI Flow

```
StudentImportManager
  ├── Header bar: [Select All] [Clear] "Đã chọn: N học sinh" [Gán lộ trình] [Thu hồi lộ trình]
  └── Student grid (mỗi card có checkbox)
       └── Card checkbox → toggle selection state
```

### Chọn nhiều (Multi-select)
- Checkbox ở mỗi card học sinh
- Nút "Chọn tất cả" trong header
- Nút "Bỏ chọn tất cả" để reset
- Counter hiển thị số học sinh đã chọn

### Gán lộ trình hàng loạt
- Header bar có nút "Gán lộ trình" (chỉ hiện khi có học sinh được chọn)
- Mở dropdown/modal chọn lộ trình
- Submit → gọi API với mảng student IDs
- Thu hồi: gán `assigned_path_id = null` cho nhiều học sinh

### File Structure

```
src/
  components/admin/
    StudentImportManager.tsx   — thêm multi-select UI, header action bar
  lib/
    teacherContentStore.ts      — thêm assignPathToStudents() (bulk)
  app/api/teacher/students/bulk-assign/route.ts  — POST: bulk assign path
```

---

## API Endpoints

### POST /api/teacher/students/bulk-assign

Gán (hoặc thu hồi) lộ trình cho nhiều học sinh.

**Request:**
```json
{
  "student_ids": ["id1", "id2"],
  "path_id": "uuid"       // null = thu hồi lộ trình
}
```

**Response:**
```json
{
  "success": true,
  "updated_count": 2,
  "updated_students": [{...}, {...}]
}
```

---

## Database

Không cần thêm bảng mới. Sử dụng bảng `teacher_students` hiện có, cập nhật `assigned_path_id`.

```sql
UPDATE teacher_students
SET assigned_path_id = :pathId
WHERE id = ANY(:studentIds::uuid[]);
```

---

## State Management

Thêm state trong `StudentImportManager.tsx`:

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [bulkAssigning, setBulkAssigning] = useState(false);
const [bulkPathId, setBulkPathId] = useState("");
const [bulkAction, setBulkAction] = useState<"assign" | "revoke" | null>(null);
```

Store action mới:

```typescript
// lib/teacherContentStore.ts
assignPathToStudents: (studentIds: string[], pathId: string | null) => Promise<void>
```
