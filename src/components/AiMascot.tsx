"use client";

import React, { useState, useRef, useEffect } from "react";
import { sfx } from "../lib/sound";
import { SpeakButton } from "./SpeakButton";

type Message = {
  sender: "owl" | "student";
  text: string;
};

export function AiMascot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "owl",
      text: "Xin chào! Ta là Cú Cú An Toàn 🦉. Có điều gì làm con lo lắng hay tò mò khi sử dụng Internet không? Con hãy hỏi Cú nhé!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    sfx.click();

    setMessages((prev) => [...prev, { sender: "student", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/student/mascot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        { sender: "owl", text: data.text || "Cú Cú chưa hiểu ý con, con nói lại rõ hơn được không?" }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "owl", text: "Hình như mạng nhà mình bị yếu rồi. Con thử hỏi Cú lại sau nhé!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTED_QUESTIONS = [
    "Cú ơi, link nhận quà game có thật không?",
    "Làm sao để đặt mật khẩu siêu mạnh?",
    "Bị bạn bắt nạt trên mạng thì con nên làm gì?"
  ];

  const handleSuggestionClick = async (questionText: string) => {
    if (loading) return;
    sfx.click();
    setMessages((prev) => [...prev, { sender: "student", text: questionText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/student/mascot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: questionText })
      });
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        { sender: "owl", text: data.text || "Cú Cú chưa hiểu ý con, con nói lại rõ hơn được không?" }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "owl", text: "Hình như mạng nhà mình bị yếu rồi. Con thử hỏi Cú lại sau nhé!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    sfx.click();
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* Floating Mascot Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center text-4xl hover:scale-110 active:scale-95 transition-all animate-float cursor-pointer"
          title="Trợ lý ảo Cú Cú An Toàn"
        >
          🦉
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-black text-white items-center justify-center">1</span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-[var(--kid-paper)] kid-sticker-card flex flex-col overflow-hidden animate-bounce-in shadow-2xl">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white flex items-center justify-between border-b-3 border-[rgba(11,32,48,0.12)]">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦉</span>
              <div className="text-left">
                <h4 className="font-black text-sm leading-tight text-amber-950">Cú Cú An Toàn</h4>
                <span className="text-[10px] text-amber-900 font-extrabold">Đang sẵn sàng giúp bé</span>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="text-amber-950 hover:bg-black/10 rounded-full w-7 h-7 flex items-center justify-center transition font-black"
            >
              ✕
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">
            {messages.map((msg, idx) => {
              const isOwl = msg.sender === "owl";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2 max-w-[85%] ${
                    isOwl ? "self-start" : "self-end flex-row-reverse"
                  }`}
                >
                  {isOwl && <span className="text-2xl mt-1 shrink-0">🦉</span>}
                  <div className="relative">
                    <div
                      className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed text-left ${
                        isOwl
                          ? "bg-white text-[var(--kid-ink)] border-2 border-slate-200 rounded-tl-none"
                          : "bg-[var(--kid-coral-new)] text-white rounded-tr-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {/* TTS for Owl responses */}
                    {isOwl && (
                      <div className="absolute top-1/2 -right-8 -translate-y-1/2">
                        <SpeakButton text={msg.text} className="w-6 h-6 text-[10px]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-start gap-2 self-start">
                <span className="text-2xl">🦉</span>
                <div className="bg-white text-[var(--kid-ink)] border-2 border-slate-200 p-3 rounded-2xl rounded-tl-none text-xs font-semibold animate-pulse">
                  Cú Cú đang suy nghĩ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {!loading && (
            <div className="px-3 py-2 bg-slate-50 border-t flex flex-wrap gap-1.5 shrink-0">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(q)}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 rounded-full px-2.5 py-1 text-[10px] font-black transition cursor-pointer leading-tight text-left"
                >
                  💡 {q}
                </button>
              ))}
            </div>
          )}

          {/* Form Input */}
          <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi Cú về mật khẩu, link lạ..."
              className="flex-1 input-kid py-2 px-3 text-xs"
              maxLength={150}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-kid btn-kid-yellow py-1 px-4 text-xs min-h-[38px] h-[38px] shrink-0"
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
