Bạn là senior full-stack developer. Hãy xây dựng một website/game học tập tên “Bé an toàn số – Học cách dùng Internet an toàn” dành cho học sinh tiểu học.

Mục tiêu sản phẩm:
Website/game giúp học sinh tiểu học nhận biết nguy hiểm khi dùng Internet, điện thoại, mạng xã hội, YouTube, game online, link lạ, người lạ nhắn tin. Học sinh sẽ học qua các tình huống mô phỏng, chọn đáp án đúng/sai, nhận điểm, huy hiệu và chứng nhận cuối game.

Công nghệ sử dụng:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Database
- Supabase Storage nếu cần lưu hình ảnh/icon
- LocalStorage để lưu tạm tiến độ khi chưa đăng nhập
- Không bắt buộc đăng nhập cho học sinh
- Học sinh chỉ cần nhập tên/nickname trước khi chơi
- Dữ liệu điểm và kết quả lưu vào Supabase

Yêu cầu giao diện:
- Phù hợp học sinh tiểu học
- Màu sắc tươi sáng, dễ thương
- Có nhân vật “Bé Kiên” và “Robot An Toàn”
- Nút bấm to, dễ nhìn
- Font chữ rõ ràng
- Giao diện responsive, dùng tốt trên điện thoại, tablet, laptop
- Có hiệu ứng nhẹ khi chọn đúng/sai
- Có âm thanh đúng/sai/hoàn thành nếu có file audio
- Không dùng giao diện quá nghiêm túc như dashboard người lớn

Cấu trúc trang cần có:

1. Trang chủ `/`
- Hiển thị tên game: “Bé an toàn số”
- Mô tả ngắn:
  “Cùng Bé Kiên và Robot An Toàn học cách sử dụng Internet an toàn nhé!”
- Ô nhập tên học sinh
- Nút “Bắt đầu hành trình”
- Khi bấm bắt đầu, tạo player trong Supabase hoặc lưu nickname vào localStorage rồi chuyển sang `/map`

2. Trang bản đồ hành trình `/map`
Hiển thị 5 chặng:
- Chặng 1: Người lạ nhắn tin
- Chặng 2: Link lạ và quà tặng giả
- Chặng 3: Mật khẩu mạnh hay yếu
- Chặng 4: Thời gian dùng màn hình
- Chặng 5: Ứng xử văn minh trên mạng

Mỗi chặng hiển thị:
- Icon
- Tên chặng
- Trạng thái: chưa chơi, đã hoàn thành
- Điểm đạt được
- Nút “Vào thử thách”

3. Trang màn chơi `/missions/[id]`
Mỗi màn chơi gồm:
- Tiêu đề thử thách
- Câu chuyện tình huống
- Hình minh họa hoặc icon
- 3 lựa chọn
- Khi học sinh chọn:
  - Nếu đúng: cộng điểm, hiện thông báo tích cực
  - Nếu sai: hiện giải thích vì sao sai
- Sau khi trả lời, có nút “Tiếp tục”
- Lưu kết quả màn chơi vào Supabase
- Cập nhật tiến độ vào localStorage

Nội dung 5 màn chơi:

Màn 1: Người lạ nhắn tin
Tình huống:
“Một người lạ nhắn: Chào em, cho anh xin số điện thoại và địa chỉ nhà nhé. Anh gửi quà cho em.”
Lựa chọn:
A. Gửi số điện thoại và địa chỉ nhà
B. Không trả lời và báo với bố mẹ
C. Hỏi lại người đó là ai
Đáp án đúng: B
Giải thích đúng:
“Giỏi lắm! Em không nên chia sẻ địa chỉ, số điện thoại, trường học cho người lạ.”

Màn 2: Link lạ và quà tặng giả
Tình huống:
“Một quảng cáo hiện lên: Chúc mừng! Bạn đã trúng iPhone. Bấm vào đây để nhận quà.”
Lựa chọn:
A. Bấm vào link để nhận quà
B. Chia sẻ cho bạn bè cùng nhận
C. Không bấm và hỏi người lớn
Đáp án đúng: C
Giải thích đúng:
“Tuyệt vời! Nhiều link trúng thưởng là giả. Em không nên bấm vào khi chưa hỏi người lớn.”

Màn 3: Mật khẩu mạnh hay yếu
Tình huống:
“Robot An Toàn nhờ em chọn mật khẩu an toàn cho tài khoản học tập.”
Lựa chọn:
A. 123456
B. bebi123
C. Bi@HocTot2026
Đáp án đúng: C
Giải thích đúng:
“Mật khẩu mạnh nên có chữ hoa, chữ thường, số và ký tự đặc biệt.”

Màn 4: Thời gian dùng màn hình
Tình huống:
“Hôm nay là ngày nghỉ. Em hãy giúp Bé Kiên chọn thói quen sử dụng thiết bị hợp lý.”
Lựa chọn:
A. Xem YouTube 3 giờ liên tục
B. Chơi game cả tối và bỏ ngủ
C. Học bài, vận động, giải trí vừa phải
Đáp án đúng: C
Giải thích đúng:
“Em có thể giải trí bằng Internet, nhưng cần cân bằng học tập, vận động và nghỉ ngơi.”

Màn 5: Ứng xử văn minh trên mạng
Tình huống:
“Một bạn đăng hình bài vẽ lên lớp học online. Em sẽ bình luận thế nào?”
Lựa chọn:
A. Chê bạn vẽ xấu
B. Góp ý nhẹ nhàng và động viên bạn
C. Chia sẻ ảnh của bạn để trêu chọc
Đáp án đúng: B
Giải thích đúng:
“Rất tốt! Khi lên mạng, em cần lịch sự, tôn trọng và không làm tổn thương người khác.”

4. Trang quiz cuối bài `/quiz`
- Chỉ mở sau khi hoàn thành 5 màn
- Có 10 câu hỏi trắc nghiệm
- Mỗi câu có 3 đáp án
- Chọn xong hiện đúng/sai
- Cuối quiz tính điểm
- Lưu kết quả vào Supabase

Câu hỏi mẫu:
1. Người lạ hỏi địa chỉ nhà, em nên làm gì?
A. Gửi ngay
B. Không gửi và báo bố mẹ
C. Hỏi người đó muốn gì
Đáp án: B

2. Khi thấy link “trúng điện thoại miễn phí”, em nên làm gì?
A. Bấm vào ngay
B. Chia sẻ cho bạn
C. Không bấm và hỏi người lớn
Đáp án: C

3. Mật khẩu nào an toàn hơn?
A. 123456
B. an2000
C. An@HocTot2026
Đáp án: C

4. Em có nên chia sẻ ảnh cá nhân cho người lạ không?
A. Có
B. Không
C. Chỉ gửi nếu họ khen em
Đáp án: B

5. Khi chơi game online, có người xin tài khoản của em, em nên:
A. Cho mượn
B. Gửi mật khẩu
C. Từ chối và báo người lớn
Đáp án: C

6. Khi thấy bạn bị trêu chọc trên mạng, em nên:
A. Trêu thêm
B. Im lặng và cười
C. Không tham gia, báo người lớn hoặc thầy cô
Đáp án: C

7. Em nên dùng Internet như thế nào?
A. Dùng cả ngày
B. Dùng có thời gian hợp lý
C. Dùng khi nào thích
Đáp án: B

8. Thông tin nào không nên chia sẻ công khai?
A. Địa chỉ nhà
B. Màu yêu thích
C. Môn học yêu thích
Đáp án: A

9. Khi gặp nội dung đáng sợ trên mạng, em nên:
A. Xem tiếp
B. Chia sẻ cho bạn
C. Dừng lại và báo người lớn
Đáp án: C

10. Bình luận văn minh là:
A. Chê bai người khác
B. Tôn trọng, góp ý nhẹ nhàng
C. Dùng lời lẽ khó nghe
Đáp án: B

5. Trang kết quả `/result`
Hiển thị:
- Tên học sinh
- Tổng điểm
- Số màn đã hoàn thành
- Điểm quiz
- Danh hiệu đạt được
- Huy hiệu nhận được
- Nút “Nhận chứng nhận”
- Nút “Chơi lại”

Quy tắc danh hiệu:
- 90–100 điểm: “Chiến binh an toàn số”
- 70–89 điểm: “Bạn nhỏ thông minh”
- 50–69 điểm: “Em đã hiểu cơ bản”
- Dưới 50 điểm: “Hãy luyện tập thêm cùng Robot An Toàn”

6. Trang chứng nhận `/certificate`
Hiển thị chứng nhận đẹp:
“Chúc mừng [Tên học sinh] đã hoàn thành hành trình Bé an toàn số và trở thành [Danh hiệu].”
Có ngày hoàn thành.
Có nút “In chứng nhận” dùng window.print().

Database Supabase cần thiết kế:

Bảng `players`:
- id uuid primary key default gen_random_uuid()
- nickname text not null
- created_at timestamp default now()

Bảng `missions`:
- id bigint primary key
- title text not null
- description text not null
- scene text not null
- icon text nullable
- order_index int not null

Bảng `mission_options`:
- id uuid primary key default gen_random_uuid()
- mission_id bigint references missions(id) on delete cascade
- option_text text not null
- is_correct boolean default false
- feedback text not null

Bảng `mission_results`:
- id uuid primary key default gen_random_uuid()
- player_id uuid references players(id) on delete cascade
- mission_id bigint references missions(id) on delete cascade
- selected_option_id uuid references mission_options(id)
- is_correct boolean
- score int default 0
- created_at timestamp default now()

Bảng `quiz_questions`:
- id uuid primary key default gen_random_uuid()
- question text not null
- option_a text not null
- option_b text not null
- option_c text not null
- correct_option text not null
- explanation text nullable

Bảng `quiz_results`:
- id uuid primary key default gen_random_uuid()
- player_id uuid references players(id) on delete cascade
- total_questions int
- correct_answers int
- score int
- created_at timestamp default now()

Bảng `final_results`:
- id uuid primary key default gen_random_uuid()
- player_id uuid references players(id) on delete cascade
- mission_score int default 0
- quiz_score int default 0
- total_score int default 0
- title text
- badge text
- created_at timestamp default now()

Hãy tạo file SQL seed cho Supabase:
- Tạo bảng
- Insert sẵn 5 missions
- Insert sẵn mission_options
- Insert sẵn 10 quiz_questions
- Có thể bật RLS nhưng cần tạo policy cho anon insert/select cơ bản để demo hoạt động

Yêu cầu code:
- Code sạch, chia component rõ ràng
- Không hard-code quá nhiều trong UI nếu dữ liệu có thể lấy từ Supabase
- Tạo file `lib/supabaseClient.ts`
- Dùng `.env.local`:
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=

Các component nên có:
- `Header`
- `HeroSection`
- `PlayerNameForm`
- `JourneyMap`
- `MissionCard`
- `OptionButton`
- `FeedbackBox`
- `ScoreBadge`
- `RobotGuide`
- `QuizQuestion`
- `ResultSummary`
- `Certificate`

Luồng chơi:
1. Học sinh vào trang chủ
2. Nhập tên
3. Tạo player trong Supabase
4. Lưu `player_id` và `nickname` vào localStorage
5. Chuyển sang bản đồ hành trình
6. Học sinh chơi từng màn
7. Mỗi màn lưu kết quả vào Supabase
8. Hoàn thành 5 màn thì mở quiz
9. Làm quiz và lưu điểm
10. Hiển thị kết quả cuối
11. In chứng nhận

Yêu cầu UX:
- Khi chưa nhập tên mà vào `/map`, tự chuyển về trang chủ
- Khi trả lời đúng, nút/khung phản hồi màu xanh
- Khi trả lời sai, khung phản hồi màu đỏ nhẹ
- Có progress bar hiển thị đã hoàn thành bao nhiêu màn
- Có tổng điểm ở góc trên
- Mỗi câu chữ ngắn, dễ hiểu cho học sinh tiểu học
- Không dùng đoạn văn quá dài

Yêu cầu responsive:
- Mobile: các lựa chọn xếp dọc, nút to
- Tablet/laptop: layout 2 cột, bên trái nhân vật và câu chuyện, bên phải lựa chọn
- Không bị tràn màn hình ở width 360px

Yêu cầu hoàn thiện:
- Tạo README hướng dẫn chạy dự án
- Hướng dẫn tạo Supabase project
- Hướng dẫn chạy SQL trong Supabase
- Hướng dẫn tạo `.env.local`
- Hướng dẫn chạy:
  npm install
  npm run dev
- Hướng dẫn build:
  npm run build

Hãy triển khai đầy đủ source code theo yêu cầu trên.
Ưu tiên làm MVP chạy ổn định trước, sau đó mới thêm animation/âm thanh.