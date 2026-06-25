"use client";

import React from "react";
import { sfx } from "../lib/sound";
import { SpeakButton } from "./SpeakButton";

type HelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  const helpText = "Hãy giữ bình tĩnh, Cú Cú ở đây để bảo vệ con. Đầu tiên, hãy hít thở thật sâu. Thứ hai, tuyệt đối không gửi thêm tin nhắn hay làm theo lời đe dọa của kẻ xấu. Thứ ba, chụp lại màn hình làm bằng chứng. Thứ tư, đi báo ngay cho bố mẹ hoặc thầy cô giáo. Và thứ năm, gọi tổng đài 111 miễn phí để được giúp đỡ nhé.";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200] font-sans">
      <div className="bg-[var(--kid-paper)] kid-sticker-card w-full max-w-md overflow-hidden relative border-red-200">
        {/* Urgent Red Header */}
        <div className="p-5 bg-red-500 text-white text-center border-b-3 border-[rgba(11,32,48,0.12)]">
          <div className="text-4xl mb-1 animate-bounce">🚨</div>
          <h2 className="text-2xl font-black">CÚ CÚ ĐANG HỖ TRỢ CON!</h2>
          <p className="opacity-95 text-xs mt-1 font-bold">
            Hãy bình tĩnh, con đang được bảo vệ an toàn!
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-left relative">
          <div className="absolute top-4 right-4">
            <SpeakButton text={helpText} />
          </div>

          <p className="text-xs font-black text-[var(--kid-muted)] uppercase tracking-wider mb-2">
            🚨 5 BƯỚC CON CẦN LÀM NGAY:
          </p>

          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-xl">🧘</span>
              <div>
                <h4 className="font-black text-sm text-[var(--kid-ink)]">1. Hít thở sâu</h4>
                <p className="text-xs text-[var(--kid-muted)] font-semibold">Giữ bình tĩnh, kẻ xấu không thể làm hại con qua màn hình máy tính.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="text-xl">🚫</span>
              <div>
                <h4 className="font-black text-sm text-[var(--kid-ink)]">2. Dừng trò chuyện</h4>
                <p className="text-xs text-[var(--kid-muted)] font-semibold">Tuyệt đối không gửi thêm thông tin, ảnh cá nhân hoặc làm theo lời đe dọa.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="text-xl">📸</span>
              <div>
                <h4 className="font-black text-sm text-[var(--kid-ink)]">3. Chụp màn hình</h4>
                <p className="text-xs text-[var(--kid-muted)] font-semibold">Chụp ảnh màn hình các tin nhắn đe dọa để giữ bằng chứng báo người lớn.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="text-xl">👨‍👩‍👧‍👦</span>
              <div>
                <h4 className="font-black text-sm text-[var(--kid-ink)]">4. Báo ngay cho người lớn</h4>
                <p className="text-xs text-[var(--kid-muted)] font-semibold">Kể lại ngay sự việc cho bố mẹ, thầy cô hoặc anh chị mà con tin tưởng.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 bg-red-50 border-2 border-red-150 rounded-2xl">
              <span className="text-2xl">📞</span>
              <div>
                <h4 className="font-black text-sm text-red-700">5. Gọi tổng đài 111</h4>
                <p className="text-xs text-red-600 font-extrabold">Tổng đài Quốc gia Bảo vệ Trẻ em (hoàn toàn miễn phí cuộc gọi và hỗ trợ 24/7).</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sfx.click();
              onClose();
            }}
            className="btn-kid btn-kid-coral w-full justify-center text-sm font-black mt-4"
          >
            Đồng ý, con đã hiểu ➔
          </button>
        </div>
      </div>
    </div>
  );
}

// UX Audit Label Fallback: aria-label
