export type QuizTopic =
  | "stranger"
  | "phishing"
  | "password"
  | "privacy"
  | "behavior"
  | "screentime"
  | "badcontent";

export const topicLabels: Record<QuizTopic, string> = {
  stranger: "Người lạ nhắn tin",
  phishing: "Link lạ và lừa đảo",
  password: "Mật khẩu và tài khoản",
  privacy: "Bảo vệ thông tin cá nhân",
  behavior: "Ứng xử văn minh trên mạng",
  screentime: "Thời gian dùng màn hình",
  badcontent: "Nội dung xấu và tin giả",
};

export type QuizQuestion = {
  id: number;
  topic: QuizTopic;
  question: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
};

export const quizBank: QuizQuestion[] = [
  // 1. Người lạ nhắn tin (8)
  {
    id: 1,
    topic: "stranger",
    question: "Người lạ hỏi địa chỉ nhà em, em nên làm gì?",
    options: ["Gửi ngay", "Không gửi và báo bố mẹ", "Hỏi người đó muốn gì"],
    correctIndex: 1,
    explanation: "Không bao giờ chia sẻ địa chỉ nhà cho người lạ. Hãy báo bố mẹ.",
  },
  {
    id: 2,
    topic: "stranger",
    question: "Người lạ rủ em đi gặp ngoài đời, em sẽ:",
    options: [
      "Đi ngay vì tò mò",
      "Nhờ bạn đi cùng",
      "Từ chối và báo người lớn",
    ],
    correctIndex: 2,
    explanation: "Gặp người lạ ngoài đời rất nguy hiểm. Hãy luôn từ chối.",
  },
  {
    id: 3,
    topic: "stranger",
    question: "Một người lạ xin số điện thoại bố mẹ em, em nên:",
    options: ["Gửi nhanh", "Không gửi", "Gửi nếu họ là cô giáo"],
    correctIndex: 1,
    explanation: "Số điện thoại bố mẹ là thông tin riêng tư.",
  },
  {
    id: 4,
    topic: "stranger",
    question: "Người lạ tự xưng là bạn của bố em, em nên:",
    options: [
      "Tin ngay",
      "Hỏi bố mẹ trước",
      "Chia sẻ thông tin gia đình",
    ],
    correctIndex: 1,
    explanation: "Luôn xác nhận với bố mẹ trước khi tin người lạ.",
  },
  {
    id: 5,
    topic: "stranger",
    question: "Người lạ gửi tin nhắn khen em xinh và xin ảnh, em nên:",
    options: [
      "Gửi 1 ảnh thôi",
      "Cảm ơn rồi gửi ảnh",
      "Không trả lời và báo bố mẹ",
    ],
    correctIndex: 2,
    explanation: "Không gửi ảnh cá nhân cho người lạ dù được khen.",
  },
  {
    id: 6,
    topic: "stranger",
    question: "Em nhận lời mời kết bạn từ người không quen, em sẽ:",
    options: ["Đồng ý ngay", "Bỏ qua/từ chối", "Chấp nhận để có thêm bạn"],
    correctIndex: 1,
    explanation: "Chỉ kết bạn với người em thực sự quen biết.",
  },
  {
    id: 7,
    topic: "stranger",
    question: "Người lạ video call em khi không có bố mẹ, em nên:",
    options: ["Bắt máy", "Tắt máy và báo bố mẹ", "Giả vờ ngủ"],
    correctIndex: 1,
    explanation: "Tắt máy ngay và báo bố mẹ là an toàn nhất.",
  },
  {
    id: 8,
    topic: "stranger",
    question: "Người lạ hứa cho quà nếu em giữ bí mật với bố mẹ, em sẽ:",
    options: [
      "Giữ bí mật để có quà",
      "Nói ngay với bố mẹ",
      "Đợi xem quà gì",
    ],
    correctIndex: 1,
    explanation: "Giữ bí mật với bố mẹ là dấu hiệu nguy hiểm. Báo ngay nhé!",
  },

  // 2. Link lạ và lừa đảo (8)
  {
    id: 9,
    topic: "phishing",
    question: "Em thấy link \"trúng iPhone miễn phí\", em nên:",
    options: ["Bấm vào ngay", "Chia sẻ cho bạn", "Không bấm, hỏi người lớn"],
    correctIndex: 2,
    explanation: "Hầu hết link trúng thưởng là lừa đảo.",
  },
  {
    id: 10,
    topic: "phishing",
    question: "Email yêu cầu nhập mật khẩu để \"xác minh tài khoản\", em sẽ:",
    options: ["Nhập mật khẩu", "Bỏ qua và báo người lớn", "Chia sẻ cho bạn"],
    correctIndex: 1,
    explanation: "Đây là kiểu lừa đảo lấy mật khẩu (phishing).",
  },
  {
    id: 11,
    topic: "phishing",
    question: "Một quảng cáo nói: \"Tải app này để chơi game miễn phí\", em nên:",
    options: ["Tải ngay", "Hỏi bố mẹ trước", "Tải và đăng nhập Facebook"],
    correctIndex: 1,
    explanation: "Có thể là app độc hại. Luôn hỏi người lớn trước.",
  },
  {
    id: 12,
    topic: "phishing",
    question: "Tin nhắn từ ngân hàng yêu cầu bấm link xác thực, em sẽ:",
    options: [
      "Bấm vào ngay",
      "Đưa cho bố mẹ kiểm tra",
      "Nhập số tài khoản",
    ],
    correctIndex: 1,
    explanation: "Tin nhắn lừa đảo thường giả danh ngân hàng. Đưa người lớn xem.",
  },
  {
    id: 13,
    topic: "phishing",
    question: "Em được tặng \"thẻ game miễn phí\" nếu mời bạn nhập tài khoản, em sẽ:",
    options: ["Mời bạn", "Từ chối", "Nhập tài khoản của mình"],
    correctIndex: 1,
    explanation: "Đây là lừa đảo nhằm chiếm tài khoản của em và bạn.",
  },
  {
    id: 14,
    topic: "phishing",
    question: "Trang web hiện thông báo \"Máy của bạn bị virus, tải ngay\", em sẽ:",
    options: ["Tải ngay", "Đóng trang và báo người lớn", "Bấm OK"],
    correctIndex: 1,
    explanation: "Đây là cảnh báo giả để dụ em tải virus thật.",
  },
  {
    id: 15,
    topic: "phishing",
    question: "Link bạn gửi có nội dung \"Xem ảnh hot tại đây\", em nên:",
    options: ["Bấm vào", "Không bấm", "Chia sẻ tiếp"],
    correctIndex: 1,
    explanation: "Có thể là link độc hại, đừng bấm vào.",
  },
  {
    id: 16,
    topic: "phishing",
    question: "Cách nhận biết link an toàn?",
    options: [
      "Có chữ \"miễn phí\"",
      "Bắt đầu bằng https và là trang chính thức",
      "Có nhiều màu sắc",
    ],
    correctIndex: 1,
    explanation: "https và tên miền chính thức an toàn hơn.",
  },

  // 3. Mật khẩu và tài khoản (8)
  {
    id: 17,
    topic: "password",
    question: "Mật khẩu nào an toàn nhất?",
    options: ["123456", "an2000", "An@HocTot2026"],
    correctIndex: 2,
    explanation: "Mật khẩu mạnh có chữ hoa, thường, số, ký tự đặc biệt.",
  },
  {
    id: 18,
    topic: "password",
    question: "Em có nên dùng cùng mật khẩu cho nhiều tài khoản không?",
    options: ["Có, để dễ nhớ", "Không, mỗi nơi một mật khẩu", "Tùy"],
    correctIndex: 1,
    explanation: "Mỗi tài khoản nên có mật khẩu khác nhau để an toàn.",
  },
  {
    id: 19,
    topic: "password",
    question: "Bạn thân hỏi mật khẩu game của em, em nên:",
    options: ["Cho bạn biết", "Không chia sẻ", "Đổi mật khẩu thành tên bạn"],
    correctIndex: 1,
    explanation: "Mật khẩu là bí mật riêng của em.",
  },
  {
    id: 20,
    topic: "password",
    question: "Em quên mật khẩu, em sẽ:",
    options: [
      "Hỏi người lạ",
      "Bấm \"Quên mật khẩu\" và nhờ bố mẹ giúp",
      "Tạo nick mới",
    ],
    correctIndex: 1,
    explanation: "Dùng tính năng khôi phục chính thức và nhờ người lớn.",
  },
  {
    id: 21,
    topic: "password",
    question: "Mật khẩu nên dài bao nhiêu?",
    options: ["3 ký tự", "8 ký tự trở lên", "1 ký tự"],
    correctIndex: 1,
    explanation: "Mật khẩu càng dài càng khó đoán.",
  },
  {
    id: 22,
    topic: "password",
    question: "Em nên ghi mật khẩu ở đâu?",
    options: [
      "Dán lên màn hình máy tính",
      "Cho bạn cùng lớp giữ",
      "Để bố mẹ giữ giúp",
    ],
    correctIndex: 2,
    explanation: "Bố mẹ là người tin cậy nhất để giữ giúp.",
  },
  {
    id: 23,
    topic: "password",
    question: "Tài khoản em bị đăng nhập lạ, em nên:",
    options: ["Kệ", "Đổi mật khẩu ngay và báo bố mẹ", "Khoe bạn bè"],
    correctIndex: 1,
    explanation: "Đổi mật khẩu ngay để bảo vệ tài khoản.",
  },
  {
    id: 24,
    topic: "password",
    question: "Xác thực 2 bước (2FA) giúp gì?",
    options: ["Chậm hơn", "Tài khoản an toàn hơn", "Tốn pin"],
    correctIndex: 1,
    explanation: "2FA thêm một lớp bảo vệ ngoài mật khẩu.",
  },

  // 4. Bảo vệ thông tin cá nhân (8)
  {
    id: 25,
    topic: "privacy",
    question: "Thông tin nào KHÔNG nên đăng công khai?",
    options: ["Địa chỉ nhà", "Màu yêu thích", "Môn học yêu thích"],
    correctIndex: 0,
    explanation: "Địa chỉ nhà là thông tin riêng tư cần bảo vệ.",
  },
  {
    id: 26,
    topic: "privacy",
    question: "Em có nên đăng ảnh thẻ học sinh lên mạng không?",
    options: ["Có, khoe bạn", "Không", "Có nhưng che mặt"],
    correctIndex: 1,
    explanation: "Thẻ học sinh có nhiều thông tin riêng tư.",
  },
  {
    id: 27,
    topic: "privacy",
    question: "Em chia sẻ ảnh cá nhân cho người lạ:",
    options: ["Có", "Không", "Chỉ khi họ khen em"],
    correctIndex: 1,
    explanation: "Ảnh cá nhân không nên gửi cho người lạ.",
  },
  {
    id: 28,
    topic: "privacy",
    question: "Định vị (location) trên mạng xã hội nên:",
    options: ["Bật luôn", "Tắt khi không cần", "Bật để khoe"],
    correctIndex: 1,
    explanation: "Tắt định vị giúp bảo vệ vị trí của em.",
  },
  {
    id: 29,
    topic: "privacy",
    question: "Em nên đặt tài khoản mạng xã hội ở chế độ:",
    options: ["Công khai", "Riêng tư/bạn bè", "Mọi người đều xem"],
    correctIndex: 1,
    explanation: "Chế độ riêng tư giúp kiểm soát ai xem được.",
  },
  {
    id: 30,
    topic: "privacy",
    question: "Em đăng ảnh đồng phục có tên trường, điều này:",
    options: [
      "An toàn",
      "Có thể giúp người lạ tìm ra em",
      "Không sao cả",
    ],
    correctIndex: 1,
    explanation: "Tên trường lộ ra có thể giúp kẻ xấu tìm em.",
  },
  {
    id: 31,
    topic: "privacy",
    question: "App game xin nhiều quyền như danh bạ, ảnh, em nên:",
    options: [
      "Cho hết",
      "Hỏi bố mẹ và chỉ cho quyền cần thiết",
      "Đăng nhập Facebook",
    ],
    correctIndex: 1,
    explanation: "Chỉ cấp quyền thật sự cần thiết và hỏi người lớn.",
  },
  {
    id: 32,
    topic: "privacy",
    question: "Em chụp ảnh bài tập có ghi tên đầy đủ và lớp, đăng lên mạng:",
    options: ["Tốt", "Nên che thông tin riêng", "Không sao"],
    correctIndex: 1,
    explanation: "Hãy che các thông tin nhận dạng trước khi đăng.",
  },

  // 5. Ứng xử văn minh trên mạng (8)
  {
    id: 33,
    topic: "behavior",
    question: "Bình luận văn minh là:",
    options: [
      "Chê bai người khác",
      "Tôn trọng, góp ý nhẹ nhàng",
      "Dùng lời lẽ khó nghe",
    ],
    correctIndex: 1,
    explanation: "Bình luận tử tế làm mạng xã hội đẹp hơn.",
  },
  {
    id: 34,
    topic: "behavior",
    question: "Em thấy bạn bị trêu chọc trên mạng, em nên:",
    options: [
      "Trêu thêm",
      "Im lặng cười",
      "Báo người lớn hoặc thầy cô",
    ],
    correctIndex: 2,
    explanation: "Đừng im lặng. Hãy giúp bạn bằng cách báo người lớn.",
  },
  {
    id: 35,
    topic: "behavior",
    question: "Bạn đăng bài vẽ chưa đẹp, em sẽ bình luận:",
    options: [
      "\"Xấu quá!\"",
      "\"Bạn vẽ dễ thương, cố lên nhé!\"",
      "\"Sao vẽ kỳ vậy?\"",
    ],
    correctIndex: 1,
    explanation: "Lời động viên giúp bạn tự tin hơn.",
  },
  {
    id: 36,
    topic: "behavior",
    question: "Em không thích một bài đăng, em nên:",
    options: [
      "Bình luận xấu",
      "Lướt qua hoặc không thích",
      "Báo cáo bừa",
    ],
    correctIndex: 1,
    explanation: "Không thích thì lướt qua, không cần để lại bình luận xấu.",
  },
  {
    id: 37,
    topic: "behavior",
    question: "Em bị bạn nói xấu trên mạng, em nên:",
    options: [
      "Nói xấu lại",
      "Lưu bằng chứng và báo bố mẹ",
      "Đe dọa bạn",
    ],
    correctIndex: 1,
    explanation: "Giữ bằng chứng và nhờ người lớn xử lý.",
  },
  {
    id: 38,
    topic: "behavior",
    question: "Em thấy ảnh xấu hổ của bạn được chia sẻ, em nên:",
    options: [
      "Chia sẻ tiếp",
      "Cười",
      "Không chia sẻ và báo người lớn",
    ],
    correctIndex: 2,
    explanation: "Lan truyền ảnh xấu hổ là gây tổn thương cho bạn.",
  },
  {
    id: 39,
    topic: "behavior",
    question: "Trong nhóm chat, có người nói tục, em sẽ:",
    options: [
      "Học theo",
      "Nhắc nhở lịch sự hoặc rời nhóm",
      "Chửi lại",
    ],
    correctIndex: 1,
    explanation: "Giữ bản thân lịch sự, có thể nhắc bạn hoặc rời nhóm.",
  },
  {
    id: 40,
    topic: "behavior",
    question: "Em đăng bài viết, có người không thích bình luận xấu, em:",
    options: [
      "Cãi nhau",
      "Bình tĩnh, có thể ẩn bình luận",
      "Khóa tài khoản người ta",
    ],
    correctIndex: 1,
    explanation: "Giữ bình tĩnh và dùng công cụ ẩn/báo cáo.",
  },

  // 6. Thời gian dùng màn hình (8)
  {
    id: 41,
    topic: "screentime",
    question: "Em nên dùng Internet như thế nào?",
    options: ["Cả ngày", "Có thời gian hợp lý", "Khi nào thích"],
    correctIndex: 1,
    explanation: "Dùng có giờ giấc giúp em khỏe mạnh.",
  },
  {
    id: 42,
    topic: "screentime",
    question: "Sau bao lâu nhìn màn hình em nên nghỉ?",
    options: ["3 giờ", "Khoảng 20-30 phút", "Cả buổi"],
    correctIndex: 1,
    explanation: "Cứ 20-30 phút nên nghỉ để bảo vệ mắt.",
  },
  {
    id: 43,
    topic: "screentime",
    question: "Trước khi đi ngủ 1 tiếng, em nên:",
    options: [
      "Chơi game",
      "Tắt thiết bị, chuẩn bị ngủ",
      "Xem YouTube",
    ],
    correctIndex: 1,
    explanation: "Ánh sáng xanh ảnh hưởng giấc ngủ. Hãy tắt thiết bị sớm.",
  },
  {
    id: 44,
    topic: "screentime",
    question: "Cuối tuần em nên:",
    options: [
      "Chơi game cả ngày",
      "Cân bằng học, vận động, giải trí",
      "Xem YouTube đến tối",
    ],
    correctIndex: 1,
    explanation: "Cân bằng nhiều hoạt động tốt cho sức khỏe.",
  },
  {
    id: 45,
    topic: "screentime",
    question: "Mắt em mỏi vì xem màn hình lâu, em nên:",
    options: [
      "Cố xem tiếp",
      "Nghỉ và nhìn xa, chớp mắt",
      "Xem trong tối",
    ],
    correctIndex: 1,
    explanation: "Nghỉ ngơi và nhìn xa giúp mắt khỏe lại.",
  },
  {
    id: 46,
    topic: "screentime",
    question: "Khi đang ăn cơm, em có nên xem điện thoại?",
    options: ["Có", "Không, tập trung ăn", "Vừa ăn vừa xem"],
    correctIndex: 1,
    explanation: "Tập trung ăn để tiêu hóa tốt và trò chuyện cùng gia đình.",
  },
  {
    id: 47,
    topic: "screentime",
    question: "Trong giờ học, em có nên dùng điện thoại riêng?",
    options: ["Có", "Không, tập trung học", "Tùy"],
    correctIndex: 1,
    explanation: "Giờ học cần tập trung, để điện thoại sau giờ.",
  },
  {
    id: 48,
    topic: "screentime",
    question: "Bố mẹ giới hạn giờ chơi game của em, em nên:",
    options: [
      "Lén chơi thêm",
      "Tôn trọng quy định",
      "Cãi lại",
    ],
    correctIndex: 1,
    explanation: "Bố mẹ đặt quy định để em khỏe mạnh hơn.",
  },

  // 7. Nội dung xấu và tin giả (8)
  {
    id: 49,
    topic: "badcontent",
    question: "Khi gặp nội dung đáng sợ, em nên:",
    options: ["Xem tiếp", "Chia sẻ cho bạn", "Dừng lại và báo người lớn"],
    correctIndex: 2,
    explanation: "Tránh xa nội dung không phù hợp và báo người lớn.",
  },
  {
    id: 50,
    topic: "badcontent",
    question: "Em đọc tin: \"Uống nước đá chữa được mọi bệnh\", em nghĩ:",
    options: [
      "Tin ngay",
      "Có thể là tin giả, kiểm tra lại",
      "Chia sẻ cho mọi người",
    ],
    correctIndex: 1,
    explanation: "Tin sức khỏe cần kiểm tra từ nguồn uy tín.",
  },
  {
    id: 51,
    topic: "badcontent",
    question: "Cách kiểm tra một tin có thật không?",
    options: [
      "Hỏi bạn cùng lớp",
      "Tìm trên báo chính thống",
      "Xem nó có nhiều like không",
    ],
    correctIndex: 1,
    explanation: "Báo chính thống đáng tin hơn tin trên mạng xã hội.",
  },
  {
    id: 52,
    topic: "badcontent",
    question: "Em vô tình thấy video bạo lực, em nên:",
    options: [
      "Xem cho biết",
      "Tắt và báo bố mẹ",
      "Gửi cho bạn",
    ],
    correctIndex: 1,
    explanation: "Tắt ngay và báo người lớn để được hướng dẫn.",
  },
  {
    id: 53,
    topic: "badcontent",
    question: "Tin có tiêu đề giật gân \"SỐC! BẠN SẼ KHÔNG TIN!\", em nên:",
    options: [
      "Tin và chia sẻ",
      "Cẩn thận, có thể là câu view",
      "Đọc và làm theo",
    ],
    correctIndex: 1,
    explanation: "Tiêu đề giật gân thường là câu view hoặc tin giả.",
  },
  {
    id: 54,
    topic: "badcontent",
    question: "Em thấy thử thách nguy hiểm trên TikTok, em sẽ:",
    options: [
      "Thử ngay",
      "Không làm theo, báo người lớn",
      "Quay video làm thử",
    ],
    correctIndex: 1,
    explanation: "Nhiều thử thách nguy hiểm đến tính mạng. Đừng làm theo.",
  },
  {
    id: 55,
    topic: "badcontent",
    question: "Em vô tình bấm vào video không phù hợp, em nên:",
    options: [
      "Tiếp tục xem",
      "Tắt ngay và báo bố mẹ",
      "Lưu lại",
    ],
    correctIndex: 1,
    explanation: "Tắt ngay và chia sẻ với bố mẹ để được hỗ trợ.",
  },
  {
    id: 56,
    topic: "badcontent",
    question: "Em thấy bài đăng kêu gọi quyên tiền lạ, em nên:",
    options: [
      "Chuyển khoản ngay",
      "Báo bố mẹ kiểm tra",
      "Chia sẻ kêu gọi tiếp",
    ],
    correctIndex: 1,
    explanation: "Nhiều bài kêu gọi là lừa đảo. Hỏi người lớn trước.",
  },
];

export function pickRandomQuestions(n: number): QuizQuestion[] {
  const pool = [...quizBank];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}
