# Tasks: Tìm Kiếm & Lọc Học Sinh (026)

## Overview

Feature cho phép giáo viên tìm kiếm và lọc học sinh theo nhiều tiêu chí: mã học sinh, tên, lớp, trạng thái lộ trình, và lộ trình cụ thể.

## UI Phase

- [x] T001 Thêm state cho filters vào `StudentImportManager.tsx`
  - `searchQuery: string`
  - `debouncedSearch: string`
  - `classFilter: string | null`
  - `statusFilter: "all" | "assigned" | "unassigned"`
  - `pathFilter: string | null`

- [x] T002 Thêm UI filter bar vào component
  - Search input với icon và debounce
  - Dropdown chọn lớp
  - Dropdown trạng thái lộ trình
  - Dropdown lộ trình
  - Nút xóa bộ lọc

- [x] T003 Tạo helper functions cho filter logic
  - `useMemo` cho `filteredStudents`
  - `useMemo` cho `classOptions` (danh sách lớp động)
  - Hàm `clearFilters`
  - `hasActiveFilters` computed state

- [x] T004 Cập nhật hiển thị số lượng học sinh
  - Thay `students.filter(s => s.is_active).length` bằng `filteredStudents.length`

- [x] T005 Cập nhật student grid để sử dụng `filteredStudents`
  - Thay `students.filter(s => s.is_active).map` bằng `filteredStudents.map`
  - Thêm empty state khi không có kết quả phù hợp
