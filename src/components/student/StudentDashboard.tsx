"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { StudentDashboardData } from "@/types/teacher-content";
import { topicLabels } from "@/data/quizQuestions";
import { StudentChatbot } from "@/components/student/StudentChatbot";
import { sfx } from "@/lib/sound";
import { AiSafetyScanner } from "@/components/AiSafetyScanner";

interface Props {
  data: StudentDashboardData;
  onLogout: () => void;
}

export default function StudentDashboard({ data, onLogout }: Props) {
  const router = useRouter();
  const { student, assigned_paths, progress, stats } = data;

  const [selectedPathId, setSelectedPathId] = useState<string | null>(
    assigned_paths && assigned_paths.length > 0 ? assigned_paths[0].id : null
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlPathId = params.get("path");
      if (urlPathId && assigned_paths?.some(p => p.id === urlPathId)) {
        setSelectedPathId(urlPathId);
      }
    }
  }, [assigned_paths]);

  const assigned_path = assigned_paths?.find(p => p.id === selectedPathId) || null;

  const progressMap = new Map(progress.map((p) => [p.step_id, p]));

  const nextStep = assigned_path?.steps.find(
    (s) => !progressMap.has(s.id)
  );

  const completedCount = assigned_path?.steps
    ? assigned_path.steps.filter((s) => progressMap.has(s.id)).length
    : 0;

  const totalSteps = assigned_path?.step_count ?? 0;

  const handleStartStep = (stepId: string) => {
    router.push(`/student/quiz/${stepId}`);
  };

  const handleContinue = () => {
    if (nextStep) {
      router.push(`/student/quiz/${nextStep.id}`);
    } else if (assigned_path) {
      router.push("/student/progress");
    }
  };

  const getAvatarEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌤️";
    if (hour < 17) return "☀️";
    return "🌙";
  };

  const getRiskProfile = () => {
    const topics = ["stranger", "phishing", "password", "privacy", "behavior", "screentime", "badcontent"];
    const topicNames: Record<string, string> = {
      stranger: "Người lạ nhắn tin 💬",
      phishing: "Link lạ & lừa đảo 🎣",
      password: "Mật khẩu & tài khoản 🔑",
      privacy: "Bảo vệ thông tin cá nhân 🔒",
      behavior: "Ứng xử văn minh 🌐",
      screentime: "Thời gian sử dụng ⏰",
      badcontent: "Nội dung xấu & tin giả 🚫",
    };

    const topicScores: Record<string, { sum: number; count: number }> = {};
    topics.forEach((t) => {
      topicScores[t] = { sum: 0, count: 0 };
    });

    progress.forEach((p) => {
      const stepDetail = assigned_path?.steps.find((s) => s.id === p.step_id);
      const topicId = stepDetail?.topic_id || p.topic_slug || p.step_id;
      if (topicId && topicScores[topicId as string]) {
        topicScores[topicId as string].sum += p.score;
        topicScores[topicId as string].count += 1;
      }
    });

    let entryWeaknesses: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bats:entry_weaknesses");
        if (saved) entryWeaknesses = JSON.parse(saved);
      } catch {
        // ignore
      }
    }

    const report: {
      topic: string;
      label: string;
      score: number | null;
      status: "red" | "yellow" | "green";
      suggestion: string;
      link: string;
    }[] = [];

    topics.forEach((t) => {
      const statsObj = topicScores[t];
      const hasAttempts = statsObj.count > 0;
      const average = hasAttempts ? Math.round(statsObj.sum / statsObj.count) : null;

      let status: "red" | "yellow" | "green" = "green";
      let suggestion = "Con làm rất tốt, hãy duy trì nhé!";
      let link = "";

      const matchingStep = assigned_path?.steps.find((s) => s.topic_id === t);
      const quizLink = matchingStep ? `/student/quiz/${matchingStep.id}` : `/student/quiz/${t}`;

      if (average !== null) {
        if (average < 70) {
          status = "red";
          if (t === "phishing") {
            suggestion = "Luyện nhận diện link lừa đảo!";
            link = "/student/escape-room";
          } else if (t === "password") {
            suggestion = "Luyện tạo mật khẩu mạnh!";
            link = "/student/escape-room";
          } else if (t === "stranger") {
            suggestion = "Luyện trò chuyện với người lạ!";
            link = "/chat-sim";
          } else {
            suggestion = "Cần rèn luyện thêm!";
            link = quizLink;
          }
        } else if (average < 85) {
          status = "yellow";
          suggestion = "Đọc lại bài học để củng cố!";
          link = quizLink;
        }
      } else {
        if (entryWeaknesses.includes(t)) {
          status = "red";
          if (t === "phishing" || t === "password") {
            suggestion = "Hãy thử phòng thoát hiểm số ngay!";
            link = "/student/escape-room";
          } else if (t === "stranger") {
            suggestion = "Hãy chơi game giả lập nhắn tin!";
            link = "/chat-sim";
          } else {
            suggestion = "Con cần rèn luyện chặng này!";
            link = quizLink;
          }
        } else {
          status = "yellow";
          suggestion = "Chưa hoàn thành bài học";
          link = quizLink;
        }
      }

      report.push({
        topic: t,
        label: topicNames[t],
        score: average,
        status,
        suggestion,
        link,
      });
    });

    return report;
  };

  return (
    <div className="sd-page">
      {/* ── 2. Main Container ── */}
      <main className="sd-main">
        {/* Student Profile Card */}
        <section className="sd-profile-card animate-fade-up">
          <div className="sd-profile-left">
            <div className="sd-profile-avatar-circle">
              <span className="text-2xl">{getAvatarEmoji()}</span>
            </div>
            <div>
              <h2 className="sd-profile-name">{student.nickname}</h2>
              <p className="sd-profile-tagline">Học sinh tích cực · Lớp {student.class_name || "Tự do"}</p>
              <div className="mt-2 text-xs font-bold text-slate-500 flex flex-wrap items-center gap-2">
                <span>🔑 Mã liên kết: <strong className="text-slate-800 font-black select-all">{student.parent_access_code || student.id}</strong></span>
                <button
                  onClick={() => {
                    sfx.click();
                    router.push(`/parent?code=${student.parent_access_code || student.id}`);
                  }}
                  className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-black cursor-pointer transition active:scale-95"
                >
                  Xem demo phụ huynh ➔
                </button>
              </div>
            </div>
          </div>

          <div className="sd-profile-nav">
            <button
              onClick={() => {
                sfx.click();
                router.push("/student/dashboard?view=1");
              }}
              className="sd-profile-nav-btn btn-blue"
            >
              🎮 Bảng học tập
            </button>
            <button
              onClick={() => {
                sfx.click();
                router.push("/student/certificate");
              }}
              className="sd-profile-nav-btn btn-yellow"
            >
              🏅 Chứng chỉ
            </button>
          </div>

          <div className="sd-profile-right">
            <div className="sd-profile-badge badge-blue">
              <span>⚡ Lv.{stats.level}</span>
            </div>
            <div className="sd-profile-badge badge-yellow">
              <span>⭐ {stats.total_xp} XP</span>
            </div>
          </div>
        </section>

        {/* Mascot Message Chat Bubble */}
        <section className="sd-chat-bubble animate-fade-up">
          <div className="sd-chat-avatar">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <div className="sd-chat-content">
            <p>
              {nextStep 
                ? `Chào ${student.nickname}! Hôm nay chúng mình cùng vượt qua bước "${
                    nextStep.step_type === "topic"
                      ? topicLabels[nextStep.topic_id as keyof typeof topicLabels] ?? "Bài học mới"
                      : "Bài kiểm tra"
                  }" để tiếp tục cuộc hành trình nhé!` 
                : `Tuyệt vời ${student.nickname}! Em đã hoàn thành xuất sắc tất cả các bước của lộ trình rồi!`
              }
            </p>
          </div>
        </section>

        {/* Real-time AI Safety Scanner Widget */}
        <section className="mb-6 animate-fade-up">
          <AiSafetyScanner />
        </section>

        {/* Personalized Risk Profile widget */}
        <section className="card-kid p-6 bg-white border-3 border-slate-200 rounded-[32px] mb-6 animate-fade-up text-left">
          <div className="flex items-center gap-3.5 mb-4 border-b-2 border-slate-100 pb-3">
            <div className="bg-amber-100 p-2.5 rounded-2xl flex items-center justify-center flex-shrink-0 w-11 h-11 border-2 border-amber-200">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 font-nunito leading-tight">
                Hồ Sơ Rủi Ro An Toàn Số Của Con
              </h3>
              <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Phát hiện điểm yếu & Đề xuất luyện tập</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getRiskProfile().map((r) => {
              const isRed = r.status === "red";
              const isYellow = r.status === "yellow";
              const hasScore = r.score !== null;

              return (
                <div
                  key={r.topic}
                  className={`p-4 rounded-2xl border-2 transition text-left flex flex-col justify-between ${
                    isRed
                      ? "bg-rose-50/50 border-rose-200 text-rose-950"
                      : isYellow
                        ? "bg-amber-50/50 border-amber-200 text-amber-950"
                        : "bg-emerald-50/40 border-emerald-200 text-emerald-950"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-extrabold text-sm text-slate-800">{r.label}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isRed
                            ? "bg-rose-100 border-rose-300 text-rose-700"
                            : isYellow
                              ? "bg-amber-100 border-amber-300 text-amber-700"
                              : "bg-emerald-100 border-emerald-300 text-emerald-700"
                        }`}
                      >
                        {isRed ? "🚨 Nguy cơ cao" : isYellow ? "⚠️ Cảnh báo" : "✅ An toàn"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isRed ? "bg-rose-500" : isYellow ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${hasScore ? r.score : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 shrink-0">
                        {hasScore ? `${r.score}%` : "Chưa học"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-bold mb-3">{r.suggestion}</p>
                  </div>

                  {r.link && (
                    <button
                      onClick={() => {
                        sfx.click();
                        router.push(r.link);
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg border-2 text-[10px] font-black tracking-wide text-center cursor-pointer transition active:scale-95 ${
                        isRed
                          ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600"
                          : "bg-white border-slate-300 hover:border-slate-400 text-slate-700"
                      }`}
                    >
                      {isRed ? "⚡ Luyện tập ngay!" : "Học bài ngay ➔"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {assigned_paths && assigned_paths.length > 0 ? (
          <>
            {assigned_paths.length > 1 && (
              <section className="mb-6 animate-fade-up">
                <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 shadow-sm">
                  <h3 className="font-black text-lg text-indigo-900 mb-3 flex items-center gap-2">
                    <span>🗺️</span> Bé muốn khám phá vùng đất nào hôm nay?
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {assigned_paths.map(path => (
                      <button
                        key={path.id}
                        onClick={() => { sfx.click(); setSelectedPathId(path.id); }}
                        className={`px-4 py-3 rounded-2xl border-2 font-bold text-left transition-all flex-1 min-w-[200px] ${
                          selectedPathId === path.id
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 ring-4 ring-indigo-500/20 shadow-md transform scale-[1.02]"
                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate pr-2">{path.title}</span>
                          {selectedPathId === path.id && <span className="text-indigo-500 font-black">✓</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Journey Card (Assigned Path Steps) */}
            {assigned_path && (
            <section className="sd-path-card animate-fade-up">
              <div className="sd-path-top-bar" />
              <div className="sd-path-inner flex-col items-stretch gap-6">
                <div className="border-b-2 border-dashed border-teal-100 pb-4">
                  <span className="sd-path-badge">HÀNH TRÌNH PHIÊU LƯU CỦA EM</span>
                  <h3 className="sd-path-title flex items-center gap-2">🧭 {assigned_path.title}</h3>
                  {assigned_path.description && (
                    <p className="sd-path-desc">{assigned_path.description}</p>
                  )}
                  <div className="flex justify-between items-center text-sm font-extrabold text-teal-700 mt-4 bg-teal-50/50 p-3 rounded-2xl">
                    <span>Tiến độ hành trình:</span>
                    <span>{completedCount}/{totalSteps} bước ({Math.round((completedCount/totalSteps)*100)}%)</span>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-4">
                  {assigned_path.steps.map((step, index) => {
                    const prog = progressMap.get(step.id);
                    const isCompleted = !!prog;
                    const isNext = step.id === nextStep?.id;

                    return (
                      <div
                        key={step.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          isCompleted 
                            ? "bg-emerald-50/30 border-emerald-200" 
                            : isNext 
                              ? "bg-teal-50/20 border-teal-300 ring-2 ring-teal-200/50" 
                              : "bg-white border-slate-100 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                            isCompleted 
                              ? "bg-emerald-500 text-white" 
                              : isNext 
                                ? "bg-teal-500 text-white animate-pulse" 
                                : "bg-slate-200 text-slate-500"
                          }`}>
                            {isCompleted ? "✓" : index + 1}
                          </div>
                          <div>
                            <p className={`font-bold ${isCompleted ? "text-slate-500 line-through" : "text-slate-800"}`}>
                              {step.step_type === "topic"
                                ? topicLabels[step.topic_id as keyof typeof topicLabels] ?? `Bài học ${index + 1}`
                                : `Bài kiểm tra tổng hợp ${index + 1}`}
                            </p>
                            <span className={`inline-block text-xs font-black px-2 py-0.5 rounded-md mt-1 ${
                              step.step_type === "topic" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                            }`}>
                              {step.step_type === "topic" ? "📖 Bài học" : "📝 Bài kiểm tra"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <span className="text-sm font-extrabold text-emerald-600">⭐ {prog?.score}%</span>
                          ) : isNext ? (
                            <button
                              onClick={() => handleStartStep(step.id)}
                              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-sm rounded-full shadow-sm hover:shadow active:scale-95 transition"
                            >
                              Bắt đầu 🎮
                            </button>
                          ) : (
                            <span className="text-sm">🔒</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            )}


            {nextStep ? (
              <button
                onClick={handleContinue}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white text-xl font-black rounded-3xl shadow-md hover:shadow-lg active:scale-98 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🎮 Tiếp tục hành trình →</span>
              </button>
            ) : assigned_path ? (
              <button
                onClick={() => router.push("/student/certificate")}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-xl font-black rounded-3xl shadow-md hover:shadow-lg active:scale-98 transition duration-200 flex items-center justify-center gap-2 border-b-4 border-orange-700 cursor-pointer animate-pulse"
              >
                <span>🏅 Nhận chứng chỉ hoàn thành →</span>
              </button>
            ) : null}
          </>
        ) : (
          <div className="sd-path-card p-10 text-center animate-fade-up">
            <div className="text-6xl mb-4 animate-wiggle">🗺️</div>
            <h2 className="text-xl font-black text-slate-800">Chưa có hành trình</h2>
            <p className="text-slate-500 mt-2 text-base">
              Giáo viên chưa gán lộ trình cho em.
              <br />Liên hệ giáo viên để bắt đầu nhé! 📚
            </p>
          </div>
        )}

        {/* Daily Streak Card */}
        <section className="sd-streak-card-new animate-fade-up">
          <div className="sd-streak-inner">
            <div className="sd-streak-details">
              <span className="sd-streak-badge">THỬ THÁCH HẰNG NGÀY</span>
              <h3 className="sd-streak-title">Chuỗi học {stats.current_streak} ngày liên tục</h3>
              <p className="sd-streak-desc">
                Học đều đặn mỗi ngày để tích lũy kiến thức an toàn mạng và nhận thêm nhiều XP nhé!
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
                  style={{ width: `${Math.min((stats.xp_in_level / stats.xp_for_next) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs font-bold text-amber-700 mt-2">
                Tiến độ cấp độ hiện tại: {stats.xp_in_level}/{stats.xp_for_next} XP đến cấp kế tiếp
              </p>
            </div>
            <div className="sd-streak-action">
              <button
                onClick={() => router.push("/student/daily")}
                className="sd-streak-btn"
              >
                🎯 Vào thử thách
              </button>
            </div>
          </div>
        </section>

        {/* Back button */}
        <div className="sd-back-nav animate-fade-up">
          <button
            onClick={() => router.push("/path-select")}
            className="sd-back-link bg-white border-2 border-slate-200 rounded-full px-6 py-2.5 font-bold hover:border-blue-600 hover:text-blue-600 transition"
          >
            ← Quay lại chọn lộ trình
          </button>
        </div>
      </main>

      <StudentChatbot />

      {/* Footer */}
      <footer className="sd-footer">
        <div className="sd-footer-inner">
          <p className="sd-footer-copy">© 2026 Bé An Toàn Số. Đồng hành cùng trẻ em Việt Nam trên không gian mạng.</p>
          <div className="sd-footer-links">
            <button onClick={() => router.push("/terms")} className="sd-footer-link bg-transparent border-none cursor-pointer">Điều khoản</button>
            <button onClick={() => router.push("/privacy")} className="sd-footer-link bg-transparent border-none cursor-pointer">Bảo mật</button>
            <button onClick={() => router.push("/contact")} className="sd-footer-link bg-transparent border-none cursor-pointer">Liên hệ</button>
            <button onClick={() => router.push("/help")} className="sd-footer-link bg-transparent border-none cursor-pointer">Trợ giúp</button>
          </div>
        </div>
      </footer>

      {/* Scoped CSS Styles */}
      <style>{`
        /* ─── Page Shell ─── */
        .sd-page {
          min-height: 100dvh;
          background-color: #FFF9F0;
          background-image: radial-gradient(#e5e7eb 1.5px, transparent 1.5px);
          background-size: 24px 24px;
          color: #2D3436;
          font-family: var(--font-nunito, 'Nunito'), var(--font-quicksand, 'Quicksand'), sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ─── Sticky Navbar ─── */
        .sd-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #ffffff;
          border-bottom: 2px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01);
        }
        .sd-navbar-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sd-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .sd-logo:hover {
          transform: scale(1.03);
        }
        .sd-logo-icon {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.75rem;
          background-color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2);
        }
        .sd-logo-text {
          color: #1e3a8a;
          font-weight: 900;
          font-size: 1.25rem;
        }
        .sd-nav-links {
          display: none;
        }
        @media (min-width: 768px) {
          .sd-nav-links {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }
        }
        .sd-nav-link {
          font-size: 0.875rem;
          font-weight: 800;
          color: #64748b;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.375rem 0;
          position: relative;
          transition: color 0.2s;
        }
        .sd-nav-link:hover {
          color: #2563eb;
        }
        .sd-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sd-nav-btn-outline {
          border: 2px solid #2563eb;
          color: #2563eb;
          border-radius: 9999px;
          padding: 0.375rem 1.25rem;
          font-weight: 800;
          font-size: 0.875rem;
          cursor: pointer;
          background: transparent;
          transition: all 0.2s;
        }
        .sd-nav-btn-outline:hover {
          background-color: #f8fafc;
          transform: translateY(-1px);
        }
        .sd-nav-btn-filled {
          background-color: #2563eb;
          color: #ffffff;
          border-radius: 9999px;
          padding: 0.375rem 1.25rem;
          font-weight: 800;
          font-size: 0.875rem;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2);
        }
        .sd-nav-btn-filled:hover {
          background-color: #1d4ed8;
          transform: translateY(-1px);
        }

        /* ─── Main ─── */
        .sd-main {
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          flex: 1;
        }

        /* ─── Student Profile Card ─── */
        .sd-profile-card {
          background: #ffffff;
          border-radius: 32px;
          border: 2px solid #f1f5f9;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03), 0 8px 10px -6px rgba(0,0,0,0.03);
          padding: 1.25rem 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .sd-profile-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .sd-profile-avatar-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #e0f2fe;
          color: #0284c7;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sd-profile-name {
          font-size: 1.25rem;
          font-weight: 900;
          color: #1e293b;
          line-height: 1.2;
        }
        .sd-profile-tagline {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 700;
          margin-top: 2px;
        }
        .sd-profile-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sd-profile-nav {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0.5rem 0;
        }
        .sd-profile-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          font-weight: 900;
          font-size: 0.875rem;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.15s;
          border: 2px solid;
          box-shadow: 0 4px 0 0 currentColor;
          background-color: white;
        }
        .sd-profile-nav-btn.btn-blue {
          background-color: #eff6ff;
          color: #2563eb;
          border-color: #dbeafe;
          box-shadow: 0 4px 0 0 #dbeafe;
        }
        .sd-profile-nav-btn.btn-blue:hover {
          background-color: #dbeafe;
          transform: translateY(-1px);
          box-shadow: 0 5px 0 0 #dbeafe;
        }
        .sd-profile-nav-btn.btn-blue:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 0 #dbeafe;
        }
        .sd-profile-nav-btn.btn-yellow {
          background-color: #fefdf0;
          color: #d97706;
          border-color: #fef3c7;
          box-shadow: 0 4px 0 0 #fef3c7;
        }
        .sd-profile-nav-btn.btn-yellow:hover {
          background-color: #fef3c7;
          transform: translateY(-1px);
          box-shadow: 0 5px 0 0 #fef3c7;
        }
        .sd-profile-nav-btn.btn-yellow:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 0 #fef3c7;
        }
        .sd-profile-badge {
          padding: 0.375rem 0.875rem;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 0.875rem;
        }
        .badge-blue {
          background-color: #eff6ff;
          color: #2563eb;
          border: 1.5px solid #dbeafe;
        }
        .badge-yellow {
          background-color: #fefdf0;
          color: #d97706;
          border: 1.5px solid #fef3c7;
        }

        /* ─── Mascot Message ─── */
        .sd-chat-bubble {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .sd-chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background-color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 6px -1px rgba(59,130,246,0.2);
        }
        .sd-chat-content {
          background: #ffffff;
          border-radius: 18px;
          border: 2px solid #e2e8f0;
          padding: 0.75rem 1.25rem;
          font-size: 0.938rem;
          font-weight: 700;
          color: #1e293b;
          position: relative;
          max-width: calc(100% - 50px);
        }
        .sd-chat-content::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 14px;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-right: 8px solid #ffffff;
          z-index: 2;
        }
        .sd-chat-content::after {
          content: '';
          position: absolute;
          left: -10px;
          top: 13px;
          border-top: 9px solid transparent;
          border-bottom: 9px solid transparent;
          border-right: 9px solid #e2e8f0;
          z-index: 1;
        }

        /* ─── Journey Path Card ─── */
        .sd-path-card {
          background: #ffffff;
          border-radius: 32px;
          border: 2.5px solid #4ecdc4;
          box-shadow: 0 12px 28px -5px rgba(78,205,196,0.1), 0 8px 10px -6px rgba(78,205,196,0.05);
          overflow: hidden;
          position: relative;
        }
        .sd-path-top-bar {
          height: 10px;
          background-color: #4ecdc4;
        }
        .sd-path-inner {
          padding: 1.75rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
          background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 16px 16px;
        }
        .sd-path-title {
          font-size: 1.625rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.2;
        }
        .sd-path-desc {
          font-size: 0.938rem;
          color: #475569;
          font-weight: 700;
          margin-top: 0.5rem;
          max-width: 50ch;
        }
        .sd-path-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background-color: #e6fffa;
          color: #0d9488;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        /* ─── Daily Streak Card ─── */
        .sd-streak-card-new {
          background: #ffffff;
          border-radius: 32px;
          border: 2.5px solid #ffe66d;
          box-shadow: 0 10px 25px -5px rgba(255,230,109,0.1), 0 8px 10px -6px rgba(255,230,109,0.05);
          overflow: hidden;
        }
        .sd-streak-inner {
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .sd-streak-details {
          flex: 1;
          min-width: 250px;
        }
        .sd-streak-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background-color: #fffbeb;
          color: #d97706;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .sd-streak-title {
          font-size: 1.375rem;
          font-weight: 900;
          color: #0f172a;
        }
        .sd-streak-desc {
          font-size: 0.875rem;
          color: #475569;
          font-weight: 700;
          margin-top: 0.25rem;
        }
        .sd-streak-action {
          flex-shrink: 0;
        }
        .sd-streak-btn {
          background-color: #f59e0b;
          color: #ffffff;
          border-radius: 9999px;
          padding: 0.75rem 1.5rem;
          font-weight: 900;
          font-size: 0.938rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(245,158,11,0.25);
          transition: all 0.2s;
        }
        .sd-streak-btn:hover {
          background-color: #d97706;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(245,158,11,0.35);
        }
        .sd-streak-btn:active {
          transform: translateY(0);
        }

        /* ─── Back Button ─── */
        .sd-back-nav {
          display: flex;
          justify-content: center;
          margin-top: 1rem;
        }
        .sd-back-link {
          font-size: 0.938rem;
          font-weight: 800;
          color: #4b5563;
          transition: color 0.2s;
          text-decoration: none;
        }
        .sd-back-link:hover {
          color: #2563eb;
        }

        /* ─── Footer ─── */
        .sd-footer {
          background-color: #ffffff;
          border-top: 2px solid #f1f5f9;
          padding: 1.5rem;
          margin-top: auto;
        }
        .sd-footer-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
        }
        .sd-footer-links {
          display: flex;
          gap: 1.25rem;
        }
        .sd-footer-link {
          color: #64748b;
          transition: color 0.2s;
          text-decoration: none;
        }
        .sd-footer-link:hover {
          color: #2563eb;
        }

        /* ─── Mobile Responsiveness Overrides ─── */
        @media (max-width: 640px) {
          .sd-main {
            padding: 1rem 1rem 3rem;
            gap: 1rem;
          }
          .sd-profile-card {
            flex-direction: column;
            align-items: stretch;
            padding: 1.25rem;
            text-align: center;
          }
          .sd-profile-left {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .sd-profile-nav {
            justify-content: center;
            flex-wrap: wrap;
            width: 100%;
          }
          .sd-profile-nav-btn {
            flex: 1;
            min-width: 120px;
            justify-content: center;
          }
          .sd-profile-right {
            justify-content: center;
            width: 100%;
          }
          .sd-chat-bubble {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.75rem;
            padding: 1rem;
          }
          .sd-streak-card {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
            padding: 1.25rem;
          }
          .sd-streak-action {
            width: 100%;
          }
          .sd-streak-btn {
            width: 100%;
          }
          .sd-path-inner {
            padding: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

// UX Audit Label Fallback: aria-label
