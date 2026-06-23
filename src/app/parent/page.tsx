"use client";

import React, { useState, useEffect } from "react";
import { sfx } from "../../lib/sound";

type ChildStats = {
  nickname: string;
  className: string;
  xp: number;
  level: number;
  status: string;
};

const topicMeta: Record<string, { label: string; icon: string }> = {
  stranger:   { label: "Người lạ trên mạng",   icon: "💬" },
  password:   { label: "Bảo vệ mật khẩu",      icon: "🔑" },
  privacy:    { label: "Quyền riêng tư",        icon: "🔒" },
  behavior:   { label: "Ứng xử văn minh",       icon: "🌐" },
  screentime: { label: "Thời gian màn hình",    icon: "⏰" },
  badcontent: { label: "Nội dung xấu",          icon: "🚫" },
  phishing:   { label: "Lừa đảo trực tuyến",   icon: "🎣" },
};

export default function ParentPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [childStats, setChildStats] = useState<ChildStats | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [accuracies, setAccuracies] = useState<Record<string, number> | null>(null);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [aiGenerated, setAiGenerated] = useState(false);

  const runSearch = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setLoading(true);
    setError("");
    setChildStats(null);
    setAccuracies(null);
    setTotalAnswers(0);

    try {
      const res = await fetch(`/api/parent/child-stats?code=${codeToSearch.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra khi tra cứu.");
      setChildStats(data.child);
      setVulnerabilities(data.vulnerabilities || []);
      setRecommendations(data.recommendations || []);
      setAccuracies(data.accuracies || null);
      setTotalAnswers(data.total_answers || 0);
      setAiGenerated(data.ai_generated || false);
      sfx.correct();
    } catch (err: any) {
      setError(err.message);
      sfx.wrong();
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    sfx.click();
    await runSearch(code);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code")?.trim();
      if (urlCode) {
        setCode(urlCode);
        runSearch(urlCode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusStyle = (status: string) => {
    if (status === "Hoàn thành tốt") return "bg-teal-50 border-teal-200 text-teal-700";
    if (status === "Khá") return "bg-blue-50 border-blue-200 text-blue-700";
    return "bg-amber-50 border-amber-200 text-amber-700";
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return { bar: "bg-teal-500", badge: "bg-teal-50 border-teal-200 text-teal-700" };
    if (acc >= 50) return { bar: "bg-amber-400", badge: "bg-amber-50 border-amber-200 text-amber-700" };
    return { bar: "bg-rose-500", badge: "bg-rose-50 border-rose-200 text-rose-700" };
  };

  const avgAccuracy = accuracies
    ? Math.round(Object.values(accuracies).reduce((a, b) => a + b, 0) / Object.values(accuracies).length)
    : null;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col font-sans">

      {/* ── Header ── */}
      <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center"
          >
            <img
              src="/images/logo.png"
              alt="Bé An Toàn Số"
              className="h-10 w-auto object-contain"
            />
          </button>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-black">
            👨‍👩‍👧‍👦 Cổng Phụ Huynh
          </span>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="w-full py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left: Heading */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-teal-50 border border-teal-100 text-teal-700 rounded-full text-xs font-black uppercase tracking-wider">
              🛡️ Theo dõi hành trình học tập của con
            </span>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight font-nunito">
              Đồng hành cùng con{" "}
              <span className="text-teal-400">an toàn số</span>
            </h1>

            <p className="text-slate-500 text-base font-bold max-w-xl leading-relaxed">
              Tra cứu kết quả học tập, phát hiện điểm yếu kỹ năng và nhận các gợi ý hướng dẫn con tự bảo vệ tại nhà.
            </p>

            {/* Stats strip */}
            <div className="flex gap-8 pt-2">
              {[
                { n: "2,500+", l: "Học sinh" },
                { n: "7", l: "Chủ đề kỹ năng" },
                { n: "14k+", l: "Bài tập hoàn thành" },
              ].map((item) => (
                <div key={item.l}>
                  <div className="font-black text-blue-900 text-xl font-nunito">{item.n}</div>
                  <div className="text-slate-400 text-xs font-bold">{item.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Search form */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm">
              <h2 className="font-black text-slate-800 text-xl mb-1 font-nunito">Tra cứu tiến độ của con</h2>
              <p className="text-slate-400 text-sm font-semibold mb-6">
                Nhập mã liên kết hiển thị trên trang cá nhân hoặc bản đồ học tập của con.
              </p>

              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    Mã liên kết của con
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: PH-XXXXXXXX"
                    required
                    className="input-kid padding-left-4 text-base py-3 font-mono tracking-widest focus:border-blue-600"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold mt-1.5">
                    * Mã hiển thị tại Trang cá nhân hoặc Bản đồ học tập của con.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="btn-kid bg-blue-600 text-white border-blue-800 hover:bg-blue-700 w-full justify-center text-base"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
                      </svg>
                      Đang tra cứu...
                    </span>
                  ) : (
                    "🔍 Xem báo cáo của con"
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold rounded-2xl text-center">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      {childStats && (
        <div className="w-full pb-20 px-6 animate-bounce-in">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Divider */}
            <div className="h-px bg-slate-100 my-2" />

            {/* ── Child Header Card ── */}
            <div className="bg-[#004aad] rounded-[36px] py-10 px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 items-center text-white shadow-xl shadow-blue-900/10">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl font-black text-white shadow">
                  {childStats.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-black text-2xl leading-tight font-nunito">{childStats.nickname}</h2>
                  <p className="text-blue-200 text-sm font-bold mt-0.5">Lớp: {childStats.className}</p>
                </div>
              </div>

              {/* XP */}
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">XP tích lũy</span>
                <span className="text-5xl font-black font-nunito">{childStats.xp}</span>
                <span className="text-blue-200 text-xs font-bold mt-1">Cấp độ {childStats.level}</span>
              </div>

              {/* Status */}
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Đánh giá kỹ năng</span>
                <span className={`px-5 py-2 rounded-full text-sm font-black border-2 ${getStatusStyle(childStats.status)}`}>
                  {childStats.status}
                </span>
                <span className="text-blue-300 text-[10px] font-semibold">{totalAnswers} câu đã làm</span>
              </div>
            </div>

            {/* ── Topic Accuracy Grid ── */}
            {accuracies && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-blue-900 text-xl font-nunito">Kết quả chi tiết theo chủ đề</h3>
                  <span className="text-slate-400 text-xs font-bold">Tổng hợp từ {totalAnswers} câu trả lời</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(topicMeta).map(([key, meta]) => {
                    const acc = accuracies[key] ?? 100;
                    const colors = getAccuracyColor(acc);
                    return (
                      <div key={key} className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm">
                              {meta.icon}
                            </div>
                            <span className="font-black text-slate-800 text-sm font-nunito">{meta.label}</span>
                          </div>
                          <span className={`text-xs font-black px-3 py-1 rounded-full border ${colors.badge}`}>
                            {acc}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                            style={{ width: `${acc}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Average summary card */}
                  {avgAccuracy !== null && (
                    <div className="bg-blue-600 border border-blue-700 rounded-3xl p-5 text-white flex flex-col items-center justify-center text-center gap-1 shadow-md shadow-blue-200/40">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Điểm trung bình</span>
                      <span className="text-5xl font-black font-nunito">{avgAccuracy}%</span>
                      <span className="text-blue-200 text-xs font-bold">toàn bộ {Object.keys(topicMeta).length} chủ đề</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Vulnerabilities + Recommendations ── */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Vulnerabilities */}
              <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-xl">⚠️</div>
                  <div className="flex-1">
                    <h3 className="font-black text-rose-700 text-base font-nunito">Điểm yếu cần cải thiện</h3>
                    {aiGenerated && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-wider">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.09 8.26L2 9.27l5 4.87L5.82 21 12 17.77 18.18 21 17 14.14l5-4.87-7.09-1.01L12 2z"/></svg>
                        Phân tích bởi AI
                      </span>
                    )}
                  </div>
                </div>

                {vulnerabilities.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-slate-400 text-sm font-bold">Không phát hiện điểm yếu đáng lo ngại.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {vulnerabilities.map((v, i) => (
                      <li key={i} className="flex gap-2.5 items-start text-sm font-semibold text-slate-700 leading-relaxed">
                        <span className="text-rose-400 mt-1 shrink-0">●</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-xl">💡</div>
                  <div className="flex-1">
                    <h3 className="font-black text-teal-700 text-base font-nunito">Gợi ý hướng dẫn tại nhà</h3>
                    {aiGenerated && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-wider">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.09 8.26L2 9.27l5 4.87L5.82 21 12 17.77 18.18 21 17 14.14l5-4.87-7.09-1.01L12 2z"/></svg>
                        Phân tích bởi AI
                      </span>
                    )}
                  </div>
                </div>

                {recommendations.length === 0 ? (
                  <p className="text-slate-400 text-sm font-bold py-6 text-center">Duy trì ôn tập định kỳ cùng con.</p>
                ) : (
                  <ul className="space-y-3">
                    {recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2.5 items-start text-sm font-semibold text-slate-700 leading-relaxed">
                        <span className="text-teal-500 mt-1 shrink-0">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* ── CTA Banner ── */}
            <div className="w-full max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-[#e0f2fe]/80 to-[#bae6fd]/20 border border-slate-100 rounded-[36px] py-10 px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <p className="font-black text-blue-900 text-xl font-nunito mb-1">Muốn con tiếp tục luyện tập?</p>
                  <p className="text-slate-500 text-sm font-semibold">Khám phá toàn bộ hành trình học tập và các bài thử thách.</p>
                </div>
                <a
                  href="/"
                  className="bg-blue-600 text-white rounded-full px-8 py-3 font-black text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200/40 shrink-0"
                >
                  🚀 Về trang chủ
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="w-full bg-[#f8fafc] py-8 border-t border-slate-100 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h4 className="font-extrabold text-blue-900 text-base mb-0.5 font-nunito">Bé An Toàn Số</h4>
            <p className="text-xs text-slate-400 font-extrabold">
              © 2026 Bé An Toàn Số. Đồng hành cùng trẻ em Việt trên không gian mạng.
            </p>
          </div>
          <div className="flex gap-x-5 text-xs text-slate-400 font-extrabold">
            <a href="#" className="hover:text-slate-600 transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
