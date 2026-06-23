"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Send, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export function FloatFeedbackButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [userInfo, setUserInfo] = useState("");
  const [isFeatureRequest, setIsFeatureRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          user_info: userInfo,
          feature_request: isFeatureRequest,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi gửi góp ý");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setContent("");
        setUserInfo("");
        setIsFeatureRequest(false);
      }, 3000);
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chỉ hiển thị nút góp ý ở trang chủ (home page)
  if (pathname !== "/") return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            title="Đóng góp ý kiến"
          >
            <MessageSquarePlus size={24} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">Đóng góp ý kiến</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-indigo-100 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 bg-slate-50">
            {isSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-800">Cảm ơn bạn!</h4>
                <p className="text-sm text-slate-600 mt-1">Ý kiến của bạn đã được ghi nhận để phát triển hệ thống.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{error}</p>
                )}
                
                <div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Bạn có ý kiến gì về hệ thống? Có lỗi hay cần tính năng mới nào không?"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 min-h-[100px] resize-none"
                    required
                  />
                </div>
                
                <div>
                  <input
                    type="text"
                    value={userInfo}
                    onChange={(e) => setUserInfo(e.target.value)}
                    placeholder="Email hoặc SĐT (không bắt buộc)"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatureRequest}
                    onChange={(e) => setIsFeatureRequest(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Đây là đề xuất tính năng mới</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Gửi ý kiến
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
