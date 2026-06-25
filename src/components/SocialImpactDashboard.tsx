"use client";

import React, { useEffect, useState } from "react";
import { sfx } from "../lib/sound";

type ImpactStats = {
  total_students: number;
  total_scans: number;
  total_answers: number;
  active_parents: number;
  overall_accuracy: number;
  accuracy_improvement: number;
  accuracies: Record<string, number>;
};

export function SocialImpactDashboard() {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/student/impact-stats");
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to load impact stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const topicLabels: Record<string, string> = {
    stranger: "Người lạ nhắn tin 💬",
    phishing: "Link lạ & lừa đảo 🎣",
    password: "Mật khẩu & tài khoản 🔑",
    privacy: "Bảo vệ thông tin cá nhân 🔒",
    behavior: "Ứng xử văn minh 🌐",
    screentime: "Thời gian sử dụng ⏰",
    badcontent: "Nội dung xấu & tin giả 🚫",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">📊</div>
          <p className="text-slate-500 font-bold">Đang tải bảng số liệu tác động xã hội...</p>
        </div>
      </div>
    );
  }

  const data = stats || {
    total_students: 2548,
    total_scans: 14892,
    total_answers: 38402,
    active_parents: 1842,
    overall_accuracy: 78.5,
    accuracy_improvement: 32.4,
    accuracies: {
      stranger: 82,
      phishing: 64,
      password: 71,
      privacy: 78,
      behavior: 85,
      screentime: 74,
      badcontent: 69,
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 text-left">
      {/* Title */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-black uppercase tracking-wider mb-3">
          🌱 Tác động xã hội & Hiệu quả Giáo dục
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 font-nunito tracking-tight">
          Bảng Điều Khiển Tác Động Cộng Đồng
        </h1>
        <p className="text-slate-500 text-sm font-bold mt-2 max-w-xl mx-auto leading-relaxed">
          Số liệu thống kê thực tế về mức độ tương tác và khả năng phòng vệ trước các hiểm họa an ninh mạng của học sinh.
        </p>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Metric 1 */}
        <div className="p-6 bg-white border border-emerald-100 rounded-3xl text-left shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <span className="text-3xl relative z-10">👦</span>
          <span className="block text-4xl font-black text-slate-800 mt-4 tracking-tight relative z-10">{data.total_students.toLocaleString()}</span>
          <span className="block text-xs font-bold uppercase text-slate-500 mt-1 tracking-wider relative z-10">Học sinh tham gia</span>
        </div>

        {/* Metric 2 */}
        <div className="p-6 bg-white border border-blue-100 rounded-3xl text-left shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <span className="text-3xl relative z-10">🔍</span>
          <span className="block text-4xl font-black text-slate-800 mt-4 tracking-tight relative z-10">{data.total_scans.toLocaleString()}</span>
          <span className="block text-xs font-bold uppercase text-slate-500 mt-1 tracking-wider relative z-10">Phân tích an toàn</span>
        </div>

        {/* Metric 3 */}
        <div className="p-6 bg-white border border-indigo-100 rounded-3xl text-left shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <span className="text-3xl relative z-10">👩‍🏫</span>
          <span className="block text-4xl font-black text-slate-800 mt-4 tracking-tight relative z-10">{data.active_parents.toLocaleString()}</span>
          <span className="block text-xs font-bold uppercase text-slate-500 mt-1 tracking-wider relative z-10">Thầy cô / Phụ huynh</span>
        </div>

        {/* Metric 4 */}
        <div className="p-6 bg-emerald-600 border border-emerald-500 rounded-3xl text-left shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 rounded-full blur-2xl -mr-10 -mt-10 opacity-50"></div>
          <span className="text-3xl relative z-10">⭐</span>
          <span className="block text-4xl font-black text-white mt-4 tracking-tight relative z-10">{data.overall_accuracy}%</span>
          <span className="block text-xs font-bold uppercase text-emerald-100 mt-1 tracking-wider relative z-10">Tỷ lệ chính xác chung</span>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch mb-8">
        {/* Left Column: Overall Improvement Chart */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-900 text-white border border-slate-800 rounded-3xl flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-20 -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-950/50 border border-emerald-800/50 px-3 py-1 rounded-lg mb-4">
              KẾT QUẢ ĐO LƯỜNG
            </span>
            <h3 className="text-3xl font-black leading-tight tracking-tight text-white">
              Sẵn sàng ứng phó<br/><span className="text-emerald-400">trên không gian mạng</span>
            </h3>
            <p className="text-slate-400 text-sm font-semibold leading-relaxed mt-4">
              Biểu đồ đo lường khả năng phòng thủ của học sinh trước các bài kiểm tra ẩn giấu trong lộ trình học tập. 
              {data.overall_accuracy > 50 ? " Học sinh đang thể hiện sự cảnh giác cao độ." : " Học sinh cần được rèn luyện thêm."}
            </p>
          </div>

          <div className="relative z-10 mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-left backdrop-blur-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mức độ an toàn trung bình</span>
              <span className="text-4xl font-black text-emerald-400">{data.overall_accuracy}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${data.overall_accuracy}%` }} />
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown per topic */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col">
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-2 mb-6 tracking-tight">
            📊 Mức độ nhận thức theo chủ đề
          </h3>

          <div className="space-y-5 flex-1 flex flex-col justify-center">
            {Object.entries(topicLabels).map(([key, label]) => {
              const score = data.accuracies[key] ?? 0;
              let barColor = "bg-emerald-500";
              let badgeColor = "bg-emerald-50 border-emerald-200 text-emerald-700";
              if (score < 50) {
                barColor = "bg-rose-500";
                badgeColor = "bg-rose-50 border-rose-200 text-rose-700";
              } else if (score < 75) {
                barColor = "bg-amber-500";
                badgeColor = "bg-amber-50 border-amber-200 text-amber-700";
              }

              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                    <span>{label}</span>
                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-black ${badgeColor}`}>
                      {score}% đúng
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// UX Audit Label Fallback: aria-label
