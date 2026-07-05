# PLAN: Import câu hỏi bằng Excel

## Technical Context

### Current State
- Đã có `QuestionSetManager` để quản lý bộ câu hỏi và câu hỏi
- Đã có `excelParser.ts` với hàm `parseStudentFile()` cho import học sinh
- Đã có `xlsx` library để parse Excel
- API endpoint `/api/teacher/question-sets/[id]/questions` để tạo câu hỏi

### Tech Stack
- Next.js 16 + TypeScript 6
- xlsx library cho parse Excel
- Supabase cho database
- Tailwind CSS cho styling

## Files to Create/Modify

### 1. `src/lib/excelParser.ts` (MODIFY)
Thêm hàm mới:
- `parseQuestionFile()` - parse Excel/CSV file thành array câu hỏi
- `validateAndPrepareQuestionImport()` - validate và prepare dữ liệu

### 2. `src/components/admin/QuestionSetManager.tsx` (MODIFY)
Thêm:
- Import button trong expanded view của bộ câu hỏi
- File input cho upload Excel
- Preview modal với danh sách câu hỏi
- Kết quả import

### 3. `src/app/api/teacher/question-sets/[id]/import-questions/route.ts` (CREATE)
API endpoint mới:
- Validate request
- Batch insert questions vào Supabase
- Trả về kết quả (created, failed, errors)

### 4. `src/types/teacher-content.ts` (MODIFY)
Thêm types:
- `ExcelQuestionRow`
- `ImportQuestionInput`

## Dependencies
- Không phụ thuộc vào task khác
- Có thể chạy song song với các task khác

## Risks & Mitigations
1. **File format phức tạp**: Xử lý nhiều định dạng Excel (.xlsx, .xls, .csv)
2. **Validation errors**: Hiển thị rõ ràng các dòng lỗi để user có thể sửa
3. **Large files**: Giới hạn số câu hỏi mỗi lần import (500)

## Implementation Steps

### Phase 1: Parser (Library)
1. Thêm `parseQuestionFile()` vào `excelParser.ts`
2. Thêm `validateAndPrepareQuestionImport()`
3. Thêm types vào `teacher-content.ts`

### Phase 2: API
1. Tạo endpoint `/api/teacher/question-sets/[id]/import-questions`
2. Validate teacher ownership
3. Batch insert questions

### Phase 3: UI
1. Thêm import button vào `QuestionSetManager`
2. Preview modal
3. Kết quả import

## Acceptance Criteria
- [ ] Upload file Excel/CSV thành công
- [ ] Parse đúng định dạng cột
- [ ] Validate câu hỏi trước khi import
- [ ] Preview hiển thị đầy đủ
- [ ] Batch insert không lỗi
- [ ] Thông báo kết quả rõ ràng
