"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { sfx } from "../lib/sound";
import { SpeakButton } from "./SpeakButton";

type ScamResult = {
  risk: "green" | "yellow" | "red";
  explanation: string;
};

export function AiSafetyScanner() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamResult | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    sfx.click();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/student/detect-scam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() })
      });
      const data = await res.json();
      setResult({
        risk: data.risk || "green",
        explanation: data.explanation || "Không phát hiện nguy hiểm rõ rệt."
      });

      if (data.risk === "red") {
        sfx.wrong();
      } else {
        sfx.correct();
      }
    } catch {
      setResult({
        risk: "yellow",
        explanation: "Có lỗi khi kết nối với hệ thống phân tích của Cú Cú. Con hãy hỏi bố mẹ trước khi làm theo tin nhắn này nhé."
      });
      sfx.wrong();
    } finally {
      setLoading(false);
    }
  };

  const getRiskStyle = (risk: "green" | "yellow" | "red") => {
    if (risk === "red") {
      return {
        bg: "bg-rose-50 border-rose-300 text-rose-950",
        badge: "bg-rose-500 text-white border-rose-600",
        emoji: "🚨",
        title: "CẢNH BÁO: RẤT NGUY HIỂM!"
      };
    }
    if (risk === "yellow") {
      return {
        bg: "bg-amber-50 border-amber-300 text-amber-950",
        badge: "bg-amber-500 text-white border-amber-600",
        emoji: "⚠️",
        title: "CẨN TRỌNG: CÓ DẤU HIỆU LẠ!"
      };
    }
    return {
      bg: "bg-emerald-50 border-emerald-300 text-emerald-950",
      badge: "bg-emerald-500 text-white border-emerald-600",
      emoji: "✅",
      title: "AN TOÀN TƯƠNG ĐỐI"
    };
  };

  const getPracticeRoute = (text: string) => {
    const textLower = text.toLowerCase();
    // Redirect logic: if it contains game-related scam elements, route to Escape Room simulation
    if (textLower.includes("kim cương") || textLower.includes("free fire") || textLower.includes("freefire") || textLower.includes("otp") || textLower.includes("mật khẩu")) {
      return "/student/escape-room";
    }
    return "/classify";
  };

  const getPracticeLabel = (text: string) => {
    const textLower = text.toLowerCase();
    if (textLower.includes("kim cương") || textLower.includes("free fire") || textLower.includes("freefire") || textLower.includes("otp") || textLower.includes("mật khẩu")) {
      return "🎮 Luyện tập tình huống tương tự (Phòng thoát hiểm) ➔";
    }
    return "🧩 Chơi game phân loại thông tin để học thêm ➔";
  };

  return (
    <div className="card-kid p-6 bg-white w-full text-left shadow-md border-3 border-slate-200 rounded-[32px]">
      {/* Title */}
      <div className="flex items-center gap-3.5 mb-3">
        <div className="bg-emerald-100 p-2.5 rounded-2xl flex items-center justify-center flex-shrink-0 w-11 h-11 border-2 border-emerald-200">
          <span className="text-xl">🤖</span>
        </div>
        <div>
          <h3 className="font-black text-xl text-slate-800 font-nunito leading-tight">
            Máy quét tin nhắn & Link lạ AI
          </h3>
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Bảo vệ con thời gian thực</span>
        </div>
      </div>

      <p className="text-xs font-bold text-slate-400 mb-4 leading-relaxed">
        Con nhận được tin nhắn trúng thưởng, xin mật khẩu hoặc link nhận quà game? Dán vào đây để Robot phân tích mức độ an toàn ngay nhé!
      </p>

      <form onSubmit={handleScan} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ví dụ: Bạn trúng thưởng 9.999 Kim Cương, đăng nhập http://garena-nha-kim-cuong.com để nhận..."
          className="input-kid h-24 text-sm resize-none py-3 px-4 focus:border-emerald-500 rounded-2xl bg-slate-50 border-slate-100 placeholder:text-slate-400"
          maxLength={500}
          disabled={loading}
          required
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="btn-kid bg-emerald-500 border-emerald-700 hover:bg-emerald-600 text-white flex-1 flex items-center justify-center gap-2 text-sm font-black min-h-[46px] h-[46px] cursor-pointer active:translate-y-[2px] active:shadow-none transition"
          >
            {loading ? (
              <span>🤖 Robot đang quét...</span>
            ) : (
              <>
                <span>🛡️ Phân tích an toàn</span>
              </>
            )}
          </button>
          {content.trim() && (
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setContent("");
                setResult(null);
              }}
              className="btn-kid bg-slate-100 border-slate-300 text-slate-600 px-5 text-sm font-black min-h-[46px] h-[46px] cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
      </form>

      {/* Analysis Result */}
      {result && (
        <div className={`mt-5 p-5 rounded-2xl border-3 animate-bounce-in relative transition-all ${getRiskStyle(result.risk).bg}`}>
          <div className="absolute top-4 right-4">
            <SpeakButton text={result.explanation} />
          </div>

          <div className="flex items-center gap-2 mb-2 font-black text-sm">
            <span className="text-xl">{getRiskStyle(result.risk).emoji}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${getRiskStyle(result.risk).badge}`}>
              {getRiskStyle(result.risk).title}
            </span>
          </div>

          <p className="text-xs font-bold leading-relaxed pr-8 mb-4">
            {result.explanation}
          </p>

          {/* Practice suggestion button if risk is warning/danger */}
          {(result.risk === "red" || result.risk === "yellow") && (
            <button
              onClick={() => {
                sfx.click();
                router.push(getPracticeRoute(content));
              }}
              className="w-full py-2.5 px-4 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-black text-xs rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-1.5"
            >
              {getPracticeLabel(content)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
