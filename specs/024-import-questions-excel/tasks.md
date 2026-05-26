# TASKS: Import câu hỏi bằng Excel

## Phase 1: Library & Types

### T001 - Thêm types cho Excel Question Import
**File:** `src/types/teacher-content.ts`
**Description:** Thêm các types cho việc import câu hỏi từ Excel
```typescript
type ExcelQuestionRow = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
  explanation?: string;
};

type ImportQuestionInput = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation?: string;
};
```

### T002 - Thêm hàm parse câu hỏi vào excelParser.ts
**File:** `src/lib/excelParser.ts`
**Description:** Thêm hàm `parseQuestionFile()` và `validateAndPrepareQuestionImport()`
- Parse file Excel/CSV thành array câu hỏi
- Validate dữ liệu (câu hỏi, đáp án, correct_option)
- Trả về danh sách hợp lệ và errors

---

## Phase 2: API

### T003 - Tạo API endpoint import câu hỏi
**File:** `src/app/api/teacher/question-sets/[id]/import-questions/route.ts`
**Description:** API endpoint mới để batch import câu hỏi
- Validate teacher ownership của question set
- Batch insert questions vào Supabase
- Trả về kết quả: created count, failed count, errors

---

## Phase 3: UI

### T004 - Thêm UI import vào QuestionSetManager
**File:** `src/components/admin/QuestionSetManager.tsx`
**Description:** Cập nhật QuestionSetManager với tính năng import Excel
- Nút "Nhập từ Excel" trong expanded view
- File input để chọn file
- Preview modal với danh sách câu hỏi
- Kết quả import (thành công/lỗi)
- Nút tải template Excel

---

## Dependencies
- T002 phụ thuộc T001
- T003 phụ thuộc T001
- T004 phụ thuộc T002 và T003

## Status
- [x] T001: Completed - Added types for Excel Question Import
- [x] T002: Completed - Added parseQuestionFile() and validateAndPrepareQuestionImport() functions
- [x] T003: Completed - Created API endpoint /api/teacher/question-sets/[id]/import-questions
- [x] T004: Completed - Added UI import button and modal to QuestionSetManager
