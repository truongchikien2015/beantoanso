import { QuizTopic } from "./quizQuestions";

export type Lesson = {
  topic: QuizTopic;
  emoji: string;
  title: string;
  intro: string;
  tips: string[];
  rule: string;
};

export const lessons: Lesson[] = [
  {
    topic: "stranger",
    emoji: "💬",
    title: "Người lạ nhắn tin",
    intro:
      "Trên Internet, em có thể được nhắn tin bởi những người em không quen biết. Hãy luôn cẩn thận!",
    tips: [
      "Không chia sẻ địa chỉ, số điện thoại, trường học cho người lạ.",
      "Không nhận lời hẹn gặp người lạ ngoài đời.",
      "Báo bố mẹ hoặc thầy cô khi có người lạ làm em khó chịu.",
    ],
    rule: "Người lạ trên mạng = người lạ ngoài đời. Luôn báo người lớn!",
  },
  {
    topic: "phishing",
    emoji: "🎁",
    title: "Link lạ và lừa đảo",
    intro:
      "Nhiều quảng cáo, link \"trúng thưởng\" trên mạng là giả nhằm lừa em bấm vào.",
    tips: [
      "Không bấm link \"trúng iPhone\", \"miễn phí 100%\".",
      "Không tải app, file lạ khi chưa hỏi người lớn.",
      "Trang web an toàn thường bắt đầu bằng https://",
    ],
    rule: "Khi không chắc chắn — đừng bấm. Hỏi người lớn trước!",
  },
  {
    topic: "password",
    emoji: "🔐",
    title: "Mật khẩu và tài khoản",
    intro:
      "Mật khẩu là chìa khóa bảo vệ tài khoản của em. Hãy giữ thật cẩn thận!",
    tips: [
      "Mật khẩu mạnh có chữ HOA, chữ thường, số và ký tự đặc biệt.",
      "Không dùng cùng một mật khẩu cho mọi tài khoản.",
      "Không bao giờ chia sẻ mật khẩu, kể cả với bạn thân.",
    ],
    rule: "Mật khẩu là bí mật. Bí mật chỉ chia sẻ với bố mẹ!",
  },
  {
    topic: "privacy",
    emoji: "🛡️",
    title: "Bảo vệ thông tin cá nhân",
    intro:
      "Một số thông tin của em rất quan trọng và cần được bảo vệ trên mạng.",
    tips: [
      "Không đăng địa chỉ nhà, số CCCD, ảnh thẻ học sinh.",
      "Tắt định vị khi không cần thiết.",
      "Đặt tài khoản ở chế độ riêng tư/bạn bè.",
    ],
    rule: "Trước khi đăng — hỏi mình: \"Người lạ có nên biết điều này không?\"",
  },
  {
    topic: "behavior",
    emoji: "💖",
    title: "Ứng xử văn minh trên mạng",
    intro: "Trên mạng, em vẫn là một con người tử tế và lịch sự.",
    tips: [
      "Bình luận nhẹ nhàng, tôn trọng cảm xúc người khác.",
      "Không trêu chọc, không lan truyền ảnh xấu hổ của bạn.",
      "Khi thấy bạn bị bắt nạt — báo người lớn ngay.",
    ],
    rule: "Lời nói trên mạng cũng có sức nặng như ngoài đời!",
  },
  {
    topic: "screentime",
    emoji: "⏰",
    title: "Thời gian dùng màn hình",
    intro:
      "Internet vui nhưng dùng quá nhiều sẽ hại sức khỏe và việc học của em.",
    tips: [
      "Cứ 20–30 phút nên nghỉ mắt 1 lần.",
      "Không dùng thiết bị 1 tiếng trước khi đi ngủ.",
      "Cân bằng học, vận động, vui chơi và nghỉ ngơi.",
    ],
    rule: "Quy tắc 20-20-20: nhìn xa 20 feet trong 20 giây sau mỗi 20 phút.",
  },
  {
    topic: "badcontent",
    emoji: "⚠️",
    title: "Nội dung xấu và tin giả",
    intro:
      "Không phải mọi thứ em thấy trên mạng đều thật và phù hợp với em.",
    tips: [
      "Tránh xa nội dung bạo lực, đáng sợ. Tắt và báo người lớn.",
      "Không tin tiêu đề giật gân: \"SỐC!\", \"BẠN SẼ KHÔNG TIN!\".",
      "Kiểm tra tin trên báo chính thống trước khi tin và chia sẻ.",
    ],
    rule: "Đọc → Suy nghĩ → Kiểm tra → Mới tin và chia sẻ.",
  },
];
