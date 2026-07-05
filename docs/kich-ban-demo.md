# 🎬 Kịch Bản Demo & Thuyết Trình: Dự Án Bé An Toàn Số 🛡️

Tài liệu này hướng dẫn chi tiết từng bước thao tác trên giao diện (Click-through) và nội dung thuyết trình tương ứng để chạy thử nghiệm hoặc quay video demo dự án.

---

## ⏱️ Tổng quan phân bổ thời gian (Tổng cộng: ~3 - 5 phút)
1. **Mở đầu & Onboarding** (30 giây)
2. **Khảo sát đầu vào (Entry Quiz)** (30 giây)
3. **Bản đồ hành trình & Mô phỏng tương tác (Chat & Email Phishing)** (1 phút 30 giây)
4. **Trợ lý AI Mascot & Trình dò Link độc hại** (1 phút)
5. **Cổng phụ huynh & Cổng giáo viên (Analytics Dashboard)** (1 phút)

---

## 🗺️ Kịch bản chi tiết từng phần

### 1. Mở đầu & Onboarding (Đăng ký học sinh)
*   **Thao tác trên màn hình:**
    1. Truy cập trang chủ dự án (`http://localhost:3000/`).
    2. Nhập biệt danh của học sinh: `Bé Kiên`.
    3. Chọn giới tính: `Nam` (hoặc `Nữ`/`Khác`).
    4. Chọn năm sinh: `2016` (học sinh Lớp 5).
    5. Nhấn **"Bắt đầu học ngay ➔"**.
*   **Lời thoại thuyết trình:**
    > *"Kính thưa Ban giám khảo, đây là cổng trải nghiệm học sinh của Bé An Toàn Số. Học sinh không cần đăng ký phức tạp mà chỉ cần nhập biệt danh và năm sinh để hệ thống cá nhân hóa độ tuổi của các câu hỏi và tình huống phù hợp nhất."*

---

### 2. Khảo sát đầu vào (Entry Quiz)
*   **Thao tác trên màn hình:**
    1. Khi vào màn hình chọn lộ trình, một hộp thoại **Entry Quiz** (Khảo sát đầu vào) sẽ tự động hiện lên.
    2. Click trả lời nhanh 3 câu hỏi trắc nghiệm (chọn phương án ngẫu nhiên hoặc trả lời đúng để nhận XP).
    3. Nhấn **"Hoàn thành"** để đóng pop-up.
*   **Lời thoại thuyết trình:**
    > *"Ngay khi bắt đầu, hệ thống sẽ đề xuất một bài khảo sát nhanh gồm 3 câu hỏi để đánh giá năng lực an toàn số ban đầu của học sinh. Dựa trên kết quả này, AI sẽ tự động điều chỉnh lộ trình học tập tối ưu nhất cho riêng con."*

---

### 3. Bản đồ hành trình & Thực hành mô phỏng tình huống thực tế
*   **Thao tác trên màn hình:**
    1. Trên màn hình Lộ trình học tập, click vào card thứ nhất: **"Chat với người lạ"**.
    2. Thực hiện chọn các câu trả lời:
        *   Khi người lạ xin số điện thoại/ảnh cá nhân: Chọn phương án từ chối lịch sự và báo cho cha mẹ.
        *   Xem Cú Cú chấm điểm trực tiếp và giải thích bằng tiếng Việt sinh động.
        *   Bấm nút phát âm thanh 🔊 để nghe Cú Cú đọc lời khuyên.
    3. Click quay lại màn hình chọn lộ trình. Click vào card thứ hai: **"Vạch trần Email lừa đảo"**.
    4. Rà soát hộp thư mô phỏng, click vào các điểm đỏ đáng ngờ:
        *   Địa chỉ email người gửi lạ (`nhanquafreefire2024@gmail.com`).
        *   Lời mời nhận quà quá khủng (SH, 9.999 Kim Cương).
        *   Yêu cầu giục giã khẩn cấp (trong 24 giờ).
        *   Link đăng nhập đáng ngờ.
    5. Bấm quay lại lộ trình học tập.
*   **Lời thoại thuyết trình:**
    > *"Điểm nâng cấp thực chiến nhất của Bé An Toàn Số chính là các bài thực hành mô phỏng tình huống. Tại đây, con được đóng vai trực tiếp xử lý tin nhắn của người lạ xin số điện thoại, xin ảnh riêng tư trên mạng xã hội giả lập. Tiếp theo là mô phỏng hòm thư điện tử, giúp học sinh tiểu học rèn luyện thói quen rà soát, chỉ ra 4 dấu hiệu lừa đảo phổ biến: người gửi lạ, quà tặng quá lớn, hối thúc thời gian, và link giả mạo."*

---

### 4. Trợ lý AI Mascot (Cú Cú) & Trình dò Link độc hại
*   **Thao tác trên màn hình:**
    1. Tại màn hình Lộ trình học tập, click vào biểu tượng Cú Cú AI Mascot ở góc dưới bên phải để mở bong bóng trò chuyện.
    2. Nhấp vào một trong các câu hỏi gợi ý nhanh vừa được thêm, ví dụ: **"Làm sao để đặt mật khẩu an toàn hả Cú?"**.
    3. Nhìn thấy Cú Cú AI trả lời tức thì bằng ngôn ngữ trẻ em, vui nhộn và chính xác.
    4. Kéo xuống dưới trong màn hình Lộ trình học tập, tìm **"Trình kiểm tra liên kết (Link Detector)"**.
    5. Nhập link giả mạo: `http://nhanquafreefire-garena.com` -> Hệ thống cảnh báo đỏ 🚨 **Không an toàn!**.
    6. Nhập link chính thống: `https://garena.vn` -> Hệ thống hiện màu xanh ✅ **An toàn**.
*   **Lời thoại thuyết trình:**
    > *"Bên cạnh lộ trình chuẩn, học sinh luôn có sự đồng hành của Cú Cú AI Mascot. Chúng tôi đã thiết kế các bong bóng gợi ý câu hỏi nhanh để các bé lười gõ phím vẫn có thể hỏi đáp ngay về bảo mật, kết bạn online. Ngoài ra, tính năng Link Detector cho phép học sinh copy bất cứ đường link nào nghi ngờ để kiểm tra mức độ độc hại trước khi click vào."*

---

### 5. Cổng Giáo viên (Teacher Dashboard & Seeder Lớp 5A)
*   **Thao tác trên màn hình:**
    1. Quay lại trang chủ, click chọn **"Cổng Giáo viên"** (hoặc truy cập trực tiếp `/teacher`).
    2. Nhìn thấy bảng thông tin tài khoản demo màu xanh lá cây hướng dẫn tài khoản:
        *   Email: `giaovienc@gmail.com`
        *   Mật khẩu: `Admin123@`
    3. Nhập thông tin tài khoản và bấm **"Đăng nhập"** (hệ thống tự động bỏ qua nếu ngoại tuyến nhờ tính năng Offline Bypass).
    4. Tại tab **Tổng quan (Overview)**, nhấn nút **"⚡ Nạp Dữ Liệu Demo Lớp 5A"** và xác nhận. Màn hình tự động tải lại với 20 học sinh Lớp 5A có đầy đủ biểu đồ Recharts, phân tích điểm yếu (Strangers & Phishing có tỉ lệ chính xác thấp nhất).
    5. Chuyển qua tab **"Học sinh (Students)"** để xem danh sách 32 học sinh (đã được đồng bộ với MongoDB) có đầy đủ tên, điểm XP, số chủ đề đã học và nút reset mật khẩu nhanh cho từng em.
*   **Lời thoại thuyết trình:**
    > *"Cuối cùng là Cổng Giáo viên. Tại đây giáo viên chủ nhiệm quản lý toàn bộ lớp học của mình. Tính năng seeder một chạm cho phép nạp nhanh dữ liệu Lớp 5A với 32 học sinh thực tế để thuyết trình. Nhờ biểu đồ trực quan, giáo viên dễ dàng phát hiện hai kỹ năng yếu nhất của cả lớp là 'Nhận biết người lạ' và 'Email lừa đảo' để thiết kế các buổi sinh hoạt lớp giáo dục chuyên sâu."*

---

## 🛡️ Điểm nhấn công nghệ cần nhấn mạnh với BGK:
*   **Vietnamese-First:** Hệ thống sử dụng giọng đọc tự nhiên bằng tiếng Việt (Text-to-Speech) thân thiện với trẻ em tiểu học.
*   **Offline/Presentation Safety:** Đảm bảo 100% không bị lỗi kết nối mạng hay Supabase gián đoạn lúc thuyết trình nhờ cơ chế Bypass đăng nhập và seeder lưu trữ local dự phòng.
*   **Trải nghiệm người dùng:** Giao diện thiết kế theo phong cách hoạt hình (Gamification), không sử dụng màu tím trơn đơn điệu, các nút bấm to dễ thao tác, có âm thanh tương tác vui tai.
