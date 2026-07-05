# PLAN: Auth, Adaptive Questioning & Social Sharing

Hệ thống cho phép học sinh tham gia theo 2 hình thức: Chơi nhanh (Guest) và Đăng ký (Member), với nội dung được cá nhân hóa theo độ tuổi/giới tính và khả năng chia sẻ thành tích.

## 1. Mục tiêu & Phạm vi
- **Chế độ Khách:** Nhập thông tin nhanh, nội dung cá nhân hóa, không lưu lâu dài.
- **Chế độ Thành viên:** Supabase Auth, lưu trữ toàn bộ lịch sử, XP, Level, Thử thách.
- **Adaptive Content:** Lọc câu hỏi dựa trên Năm sinh (độ tuổi) và Giới tính.
- **Social Sharing:** Tạo card kết quả để chia sẻ lên Zalo/Facebook.

## 2. Giai đoạn thực hiện

### Giai đoạn 1: Cấu trúc Dữ liệu (Database)
- [ ] **Bảng `questions`**: Thêm các trường lọc:
  - `min_age` (int): Độ tuổi tối thiểu.
  - `max_age` (int): Độ tuổi tối đa.
  - `target_gender` (text): 'male', 'female', 'all'.
- [ ] **Bảng `profiles`**: Gắn với `auth.users` của Supabase:
  - `id` (uuid, PK), `full_name` (text), `gender` (text), `birth_year` (int), `avatar_url` (text).
  - `xp` (int), `level` (int), `total_score` (int).
- [ ] **Bảng `user_progress`**: Lưu tiến trình chi tiết:
  - `user_id` (uuid), `path_id` (text), `completed_topics` (jsonb), `daily_challenges` (jsonb).

### Giai đoạn 2: Luồng xác thực & Thông tin người dùng
- [ ] **Auth UI**: Tạo modal Đăng ký/Đăng nhập (Email/Password).
- [ ] **Guest Info**: Cập nhật màn hình chào mừng để thu thập Năm sinh/Giới tính khi chơi nhanh.
- [ ] **Profile Sync**: Cho phép đồng bộ dữ liệu Guest vào tài khoản Member khi đăng ký.

### Giai đoạn 3: Cá nhân hóa Câu hỏi (Adaptive Logic)
- [ ] Refactor `fetchRandomQuestion`: Thêm logic lọc SQL theo tuổi và giới tính của người chơi.
- [ ] Cập nhật Script Seed để bổ sung dữ liệu mẫu cho các lứa tuổi khác nhau.

### Giai đoạn 4: Hệ thống Điểm & Chia sẻ
- [ ] Tính toán XP/Level sau mỗi câu trả lời đúng.
- [ ] Xây dựng Component `ResultCard` hiển thị thành tích đẹp mắt.
- [ ] Tích hợp tính năng tải ảnh/chia sẻ mạng xã hội.

## 3. Rủi ro & Giải pháp
- **Rủi ro:** Không đủ câu hỏi cho một độ tuổi cụ thể.
- **Giải pháp:** Nếu không tìm thấy câu hỏi phù hợp lứa tuổi, hệ thống sẽ fallback về bộ câu hỏi "All Ages".

## 4. Kiểm thử (Verification)
- Kiểm tra đăng ký/đăng nhập thành công.
- Kiểm tra chơi nhanh với các độ tuổi khác nhau có ra câu hỏi khác nhau không.
- Kiểm tra lịch sử được lưu lại sau khi F5 (đối với Member).
