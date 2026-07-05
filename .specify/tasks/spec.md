# Feature 025: Bulk Student Path Assignment — SPEC

## Mục tiêu

Cho phép giáo viên chọn nhiều học sinh cùng lúc bằng checkbox và gán (hoặc thu hồi) một lộ trình học tập chung cho tất cả học sinh đã chọn.

---

## User Stories

### US1: Multi-Select Students [P1]
**Priority: P1**

Là giáo viên, tôi muốn chọn nhiều học sinh cùng lúc bằng checkbox để có thể thực hiện thao tác hàng loạt.

**Acceptance Criteria:**
- [x] Mỗi card học sinh có checkbox ở góc trái trên
- [x] Click checkbox → toggle trạng thái chọn của học sinh đó
- [x] Nút "Chọn tất cả" trong header → chọn tất cả học sinh đang hiển thị
- [x] Nút "Bỏ chọn tất cả" → reset tất cả checkbox
- [x] Counter hiển thị "Đã chọn: N học sinh" trong header
- [x] Checkbox đã chọn hiển thị trạng thái checked (màu sáng hơn)

---

### US2: Bulk Assign Learning Path [P1]
**Priority: P1**

Là giáo viên, tôi muốn gán một lộ trình chung cho nhiều học sinh đã chọn để tiết kiệm thời gian.

**Acceptance Criteria:**
- [x] Khi có học sinh được chọn, header hiển thị button "Gán lộ trình" + button "Thu hồi lộ trình"
- [x] Click "Gán lộ trình" → mở dropdown chọn lộ trình (lấy từ learningPaths đã fetch sẵn)
- [x] Submit → gọi POST /api/teacher/students/bulk-assign với mảng student_ids + path_id
- [x] API trả về danh sách học sinh đã cập nhật → cập nhật lại UI (selectedIds reset về rỗng)
- [x] Toast thông báo thành công: "Đã gán lộ trình cho N học sinh"
- [x] Nếu không có lộ trình nào → disabled button, hiển thị tooltip "Chưa có lộ trình nào"

---

### US3: Bulk Revoke Learning Path [P2]
**Priority: P2**

Là giáo viên, tôi muốn thu hồi lộ trình (gán null) cho nhiều học sinh đã chọn.

**Acceptance Criteria:**
- [x] Click "Thu hồi lộ trình" → confirm dialog "Thu hồi lộ trình của N học sinh?"
- [x] Confirm → gọi POST /api/teacher/students/bulk-assign với path_id = null
- [x] API trả về → cập nhật UI, reset selection
- [x] Toast thông báo: "Đã thu hồi lộ trình của N học sinh"

---

### US4: Visual Selection State [P2]
**Priority: P2**

Trải nghiệm chọn phải rõ ràng, không nhầm lẫn.

**Acceptance Criteria:**
- [x] Card học sinh đã chọn có border/màu nổi bật (ví dụ: border-sky-400, bg-sky-50)
- [x] Checkbox hiển thị checked state
- [x] Số lượng selected được hiển thị rõ ràng ngay cả khi danh sách dài

---

## Component Changes

### StudentImportManager.tsx

**Thêm state:**
```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [showBulkAssign, setShowBulkAssign] = useState(false);
const [bulkPathId, setBulkPathId] = useState("");
const [bulkLoading, setBulkLoading] = useState(false);
```

**Thêm UI:**
1. Header action bar (khi selectedIds.size > 0):
   - Counter: "Đã chọn: N học sinh"
   - Nút "Chọn tất cả" / "Bỏ chọn"
   - Dropdown/modal chọn lộ trình
   - Button "Thu hồi lộ trình"
2. Checkbox ở mỗi student card
3. Visual highlight cho card đã chọn

---

## API Changes

### POST /api/teacher/students/bulk-assign

**Body:**
```typescript
{
  student_ids: string[];
  path_id: string | null;  // null = revoke
}
```

**Response:**
```typescript
{
  success: boolean;
  updated_count: number;
  updated_students: TeacherStudent[];  // danh sách học sinh đã cập nhật
}
```

**Implementation:**
- Sử dụng Supabase Admin client (service_role key) để update nhiều rows
- SQL: `UPDATE teacher_students SET assigned_path_id = $1 WHERE id = ANY($2::uuid[])`
- Trả về danh sách học sinh đã update (fetch lại sau update)

---

## Error Handling

- [x] Nếu không có học sinh nào được chọn → disable action buttons, không gọi API
- [x] Nếu chưa có lộ trình nào → disable "Gán lộ trình", tooltip "Chưa có lộ trình"
- [x] Nếu API lỗi → hiển thị toast lỗi, không reset selection
- [x] Confirm dialog trước khi thu hồi lộ trình
