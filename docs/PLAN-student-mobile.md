# Kế Hoạch Thiết Kế & Tối Ưu Hóa Responsive Giao Diện Học Sinh Trên Mobile (PLAN-student-mobile)

Tài liệu này lập kế hoạch chi tiết cho việc thiết kế, tối ưu hóa responsive và cải thiện trải nghiệm người dùng (UX) trên các thiết bị di động (mobile & tablet) cho toàn bộ nhóm trang học sinh của hệ thống "Bé An Toàn Số" (từ màn hình đăng nhập, bảng học tập, bản đồ hành trình, trang tiến trình, thử thách hằng ngày, trang làm quiz cho đến chứng nhận hoàn thành).

## Project Type: WEB

---

## 🎯 Success Criteria (Tiêu chí thành công)

1. **Độ tương thích di động (Mobile Responsive):**
   - Đảm bảo hiển thị hoàn hảo ở các độ phân giải màn hình từ cực nhỏ (320px như iPhone SE) đến máy tính bảng (768px+ như iPad).
   - Không có hiện tượng tràn viền chiều ngang (no unexpected horizontal overflow-x) gây thanh cuộn ngang ngoài ý muốn trên toàn bộ shell của trang.
2. **Kích thước vùng chạm (Touch-friendly targets):**
   - Tất cả các nút hành động, thẻ bài học, thẻ chặng bản đồ, và đặc biệt là các đáp án trắc nghiệm (Answer cards) có chiều cao tối thiểu là 48px (khuyến nghị 52px) và khoảng cách an toàn (tối thiểu 8px - 12px) để tránh bấm nhầm trên màn hình cảm ứng.
3. **Màu sắc & Phông chữ (Aesthetic & Fonts):**
   - Tuân thủ nghiêm ngặt **Purple Ban** (Tuyệt đối không dùng màu Tím/Indigo/Violet). Sử dụng bộ màu Pastel Kid-friendly: Xanh ngọc (`#4ECDC4`), Vàng kem (`#FFF9F0`), San hô (`#FF6B6B`), xanh emerald cho trạng thái đúng, đỏ hồng cho trạng thái sai.
   - Sử dụng phông chữ thân thiện `Nunito` và `Quicksand` có cỡ chữ body tối thiểu 15px - 16px trên di động để học sinh tiểu học dễ đọc mà không bị mỏi mắt.
4. **Bản đồ hành trình & Canvas chứng chỉ:**
   - Bản đồ hành trình (`JourneyMap`) giữ đúng tọa độ tương đối của các chặng bài học so với con đường trên ảnh nền khi co giãn màn hình bằng cơ chế cuộn ngang (`overflow-x-auto`) với chiều rộng cố định tối thiểu (`min-width: 768px`).
   - Chứng chỉ hoàn thành (`Certificate`) tự động co giãn vừa khít màn hình dọc bằng thuộc tính CSS scale (`transform: scale(...)`) hoặc wrapper thích ứng để tránh mất góc khi xem trên điện thoại thông minh.

---

## 🛠️ Tech Stack & Constraints

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 + Scoped CSS (`<style>` in components)
- **Fonts:** Nunito & Quicksand
- **Kiểm thử thủ công:** Chrome DevTools Device Mode (iPhone SE/12 Pro, iPad).

---

## 📁 File Structure (Các file cần kiểm tra & tối ưu hóa)

### [MODIFY]
- [globals.css](file:///Applications/work/hackthon/beantoanso/src/app/globals.css) — Thêm các utility class di động và biến font size fluid.
- [StudentLoginForm.tsx](file:///Applications/work/hackthon/beantoanso/src/components/student/StudentLoginForm.tsx) — Tối ưu hóa padding, spacing trường nhập liệu và nút bấm.
- [StudentDashboard.tsx](file:///Applications/work/hackthon/beantoanso/src/components/student/StudentDashboard.tsx) — Stacking dọc thông tin học sinh, timeline lộ trình và thách thức hằng ngày.
- [JourneyMap.tsx](file:///Applications/work/hackthon/beantoanso/src/components/JourneyMap.tsx) — Cuộn ngang mượt mà, cố định tỷ lệ bản đồ.
- [LearningPathSelector.tsx](file:///Applications/work/hackthon/beantoanso/src/components/LearningPathSelector.tsx) — Điều chỉnh thẻ lộ trình co giãn 100% chiều ngang di động.
- [QuizScreen.tsx](file:///Applications/work/hackthon/beantoanso/src/components/QuizScreen.tsx) & [page.tsx](file:///Applications/work/hackthon/beantoanso/src/app/student/quiz/%5BstepId%5D/page.tsx) — Tối ưu hóa layout câu hỏi, nút đáp án lớn xếp dọc, popup kết quả điểm số và giải thích.
- [StudentDailyQuizPanel.tsx](file:///Applications/work/hackthon/beantoanso/src/components/student/StudentDailyQuizPanel.tsx) & [page.tsx](file:///Applications/work/hackthon/beantoanso/src/app/student/daily/page.tsx) — Thiết kế responsive cho khung thử thách hằng ngày và danh sách câu hỏi.
- [StudentProgressCard.tsx](file:///Applications/work/hackthon/beantoanso/src/components/student/StudentProgressCard.tsx) & [page.tsx](file:///Applications/work/hackthon/beantoanso/src/app/student/progress/page.tsx) — Thiết kế responsive cho trang xem tiến trình học tập, xếp dọc biểu đồ và chỉ số.
- [Certificate.tsx](file:///Applications/work/hackthon/beantoanso/src/components/Certificate.tsx) & [page.tsx](file:///Applications/work/hackthon/beantoanso/src/app/student/certificate/page.tsx) — Tối ưu hóa viewport scale chứng chỉ ngang trên màn hình dọc.
- [EscapeRoomSimulation.tsx](file:///Applications/work/hackthon/beantoanso/src/components/EscapeRoomSimulation.tsx) & [ClassifyGame.tsx](file:///Applications/work/hackthon/beantoanso/src/components/ClassifyGame.tsx) — Touch-friendly controls và gesture support.

---

## 📋 Task Breakdown (Chi tiết công việc)

### Phase 1: Nền tảng (Foundation) & Utility CSS di động
- **T1.1: Tinh chỉnh Fluid Typography và Responsive Overrides**
  - **Agent:** `frontend-specialist`
  - **Skills:** `clean-code`, `frontend-design`
  - **INPUT:** `src/app/globals.css`
  - **OUTPUT:** Định nghĩa các kích thước phông chữ linh hoạt thông qua hàm `clamp()` và bổ sung utility padding/margin cho thiết bị di động.
  - **VERIFY:** Khai báo thành công, không lỗi cú pháp CSS.

### Phase 2: Tối ưu Giao diện Đăng nhập & Dashboard học sinh
- **T2.1: Tối ưu responsive Cổng đăng nhập học sinh (`/student/login`)**
  - **Agent:** `frontend-specialist`
  - **INPUT:** `src/components/student/StudentLoginForm.tsx` & `src/app/student/login/page.tsx`
  - **OUTPUT:** Padding của card được cấu hình `p-6 sm:p-8`, inputs & nút đăng nhập có chiều cao lớn (>48px) giúp dễ chạm bằng ngón tay.
  - **VERIFY:** Giao diện co giãn tốt trên màn hình iPhone SE (320px).
- **T2.2: Tối ưu hóa Bảng học tập học sinh (`/student/dashboard`)**
  - **Agent:** `frontend-specialist`
  - **INPUT:** `src/components/student/StudentDashboard.tsx`
  - **OUTPUT:** Profile card chuyển từ ngang sang dọc trên mobile, danh sách các bước học xếp gọn gàng, các nút "Bắt đầu 🎮" có khoảng cách rộng.
  - **VERIFY:** Không bị tràn màn hình ở chiều rộng 360px.

### Phase 3: Bản đồ hành trình & Lộ trình phiêu lưu
- **T3.1: Đảm bảo tọa độ JourneyMap chuẩn xác trên mobile**
  - **Agent:** `frontend-specialist`
  - **INPUT:** `src/components/JourneyMap.tsx`
  - **OUTPUT:** Bao bọc bản đồ trong một khung cuộn ngang `overflow-x-auto` và đặt `min-width: 768px` để các nút chặng an toàn mạng không bị lệch khỏi con đường của ảnh nền.
  - **VERIFY:** Kiểm tra trực quan trên trình giả lập mobile, bản đồ có thể cuộn ngang mượt mà và các chấm chặng nằm chính xác trên đường đi.
- **T3.2: Tối ưu bộ chọn lộ trình (`LearningPathSelector.tsx`)**
  - **Agent:** `frontend-specialist`
  - **INPUT:** `src/components/LearningPathSelector.tsx`
  - **OUTPUT:** Grid khóa học xếp thành 1 cột trên mobile, badge và tiêu đề được thu nhỏ hợp lý, ẩn bớt text mô tả quá dài để giao diện gọn gàng.
  - **VERIFY:** Bố cục dọc hiển thị cân đối.

### Phase 4: Giao diện học tập, làm Quiz & Trò chơi mô phỏng
- **T4.1: Tối ưu hóa màn hình làm Quiz và câu hỏi**
  - **Agent:** `frontend-specialist`
  - **INPUT:** `src/components/QuizScreen.tsx`, `src/components/MissionScreen.tsx`, `src/app/student/quiz/[stepId]/page.tsx`
  - **OUTPUT:** Sắp xếp 3 đáp án A, B, C theo chiều dọc trên mobile. Nút đáp án to rõ (>52px) with bóng đổ Stitch. Tối ưu hiển thị hình ảnh/video minh họa câu hỏi không bị tràn viền. Màn hình báo điểm kết thúc thiết kế bento viền xanh/đỏ sinh động.
  - **VERIFY:** Học sinh dễ dàng đọc câu hỏi và click chọn đáp án bằng một tay trên điện thoại di động.
- **T4.2: Tối ưu hóa trải nghiệm Game kéo thả và Escape Room**
  - **Agent:** `frontend-specialist`
  - **INPUT:** `src/components/EscapeRoomSimulation.tsx` & `src/components/ClassifyGame.tsx`
  - **OUTPUT:** Cải thiện vùng chạm cho các vật phẩm trong Escape Room. Game kéo thả thông tin giả mạo/an toàn hỗ trợ click để chọn hoặc Touch Events.
  - **VERIFY:** Thực hiện trơn tru các thao tác tương tác trên màn hình cảm ứng di động.

### Phase 5: Tối ưu Giao diện Daily Quiz & Progress (Tiến trình)
- **T5.1: Tối ưu responsive trang Thử thách hằng ngày (`/student/daily`)**
  - **Agent:** `frontend-specialist`
  - **INPUT:** `src/components/student/StudentDailyQuizPanel.tsx` & `src/app/student/daily/page.tsx`
  - **OUTPUT:** Thiết kế dạng danh sách dọc tinh gọn, điều chỉnh kích thước của các panel hoạt động trên mobile, vùng touch answers được phóng to.
  - **VERIFY:** Giao diện hiển thị mượt mà không lỗi cuộn ngang trên điện thoại di động.
- **T5.2: Tối ưu responsive trang xem Tiến trình (`/student/progress`)**
  - **Agent:** `frontend-specialist`
  - **INPUT:** `src/components/student/StudentProgressCard.tsx` & `src/app/student/progress/page.tsx`
  - **OUTPUT:** Chuyển các bảng chỉ số và biểu đồ học tập từ hàng ngang sang hàng dọc trên mobile, tối ưu padding cho card tiến trình.
  - **VERIFY:** Biểu đồ hiển thị gọn gàng, các số liệu không bị đè chữ trên màn hình 375px.

### Phase 6: Tối ưu hiển thị Chứng chỉ tốt nghiệp
- **T6.1: Cấu hình responsive khung Chứng chỉ (`Certificate.tsx`)**
  - **Agent:** `frontend-specialist`
  - **INPUT:** `src/components/Certificate.tsx`
  - **OUTPUT:** Sử dụng CSS transform scale hoặc scroll wrapper để hiển thị chứng chỉ ngang trọn vẹn trên màn hình dọc di động.
  - **VERIFY:** Chứng chỉ không bị cắt góc, nút tải xuống hiển thị đầy đủ và dễ thao tác.

---

## 🏁 Phase X: Verification Plan (Kế hoạch xác minh)

### 1. Automated Verification Checks
Chạy các công cụ phân tích tĩnh để loại bỏ lỗi biên dịch và cảnh báo linter:
```bash
npm run lint && npx tsc --noEmit
```

### 2. Manual Verification Checklist
- [ ] Giả lập responsive trên Chrome DevTools ở các kích thước 320px, 375px, 414px (Mobile) và 768px (Tablet).
- [ ] Xác nhận không có lỗi layout tràn viền chiều ngang gây ra scrollbar ngang ở body trang.
- [ ] Xác nhận chiều cao của toàn bộ các nút bấm và khu vực đáp án đạt tối thiểu 48px.
- [ ] Xác nhận bản đồ hành trình hiển thị đúng vị trí chặng và cuộn ngang trơn tru.
- [ ] Xác nhận chứng chỉ hiển thị trọn vẹn và nút tải xuống hoạt động bình thường trên màn hình dọc.
- [ ] Kiểm tra tuân thủ Purple Ban (Không chứa mã màu tím/violet).

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-06-25
