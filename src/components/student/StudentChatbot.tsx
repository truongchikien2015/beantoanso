"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Mic, MicOff, Send, X } from "lucide-react";
import {
  sendStudentChatMessage,
  type StudentChatMessage,
} from "@/lib/studentApi";
import { listenForVoiceAnswer, voiceAnswerAvailable } from "@/lib/voiceAnswer";

const MAX_HISTORY_ITEMS = 10;
const VOICE_WAVE_BARS = [0, 1, 2, 3, 4, 5, 6];

type ChatMessage = StudentChatMessage & {
  id: string;
  refused?: boolean;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function StudentChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");

  const history = useMemo<StudentChatMessage[]>(() => {
    return messages
      .slice(-MAX_HISTORY_ITEMS)
      .map(({ role, content }) => ({ role, content }));
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: question,
    };

    setMessages((current) => [...current, userMessage].slice(-MAX_HISTORY_ITEMS));
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await sendStudentChatMessage(question, history);
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: response.answer,
        refused: response.refused,
      };
      setMessages((current) => [...current, assistantMessage].slice(-MAX_HISTORY_ITEMS));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trợ lý đang bận, em thử lại sau nhé.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (listening) {
      return;
    }

    if (!voiceAnswerAvailable()) {
      setError("Trình duyệt chưa hỗ trợ nhập giọng nói. Em thử dùng Chrome nhé.");
      return;
    }

    setError("");
    setListening(true);

    try {
      const transcript = await listenForVoiceAnswer();
      if (transcript.trim()) {
        setInput(transcript.trim());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const denied = message === "not-allowed" || message === "service-not-allowed";
      setError(
        denied
          ? "Em cần cho phép dùng micro để nhập bằng giọng nói."
          : "Chưa nghe rõ giọng nói, em thử lại nhé.",
      );
    } finally {
      setListening(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-[24px] border-[3px] border-white bg-gradient-to-br from-sky-400 via-indigo-400 to-teal-400 text-white shadow-[0_16px_32px_rgba(14,116,144,0.28)] transition hover:-translate-y-1 hover:rotate-2 focus:outline-none focus:ring-4 focus:ring-sky-200 sm:bottom-7 sm:right-7"
        aria-label="Mở trợ lý học tập"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
        <span className="absolute -right-1 -top-2 rounded-full bg-[var(--kid-coral-new)] px-2 py-1 text-xs font-black text-white shadow">
          AI
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 px-3 pb-4 pt-16 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-chatbot-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Đóng trợ lý học tập"
          />

          <section className="relative w-full max-w-xl overflow-hidden rounded-[30px] border-[3px] border-white bg-[var(--kid-paper)] shadow-[0_28px_70px_rgba(15,23,42,0.25)]">
            <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-sky-300 via-indigo-300 to-teal-300" />
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-sky-400 to-indigo-500 text-2xl shadow-md">
                    🤖
                  </div>
                  <div>
                    <h2 id="student-chatbot-title" className="text-lg font-black text-slate-800">
                      Hỏi trợ lý học tập
                    </h2>
                    <p className="text-sm text-slate-500">
                      Em có thể hỏi thêm về bài học, an toàn số và kỹ năng học tập.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="max-h-[52vh] min-h-56 overflow-y-auto rounded-3xl border border-slate-100 bg-slate-50/80 p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-slate-500 space-y-2">
                    <p className="font-semibold text-slate-700">Gợi ý câu hỏi:</p>
                    <button
                      type="button"
                      onClick={() => setInput("Làm sao tạo mật khẩu mạnh?")}
                      className="block w-full rounded-2xl bg-white px-3 py-2 text-left transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    >
                      Làm sao tạo mật khẩu mạnh?
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput("Khi gặp người lạ nhắn tin em nên làm gì?")}
                      className="block w-full rounded-2xl bg-white px-3 py-2 text-left transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
                    >
                      Khi gặp người lạ nhắn tin em nên làm gì?
                    </button>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-3xl px-4 py-2 text-sm leading-relaxed ${
                          message.role === "user"
                            ? "bg-[var(--kid-coral-new)] text-white rounded-br-md"
                            : message.refused
                              ? "bg-amber-50 text-amber-800 border border-amber-200 rounded-bl-md"
                              : "bg-white text-slate-700 border border-sky-100 rounded-bl-md"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="text-sm text-slate-500">Trợ lý đang suy nghĩ...</div>
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {listening && (
                <div
                  className="voice-listening-card"
                  role="status"
                  aria-live="polite"
                >
                  <span className="voice-live-dot" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[var(--kid-ink)]">Đang nghe giọng nói...</p>
                    <p className="text-xs font-bold text-[var(--kid-muted)]">Nói câu hỏi của em, trợ lý sẽ tự điền vào ô nhập.</p>
                  </div>
                  <div className="voice-wave" aria-hidden="true">
                    {VOICE_WAVE_BARS.map((bar) => (
                      <span
                        key={bar}
                        className="voice-wave-bar"
                        style={{ animationDelay: `${bar * 0.08}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={800}
                  className={`Input min-h-12 flex-1 rounded-2xl border-2 px-4 text-base font-bold ${
                    listening ? "border-[var(--kid-coral-new)] shadow-[0_0_0_4px_rgba(255,107,107,0.14)]" : ""
                  }`}
                  placeholder={listening ? "Đang nghe em nói..." : "Nhập câu hỏi học tập của em..."}
                  disabled={loading}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    disabled={loading || listening}
                    className={`voice-mic-button ${listening ? "voice-mic-button-active" : ""}`}
                    aria-label={listening ? "Đang nghe giọng nói" : "Nhập bằng giọng nói"}
                    title={listening ? "Đang nghe" : "Nói để nhập câu hỏi"}
                  >
                    {listening ? (
                      <MicOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Mic className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="btn-kid btn-kid-teal flex min-w-24 items-center gap-2 px-4 py-2 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Gửi</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
