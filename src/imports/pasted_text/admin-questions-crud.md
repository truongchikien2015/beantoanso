Bạn là senior full-stack developer. Hãy nâng cấp dự án “Bé an toàn số” đang dùng Next.js App Router + TypeScript + Tailwind CSS + Supabase.

Yêu cầu thêm 2 module mới:

1. CRUD câu hỏi quiz cho quản trị viên
2. Leaderboard bảng xếp hạng học sinh/người chơi

Mục tiêu:
- Giáo viên/quản trị viên có thể thêm, sửa, xóa, xem danh sách câu hỏi quiz.
- Người chơi sau khi hoàn thành game sẽ được lưu điểm và hiển thị trên bảng xếp hạng.
- Leaderboard giúp tăng tính trò chơi hóa và tạo động lực học tập.

==================================================
PHẦN 1: CRUD CÂU HỎI QUIZ
==================================================

Tạo trang quản trị câu hỏi tại:

/admin/questions

Chức năng cần có:
- Hiển thị danh sách câu hỏi quiz
- Tìm kiếm câu hỏi theo từ khóa
- Lọc câu hỏi theo chủ đề
- Thêm câu hỏi mới
- Sửa câu hỏi
- Xóa câu hỏi
- Bật/tắt trạng thái câu hỏi
- Hiển thị đáp án đúng
- Hiển thị giải thích sau câu hỏi

Thông tin mỗi câu hỏi gồm:
- Câu hỏi
- Chủ đề
- Đáp án A
- Đáp án B
- Đáp án C
- Đáp án đúng: A/B/C
- Giải thích ngắn
- Trạng thái: active/inactive
- Ngày tạo
- Ngày cập nhật

Các chủ đề câu hỏi:
1. Người lạ nhắn tin
2. Link lạ và lừa đảo
3. Mật khẩu và tài khoản
4. Bảo vệ thông tin cá nhân
5. Ứng xử văn minh trên mạng
6. Thời gian dùng màn hình
7. Nội dung xấu và tin giả

UI yêu cầu:
- Giao diện admin đơn giản, dễ dùng
- Dùng table để hiển thị danh sách câu hỏi
- Có nút “Thêm câu hỏi”
- Có nút “Sửa”
- Có nút “Xóa”
- Có ô tìm kiếm
- Có dropdown lọc chủ đề
- Có badge trạng thái active/inactive
- Có confirm popup trước khi xóa
- Form thêm/sửa nằm trong modal hoặc page riêng đều được

Route đề xuất:
- /admin/questions
- /admin/questions/create nếu dùng page riêng
- /admin/questions/[id]/edit nếu dùng page riêng

Component cần tạo:
- QuestionTable
- QuestionForm
- QuestionFilter
- QuestionSearch
- QuestionStatusBadge
- DeleteQuestionButton

Validation:
- Không được để trống câu hỏi
- Không được để trống 3 đáp án
- Đáp án đúng chỉ nhận A, B hoặc C
- Chủ đề bắt buộc chọn
- Giải thích nên có nhưng không bắt buộc
- Khi xóa cần confirm

Logic:
- Quiz cuối bài chỉ lấy câu hỏi có `is_active = true`
- Mỗi lượt quiz random 10 câu từ danh sách active
- Không lấy câu hỏi inactive vào quiz
- Nếu số câu active dưới 10 thì lấy toàn bộ số câu hiện có

==================================================
PHẦN 2: LEADERBOARD NGƯỜI DÙNG
==================================================

Tạo trang leaderboard tại:

/leaderboard

Mục tiêu:
Hiển thị bảng xếp hạng học sinh/người chơi có điểm cao nhất.

Dữ liệu hiển thị:
- Hạng
- Tên học sinh
- Tổng điểm
- Điểm nhiệm vụ
- Điểm quiz
- Danh hiệu
- Huy hiệu
- Ngày hoàn thành

Cách xếp hạng:
- Sắp xếp theo `total_score` giảm dần
- Nếu bằng điểm thì người hoàn thành sớm hơn xếp trên
- Chỉ hiển thị kết quả đã hoàn thành cuối game
- Mặc định hiển thị Top 10
- Có thể thêm nút “Xem thêm” để hiển thị Top 50

UI yêu cầu:
- Giao diện vui nhộn, phù hợp trẻ em
- Top 1, 2, 3 có icon huy chương
- Có card nổi bật cho Top 3
- Có bảng danh sách từ hạng 4 trở xuống
- Có nút “Chơi lại để cải thiện điểm”
- Có nút quay về trang chủ
- Responsive tốt trên mobile

Route:
- /leaderboard

Component cần tạo:
- LeaderboardPage
- TopThreePodium
- LeaderboardTable
- RankBadge
- PlayerScoreCard

Tại trang kết quả `/result`, thêm nút:
- “Xem bảng xếp hạng”

Tại trang chủ `/`, thêm nút:
- “Bảng xếp hạng”

==================================================
PHẦN 3: CẬP NHẬT DATABASE SUPABASE
==================================================

Cập nhật bảng `quiz_questions`.

Nếu bảng chưa có đủ field thì alter thêm:

- category text
- is_active boolean default true
- created_at timestamp default now()
- updated_at timestamp default now()

Schema đề xuất:

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C')),
  explanation text,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

Cập nhật bảng `final_results` nếu cần:

create table if not exists final_results (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  mission_score int default 0,
  quiz_score int default 0,
  total_score int default 0,
  title text,
  badge text,
  completed_at timestamp default now(),
  created_at timestamp default now()
);

Bảng `players`:

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  created_at timestamp default now()
);

Query leaderboard cần join players + final_results:

select
  final_results.id,
  players.nickname,
  final_results.mission_score,
  final_results.quiz_score,
  final_results.total_score,
  final_results.title,
  final_results.badge,
  final_results.completed_at
from final_results
join players on players.id = final_results.player_id
order by final_results.total_score desc, final_results.completed_at asc
limit 50;

==================================================
PHẦN 4: RLS POLICY CHO SUPABASE
==================================================

Vì đây là demo cuộc thi, có thể dùng policy đơn giản.

Public user:
- Có thể select quiz_questions active
- Có thể select leaderboard
- Có thể insert players
- Có thể insert mission_results
- Có thể insert quiz_results
- Có thể insert final_results

Admin CRUD câu hỏi:
Có 2 hướng triển khai.

Hướng đơn giản cho MVP:
- Tạo biến môi trường:
  NEXT_PUBLIC_ADMIN_PASSWORD=
- Trang /admin yêu cầu nhập mật khẩu
- Nếu đúng thì lưu `is_admin=true` vào localStorage
- Cho phép truy cập /admin/questions
- Lưu ý: cách này chỉ phù hợp demo, không dùng production.

Hướng tốt hơn:
- Dùng Supabase Auth
- Chỉ email admin mới được CRUD câu hỏi
- Tạo bảng profiles có role admin
- Policy update/delete/insert quiz_questions chỉ cho role admin

Ưu tiên triển khai MVP trước bằng admin password localStorage để demo nhanh.

==================================================
PHẦN 5: ADMIN LOGIN ĐƠN GIẢN
==================================================

Tạo trang:

/admin

Chức năng:
- Nhập mật khẩu admin
- So sánh với env `NEXT_PUBLIC_ADMIN_PASSWORD`
- Nếu đúng:
  - lưu localStorage `be_an_toan_so_admin = true`
  - redirect sang `/admin/questions`
- Nếu sai:
  - hiện thông báo “Mật khẩu không đúng”

Tạo guard:
- Nếu chưa có localStorage admin thì redirect về `/admin`
- Áp dụng cho `/admin/questions`

Component:
- AdminLoginForm
- AdminGuard
- AdminLayout

==================================================
PHẦN 6: CRUD FUNCTION LOGIC
==================================================

Tạo service file:

lib/questions.ts

Các hàm cần có:

- getQuestions()
- getActiveQuestions()
- getQuestionById(id)
- createQuestion(data)
- updateQuestion(id, data)
- deleteQuestion(id)
- toggleQuestionStatus(id, isActive)

Tạo service file:

lib/leaderboard.ts

Các hàm cần có:

- getLeaderboard(limit = 10)
- getTopPlayers(limit = 3)
- getPlayerBestResult(playerId)

==================================================
PHẦN 7: CẬP NHẬT QUIZ
==================================================

Cập nhật trang `/quiz`:

- Không dùng data hard-code nữa
- Lấy câu hỏi từ Supabase:
  select * from quiz_questions where is_active = true
- Random 10 câu
- Hiển thị từng câu
- Sau khi học sinh chọn đáp án:
  - hiện đúng/sai
  - hiện explanation
- Cuối quiz:
  - tính điểm
  - lưu quiz_results
  - chuyển sang /result

Điểm quiz:
- Mỗi câu đúng +10 điểm
- 10 câu tối đa 100 điểm

==================================================
PHẦN 8: CẬP NHẬT TRANG RESULT
==================================================

Trang `/result` cần:
- Lưu final_results nếu chưa lưu
- Hiển thị tổng điểm
- Hiển thị danh hiệu
- Hiển thị huy hiệu
- Hiển thị thứ hạng hiện tại nếu lấy được
- Có nút:
  - Xem chứng nhận
  - Xem bảng xếp hạng
  - Chơi lại

Danh hiệu:
- 90–100: Chiến binh an toàn số
- 70–89: Bạn nhỏ thông minh
- 50–69: Em đã hiểu cơ bản
- Dưới 50: Hãy luyện tập thêm cùng Robot An Toàn

==================================================
PHẦN 9: SEED CÂU HỎI
==================================================

Cập nhật file seed SQL:
- Thêm tối thiểu 50 câu hỏi
- Mỗi câu có category
- Mỗi câu có explanation
- Mặc định is_active = true

Ví dụ insert:

insert into quiz_questions (
  question,
  category,
  option_a,
  option_b,
  option_c,
  correct_option,
  explanation,
  is_active
) values
(
  'Người lạ hỏi địa chỉ nhà của em, em nên làm gì?',
  'Người lạ nhắn tin',
  'Gửi ngay',
  'Không gửi và báo bố mẹ',
  'Hỏi người đó muốn gì',
  'B',
  'Em không nên chia sẻ địa chỉ nhà cho người lạ.',
  true
);

==================================================
PHẦN 10: YÊU CẦU HOÀN THIỆN
==================================================

Sau khi code xong, hãy kiểm tra:

1. Admin có đăng nhập được không
2. Admin có thêm câu hỏi được không
3. Admin có sửa câu hỏi được không
4. Admin có xóa câu hỏi được không
5. Admin có bật/tắt câu hỏi được không
6. Quiz chỉ lấy câu hỏi active
7. Quiz random 10 câu, không trùng trong một lượt
8. Điểm quiz tính đúng
9. Final result lưu vào Supabase
10. Leaderboard hiển thị đúng Top 10
11. Top 1, 2, 3 hiển thị huy chương
12. Mobile 360px không bị vỡ giao diện
13. Build không lỗi TypeScript
14. README được cập nhật hướng dẫn sử dụng admin và leaderboard

==================================================
PHẦN 11: README CẦN CẬP NHẬT
==================================================

README cần bổ sung:

- Cách tạo Supabase project
- Cách chạy file schema.sql
- Cách seed 50 câu hỏi
- Cách tạo `.env.local`

.env.local gồm:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_PASSWORD=123456

- Cách chạy dev:

npm install
npm run dev

- Cách vào admin:

/admin

- Cách xem leaderboard:

/leaderboard

==================================================
KẾT QUẢ MONG MUỐN
==================================================

Sau khi hoàn thành, dự án có:
- Website/game học tập cho học sinh
- Quiz lấy câu hỏi từ Supabase
- Admin CRUD câu hỏi
- Leaderboard bảng xếp hạng
- Trang kết quả có nút xem bảng xếp hạng
- Dữ liệu điểm người chơi lưu Supabase
- Giao diện đẹp, dễ dùng, phù hợp học sinh tiểu học