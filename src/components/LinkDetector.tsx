"use client";

import React, { useState } from "react";
import { sfx } from "../lib/sound";
import { SpeakButton } from "./SpeakButton";

type ScamResult = {
  risk: "green" | "yellow" | "red";
  explanation: string;
};

export function LinkDetector() {
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
        explanation: "Có lỗi khi kết nối với hệ thống phân tích. Con hãy hỏi bố mẹ trước khi làm theo tin nhắn này."
      });
      sfx.wrong();
    } finally {
      setLoading(false);
    }
  };

  const getRiskStyle = (risk: "green" | "yellow" | "red") => {
    if (risk === "red") {
      return {
        border: "border-red-400 bg-red-50 text-red-900",
        badge: "bg-red-500 text-white",
        emoji: "🚨",
        title: "CẢNH BÁO NGUY HIỂM!"
      };
    }
    if (risk === "yellow") {
      return {
        border: "border-amber-400 bg-amber-50 text-amber-900",
        badge: "bg-amber-500 text-white",
        emoji: "⚠️",
        title: "CẦN CẨN TRỌNG!"
      };
    }
    return {
      border: "border-emerald-400 bg-emerald-50 text-emerald-900",
      badge: "bg-emerald-500 text-white",
      emoji: "✅",
      title: "AN TOÀN TƯƠNG ĐỐI"
    };
  };

  return (
    <div className="card-kid p-6 bg-white w-full text-left">
      {/* Title box with search icon */}
      <div className="flex items-center gap-3.5 mb-3">
        <div className="scenario-icon bg-slate-100 p-2 rounded-xl flex items-center justify-center flex-shrink-0 w-11 h-11 border border-slate-200">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
          </svg>
        </div>
        <h3 className="font-black text-xl text-slate-800 font-nunito leading-none">
          Máy dò tin nhắn & Link lạ
        </h3>
      </div>

      <p className="text-xs font-bold text-slate-400 mb-4 leading-relaxed">
        Con nhận được tin nhắn trúng thưởng, xin mật khẩu hoặc link nhận quà game? Dán vào đây để Cú phân tích giúp con nhé!
      </p>

      <form onSubmit={handleScan} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ví dụ: Chúc mừng bạn đã trúng thưởng kim cương miễn phí, hãy bấm vào garena-nha-kim-cuong.com..."
          className="input-kid h-24 text-sm resize-none py-3 px-4 focus:border-pink-500 rounded-2xl bg-slate-50 border-slate-100"
          maxLength={500}
          disabled={loading}
          required
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="btn-kid btn-kid-coral flex-1 flex items-center justify-center gap-2 text-sm font-black min-h-[44px] h-[44px] cursor-pointer"
          >
            {loading ? (
              <span>🤖 Đang phân tích kỹ lưỡng...</span>
            ) : (
              <>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                </svg>
                <span>Quét độ an toàn</span>
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
              className="btn-kid bg-slate-100 text-slate-600 px-5 text-sm font-black min-h-[44px] h-[44px] border-slate-200 cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
      </form>

      {/* Analysis Result */}
      {result && (
        <div className={`mt-5 p-4 rounded-2xl border-3 animate-bounce-in relative ${getRiskStyle(result.risk).border}`}>
          <div className="absolute top-4 right-4">
            <SpeakButton text={result.explanation} />
          </div>
          
          <div className="flex items-center gap-2 mb-2 font-black text-sm">
            <span className="text-xl">{getRiskStyle(result.risk).emoji}</span>
            <span>{getRiskStyle(result.risk).title}</span>
          </div>

          <p className="text-xs font-semibold leading-relaxed pr-8">
            {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
