"use client";

import React, { useState } from "react";
import { sfx } from "../lib/sound";
import { SpeakButton } from "./SpeakButton";

type Question = {
  id: number;
  category: "password" | "phishing" | "behavior" | "privacy";
  text: string;
  options: string[];
  correct: number; // index of correct option
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "password",
    text: "Mật khẩu nào sau đây là mạnh nhất để bảo vệ tài khoản của con?",
    options: [
      "12345678 (Quá dễ đoán)",
      "minh2014 (Chứa tên và năm sinh dễ tìm)",
      "AnToan@2026# (Chứa chữ hoa, chữ thường, số và ký tự đặc biệt)"
    ],
    correct: 2
  },
  {
    id: 2,
    category: "phishing",
    text: "Khi có người lạ nhắn tin hứa tặng quà hoặc kim cương game miễn phí và gửi link lạ, con làm gì?",
    options: [
      "Bấm vào link ngay để xem quà thế nào",
      "Không bấm vào link, chặn người lạ và báo ngay cho bố mẹ hoặc thầy cô",
      "Gửi thông tin tài khoản cho họ nhờ nạp quà hộ"
    ],
    correct: 1
  },
  {
    id: 3,
    category: "behavior",
    text: "Nếu con thấy bạn bè trong lớp đăng bài viết hoặc nhắn tin nói xấu một bạn khác trên mạng, con sẽ làm gì?",
    options: [
      "Tham gia bình luận nói xấu cùng cho vui",
      "Khuyên bạn dừng lại, không chia sẻ bài viết đó và báo giáo viên nếu cần",
      "Đăng bài nói xấu lại bạn kia để trả thù"
    ],
    correct: 1
  },
  {
    id: 4,
    category: "privacy",
    text: "Thông tin nào dưới đây con tuyệt đối KHÔNG ĐƯỢC chia sẻ cho người lạ trên mạng?",
    options: [
      "Địa chỉ nhà, số điện thoại của con/bố mẹ và mật khẩu của con",
      "Màu sắc con yêu thích và bài hát con hay nghe",
      "Các món đồ chơi con thích chơi ở nhà"
    ],
    correct: 0
  },
  {
    id: 5,
    category: "phishing",
    text: "Khi nhận được thư lạ thông báo trúng giải thưởng lớn (như điện thoại iPhone) từ sự kiện con không tham gia, con nên làm gì?",
    options: [
      "Cung cấp thông tin tài khoản ngân hàng của bố mẹ để nhận giải",
      "Không tin tưởng, xóa email hoặc nhờ người lớn kiểm tra hộ",
      "Gửi link trúng thưởng cho tất cả bạn bè cùng nhận giải"
    ],
    correct: 1
  }
];

type Props = {
  onComplete: (weakCategories: string[]) => void;
  onClose: () => void;
};

export function EntryQuiz({ onComplete, onClose }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const activeQuestion = QUESTIONS[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    sfx.click();
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: optIdx }));
  };

  const handleNext = () => {
    sfx.click();
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx((idx) => idx + 1);
    } else {
      evaluateResults();
    }
  };

  const evaluateResults = () => {
    const weakCategories: string[] = [];
    const scores: Record<string, { correct: number; total: number }> = {
      password: { correct: 0, total: 0 },
      phishing: { correct: 0, total: 0 },
      behavior: { correct: 0, total: 0 },
      privacy: { correct: 0, total: 0 }
    };

    QUESTIONS.forEach((q) => {
      scores[q.category].total += 1;
      if (answers[q.id] === q.correct) {
        scores[q.category].correct += 1;
      }
    });

    // If correct count is less than total, it's a weak category
    Object.keys(scores).forEach((cat) => {
      if (scores[cat].correct < scores[cat].total) {
        weakCategories.push(cat);
      }
    });

    // Save weak categories in localStorage
    localStorage.setItem("bats:entry_weaknesses", JSON.stringify(weakCategories));
    setShowResult(true);
  };

  const handleFinish = () => {
    sfx.click();
    const saved = localStorage.getItem("bats:entry_weaknesses");
    const weaknesses = saved ? JSON.parse(saved) : [];
    onComplete(weaknesses);
  };

  if (showResult) {
    return (
      <div className="card-kid p-6 bg-white max-w-md mx-auto my-8 text-center animate-bounce-in">
        <div className="text-6xl mb-4 animate-wiggle inline-block">🎓</div>
        <h2 className="text-3xl font-black text-[var(--kid-ink)] mb-2 font-nunito">Khảo sát hoàn tất!</h2>
        <p className="text-[var(--kid-muted)] text-sm font-bold mb-6">
          Hệ thống đã phân tích kỹ năng của con để chuẩn bị lộ trình học phù hợp nhất.
        </p>

        <div className="card-kid p-4 bg-amber-50 border-amber-200 text-amber-800 text-xs font-semibold mb-6 leading-relaxed text-left">
          💡 **Gợi ý của Cú Cú:** Cú phát hiện con nên học kỹ hơn về chủ đề này để tự bảo vệ tốt nhất:
          <ul className="list-disc list-inside mt-2 font-black">
            {QUESTIONS.map((q) => {
              const isCorrect = answers[q.id] === q.correct;
              if (!isCorrect) {
                return (
                  <li key={q.id} className="text-[var(--kid-coral-new)]">
                    {q.category === "password" && "Tạo mật khẩu mạnh bảo vệ tài khoản"}
                    {q.category === "phishing" && "Nhận biết các trò lừa đảo trúng thưởng, link độc"}
                    {q.category === "behavior" && "Ứng xử lịch sự, văn minh trực tuyến"}
                    {q.category === "privacy" && "Bảo vệ thông tin bí mật cá nhân"}
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>

        <button onClick={handleFinish} className="btn-kid btn-kid-teal w-full justify-center">
          Khám phá Lộ trình của con! 🚀
        </button>
      </div>
    );
  }

  const selectedOpt = answers[activeQuestion.id];

  return (
    <div className="card-kid p-6 bg-white max-w-md mx-auto my-8 text-left animate-bounce-in relative">
      <div className="absolute top-4 right-4">
        <SpeakButton text={activeQuestion.text} />
      </div>

      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <span className="text-xs font-black text-[var(--kid-coral-new)] uppercase tracking-wider">
          Khảo sát kỹ năng ({currentIdx + 1}/{QUESTIONS.length})
        </span>
        <button
          onClick={onClose}
          className="text-xs font-black text-slate-400 hover:text-red-500 transition"
        >
          Bỏ qua ✕
        </button>
      </div>

      <h3 className="font-black text-lg text-[var(--kid-ink)] mb-4 leading-normal pr-8 font-nunito">
        {activeQuestion.text}
      </h3>

      <div className="space-y-3 mb-6">
        {activeQuestion.options.map((opt, idx) => {
          const isSelected = selectedOpt === idx;
          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              className={`w-full text-left p-3 border-2 rounded-xl text-xs font-semibold leading-relaxed transition cursor-pointer ${
                isSelected
                  ? "bg-sky-50 border-[var(--kid-sky)] text-sky-900 font-extrabold"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        disabled={selectedOpt === undefined}
        className="btn-kid btn-kid-teal w-full justify-center"
      >
        {currentIdx < QUESTIONS.length - 1 ? "Câu tiếp theo ➔" : "Xem đánh giá 🏆"}
      </button>
    </div>
  );
}
