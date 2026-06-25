"use client";

import { useEffect } from "react";
import { sfx } from "../lib/sound";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
      <div 
        className="bg-white card-kid rounded-[36px] max-w-4xl w-full relative shadow-2xl border-4 border-slate-200 animate-bounce-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={() => { sfx.click(); onClose(); }}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-bold z-10"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center p-6 sm:p-10">
          {/* Left Column: Chân dung tác giả */}
          <div className="md:col-span-5 flex flex-col items-center relative">
            <div className="relative p-2 bg-white rounded-[36px] max-w-[280px] w-full shadow-lg border border-slate-200/50">
              <img
                src="/images/graduation_author.png"
                alt="Chân dung tác giả Trương Chí Kiên"
                className="w-full rounded-[30px] object-cover shadow-inner"
              />
            </div>
            {/* Author tag */}
            <div className="absolute -bottom-4 bg-white py-2.5 px-4.5 rounded-2xl flex items-center gap-2 border border-slate-200 shadow-md">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-lg shadow-sm text-white font-bold">
                🎓
              </div>
              <div className="leading-tight text-left">
                <p className="text-[10px] text-slate-400 font-black leading-none uppercase">Tác giả</p>
                <p className="text-xs text-blue-900 font-black leading-tight mt-0.5">Trương Chí Kiên</p>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative Content */}
          <div className="md:col-span-7 flex flex-col items-start text-left pt-6 md:pt-0">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-full text-xs font-black mb-5">
              ❤️ Tâm sự từ người sáng lập
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-blue-900 tracking-tight leading-tight mb-6 font-nunito">
              Xây dựng không gian mạng <br className="hidden md:block" />
              <span className="text-blue-600 font-black">an toàn cho trẻ em</span>
            </h2>
            <div className="space-y-4 text-slate-700 text-[15px] font-semibold leading-relaxed">
              <p>
                Xin chào! Mình là Trương Chí Kiên. Nhận thấy trẻ em ngày nay tiếp xúc với Internet từ rất sớm nhưng lại thiếu các kỹ năng tự bảo vệ, mình đã tạo ra &quot;Bé An Toàn Số&quot; với mong muốn đóng góp một phần nhỏ bé cho cộng đồng.
              </p>
              <p>
                Trang web được thiết kế như một trò chơi tương tác, nơi các em có thể hóa thân thành những &quot;Hiệp sĩ không gian mạng&quot;, trải qua các thử thách để học cách nhận biết lừa đảo, bảo vệ thông tin cá nhân và ứng xử văn minh trên môi trường số.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// UX Audit Label Fallback: aria-label
