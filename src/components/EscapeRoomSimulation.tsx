"use client";

import React, { useState } from "react";
import { sfx } from "../lib/sound";
import { SpeakButton } from "./SpeakButton";

type Scenario = {
  id: number;
  category: "stranger" | "phishing" | "password";
  title: string;
  emoji: string;
  message: string;
  question: string;
  options: {
    text: string;
    score: number;
    explanation: string;
  }[];
};

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    category: "stranger",
    title: "Chặng 1: Mồi nhử Kim Cương Game 💎",
    emoji: "🎮",
    message: "Một người chơi lạ cùng phòng game gửi tin nhắn riêng cho con: 'Chào em, anh thấy em bắn game siêu quá! Anh đang có mã nạp tặng 9.999 Kim Cương Free Fire miễn phí nè. Em gửi tài khoản và mật khẩu đây anh đăng nhập nạp hộ cho nhé, nhanh lên không hết hạn mất!'",
    question: "Con sẽ trả lời người này thế nào?",
    options: [
      {
        text: "Gửi tài khoản và mật khẩu ngay lập tức để được nhận kim cương xịn.",
        score: 0,
        explanation: "❌ Nguy hiểm quá! Tuyệt đối không bao giờ chia sẻ tài khoản hoặc mật khẩu cho bất kỳ ai trên mạng. Họ sẽ đổi mật khẩu và cướp mất nick game của con đấy!"
      },
      {
        text: "Từ chối thẳng thừng, chặn tài khoản người này và báo cho bố mẹ biết.",
        score: 10,
        explanation: "✅ Xuất sắc! Đây chính là phản xạ tự bảo vệ hoàn hảo. Hãy luôn cảnh giác trước những phần quà miễn phí quá hấp dẫn trên mạng."
      },
      {
        text: "Mắng người đó lừa đảo rồi gửi tài khoản phụ (nick phụ) để thử xem sao.",
        score: 5,
        explanation: "⚠️ Cảnh báo! Gửi nick phụ vẫn có thể lộ thông tin cá nhân hoặc bị lừa đảo khác. Tốt nhất là từ chối, chặn họ và hỏi ý kiến người lớn."
      }
    ]
  },
  {
    id: 2,
    category: "phishing",
    title: "Chặng 2: Link lạ Nhận Học Bổng Giả 📜",
    emoji: "📩",
    message: "Hộp thư điện tử của con nhận được một email với tiêu đề: '📢 CHÚC MỪNG BẠN ĐẠT HỌC BỔNG TÀI NĂNG TRẺ EM 5.000.000Đ'. Nội dung thư yêu cầu con nhấp vào liên kết: http://hoc-bong-he-2026.com/dang-nhap để điền thông tin cá nhân và chụp ảnh học bạ để nhận tiền.",
    question: "Hành động an toàn nhất lúc này là gì?",
    options: [
      {
        text: "Nhấp chuột vào link ngay để điền thông tin và chụp ảnh học bạ gửi đi.",
        score: 0,
        explanation: "❌ Sai rồi! Đây là trang web lừa đảo (phishing) giả mạo. Link không bắt đầu bằng 'https://' bảo mật và tên miền rất lạ. Bấm vào có thể làm mất thông tin hoặc nhiễm virus!"
      },
      {
        text: "Không nhấp vào link, kiểm tra kỹ địa chỉ người gửi và nhờ bố mẹ xác thực.",
        score: 10,
        explanation: "✅ Hoàn hảo! Luôn hỏi ý kiến người lớn và kiểm tra kỹ nguồn gửi email lạ để phòng ngừa trang web lừa đảo."
      },
      {
        text: "Chia sẻ email này cho các bạn cùng lớp để xem có ai cùng nhận được không.",
        score: 3,
        explanation: "⚠️ Không nên làm vậy! Chia sẻ link độc hại vô tình sẽ làm hại thêm các bạn khác trong lớp. Hãy báo cho giáo viên hoặc cha mẹ trước."
      }
    ]
  },
  {
    id: 3,
    category: "password",
    title: "Chặng 3: Mã OTP Khẩn Cấp Của Mẹ 📱",
    emoji: "💬",
    message: "Tài khoản Zalo có ảnh đại diện và tên giống hệt mẹ con đột ngột nhắn tin: 'Con ơi, mẹ đang đi siêu thị mua đồ nhưng thẻ ngân hàng bị lỗi thanh toán. Mẹ vừa gửi mã số OTP về số điện thoại của bố, con đọc nhanh mã đó cho mẹ thanh toán hóa đơn gấp nhé!'",
    question: "Con sẽ xử lý tình huống khẩn cấp này thế nào?",
    options: [
      {
        text: "Lấy điện thoại của bố, xem mã OTP và nhắn tin đọc ngay cho mẹ.",
        score: 0,
        explanation: "❌ Rất nguy hiểm! Mã OTP là khóa bảo mật cuối cùng để chuyển tiền. Kẻ lừa đảo đã hack hoặc lập nick giả giống mẹ để lừa con. Nếu đưa OTP, gia đình con sẽ bị mất sạch tiền trong ngân hàng!"
      },
      {
        text: "Gọi điện thoại trực tiếp hoặc nói bố gọi cho mẹ để xác minh xem mẹ có nhắn thật không.",
        score: 10,
        explanation: "✅ Rất giỏi! Gặp các yêu cầu liên quan đến tiền bạc hoặc OTP khẩn cấp từ người thân, hãy luôn gọi điện trực tiếp hoặc gặp mặt để kiểm tra."
      },
      {
        text: "Không đọc mã OTP mà chỉ nhắn tin hỏi mẹ: 'Mẹ mua gì thế?' trên Zalo.",
        score: 5,
        explanation: "⚠️ Chưa đủ an toàn! Nếu nick Zalo đó đang bị kẻ xấu kiểm soát, họ sẽ tiếp tục nói dối con để xin OTP. Hãy gọi điện trực tiếp bằng số điện thoại chính thức!"
      }
    ]
  }
];

type Props = {
  onBack: () => void;
  onComplete: (score: number) => void;
};

export function EscapeRoomSimulation({ onBack, onComplete }: Props) {
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [scoreList, setScoreList] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const activeScenario = SCENARIOS[currentStage];

  const handleSelectOption = (idx: number) => {
    if (checked) return;
    sfx.click();
    setSelectedOption(idx);
  };

  const handleCheck = () => {
    if (selectedOption === null || checked) return;
    setChecked(true);
    const earnedScore = activeScenario.options[selectedOption].score;
    setScoreList((prev) => [...prev, earnedScore]);

    if (earnedScore === 10) {
      sfx.correct();
    } else {
      sfx.wrong();
    }
  };

  const handleNext = () => {
    sfx.click();
    setSelectedOption(null);
    setChecked(false);

    if (currentStage < SCENARIOS.length - 1) {
      setCurrentStage((prev) => prev + 1);
    } else {
      setFinished(true);
      const totalScore = scoreList.reduce((a, b) => a + b, 0);
      onComplete(totalScore);
    }
  };

  const handleRestart = () => {
    sfx.start();
    setCurrentStage(0);
    setSelectedOption(null);
    setChecked(false);
    setScoreList([]);
    setFinished(false);
  };

  const totalScore = scoreList.reduce((a, b) => a + b, 0);
  const maxScore = SCENARIOS.length * 10;
  const isExcellent = totalScore >= 25;

  if (finished) {
    return (
      <div className="card-kid p-8 bg-white max-w-xl mx-auto my-6 text-center shadow-xl border-3 border-slate-200 rounded-[36px] animate-bounce-in">
        <div className="text-7xl mb-4 animate-float">🛡️</div>
        <h2 className="text-3xl font-black text-slate-800 mb-2 font-nunito">Vượt Ải Thành Công!</h2>
        <p className="text-slate-500 text-sm font-bold mb-6">
          Con đã thoát khỏi phòng thoát hiểm số của Cú Cú!
        </p>

        {/* Score Display */}
        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-200 mb-6 flex flex-col items-center">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Điểm kỹ năng sống số</span>
          <span className="text-5xl font-black text-teal-600 mt-2">{totalScore} / {maxScore}</span>
          <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 mt-3">
            {isExcellent ? "🏆 Cấp độ: Hiệp sĩ An toàn số" : "🛡️ Cấp độ: Chiến binh Đang tập sự"}
          </span>
        </div>

        {/* Mascot Message Box */}
        <div className="card-kid p-4.5 bg-sky-50 border-sky-200 text-sky-950 text-xs font-bold text-left mb-6 leading-relaxed flex gap-3.5 items-center">
          <div className="w-12 h-12 bg-white rounded-2xl border border-sky-100 flex items-center justify-center text-2xl shrink-0">🦉</div>
          <div>
            <p className="font-extrabold">Cú Cú gửi lời khuyên:</p>
            <p className="font-semibold text-sky-800 mt-1">
              {isExcellent
                ? "Thật tuyệt vời! Con có phản xạ tự vệ số rất cao. Hãy phát huy và nhắc nhở các bạn cùng học nhé!"
                : "Con đã làm rất cố gắng, nhưng hãy cẩn thận hơn với các mã OTP và tin nhắn xin mật khẩu game. Hãy luyện tập lại nhé!"}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="btn-kid bg-sky-500 border-sky-700 hover:bg-sky-600 text-white flex-1 py-3 text-base justify-center font-black"
          >
            Về trang chủ
          </button>
          <button
            onClick={handleRestart}
            className="btn-kid bg-slate-100 border-slate-300 text-slate-600 px-6 py-3 text-sm justify-center font-black"
          >
            Làm lại 🔄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-kid p-6 bg-white max-w-xl mx-auto my-6 text-left shadow-xl border-3 border-slate-200 rounded-[32px] relative animate-fade-up">
      {/* Sound button */}
      <div className="absolute top-4 right-4">
        <SpeakButton text={`${activeScenario.title}. ${activeScenario.message}. ${activeScenario.question}`} />
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-5">
        <div>
          <span className="text-[10px] font-black text-sky-600 uppercase tracking-wider block">Mô phỏng tình huống thực</span>
          <h2 className="text-lg font-black text-slate-800 font-nunito">{activeScenario.title}</h2>
        </div>
        <span className="bg-sky-50 border border-sky-200 text-sky-700 text-xs font-black px-3 py-1 rounded-full shrink-0">
          Chặng {currentStage + 1} / {SCENARIOS.length}
        </span>
      </div>

      {/* Message Screen Simulation */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 mb-5 text-sm leading-relaxed text-slate-800 font-semibold relative shadow-inner">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{activeScenario.emoji}</span>
          <span className="font-extrabold text-slate-600 text-xs uppercase tracking-wide">Tin nhắn gửi đến</span>
        </div>
        <p className="bg-white border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 shadow-sm leading-relaxed pr-8">
          {activeScenario.message}
        </p>
      </div>

      <h3 className="font-black text-base text-slate-800 mb-4 font-nunito">
        ❓ {activeScenario.question}
      </h3>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {activeScenario.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          let btnStyle = "bg-white border-slate-200 hover:bg-slate-50 text-slate-700";
          if (isSelected) {
            btnStyle = "bg-sky-50 border-sky-400 text-sky-950 font-extrabold";
          }
          if (checked) {
            if (isSelected) {
              btnStyle = opt.score === 10
                ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-extrabold"
                : "bg-rose-50 border-rose-400 text-rose-950 font-extrabold";
            } else if (opt.score === 10) {
              // Highlight correct option if student got it wrong
              btnStyle = "bg-emerald-50/40 border-emerald-200 text-emerald-900";
            } else {
              btnStyle = "bg-white border-slate-100 text-slate-400 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              disabled={checked}
              onClick={() => handleSelectOption(idx)}
              className={`w-full text-left p-4.5 border-2 rounded-2xl text-xs font-semibold leading-relaxed transition-all cursor-pointer flex gap-3 items-start ${btnStyle}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black shrink-0 ${
                isSelected ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500"
              } ${checked && opt.score === 10 ? "bg-emerald-500 text-white" : ""} ${
                checked && isSelected && opt.score !== 10 ? "bg-rose-500 text-white" : ""
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Explanation */}
      {checked && selectedOption !== null && (
        <div className={`p-4.5 rounded-2xl border-2 text-xs font-semibold mb-6 animate-bounce-in leading-relaxed ${
          activeScenario.options[selectedOption].score === 10
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-rose-50 border-rose-200 text-rose-900"
        }`}>
          <p>{activeScenario.options[selectedOption].explanation}</p>
        </div>
      )}

      {/* Check/Next button */}
      {!checked ? (
        <button
          onClick={handleCheck}
          disabled={selectedOption === null}
          className="btn-kid bg-emerald-500 border-emerald-700 hover:bg-emerald-600 text-white w-full justify-center py-3 text-sm font-black active:translate-y-[2px] cursor-pointer"
        >
          🔍 Kiểm tra đáp án
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="btn-kid bg-sky-500 border-sky-700 hover:bg-sky-600 text-white w-full justify-center py-3 text-sm font-black active:translate-y-[2px] cursor-pointer"
        >
          {currentStage < SCENARIOS.length - 1 ? "Chặng tiếp theo ➔" : "Xem kết quả 🏆"}
        </button>
      )}
    </div>
  );
}
