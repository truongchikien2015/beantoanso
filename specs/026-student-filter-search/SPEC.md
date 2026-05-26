# SPEC.md — Tìm Kiếm & Lọc Học Sinh (026)

## 1. Project Overview

| Field | Detail |
|---|---|
| **Feature** | Tìm kiếm và lọc học sinh theo nhiều tiêu chí |
| **Feature ID** | 026 |
| **Component** | StudentImportManager.tsx (Teacher Dashboard) |
| **Target Users** | Giáo viên |

## 2. Mục tiêu

Cho phép giáo viên:
- Tìm kiếm học sinh theo **mã học sinh** hoặc **tên**
- Lọc theo **lớp** (class_name)
- Lọc theo **trạng thái lộ trình** (đã gán / chưa gán)
- Lọc theo **lộ trình cụ thể**

## 3. User Stories

### US1: Tìm kiếm theo mã hoặc tên
- **Priority**: P1
- **Actor**: Giáo viên
- **Trigger**: Nhập vào ô tìm kiếm
- **Behavior**:
  - Real-time search khi gõ (debounce 300ms)
  - Tìm kiếm không phân biệt hoa thường
  - Match cả `student_code` và `nickname`
- **Acceptance**:
  - Hiển thị kết quả lọc ngay khi gõ
  - Xử lý empty search → hiện tất cả học sinh

### US2: Lọc theo lớp (class_name)
- **Priority**: P1
- **Actor**: Giáo viên
- **Trigger**: Chọn dropdown lớp
- **Behavior**:
  - Dropdown chứa danh sách lớp động (từ dữ liệu học sinh)
  - Option "Tất cả lớp" để bỏ lọc
- **Acceptance**:
  - Lớp không trùng lặp
  - Cập nhật danh sách khi có học sinh mới

### US3: Lọc theo trạng thái lộ trình
- **Priority**: P2
- **Actor**: Giáo viên
- **Trigger**: Chọn dropdown trạng thái
- **Behavior**:
  - Options: "Tất cả", "Đã gán lộ trình", "Chưa gán lộ trình"
- **Acceptance**:
  - Kết hợp được với search và filter lớp

### US4: Lọc theo lộ trình cụ thể
- **Priority**: P2
- **Actor**: Giáo viên
- **Trigger**: Chọn dropdown lộ trình
- **Behavior**:
  - Options: "Tất cả lộ trình", + danh sách lộ trình từ store
  - Kết hợp với filter trạng thái
- **Acceptance**:
  - Hiện học sinh thuộc lộ trình được chọn

## 4. UI Design

### 4.1 Filter Bar
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Tìm kiếm...          │ Lớp ▼ │ Trạng thái ▼ │ Lộ trình ▼ │ ✕  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Components
| Element | Description |
|---|---|
| Search input | Input với icon search, placeholder "Tìm mã hoặc tên..." |
| Class dropdown | Select với options động từ dữ liệu |
| Status dropdown | Select: Tất cả / Đã gán / Chưa gán |
| Path dropdown | Select: Tất cả / [danh sách lộ trình] |
| Clear button | Reset tất cả filters |

### 4.3 Responsive
- Desktop: Inline filter bar
- Mobile: Stack filters hoặc collapse vào button "Bộ lọc"

## 5. Technical Approach

### 5.1 Client-side filtering
- Filter trong component `StudentImportManager`
- Sử dụng React state cho search query và filter values
- Debounce search input 300ms

### 5.2 Filter State
```typescript
interface StudentFilters {
  searchQuery: string;
  classFilter: string | null;     // null = "Tất cả"
  statusFilter: "all" | "assigned" | "unassigned";
  pathFilter: string | null;      // null = "Tất cả"
}
```

### 5.3 Computed filtered list
```typescript
const filteredStudents = useMemo(() => {
  return students.filter(s => {
    const matchesSearch = !searchQuery ||
      s.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = !classFilter || s.class_name === classFilter;

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "assigned" && s.assigned_path_id) ||
      (statusFilter === "unassigned" && !s.assigned_path_id);

    const matchesPath = !pathFilter || s.assigned_path_id === pathFilter;

    return matchesSearch && matchesClass && matchesStatus && matchesPath;
  });
}, [students, searchQuery, classFilter, statusFilter, pathFilter]);
```

### 5.4 Derived dropdown options
```typescript
const classOptions = useMemo(() => {
  const classes = [...new Set(students
    .filter(s => s.is_active && s.class_name)
    .map(s => s.class_name as string))];
  return classes.sort();
}, [students]);
```

## 6. Files to Modify

| File | Change |
|---|---|
| `src/components/admin/StudentImportManager.tsx` | Thêm filter bar UI và logic |
| `src/types/teacher-content.ts` | Thêm `StudentFilters` interface (optional) |

## 7. Acceptance Criteria

- [ ] Search input tìm kiếm theo mã và tên (case-insensitive)
- [ ] Dropdown lớp hiển thị đúng các lớp từ dữ liệu
- [ ] Filter trạng thái hoạt động chính xác
- [ ] Filter lộ trình hoạt động chính xác
- [ ] Tất cả filters kết hợp được với nhau
- [ ] Nút "Xóa bộ lọc" reset về trạng thái mặc định
- [ ] Số lượng học sinh hiển thị cập nhật theo filter
- [ ] Performance tốt với danh sách 100+ học sinh
