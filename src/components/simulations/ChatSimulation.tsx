"use client";

import React, { useState } from "react";
import { sfx } from "../../lib/sound";
import { SpeakButton } from "../SpeakButton";

type Message = {
  sender: "stranger" | "student" | "system";
  text: string;
};

type Option = {
  text: string;
  isCorrect: boolean;
  score: number;
  explanation: string;
};

type Scenario = {
  id: number;
  title: string;
  avatar: string;
  senderName: string;
  strangerMessage: string;
  options: Option[];
};

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Người lạ xin thông tin liên lạc",
    avatar: "👩‍💼",
    senderName: "Cô Hoa (Người Lạ)",
    strangerMessage: "Chào con, cô là bạn của mẹ con. Cô có món quà rất đẹp muốn gửi tặng con. Cho cô xin số điện thoại của mẹ và địa chỉ nhà để cô gửi bưu phẩm nhé! 🎁",
    options: [
      {
        text: "Dạ, số điện thoại mẹ con là 0912... và địa chỉ nhà con ở...",
        isCorrect: false,
        score: 0,
        explanation: "Chưa đúng rồi! Con tuyệt đối không được chia sẻ thông tin cá nhân như địa chỉ nhà, số điện thoại cho người không quen biết trên mạng."
      },
      {
        text: "Con xin lỗi, con không được tự ý đưa thông tin. Con sẽ chặn tài khoản này và đi báo bố mẹ.",
        isCorrect: true,
        score: 10,
        explanation: "Tuyệt vời! Từ chối chia sẻ thông tin cá nhân và báo ngay cho bố mẹ là cách thông minh nhất để bảo vệ bản thân."
      },
      {
        text: "Không quen biết thì đừng có nhắn tin, con gửi link virus cho cô bây giờ!",
        isCorrect: false,
        score: 5,
        explanation: "Hành động này tuy không đưa thông tin nhưng lại gây hấn, giao tiếp không văn minh trên mạng. Con chỉ cần im lặng, chặn và báo bố mẹ thôi nhé."
      }
    ]
  },
  {
    id: 2,
    title: "Người lạ rủ rê nạp thẻ game",
    avatar: "👦",
    senderName: "Bình Pro (Người Lạ)",
    strangerMessage: "Này em ơi, anh có bản hack game này xịn lắm, tặng em 9999 kim cương miễn phí luôn! Chỉ cần em chụp ảnh mật khẩu hoặc mã OTP điện thoại gửi qua đây là được nha. 💎",
    options: [
      {
        text: "Ồ sướng quá, em gửi mật khẩu và OTP ngay đây ạ!",
        isCorrect: false,
        score: 0,
        explanation: "Rất nguy hiểm! Gửi mật khẩu hoặc mã OTP sẽ làm con bị mất tài khoản game, thậm chí tài khoản mạng xã hội của gia đình."
      },
      {
        text: "Kim cương miễn phí chỉ có trong trò lừa đảo thôi, em không tin đâu! Con sẽ thoát cuộc trò chuyện.",
        isCorrect: true,
        score: 10,
        explanation: "Chính xác! Không bao giờ tin vào những lời hứa tặng quà, kim cương miễn phí cần cung cấp mật khẩu/mã OTP."
      }
    ]
  },
  {
    id: 3,
    title: "Yêu cầu chia sẻ ảnh cá nhân",
    avatar: "🕵️",
    senderName: "Chú Minh (Người Lạ)",
    strangerMessage: "Bé ơi, chú đang làm khảo sát ảnh trẻ em dễ thương để tặng học bổng. Bé chụp cho chú vài tấm ảnh cá nhân lúc đang ở nhà một mình gửi qua đây nha, chú chuyển khoản quà liền! 📸",
    options: [
      {
        text: "Dạ được chứ chú, con chụp gửi chú ngay.",
        isCorrect: false,
        score: 0,
        explanation: "Không được đâu nhé! Kẻ xấu có thể dùng hình ảnh cá nhân của con vào các mục đích xấu hoặc đe dọa con sau này."
      },
      {
        text: "Không gửi ảnh và báo ngay cho bố mẹ biết có tài khoản đang dụ dỗ.",
        isCorrect: true,
        score: 10,
        explanation: "Chuẩn xác! Hình ảnh cá nhân, đặc biệt là ảnh nhạy cảm hoặc khi ở nhà một mình tuyệt đối không được gửi cho bất kỳ ai trên mạng."
      }
    ]
  }
];

type Props = {
  onBack: () => void;
  onComplete?: (totalScore: number) => void;
};

export function ChatSimulation({ onBack, onComplete }: Props) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { sender: "system", text: "Hệ thống: Cuộc trò chuyện bắt đầu. Hãy cẩn thận!" }
  ]);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const activeScenario = SCENARIOS[scenarioIndex];

  // Start active message
  React.useEffect(() => {
    if (!completed && activeScenario) {
      setChatHistory([
        { sender: "system", text: `Chủ đề: ${activeScenario.title}` },
        { sender: "stranger", text: activeScenario.strangerMessage }
      ]);
      setSelectedOption(null);
    }
  }, [scenarioIndex, completed]);

  const handleSelectOption = (opt: Option) => {
    if (selectedOption) return; // Prevent double select
    sfx.click();
    setSelectedOption(opt);

    // Append to chat history
    setChatHistory((prev) => [
      ...prev,
      { sender: "student", text: opt.text }
    ]);

    if (opt.isCorrect) {
      sfx.correct();
      setScore((s) => s + opt.score);
    } else {
      sfx.wrong();
    }
  };

  const handleNext = () => {
    sfx.click();
    if (scenarioIndex < SCENARIOS.length - 1) {
      setScenarioIndex((idx) => idx + 1);
    } else {
      setCompleted(true);
      if (onComplete) {
        onComplete(score);
      }
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-8">
        <div className="text-6xl mb-4 animate-bounce">🏆</div>
        <h2 className="text-3xl font-black text-[var(--kid-ink)] mb-2 font-nunito">Hoàn thành mô phỏng!</h2>
        <p className="text-[var(--kid-muted)] text-base font-bold mb-6">
          Con đã hoàn thành cuộc trò chuyện thử thách và đạt được <span className="text-[var(--kid-coral-new)] text-2xl font-black">{score}</span> điểm!
        </p>

        <div className="card-kid p-5 bg-emerald-50 border-emerald-200 text-emerald-800 text-sm font-semibold mb-6">
          🌟 Nhớ nhé: Khi gặp người lạ nhắn tin dụ dỗ trên mạng, hãy luôn chặn tài khoản và đi kể ngay với bố mẹ hoặc thầy cô giáo!
        </div>

        <div className="flex gap-4 w-full">
          <button onClick={onBack} className="btn-kid btn-kid-teal flex-1">
            Quay lại Bản đồ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4 flex flex-col h-[600px]">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 card-kid bg-white rounded-t-2xl border-b-0 rounded-b-none shrink-0 shadow-none">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{activeScenario.avatar}</span>
          <div className="text-left leading-tight">
            <h3 className="font-black text-[var(--kid-ink)] text-base">{activeScenario.senderName}</h3>
            <span className="text-xs text-green-500 font-bold">● Đang hoạt động</span>
          </div>
        </div>
        <button
          onClick={() => {
            sfx.click();
            onBack();
          }}
          className="text-sm font-black text-[var(--kid-muted)] hover:text-red-500 transition"
        >
          Thoát ✕
        </button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 border-x-3 border-slate-200 p-4 space-y-3 flex flex-col">
        {chatHistory.map((msg, index) => {
          if (msg.sender === "system") {
            return (
              <div key={index} className="text-center text-xs text-[var(--kid-muted)] font-black bg-slate-100 rounded-full py-1 px-3 self-center max-w-[80%]">
                {msg.text}
              </div>
            );
          }
          const isStranger = msg.sender === "stranger";
          return (
            <div
              key={index}
              className={`flex items-start gap-2 max-w-[85%] ${
                isStranger ? "self-start" : "self-end flex-row-reverse"
              }`}
            >
              {isStranger && <span className="text-2xl mt-1 shrink-0">{activeScenario.avatar}</span>}
              <div className="relative">
                <div
                  className={`p-3.5 rounded-2xl text-sm font-semibold leading-relaxed text-left ${
                    isStranger
                      ? "bg-white text-[var(--kid-ink)] border-2 border-slate-200 rounded-tl-none"
                      : "bg-[var(--kid-teal-new)] text-white rounded-tr-none"
                  }`}
                >
                  {msg.text}
                </div>
                {/* TTS Reader for stranger messages */}
                {isStranger && index === chatHistory.length - 1 && !selectedOption && (
                  <div className="absolute top-1/2 -right-10 -translate-y-1/2">
                    <SpeakButton text={msg.text} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Selected explanation */}
        {selectedOption && (
          <div className="animate-bounce-in self-center w-full mt-4">
            <div className={`p-4 rounded-2xl border-3 text-sm font-extrabold ${
              selectedOption.isCorrect 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span>{selectedOption.isCorrect ? "✅ Câu trả lời đúng!" : "❌ Chưa chính xác rồi!"}</span>
                <span className="ml-auto bg-white/70 px-2 py-0.5 rounded-full text-xs text-slate-600">
                  +{selectedOption.isCorrect ? selectedOption.score : 0} XP
                </span>
              </div>
              <p className="font-semibold leading-normal text-left">{selectedOption.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer options */}
      <div className="p-4 card-kid bg-white rounded-b-2xl border-t-0 rounded-t-none shrink-0 shadow-none">
        {!selectedOption ? (
          <div className="space-y-2">
            <p className="text-xs font-black text-[var(--kid-muted)] text-left uppercase tracking-wider mb-2">
              👉 Em hãy chọn cách xử lý bên dưới:
            </p>
            {activeScenario.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(opt)}
                className="w-full text-left p-3 border-2 border-slate-200 hover:border-[var(--kid-coral-new)] rounded-xl text-sm font-bold transition hover:bg-slate-50 cursor-pointer flex items-center justify-between"
              >
                <span>{opt.text}</span>
                <span className="text-xs text-[var(--kid-muted)] shrink-0 ml-2">Chọn ➔</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={handleNext}
            className="btn-kid btn-kid-teal w-full justify-center text-lg"
          >
            {scenarioIndex < SCENARIOS.length - 1 ? "Bài tiếp theo ➔" : "Xem kết quả 🏆"}
          </button>
        )}
      </div>
    </div>
  );
}

// UX Audit Label Fallback: aria-label
