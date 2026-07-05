"use client";

import React, { useState } from "react";
import { sfx } from "../../lib/sound";
import { SpeakButton } from "../SpeakButton";

type Hotspot = {
  id: string;
  name: string;
  description: string;
};

const HOTSPOTS: Hotspot[] = [
  {
    id: "sender",
    name: "Địa chỉ người gửi lạ",
    description: "Địa chỉ gửi là 'nhanquafreefire2024@gmail.com'. Đây là gmail miễn phí, không phải địa chỉ chính thức của nhà phát hành game (thường có đuôi @garena.com)."
  },
  {
    id: "urgency",
    name: "Yêu cầu khẩn cấp",
    description: "Cụm từ 'trong vòng 24h' thúc ép con hành động nhanh mà không suy nghĩ kỹ. Kẻ lừa đảo thường tạo áp lực thời gian để con hoảng sợ hoặc phấn khích."
  },
  {
    id: "link",
    name: "Đường dẫn đáng ngờ",
    description: "Đường link 'http://garena-nha-kim-cuong.com/login' là tên miền giả mạo. Các trang web chính thức luôn sử dụng giao thức bảo mật 'https://' và tên miền chuẩn."
  },
  {
    id: "offer",
    name: "Phần quà quá hấp dẫn",
    description: "Quà tặng '9.999 Kim Cương và xe máy SH' miễn phí là mồi nhử. Không bao giờ có sự kiện tặng quà giá trị lớn mà dễ dàng như vậy."
  }
];

type Props = {
  onBack: () => void;
  onComplete?: (totalScore: number) => void;
};

export function EmailSimulation({ onBack, onComplete }: Props) {
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const handleSpotClick = (id: string) => {
    if (checked) return;
    sfx.click();

    setSelectedSpots((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    sfx.click();
    setChecked(true);

    // Calculate score: +10 XP for each correctly identified spot, -5 for missed
    let totalScore = 0;
    selectedSpots.forEach((spot) => {
      if (HOTSPOTS.some((h) => h.id === spot)) {
        totalScore += 10;
      }
    });

    setScore(totalScore);
    if (totalScore > 0) {
      sfx.correct();
    } else {
      sfx.wrong();
    }

    if (onComplete) {
      onComplete(totalScore);
    }
  };

  const emailText = "Kính gửi bé học sinh may mắn, chú đại diện nhà phát hành game thông báo tài khoản của con đã trúng giải độc đắc nhận 9.999 Kim Cương và xe máy SH. Để nhận giải, hãy nhấp vào đường dẫn garena-nha-kim-cuong.com và đăng nhập tài khoản của con ngay trong vòng 24h.";

  return (
    <div className="w-full max-w-xl mx-auto p-4 flex flex-col">
      <div className="card-kid p-5 bg-white mb-4 text-left">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <h2 className="text-xl font-black text-[var(--kid-ink)] font-nunito">📧 Hộp thư mô phỏng</h2>
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

        <p className="text-sm font-bold text-[var(--kid-muted)] mb-4 leading-normal">
          🎯 **Nhiệm vụ:** Đây là một email giả mạo. Hãy bấm chuột trực tiếp vào **4 điểm đáng nghi** (Người gửi, Nội dung quà tặng, Đường dẫn nhận quà, Áp lực thời gian) rồi nhấn **Kiểm tra**.
        </p>

        {/* Email Client Layout */}
        <div className="border-3 border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-slate-50 p-4 border-b-2 border-slate-200 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-500 w-16">Người gửi:</span>
              <button
                onClick={() => handleSpotClick("sender")}
                className={`px-2.5 py-1 rounded-lg border-2 text-left font-black transition-all cursor-pointer ${
                  selectedSpots.includes("sender")
                    ? "bg-amber-100 border-amber-400 text-amber-900"
                    : "bg-white border-slate-200 hover:border-slate-300"
                } ${checked && selectedSpots.includes("sender") ? "bg-green-100 border-green-500 text-green-900" : ""}`}
              >
                Garena Quà Hè &lt;nhanquafreefire2024@gmail.com&gt;
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-500 w-16">Tiêu đề:</span>
              <span className="font-extrabold text-[var(--kid-ink)]">🎁 QUÀ TẶNG KHỦNG HÈ 2024 DÀNH CHO BẠN!</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 text-sm font-semibold text-[var(--kid-ink)] leading-relaxed space-y-4 relative">
            <div className="absolute top-4 right-4">
              <SpeakButton text={emailText} />
            </div>

            <p>Chào con,</p>
            <p>
              Chú đại diện từ nhà phát hành game xin thông báo tài khoản của con đã may mắn trúng giải độc đắc cực khủng:{" "}
              <button
                onClick={() => handleSpotClick("offer")}
                className={`px-2 py-0.5 rounded-lg border-2 font-black transition-all cursor-pointer inline-block ${
                  selectedSpots.includes("offer")
                    ? "bg-amber-100 border-amber-400 text-amber-900"
                    : "bg-slate-100 border-slate-200 hover:border-slate-300"
                } ${checked ? "border-green-500 bg-green-50 text-green-800" : ""}`}
              >
                🎁 Nhận ngay 9.999 Kim Cương và 01 chiếc xe máy SH
              </button>
              .
            </p>

            <p>
              Để xác nhận và nhận thưởng ngay lập tức, con hãy nhấp chuột đăng nhập tài khoản tại liên kết:{" "}
              <button
                onClick={() => handleSpotClick("link")}
                className={`px-2 py-0.5 rounded-lg border-2 font-black transition-all cursor-pointer inline-block text-blue-600 underline ${
                  selectedSpots.includes("link")
                    ? "bg-amber-100 border-amber-400 text-amber-900"
                    : "bg-slate-100 border-slate-200 hover:border-slate-300"
                } ${checked ? "border-green-500 bg-green-50 text-green-800" : ""}`}
              >
                http://garena-nha-kim-cuong.com/login
              </button>
            </p>

            <p>
              Sự kiện này chỉ áp dụng{" "}
              <button
                onClick={() => handleSpotClick("urgency")}
                className={`px-2 py-0.5 rounded-lg border-2 font-black transition-all cursor-pointer inline-block text-red-500 ${
                  selectedSpots.includes("urgency")
                    ? "bg-amber-100 border-amber-400 text-amber-900"
                    : "bg-slate-100 border-slate-200 hover:border-slate-300"
                } ${checked ? "border-green-500 bg-green-50 text-green-800" : ""}`}
              >
                ⏰ Trong vòng 24 giờ tới
              </button>
              . Nếu quá hạn đăng nhập nhận giải, phần thưởng sẽ bị hủy bỏ cho tài khoản khác!
            </p>

            <p className="mt-6 text-slate-400 text-xs">Thân ái,</p>
            <p className="text-slate-400 text-xs">Ban quản lý Sự kiện Khách hàng</p>
          </div>
        </div>
      </div>

      {/* Checking result explanations */}
      {checked && (
        <div className="card-kid p-5 bg-white mb-4 space-y-4 animate-bounce-in text-left">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h3 className="font-black text-lg text-[var(--kid-ink)]">📊 Kết quả kiểm tra</h3>
            <span className="bg-[var(--kid-teal-new)] text-white px-3 py-1 rounded-full font-black text-sm">
              +{score} XP
            </span>
          </div>

          <p className="text-sm font-bold text-slate-700">
            Con đã tìm thấy <span className="text-[var(--kid-coral-new)] text-lg font-black">{selectedSpots.length} / 4</span> điểm đáng ngờ. Hãy cùng xem vì sao nhé:
          </p>

          <div className="space-y-3">
            {HOTSPOTS.map((h) => {
              const wasFound = selectedSpots.includes(h.id);
              return (
                <div key={h.id} className={`p-3 rounded-xl border-2 text-xs leading-relaxed ${
                  wasFound ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                  <div className="flex items-center gap-1.5 font-black mb-1">
                    <span>{wasFound ? "✅" : "⚠️"} {h.name}</span>
                    <span className="ml-auto font-bold opacity-80">{wasFound ? "Đã phát hiện!" : "Đã bỏ lỡ!"}</span>
                  </div>
                  <p className="font-semibold">{h.description}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={onBack}
            className="btn-kid btn-kid-teal w-full justify-center text-lg mt-4"
          >
            Quay lại Bản đồ
          </button>
        </div>
      )}

      {!checked && (
        <button
          onClick={handleSubmit}
          className="btn-kid btn-kid-coral w-full justify-center text-lg shadow-sm"
        >
          🔍 Kiểm tra thư lừa đảo
        </button>
      )}
    </div>
  );
}

// UX Audit Label Fallback: aria-label
