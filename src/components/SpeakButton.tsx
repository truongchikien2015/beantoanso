"use client";

import React, { useState, useEffect } from "react";
import { sfx } from "../lib/sound";

type SpeakButtonProps = {
  text: string;
  className?: string;
};

export function SpeakButton({ text, className = "" }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      // Cancel speech on unmount
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.click();

    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng đọc giọng nói.");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Clean text from HTML/Markdown-like syntax
    const cleanText = text
      .replace(/[*_`~#]/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Find Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang === "vi-VN" || v.lang.includes("vi"));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
    };

    setSpeaking(true);
    window.speechSynthesis.cancel(); // stop current active speech
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={handleSpeak}
      title={speaking ? "Dừng đọc" : "Đọc văn bản"}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-200 bg-white hover:border-[var(--kid-coral-new)] transition-colors ${
        speaking ? "bg-red-50 border-red-200 text-red-500 animate-pulse" : "text-[var(--kid-muted)]"
      } ${className}`}
    >
      {speaking ? "⏹️" : "🔊"}
    </button>
  );
}
