# Kế hoạch triển khai Giai đoạn 2: Nâng cao khả năng ứng dụng trong trường học

Bổ sung các tính năng nâng cao kết nối Nhà trường - Gia đình - Học sinh bao gồm: Cổng phụ huynh thông minh dựa trên dữ liệu học tập thực tế, xuất báo cáo PDF/Excel cho Giáo viên, Chứng nhận điện tử kèm mã QR xác thực và Kho câu hỏi tình huống do giáo viên đóng góp.

## 📊 Project Type: WEB

## 🎯 Success Criteria
- [ ] Cổng phụ huynh hiển thị chính xác tiến trình học, điểm số thực tế từ cơ sở dữ liệu MongoDB thay vì dữ liệu giả.
- [ ] Cổng giáo viên cho phép tải file Excel (`.xlsx`) chứa điểm số chi tiết của lớp học và xuất bản in PDF (A4) tối ưu.
- [ ] Chứng nhận điện tử tự động tạo mã QR chứa liên kết xác thực công khai `/share/result/[id]` bằng Google Charts API.
- [ ] Trang xác thực chứng chỉ `/share/result/[id]` hoạt động chính xác, bảo vệ quyền riêng tư của trẻ em bằng cách ẩn thông tin cá nhân sâu.
- [ ] Kho tình huống tùy chỉnh của giáo viên cho phép lưu câu hỏi tình huống mới vào MongoDB và tích hợp trực tiếp vào lộ trình học tập của học sinh.

## 🛠️ Tech Stack & Rationale
- **Framework**: Next.js 16 + React 18
- **Database**: MongoDB (Mongoose Schema)
- **Libraries**:
  - `xlsx` cho xuất Excel
  - `lucide-react` cho icons
  - `canvas-confetti` cho hiệu ứng ăn mừng
- **CSS**: Tailwind CSS v4 + Custom `@media print` cho PDF

## 📁 File Structure
```
src/
├── app/
│   ├── parent/
│   │   └── page.tsx                         # [NEW] Cổng thông tin phụ huynh
│   ├── api/
│   │   └── parent/
│   │       └── child-stats/
│   │           └── route.ts                 # [NEW] API tính toán thống kê cho phụ huynh
│   ├── share/
│   │   └── result/
│   │       └── [id]/
│   │           └── page.tsx                 # [NEW] Trang xác thực chứng chỉ công khai
│   └── teacher/
│       └── scenarios/
│           └── page.tsx                     # [NEW] Giao diện đóng góp câu hỏi của GV
├── components/
│   ├── Certificate.tsx                      # [MODIFY] Thêm QR code xác thực
│   ├── admin/
│   │   └── TeacherDashboard.tsx             # [MODIFY] Thêm in PDF và xuất Excel
│   └── AiMascot.tsx                         # [MODIFY] Tích hợp câu hỏi nhanh
```

---

## 📝 Task Breakdown

### Task 1: API Cổng phụ huynh (`/api/parent/child-stats`)
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P0
- **Dependencies**: None
- **Task**: Truy vấn dữ liệu thực tế từ các bảng `StudentAnswer`, `Result`, `Profile` và `TeacherStudent` trong MongoDB. Tính toán tỷ lệ phần trăm chính xác của từng chủ đề an toàn mạng và đưa ra cảnh báo điểm yếu kỹ năng (accuracy < 70%) cùng các khuyến nghị tương ứng.
- **INPUT**: API nhận query param `code` (mã liên kết học sinh).
- **OUTPUT**: JSON response chứa thông tin học sinh, tỷ lệ đúng theo từng chủ đề, danh sách điểm yếu và lời khuyên.
- **VERIFY**: Chạy `curl "http://localhost:3000/api/parent/child-stats?code=STUDENT_CODE"` trả về mã 200 kèm cấu trúc JSON chính xác.

### Task 2: Nâng cấp UI Cổng phụ huynh (`src/app/parent/page.tsx`)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 1
- **Task**: Xây dựng giao diện hiển thị báo cáo học tập trực quan của con. Vẽ các thanh tiến trình trực quan theo từng chủ đề an toàn (phishing, stranger, password, privacy...). Hiển thị rõ danh sách các điểm yếu được cảnh báo và những hành động khuyến nghị phụ huynh cần làm cùng con.
- **INPUT**: Dữ liệu phản hồi từ API `/api/parent/child-stats`.
- **OUTPUT**: Giao diện dashboard thân thiện, dễ đọc cho phụ huynh.
- **VERIFY**: Truy cập trang `/parent`, nhập mã liên kết và thấy hiển thị chính xác biểu đồ tiến độ học tập thực tế.

### Task 3: Xuất báo cáo Excel & In PDF cho Giáo viên (`src/components/admin/TeacherDashboard.tsx`)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P1
- **Dependencies**: None
- **Task**: 
  - Tích hợp thư viện `xlsx` để kết xuất danh sách học sinh của lớp gồm: Họ tên, mã liên kết, điểm số XP, số câu trả lời và tỷ lệ chính xác.
  - Sử dụng `@media print` trong CSS để định dạng in A4 tối ưu (ẩn navbar, sidebar, nút bấm; căn chỉnh bảng điểm nằm gọn trong trang in).
- **INPUT**: Dữ liệu danh sách học sinh đang có trong state của `TeacherDashboard`.
- **OUTPUT**: Nút "Xuất Excel" tạo file `.xlsx` và nút "In PDF" kích hoạt hộp thoại in của trình duyệt.
- **VERIFY**: Nhấn nút "Xuất Excel" tải về file chứa đầy đủ tiếng Việt không lỗi font; nhấn "In PDF" mở màn hình preview in A4 sạch đẹp.

### Task 4: Mã QR Chứng nhận điện tử (`src/components/Certificate.tsx`)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P1
- **Dependencies**: None
- **Task**: Tích hợp Google Charts QR Code API (`https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=...`) vào component chứng chỉ để hiển thị mã QR liên kết trực tiếp tới trang xác thực `/share/result/[result-id]`.
- **INPUT**: ID kết quả học tập (`result-id`).
- **OUTPUT**: Ảnh mã QR hiển thị ở góc chứng chỉ.
- **VERIFY**: Hiển thị chứng chỉ sau khi học sinh đạt danh hiệu, quét mã QR bằng điện thoại và verify link chuyển hướng.

### Task 5: Trang xác thực chứng chỉ công khai (`src/app/share/result/[id]/page.tsx`)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 4
- **Task**: Tạo trang public `/share/result/[id]` để tra cứu thông tin chứng nhận của học sinh. Hiển thị thông báo chúc mừng kèm dải ruy băng xanh "ĐÃ XÁC THỰC ✓" từ hệ thống Bé An Toàn Số.
- **INPUT**: ID kết quả trên URL.
- **OUTPUT**: Trang web công khai hiển thị tên học sinh, lớp, danh hiệu và ngày đạt chứng chỉ.
- **VERIFY**: Truy cập link chứng chỉ công khai thấy giao diện trực quan và dữ liệu khớp với kết quả học tập.

### Task 6: Đóng góp câu hỏi tùy chỉnh của Giáo viên (`src/app/teacher/scenarios/page.tsx`)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: None
- **Task**: Xây dựng form cho phép giáo viên thêm câu hỏi tình huống mới (nội dung câu hỏi, 3 đáp án lựa chọn, đáp án đúng, giải thích). Lưu trữ câu hỏi này vào MongoDB để tự động nạp ngẫu nhiên khi học sinh làm nhiệm vụ học tập.
- **INPUT**: Form nhập thông tin câu hỏi.
- **OUTPUT**: Lưu câu hỏi thành công vào DB.
- **VERIFY**: Điền form và submit, kiểm tra câu hỏi mới xuất hiện trong danh sách câu hỏi của lớp.

---

## 🏁 Phase X: Verification (Xác minh hệ thống)
- [ ] Chạy linting và typecheck để đảm bảo mã sạch không lỗi:
  ```bash
  npm run lint && npx tsc --noEmit
  ```
- [ ] Chạy bộ unit test để đảm bảo không bị regression:
  ```bash
  npm run test
  ```
- [ ] Chạy build production để đảm bảo dự án Next.js tối ưu hóa thành công:
  ```bash
  npm run build
  ```
