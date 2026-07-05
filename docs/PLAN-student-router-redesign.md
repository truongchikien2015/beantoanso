# Kế hoạch Thiết kế lại Toàn bộ Giao diện Nhóm Trang Học sinh (/student/*)

Kế hoạch này phác thảo các bước quét các router của học sinh bằng GitNexus và thực hiện cải tạo giao diện (UI Redesign) đồng bộ với ngôn ngữ thiết kế **Stitch - Playful Garden** (sticky header phẳng màu trắng, nền kem `#FFF9F0` chấm lưới, phông chữ Nunito sans-serif, các góc bo tròn lớn `rounded-[28px]`, viền xám nhạt dày và không sử dụng màu Tím/Indigo).

## Báo cáo quét Router Học sinh bằng GitNexus

Dựa trên kết quả phân tích từ `gitnexus:route_map` và cấu trúc thư mục `src/app/student/`, chúng tôi đã xác định được toàn bộ các router và file liên quan của học sinh:

1. **Dashboard Học sinh**: `/student/dashboard` (`src/app/student/dashboard/page.tsx`, `src/components/student/StudentDashboard.tsx`) - *Đã được thiết kế lại*.
2. **Thử thách hằng ngày**: `/student/daily` (`src/app/student/daily/page.tsx`, `src/components/student/StudentDailyQuizPanel.tsx`) - *Đã được thiết kế lại*.
3. **Tiến độ học tập**: `/student/progress` (`src/app/student/progress/page.tsx`, `src/components/student/StudentProgressCard.tsx`) - *Đã được thiết kế lại*.
4. **Trang Đăng nhập Học sinh**: `/student/login` (`src/app/student/login/page.tsx`, `src/components/student/StudentLoginForm.tsx`) - *Cần thiết kế lại*.
5. **Trang Làm bài học & kiểm tra**: `/student/quiz/[stepId]` (`src/app/student/quiz/[stepId]/page.tsx`) - *Cần thiết kế lại*.
6. **Trang Chứng nhận hoàn thành**: `/student/certificate` (`src/app/student/certificate/page.tsx`, `src/components/Certificate.tsx`) - *Cần thiết kế lại*.

---

## User Review Required

> [!IMPORTANT]
> - **Đồng bộ hóa toàn diện**: Chuyển đổi toàn bộ các trang học sinh chưa cải tạo (Đăng nhập, Làm bài Quiz, Chứng nhận) sang nền kem `#FFF9F0` chấm lưới mịn và phông chữ Nunito.
> - **Tránh phá vỡ logic**: Giữ nguyên toàn bộ logic đăng nhập, chấm điểm Quiz client-side/server-side, lưu lịch sử bài làm, tính toán XP, và sinh ảnh chứng chỉ hoàn thành.
> - **Chống ô nhiễm CSS**: Tất cả mã CSS mới sẽ được đóng gói bằng thẻ `<style>` scoped cục bộ trong từng trang để bảo vệ tính độc lập.

---

## Open Questions (Socratic Gate)

> [!WARNING]
> 1. **Giao diện làm bài Quiz**: Đối với trang làm bài Quiz (`/student/quiz/[stepId]`), chúng ta có nên giữ nguyên thanh tiến trình Star Style ở header nhưng chuyển sang màu pastel nhẹ hơn, hay thiết kế lại thành thanh tiến trình nằm ngang phẳng dạng bento?
> 2. **Trang Chứng chỉ**: Trang hiển thị chứng chỉ (`/student/certificate`) hiện đang dùng cấu trúc hiển thị ảnh canvas chứng chỉ. Có cần thiết kế thêm hiệu ứng confetti ăn mừng sinh động và thẻ bọc viền vàng ánh kim sang trọng bên ngoài chứng chỉ không?
> 3. **Phạm vi các trang mô phỏng**: Các trang giả lập như `/chat-sim` (Chat ảo), `/email-sim` (Hòm thư ảo), `/classify` (Phân loại thông tin) có cần đưa vào kế hoạch redesign đợt này không, hay sẽ thực hiện ở một plan riêng?

---

## Proposed Changes

### 1. Trang Đăng nhập Học sinh (`/student/login`)

#### [MODIFY] [page.tsx](file:///Applications/work/hackthon/beantoanso/src/app/student/login/page.tsx)
- Đổi wrapper ngoài thành `.sd-page` nền kem chấm lưới mịn.
- Cải tạo Mascot emoji `🎓` và các emoji trang trí thành hiệu ứng chuyển động mượt mà hơn.
- Định dạng lại tiêu đề "Cổng học sinh" sang dạng phẳng đậm màu chữ Slate thay vì gradient cũ.

#### [MODIFY] [StudentLoginForm.tsx](file:///Applications/work/hackthon/beantoanso/src/components/student/StudentLoginForm.tsx)
- Đổi vỏ bọc `Card` thành thẻ bento trắng viền xám nhạt `border-[3px] border-slate-200/80` bo góc `rounded-[28px]`.
- Thay thế class `.input-kid` thành input tối giản viền dày phản hồi tiêu điểm mượt mà.
- Thay thế nút đăng nhập `.btn-kid-coral` thành nút cam san hô/teal solid `rounded-full` bóng bẩy có phản hồi lực nhấn `active:scale-98`.

---

### 2. Trang Làm bài học & kiểm tra (`/student/quiz/[stepId]`)

#### [MODIFY] [page.tsx](file:///Applications/work/hackthon/beantoanso/src/app/student/quiz/[stepId]/page.tsx)
- **Cấu trúc chung**: Đổi nền trang thành `#FFF9F0` chấm lưới, font Nunito.
- **Thanh Header & Tiến độ**: Thay thế `kid-paper-header` bằng sticky header phẳng màu trắng chứa nút "Thoát", tiêu đề "Bài kiểm tra" và nhãn đếm câu. Thanh tiến trình Star Style được bo tròn mịn hơn với màu xanh ngọc.
- **Thẻ câu hỏi**: Thiết kế lại thẻ QuizQuestion thành nền trắng viền `border-[3px] border-slate-200/80` và bo góc `rounded-[28px]`.
- **Nút đáp án**: Chuyển đổi các nút lựa chọn từ dạng `.kid-choice` sang nút viền dày bo tròn, đổi màu sắc khi hover/active sang xanh ngọc (Teal) và cam san hô thay vì các màu biến thể cũ.
- **Khối kết quả**: Thiết kế lại màn hình báo điểm ăn mừng lớn với cúp vàng `🏆`, điểm số to rõ viền xanh ngọc/lá cây, kèm bảng đáp án chi tiết viền dày và khối giải thích màu vàng kem dịu mắt.
- **Nút điều hướng**: Các nút "Câu trước", "Câu tiếp", "Nộp bài", "Làm lại" chuyển sang phong cách bento bo tròn đầy đặn.

---

### 3. Trang Chứng nhận hoàn thành (`/student/certificate`)

#### [MODIFY] [page.tsx](file:///Applications/work/hackthon/beantoanso/src/app/student/certificate/page.tsx)
- **Layout**: Bọc trang bằng nền kem `#FFF9F0` chấm lưới mịn.
- **Header**: Tích hợp sticky white header phẳng có nút "Quay lại Bảng học tập".
- **Khung chứa chứng chỉ**: Đặt ảnh chứng chỉ canvas vào bên trong một khung bento viền kép vàng ánh kim sang trọng, bo góc tròn và thêm bóng đổ nhẹ để tạo độ sâu thị giác.
- **Các nút chức năng**: Nút "Tải ảnh về máy" và các nút chia sẻ mạng xã hội được thiết kế bo tròn tinh tế hơn.

---

## Verification Plan

### Automated Tests
- Biên dịch TypeScript:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && npm run typecheck
  ```
- Kiểm tra linter:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && npm run lint
  ```

### Manual Verification
- Dùng Browser subagent thực hiện:
  1. Đăng xuất học sinh và truy cập `/student/login` để kiểm tra giao diện đăng nhập mới.
  2. Đăng nhập học sinh `bekim32` / `123456`, chọn lộ trình và vào bài học để kiểm tra giao diện `/student/quiz/[stepId]`.
  3. Hoàn thành bài học, xem lại đáp án và chuyển hướng đến trang `/student/certificate`.
  4. Chụp ảnh màn hình các trang login, quiz (trước/sau khi nộp bài) và certificate để đối chiếu độ đồng bộ thiết kế.
