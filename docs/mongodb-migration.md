# Kế hoạch di chuyển toàn bộ luồng dữ liệu từ Supabase sang MongoDB

Di chuyển toàn bộ cơ chế xác thực (Authentication), quản lý dữ liệu (Learning Paths, Topics, Questions) và đồng bộ điểm số học sinh từ Supabase sang 100% MongoDB.

## 📊 Project Type: WEB

## 🎯 Success Criteria
- [ ] Xóa bỏ hoàn toàn kết nối Client-side tới Supabase trong ứng dụng.
- [ ] Xác thực giáo viên và học sinh tự do (Profile) sử dụng cơ sở dữ liệu MongoDB và cơ chế Custom JWT (jose).
- [ ] Thay thế toàn bộ các lệnh truy vấn Supabase trực tiếp (`supabase.from(...)`) ở Admin Dashboard và Student App bằng các API endpoints của hệ thống kết nối tới MongoDB.
- [ ] Sao lưu và phục hồi dữ liệu hệ thống (Backup & Restore) hoạt động trực tiếp trên MongoDB thay vì Supabase.
- [ ] 100% Unit test cũ và mới pass; ứng dụng biên dịch thành công.

## 🛠️ Tech Stack & Rationale
- **Database**: MongoDB (Mongoose)
- **Authentication**: Custom JWT (jose) lưu trong LocalStorage (`student_token`, `teacher_token`).
- **REST APIs**: Các Next.js API Routes nội bộ trong `src/app/api/...`
- **Libraries**: `bcryptjs` cho băm mật khẩu.

## 📁 File Structure (New API Routes)
```
src/
└── app/
    └── api/
        ├── auth/
        │   ├── teacher/login/route.ts       # [MODIFY] Chuyển đổi sang MongoDB
        │   └── student/login/route.ts       # [MODIFY] Chuyển đổi sang MongoDB
        ├── student/
        │   ├── topics/route.ts              # [NEW] Lấy các chủ đề hoạt động
        │   ├── questions/route.ts           # [NEW] Lấy câu hỏi theo filter
        │   └── progress/route.ts            # [MODIFY] Thêm POST sync XP và lưu MongoDB
        └── admin/
            ├── topics/route.ts              # [NEW] Admin lấy/tạo chủ đề
            ├── topics/[id]/route.ts         # [NEW] Admin sửa/xóa chủ đề
            ├── learning-paths/route.ts      # [NEW] Admin lấy/tạo lộ trình
            ├── learning-paths/[id]/route.ts # [NEW] Admin sửa/xóa lộ trình
            ├── questions/route.ts           # [NEW] Admin lấy/tạo câu hỏi
            └── questions/[id]/route.ts      # [NEW] Admin sửa/xóa câu hỏi
```

---

## 📝 Task Breakdown

### Task 1: Cập nhật Mongoose Model `Profile` (`src/lib/db/models/Profile.ts`)
- **Agent**: `database-architect`
- **Skill**: `database-design`
- **Priority**: P0
- **Task**: Thêm các trường `email` (string, unique, sparse) và `password_hash` (string, optional) vào schema và interface `IProfile` để phục vụ học sinh tự do đăng ký và xác thực qua MongoDB.
- **Verify**: Kiểm tra kiểu dữ liệu trong file, chạy `yarn run typecheck` thành công.

### Task 2: Cập nhật API Đăng nhập Giáo viên & Học sinh tự do
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P0
- **Task**:
  - `src/app/api/auth/teacher/login/route.ts`: Cập nhật logic POST để so khớp mật khẩu giáo viên bằng `bcryptjs` từ MongoDB `Teacher` và trả về custom JWT token. Đăng ký giáo viên mới bằng cách băm mật khẩu và lưu trực tiếp vào MongoDB.
  - `src/app/api/auth/student/login/route.ts`: Tương tự, đăng ký/đăng nhập học sinh tự do bằng email & mật khẩu lưu trực tiếp trong `Profile` collection trên MongoDB.
- **Verify**: Chạy tests kiểm tra hai endpoint auth trả về JWT token chính xác.

### Task 3: Viết các API học sinh lấy dữ liệu (Topics, Questions, Progress)
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P1
- **Task**:
  - `/api/student/topics`: Tạo endpoint GET trả về danh sách chủ đề hoạt động từ MongoDB `Topic`.
  - `/api/student/questions`: Tạo endpoint GET trả về câu hỏi lọc theo `topic_slug`, `age`, `gender` từ MongoDB `Question`.
  - `/api/student/progress`: Thêm phương thức `POST` cho phép đồng bộ XP của học sinh tự do (cập nhật `Profile.xp`) hoặc học sinh giáo viên tạo (cập nhật `TeacherStudentStats`).
- **Verify**: Gọi API bằng curl trả về đúng dữ liệu MongoDB.

### Task 4: Viết các API Quản trị cho Admin Dashboard
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P1
- **Task**: Tạo các endpoints `/api/admin/topics`, `/api/admin/learning-paths` và `/api/admin/questions` (cùng các dynamic route `[id]`) xử lý các tác vụ CRUD cho Admin. Sử dụng `checkAdmin` để xác thực.
- **Verify**: Gọi API kèm header `x-admin-password` hợp lệ và không hợp lệ để kiểm tra phân quyền.

### Task 5: Di chuyển API Sao lưu & Khôi phục (`/api/admin/backup-restore`)
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P1
- **Task**: Thay đổi backup/restore để đọc và ghi trực tiếp từ các MongoDB collections (`Profile`, `Teacher`, `Topic`, `Question`, `LearningPath`, v.v.) thay vì thông qua `supabaseAdmin`.
- **Verify**: Thử tạo bản sao lưu từ giao diện Admin, xóa một vài dữ liệu và khôi phục thành công.

### Task 6: Cập nhật giao diện Client-side của Học sinh
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Task**:
  - `App.tsx` & `page.tsx` & `path-select/page.tsx`: Thay thế kiểm tra session Supabase bằng việc kiểm tra `localStorage.getItem("student_token")` và gọi GET `/api/student/login`. Fetch topics/questions từ các API mới `/api/student/topics` và `/api/student/questions`.
  - `AuthModal.tsx`: Lưu JWT token nhận được khi login/register thành viên tự do vào `student_token` trong `localStorage` thay vì gọi `supabase.auth.setSession`.
  - `chat-sim/page.tsx` & `email-sim/page.tsx`: Gọi `POST /api/student/progress` để cập nhật XP khi hoàn thành mô phỏng.
- **Verify**: Thực hiện đăng ký học sinh mới, chơi game lộ trình, hoàn thành mô phỏng chat người lạ, và kiểm tra XP tăng trên header.

### Task 7: Cập nhật Cổng Giáo viên (`src/app/teacher/page.tsx` & `teacherContentStore.ts`)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Task**:
  - `page.tsx`: Đăng nhập giáo viên bằng cách gọi `/api/auth/teacher/login` và lưu token vào `teacher_token` trong `localStorage`.
  - `teacherContentStore.ts`: Đọc header Authorization từ `teacher_token` thay vì `supabase.auth.getSession()`.
- **Verify**: Đăng nhập tài khoản giáo viên thành công, quản lý lớp học và danh sách bình thường.

### Task 8: Cập nhật Admin Dashboard UI
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Task**:
  - Cập nhật `AdminDashboard.tsx`, `TopicManager.tsx`, `PathManager.tsx` và `AdminQuestions.tsx` để thực hiện fetch dữ liệu qua các API quản trị mới của MongoDB (`/api/admin/...`) thay vì gọi `supabase.from(...)` trực tiếp.
- **Verify**: Đăng nhập Admin, thực hiện thêm chủ đề mới, thêm lộ trình học tập mới, chỉnh sửa câu hỏi hệ thống và kiểm tra thay đổi lưu vào MongoDB thành công.

---

## 🏁 Phase X: Verification
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
