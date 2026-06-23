# Lộ trình Triển khai các Chức năng Tương tác & AI cho Học sinh Tiểu học

Tài liệu này vạch ra kế hoạch chi tiết để hiện thực hóa 10 nhóm tính năng nâng cấp nhằm nâng cao tính thực chiến, áp dụng AI và cải thiện độ tiếp cận của nền tảng **Bé An Toàn Số**.

---

## 1. Tổng quan & Thiết kế Hệ thống (Tech Stack & Architecture)

- **Database**: Sử dụng MongoDB (Mongoose) làm database lưu trữ tiến trình cá nhân hóa, bảng điều khiển của giáo viên, liên kết phụ huynh và kho tình huống.
- **AI Integration**: Tích hợp Grok API thông qua route nội bộ `/api/grok/` phục vụ cho trợ lý ảo và bộ tạo câu hỏi từ tình huống thực tế của giáo viên.
- **Text-to-Speech (TTS)**: Sử dụng Web Speech API (`window.speechSynthesis`) tích hợp sẵn trên trình duyệt để hoạt động offline, không tốn chi phí và phản hồi tức thì.
- **Offline / PWA**: Đăng ký Service Worker thông qua `next-pwa` để lưu trữ ngoại tuyến tài nguyên học tập cơ bản.

---

## 2. Danh sách các thay đổi đề xuất (Proposed File Changes)

### 2.1. Thành phần Mô phỏng & Mini-games
#### [NEW] [ChatSimulation.tsx](file:///Applications/work/hackthon/beantoanso/src/components/simulations/ChatSimulation.tsx)
- Giao diện giả lập Messenger/Zalo hoạt hình. Có bong bóng chat tự động xuất hiện.
- Trình diễn các kịch bản xin số điện thoại, đòi ảnh, dụ dỗ nạp game.
- Cung cấp các nút lựa chọn hành vi cho học sinh và hiển thị giải thích sau mỗi lượt bấm.

#### [NEW] [EmailSimulation.tsx](file:///Applications/work/hackthon/beantoanso/src/components/simulations/EmailSimulation.tsx)
- Giao diện giả lập hòm thư điện tử. Renders nội dung email nhận quà/cảnh báo tài khoản.
- Học sinh click trực tiếp vào các "điểm nghi vấn" (đường link lạ, lỗi chính tả, logo giả).
- Đánh giá kết quả và chỉ ra các điểm học sinh bỏ sót.

#### [NEW] [MiniGames.tsx](file:///Applications/work/hackthon/beantoanso/src/components/simulations/MiniGames.tsx)
- Trò chơi kéo thả phân loại thông tin (Bí mật vs. Công khai).
- Game ghép nối các bước xử lý khi bị bắt nạt trên mạng.

### 2.2. Trợ lý AI Mascot & Phân tích Link lừa đảo
#### [NEW] [AiMascot.tsx](file:///Applications/work/hackthon/beantoanso/src/components/AiMascot.tsx)
- Widget nổi ở góc phải bên dưới màn hình, hiển thị Mascot hoạt hình "Cú Cú An Toàn".
- Cho phép trò chuyện bằng văn bản tiếng Việt.
- Tích hợp route `/api/student/mascot-chat` với prompt giới hạn nghiêm ngặt chỉ trả lời về an toàn số cho học sinh tiểu học.

#### [NEW] [LinkDetector.tsx](file:///Applications/work/hackthon/beantoanso/src/components/LinkDetector.tsx)
- Hộp nhập liệu trực quan để kiểm tra link/tin nhắn nghi ngờ.
- Phân tích regex cơ bản + gọi AI để đánh giá rủi ro. Hiển thị 3 mức cảnh báo: Xanh (An toàn), Vàng (Hỏi ý kiến cha mẹ), Đỏ (Nguy hiểm).

### 2.3. Cá nhân hóa & Cổng Phụ huynh / Giáo viên
#### [NEW] [EntryQuiz.tsx](file:///Applications/work/hackthon/beantoanso/src/components/EntryQuiz.tsx)
- Bài kiểm tra đầu vào 5 câu hỏi nhanh khi học sinh đăng nhập lần đầu.
- Ghi nhận điểm số theo từng khía cạnh để cập nhật lộ trình cá nhân hóa trên màn hình `/path-select`.

#### [NEW] [parent/page.tsx](file:///Applications/work/hackthon/beantoanso/src/app/parent/page.tsx)
- Trang dành riêng cho phụ huynh tra cứu tiến độ của con bằng cách nhập "Mã liên kết phụ huynh" của trẻ.
- Hiển thị biểu đồ tròn lỗ hổng kiến thức và các lời khuyên đồng hành tại nhà.

#### [MODIFY] [teacher/page.tsx](file:///Applications/work/hackthon/beantoanso/src/app/teacher/page.tsx)
- Bổ sung dashboard thống kê tỷ lệ hoàn thành, chủ đề hay sai nhất của lớp và nút xuất báo cáo Excel/Print.

### 2.4. Trợ năng & Tính năng phụ trợ
#### [NEW] [SpeakButton.tsx](file:///Applications/work/hackthon/beantoanso/src/components/SpeakButton.tsx)
- Nút bấm biểu tượng Loa phát thanh cạnh các câu hỏi và đoạn hội thoại. Tích hợp Web Speech API.

#### [NEW] [HelpModal.tsx](file:///Applications/work/hackthon/beantoanso/src/components/HelpModal.tsx)
- Modal khẩn cấp khi bấm nút "Con cần giúp đỡ". Hiển thị số điện thoại tổng đài 111 và các bước hướng dẫn chụp màn hình/báo cha mẹ.

#### [NEW] [CertificateGenerator.tsx](file:///Applications/work/hackthon/beantoanso/src/components/CertificateGenerator.tsx)
- Trình tạo chứng chỉ "Chiến binh An Toàn Số" dưới dạng mẫu SVG đẹp mắt, có thể tải về làm ảnh và đính kèm mã QR kiểm chứng.

---

## 3. Kế hoạch Thực hiện Nhiệm vụ (Task Breakdown)

### Giai đoạn 1: Tính năng Thực chiến & Trợ năng (Core Demo)

| ID | Nhiệm vụ | Đại diện đảm nhận | Tiêu chí Hoàn thành & Xác minh |
|----|----------|-------------------|-------------------------------|
| 1.1 | Tạo component mô phỏng Chat tương tác `ChatSimulation.tsx` | `frontend-specialist` | Chọn các phương án chat hiển thị giải thích đúng/sai đầy đủ. |
| 1.2 | Tạo component tương tác email giả mạo `EmailSimulation.tsx` | `frontend-specialist` | Click vào các điểm lừa đảo sẽ tô đỏ/xanh và tính điểm khi nộp. |
| 1.3 | Tích hợp giọng nói hỗ trợ tiếp cận `SpeakButton.tsx` | `frontend-specialist` | Bấm vào loa phát ra tiếng đọc nội dung câu hỏi trơn tru. |
| 1.4 | Xây dựng trợ lý Mascot AI `AiMascot.tsx` & endpoint `/api/student/mascot-chat` | `frontend-specialist` & `backend-specialist` | Trả lời nhanh gọn, từ chối các câu hỏi ngoài phạm vi an toàn mạng. |
| 1.5 | Tạo chức năng cảnh báo link/tin nhắn độc hại `LinkDetector.tsx` | `backend-specialist` | Nhập link/tin nhắn chứa từ khóa nhạy cảm trả về cảnh báo Vàng/Đỏ. |

### Giai đoạn 2: Cá nhân hóa & Bảng điều khiển (Dashboard & Portal)

| ID | Nhiệm vụ | Đại diện đảm nhận | Tiêu chí Hoàn thành & Xác minh |
|----|----------|-------------------|-------------------------------|
| 2.1 | Tạo bài test đầu vào `EntryQuiz.tsx` & logic cá nhân hóa lộ trình | `frontend-specialist` | Điểm số được lưu vào DB và đổi thứ tự hiển thị bài học phù hợp. |
| 2.2 | Xây dựng Cổng phụ huynh `/parent` | `frontend-specialist` & `backend-specialist` | Nhập mã liên kết hiện ra đúng dữ liệu tiến trình và lời khuyên. |
| 2.3 | Nâng cấp Dashboard Giáo viên `/teacher` (thống kê lớp học & xuất file) | `frontend-specialist` | Biểu đồ hiển thị thống kê chính xác và xuất file Excel/In báo cáo. |
| 2.4 | Tích hợp nút hỗ trợ khẩn cấp `HelpModal.tsx` & Chứng nhận QR | `frontend-specialist` | Nút khẩn cấp hoạt động tốt; Chứng nhận SVG kết xuất đủ tên/QR. |

---

## 4. Kế hoạch Xác minh Tổng thể (Phase X)

- **Kiểm thử biên dịch**: `yarn run typecheck` không có lỗi TypeScript.
- **Kiểm thử logic**: Chạy lại các file kiểm thử `yarn run test` bảo đảm không ảnh hưởng đến API hiện tại.
- **Kiểm thử UX/UI**: Chạy `yarn run dev` và dùng thử giao diện mô phỏng trên thiết bị di động/máy tính bảng để bảo đảm các nút bấm to, rõ ràng cho trẻ em.
- **Đánh giá Hiệu năng**: Đo tốc độ tải trang bằng Lighthouse, tối ưu hóa các tệp tin SVG chứng chỉ và giọng nói TTS.
