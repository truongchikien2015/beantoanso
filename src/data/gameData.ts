export type Mission = {
  id: number;
  title: string;
  icon: string;
  scene: string;
  options: { text: string; isCorrect: boolean; feedback: string }[];
};

export const missions: Mission[] = [
  {
    id: 1,
    title: "Người lạ nhắn tin",
    icon: "💬",
    scene:
      "Một người lạ nhắn: \"Chào em, cho anh xin số điện thoại và địa chỉ nhà nhé. Anh gửi quà cho em.\"",
    options: [
      {
        text: "Gửi số điện thoại và địa chỉ nhà",
        isCorrect: false,
        feedback:
          "Không nên nhé! Em không bao giờ gửi địa chỉ hay số điện thoại cho người lạ.",
      },
      {
        text: "Không trả lời và báo với bố mẹ",
        isCorrect: true,
        feedback:
          "Giỏi lắm! Em không nên chia sẻ địa chỉ, số điện thoại, trường học cho người lạ.",
      },
      {
        text: "Hỏi lại người đó là ai",
        isCorrect: false,
        feedback:
          "Vẫn nguy hiểm vì em đang trò chuyện với người lạ. Hãy báo bố mẹ trước.",
      },
    ],
  },
  {
    id: 2,
    title: "Link lạ và quà tặng giả",
    icon: "🎁",
    scene:
      "Một quảng cáo hiện lên: \"Chúc mừng! Bạn đã trúng iPhone. Bấm vào đây để nhận quà.\"",
    options: [
      {
        text: "Bấm vào link để nhận quà",
        isCorrect: false,
        feedback: "Không nên! Đó có thể là link lừa đảo.",
      },
      {
        text: "Chia sẻ cho bạn bè cùng nhận",
        isCorrect: false,
        feedback: "Như vậy có thể khiến bạn bè cũng gặp nguy hiểm.",
      },
      {
        text: "Không bấm và hỏi người lớn",
        isCorrect: true,
        feedback:
          "Tuyệt vời! Nhiều link trúng thưởng là giả. Em không nên bấm vào khi chưa hỏi người lớn.",
      },
    ],
  },
  {
    id: 3,
    title: "Mật khẩu mạnh hay yếu",
    icon: "🔐",
    scene: "Robot An Toàn nhờ em chọn mật khẩu an toàn cho tài khoản học tập.",
    options: [
      { text: "123456", isCorrect: false, feedback: "Quá dễ đoán! Mật khẩu này rất yếu." },
      {
        text: "bebi123",
        isCorrect: false,
        feedback: "Vẫn yếu vì chỉ có chữ thường và số đơn giản.",
      },
      {
        text: "Bi@HocTot2026",
        isCorrect: true,
        feedback:
          "Mật khẩu mạnh nên có chữ hoa, chữ thường, số và ký tự đặc biệt.",
      },
    ],
  },
  {
    id: 4,
    title: "Thời gian dùng màn hình",
    icon: "⏰",
    scene:
      "Hôm nay là ngày nghỉ. Em hãy giúp Bé Kiên chọn thói quen sử dụng thiết bị hợp lý.",
    options: [
      {
        text: "Xem YouTube 3 giờ liên tục",
        isCorrect: false,
        feedback: "Xem quá lâu sẽ hại mắt và sức khỏe.",
      },
      {
        text: "Chơi game cả tối và bỏ ngủ",
        isCorrect: false,
        feedback: "Bỏ ngủ rất hại sức khỏe đó!",
      },
      {
        text: "Học bài, vận động, giải trí vừa phải",
        isCorrect: true,
        feedback:
          "Em có thể giải trí bằng Internet, nhưng cần cân bằng học tập, vận động và nghỉ ngơi.",
      },
    ],
  },
  {
    id: 5,
    title: "Ứng xử văn minh trên mạng",
    icon: "💖",
    scene:
      "Một bạn đăng hình bài vẽ lên lớp học online. Em sẽ bình luận thế nào?",
    options: [
      { text: "Chê bạn vẽ xấu", isCorrect: false, feedback: "Lời chê có thể làm bạn buồn." },
      {
        text: "Góp ý nhẹ nhàng và động viên bạn",
        isCorrect: true,
        feedback:
          "Rất tốt! Khi lên mạng, em cần lịch sự, tôn trọng và không làm tổn thương người khác.",
      },
      {
        text: "Chia sẻ ảnh của bạn để trêu chọc",
        isCorrect: false,
        feedback: "Trêu chọc người khác là không tốt.",
      },
    ],
  },
];

export function getBadge(totalScore: number): { title: string; emoji: string } {
  if (totalScore >= 90) return { title: "Chiến binh an toàn số", emoji: "🏆" };
  if (totalScore >= 70) return { title: "Bạn nhỏ thông minh", emoji: "🌟" };
  if (totalScore >= 50) return { title: "Em đã hiểu cơ bản", emoji: "🎖️" };
  return { title: "Hãy luyện tập thêm cùng Robot An Toàn", emoji: "💪" };
}

export const QUIZ_QUESTIONS_PER_ROUND = 10;
