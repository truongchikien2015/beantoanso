# Project Plan: News, Feedback & Teacher Subscription

## Tổng quan
Kế hoạch triển khai 3 tính năng mới giúp mở rộng chức năng hệ thống:
1. Tin tức (Blog) hỗ trợ SEO bằng AI.
2. Nút Float góp ý tính năng (Feedback).
3. Đăng ký giáo viên & Thanh toán subscription qua VNPay.

---

## Phân rã nhiệm vụ (Task Breakdown)

### Phase 1: Nút Feedback (Float Button)
- [ ] **Mô hình Dữ liệu (Database)**: Tạo schema/collection `Feedback` (user_id, content, feature_request, status, created_at).
- [ ] **API Backend**: Endpoint `POST /api/feedback` để nhận góp ý từ client.
- [ ] **UI Client**: Tạo component `<FloatFeedbackButton />` gắn cố định (fixed) ở góc phải màn hình, có modal chứa form nhập nội dung góp ý.
- [ ] **UI Admin**: Thêm tab/trang "Quản lý Góp ý" trong Admin Dashboard để admin xem danh sách các phản hồi và thay đổi trạng thái (New, Reviewed).

### Phase 2: Tin tức (News/Blog) chuẩn SEO với AI
- [ ] **Mô hình Dữ liệu**: Tạo schema `NewsCategory` và `NewsArticle` (có các trường SEO meta).
- [ ] **API Backend & AI**:
  - `GET/POST /api/admin/news` (Quản lý bài viết).
  - `POST /api/admin/news/ai-seo` (Gọi Grok AI truyền chủ đề để sinh ra Meta Title, Meta Description, Outline gợi ý dựa trên Tùy chọn A).
- [ ] **UI Admin**: Màn hình "Quản lý Tin tức" với Rich Text Editor (trình soạn thảo) và nút "Tối ưu SEO bằng AI".
- [ ] **UI Client**: 
  - Tạo route `/news` hiển thị danh sách bài viết theo danh mục.
  - Tạo route `/news/[slug]` hiển thị chi tiết bài viết (Hỗ trợ SSR / Metadata tĩnh cho SEO).

### Phase 3: Đăng ký Giáo viên & Thanh toán (VNPay Demo)
- [ ] **Mô hình Dữ liệu**: Thêm các trường vào user role Teacher (`subscription_status`, `trial_end_date`, `subscription_end_date`). Cập nhật model Admin để có chức năng "Duyệt Giáo viên".
- [ ] **Landing Page**: Xây dựng UI tĩnh trang `/become-teacher` với các thông tin quảng bá, tính năng và nút "Bắt đầu dùng thử 30 ngày". Form nộp hồ sơ.
- [ ] **Workflow Duyệt (Admin)**: Danh sách giáo viên chờ duyệt -> Admin bấm duyệt -> Cập nhật trạng thái và tự động cộng 30 ngày trial.
- [ ] **Tích hợp VNPay (Demo Mode)**:
  - Khởi tạo cổng thanh toán VNPay bằng sandbox account (Config env: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`).
  - `GET /api/payment/vnpay/create` -> Sinh link thanh toán gia hạn (vd: 50.000 VNĐ / tháng).
  - `GET /api/payment/vnpay/ipn` -> Xử lý Webhook VNPay gọi về để cập nhật `subscription_end_date` thêm 30 ngày.
- [ ] **UI Teacher Dashboard**: Thêm banner cảnh báo khi gần hết hạn. Nút "Thanh toán/Gia hạn" mở cổng VNPay.

---

## Agent Assignments

- `@backend-specialist`: Xử lý Models, API VNPay, API AI SEO, API Feedback.
- `@frontend-specialist`: Xử lý UI Landing page `/become-teacher`, Float button, trang hiển thị `/news`.
- `@orchestrator`: Cấu hình routing tổng thể và ghép nối luồng dữ liệu Admin.

---

## Verification Checklist
1. Thử gửi feedback thành công và xuất hiện trên màn hình Admin.
2. Admin tạo bài viết mới -> Nhấn "Gợi ý SEO bằng AI" -> AI điền tự động Title và Description.
3. Bài viết hiển thị trên trang chủ `/news` với đầy đủ thẻ `<meta name="description">` khi View Source.
4. Nộp form đăng ký Giáo viên -> Chờ Admin duyệt -> Hiển thị Trial 30 ngày.
5. Click nút Gia hạn gói -> Redirect sang VNPay Sandbox -> Hoàn tất thanh toán test -> Trở về cập nhật ngày hết hạn.
