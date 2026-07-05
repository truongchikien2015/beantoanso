# SPEC: Import câu hỏi bằng Excel cho Giáo viên

## 1. Mục tiêu

Cho phép giáo viên **upload file Excel/CSV** để import nhiều câu hỏi cùng lúc vào bộ câu hỏi, tương tự như cách import học sinh. Mỗi bộ câu hỏi có thể chứa nhiều câu hỏi được nhập từ một file Excel.

## 2. Mô tả tính năng

### 2.1 Cấu trúc file Excel

File Excel/CSV cần có các cột sau:

| Cột | Bắt buộc | Mô tả |
|-----|-----------|--------|
| `question` | ✅ | Nội dung câu hỏi |
| `option_a` | ✅ | Đáp án A |
| `option_b` | ✅ | Đáp án B |
| `option_c` | ✅ | Đáp án C |
| `correct_option` | ✅ | Đáp án đúng (A, B, hoặc C) |
| `explanation` | ❌ | Giải thích (tùy chọn) |

### 2.2 Luồng người dùng

1. Giáo viên vào tab **"Bộ câu hỏi"**
2. Chọn bộ câu hỏi muốn thêm câu hỏi (hoặc tạo bộ mới)
3. Click nút **"Nhập từ Excel"**
4. Chọn file Excel/CSV chứa câu hỏi
5. Hệ thống parse và hiển thị preview
6. Xác nhận import
7. Hiển thị kết quả: thành công / lỗi

### 2.3 Validation

- Câu hỏi không được trống
- Phải có đủ 3 đáp án (A, B, C)
- `correct_option` phải là A, B, hoặc C
- Giới hạn 500 câu hỏi mỗi lần import

## 3. Thiết kế UI

### 3.1 Vị trí nút

Trong `QuestionSetManager.tsx`:
- Thêm nút "Nhập từ Excel" trong phần mở rộng của mỗi bộ câu hỏi (expanded view)
- Hoặc trong header của bộ câu hỏi

### 3.2 Giao diện

**Preview Modal:**
- Hiển thị danh sách câu hỏi sẽ được import (có phân trang nếu > 20)
- Highlight các dòng lỗi (màu đỏ)
- Số lượng: X câu hỏi hợp lệ, Y dòng lỗi
- Nút "Import X câu hỏi" và "Hủy"

**Kết quả:**
- Toast notification thành công
- Bảng hiển thị các câu hỏi đã được tạo
- Nút tải file lỗi (nếu có)

## 4. Kiến trúc kỹ thuật

### 4.1 Files cần tạo/sửa

| File | Hành động |
|------|------------|
| `src/lib/excelParser.ts` | Thêm hàm `parseQuestionFile()`, `validateAndPrepareQuestionImport()` |
| `src/components/admin/QuestionSetManager.tsx` | Thêm UI import Excel |
| `src/app/api/teacher/question-sets/[id]/import-questions/route.ts` | API endpoint mới |
| `src/types/teacher-content.ts` | Thêm types liên quan |

### 4.2 API Endpoint

```
POST /api/teacher/question-sets/[id]/import-questions
```

**Request:**
```json
{
  "questions": [
    {
      "question": "Câu hỏi 1",
      "option_a": "Đáp án A",
      "option_b": "Đáp án B",
      "option_c": "Đáp án C",
      "correct_option": "A",
      "explanation": "Giải thích"
    }
  ]
}
```

**Response:**
```json
{
  "created": 10,
  "failed": 2,
  "errors": [
    { "row": 3, "message": "Thiếu đáp án" }
  ]
}
```

## 5. Tiêu chí hoàn thành

- [ ] Giáo viên có thể tải template Excel mẫu
- [ ] Giáo viên có thể upload file Excel/CSV
- [ ] Hệ thống parse và validate dữ liệu
- [ ] Hiển thị preview trước khi import
- [ ] Import batch vào Supabase
- [ ] Hiển thị kết quả import (thành công/lỗi)
- [ ] Tương thích với file .xlsx, .xls, .csv

## 6. Ngoài phạm vi

- AI-powered question generation (đã có sẵn)
- Sửa câu hỏi hàng loạt
- Export câu hỏi ra Excel
