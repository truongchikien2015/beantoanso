"use client";

import { useState, useRef } from "react";
import { sfx } from "../lib/sound";
import { AuthModal } from "./AuthModal";

export function HomeScreen({
  onStart,
  onLeaderboard,
  onAdmin,
  onLessons,
  onDaily,
  onClassify,
  onTeacher,
}: {
  onStart: (name: string, gender: string, birthYear: number) => void;
  onLeaderboard: () => void;
  onAdmin: () => void;
  onLessons: () => void;
  onDaily: () => void;
  onClassify: () => void;
  onTeacher: () => void;
}) {
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState<string>("2014");
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  const founderRef = useRef<HTMLDivElement>(null);

  const canStart = name.trim().length > 0;

  const handleStart = () => {
    if (!canStart) return;
    sfx.start();
    onStart(name.trim(), "other", parseInt(birthYear || "2014", 10));
  };

  const handleAuthSuccess = (user: any, profile: any) => {
    setShowAuth(false);
    sfx.start();
    const fullName = profile?.full_name || user?.email || "Bạn";
    const userGender = profile?.gender || "other";
    const userBirthYear = profile?.birth_year || 2010;
    onStart(fullName, userGender, userBirthYear);
  };

  const openAuth = (tab: "login" | "register") => {
    sfx.click();
    setAuthTab(tab);
    setShowAuth(true);
  };

  const handleScrollToFounder = (e: React.MouseEvent) => {
    e.preventDefault();
    sfx.click();
    founderRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLessonClick = (topic: string) => {
    sfx.click();
    window.location.href = `/lessons?topic=${topic}`;
  };

  return (
    <div className="kid-paper-page min-h-screen overflow-x-hidden flex flex-col font-sans">
      {/* ── 1. Header ── */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { sfx.click(); window.location.href = "/"; }}>
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"></path>
            </svg>
            <span className="text-[var(--kid-ink)] font-black text-xl flex items-center gap-1 tracking-tight">
              Bé An Toàn Số
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#lessons" onClick={(e) => { e.preventDefault(); sfx.click(); onLessons(); }} className="hover:text-emerald-700 transition-colors">Khóa học</a>
            <a href="#daily" onClick={(e) => { e.preventDefault(); sfx.click(); onDaily(); }} className="hover:text-emerald-700 transition-colors">Thử thách</a>
            <a href="#leaderboard" onClick={(e) => { e.preventDefault(); sfx.click(); onLeaderboard(); }} className="hover:text-emerald-700 transition-colors">Vinh danh</a>
            <a href="#about" onClick={handleScrollToFounder} className="hover:text-emerald-700 transition-colors">Về tác giả</a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuth("login")}
              className="px-5 py-2 text-sm font-bold text-slate-700 hover:text-emerald-700 bg-white border border-slate-200 hover:border-emerald-600 rounded-full transition-all cursor-pointer"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => openAuth("register")}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="relative pt-12 pb-12 px-6 max-w-6xl mx-auto flex flex-col items-center flex-1">
        {/* Mascot Avatars */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="w-14 h-14 bg-rose-100 border-2 border-white shadow-md rounded-full flex items-center justify-center text-2xl -rotate-6 animate-float">
            👧
          </div>
          <div className="w-14 h-14 bg-emerald-100 border-2 border-white shadow-md rounded-full flex items-center justify-center text-2xl rotate-6 animate-float delay-150">
            🤖
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight text-center max-w-2xl">
          Học Internet <span className="text-rose-500 font-extrabold">an toàn</span> cùng em
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm font-bold mt-4 text-center max-w-lg leading-relaxed">
          Nhập tên, chọn lộ trình, rồi bắt đầu bài học đầu tiên. Khám phá thế giới số một cách vui vẻ và an toàn!
        </p>

        {/* ── 3. Quick Start Card ── */}
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 p-6 shadow-xl/50 mt-8 mb-16 relative">
          <h2 className="text-center font-black text-slate-800 text-lg mb-6">
            Bắt đầu nhanh
          </h2>

          <div className="space-y-4">
            {/* Tên của em */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                Tên của em
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                maxLength={30}
                placeholder="Ví dụ: Bé Minh"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-slate-700 font-bold transition-all placeholder:text-slate-300"
                autoComplete="given-name"
              />
            </div>

            {/* Năm sinh */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                Năm sinh
              </label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-slate-700 font-bold transition-all placeholder:text-slate-300"
                placeholder="2014"
                min={1990}
                max={new Date().getFullYear()}
              />
            </div>

            {/* Bắt đầu học Button */}
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="w-full py-4 bg-rose-300 hover:bg-rose-400 text-white font-black text-lg rounded-2xl border-b-4 border-rose-500/30 transition-all transform active:translate-y-0.5 disabled:opacity-50 disabled:transform-none cursor-pointer mt-4"
            >
              Bắt đầu học
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">hoặc</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Đăng nhập để lưu điểm Button */}
            <button
              onClick={() => openAuth("login")}
              className="w-full py-3.5 bg-[#4ECDC4] hover:bg-[#3dbdb3] text-white font-black text-base rounded-2xl border-b-4 border-[#35ada4]/30 transition-all transform active:translate-y-0.5 cursor-pointer"
            >
              Đăng nhập để lưu điểm
            </button>
          </div>
        </div>
      </section>

      {/* ── 4. Founder Section ── */}
      <section id="about" ref={founderRef} className="w-full bg-[#f4f7fe]/70 py-16 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-12 gap-10 items-center">
          {/* Graduation Image & floating badge */}
          <div className="md:col-span-5 flex flex-col items-center relative">
            <div className="relative p-2 bg-gradient-to-tr from-rose-200 to-amber-100 rounded-[36px] shadow-lg max-w-sm w-full">
              <img
                src="/images/graduation_author.png"
                alt="Chân dung tác giả"
                className="w-full rounded-[30px] object-cover shadow-inner"
              />
            </div>
            {/* Floating author tag */}
            <div className="absolute -bottom-4 right-4 bg-white border border-slate-100 shadow-md py-2.5 px-4 rounded-2xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#4ECDC4] flex items-center justify-center text-lg shadow-sm">
                🤖
              </div>
              <div className="leading-tight">
                <p className="text-[10px] text-slate-400 font-extrabold leading-none">Tác giả</p>
                <p className="text-xs text-slate-700 font-extrabold leading-tight">Trương Chí Kiên</p>
              </div>
            </div>
          </div>

          {/* Narrative Content */}
          <div className="md:col-span-7 flex flex-col items-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 text-rose-500 rounded-full text-xs font-black mb-4">
              ❤️ Tâm sự từ người sáng lập
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mb-6">
              Xây dựng không gian mạng <span className="text-emerald-800">an toàn cho trẻ em</span>
            </h2>
            <div className="space-y-4 text-slate-500 text-sm font-bold leading-relaxed">
              <p>
                Xin chào! Mình là Trương Chí Kiên. Nhận thấy trẻ em ngày nay tiếp xúc với Internet từ rất sớm nhưng lại thiếu các kỹ năng tự bảo vệ, mình đã tạo ra &quot;Bé An Toàn Số&quot; với mong muốn đóng góp một phần nhỏ bé cho cộng đồng.
              </p>
              <p>
                Trang web được thiết kế như một trò chơi tương tác, nơi các em có thể hóa thân thành những &quot;Hiệp sĩ không gian mạng&quot;, trải qua các thử thách để học cách nhận biết lừa đảo, bảo vệ thông tin cá nhân và ứng xử văn minh trên môi trường số.
              </p>
            </div>
            {/* Hashtags */}
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-full text-xs font-extrabold hover:border-slate-300 hover:text-slate-600 transition-colors">
                #GiaoDucTuoiTeens
              </span>
              <span className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-full text-xs font-extrabold hover:border-slate-300 hover:text-slate-600 transition-colors">
                #AnToanMang
              </span>
              <span className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-full text-xs font-extrabold hover:border-slate-300 hover:text-slate-600 transition-colors">
                #HocMaChoi
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Lessons Section ── */}
      <section id="lessons" className="w-full py-20 max-w-5xl mx-auto px-6">
        <h2 className="text-center text-3xl font-black text-slate-800 tracking-tight mb-2">
          Khám phá các <span className="text-rose-400">bài học thú vị</span>
        </h2>
        <p className="text-center text-slate-400 text-sm font-bold max-w-md mx-auto leading-relaxed mb-12">
          Mỗi bài học chỉ vài phút. Đúng hay sai đều có giải thích dễ hiểu. Học mà chơi - chơi mà học.
        </p>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Password */}
          <div
            onClick={() => handleLessonClick("password")}
            className="bg-[#ecf3fe]/80 border border-slate-100/50 rounded-[32px] p-8 flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl text-slate-600">
                  💬
                </div>
                <span className="px-3 py-1 bg-rose-100 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Cobalt
                </span>
              </div>
              <h3 className="text-slate-850 font-black text-xl mb-3">An toàn mật khẩu</h3>
              <p className="text-slate-400 text-sm font-semibold leading-relaxed mb-6">
                Học cách tạo mật khẩu siêu mạnh như một chiếc két sắt không thể phá vỡ, bảo vệ tài khoản khỏi những kẻ xấu trên mạng.
              </p>
            </div>
            <button className="self-start px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 transition-all cursor-pointer">
              Học ngay <span className="text-sm">→</span>
            </button>
          </div>

          {/* Card 2: Phishing */}
          <div
            onClick={() => handleLessonClick("phishing")}
            className="bg-[#ecf3fe]/80 border border-slate-100/50 rounded-[32px] p-8 flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">
                  <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"></path>
                  </svg>
                </div>
                <span className="px-3 py-1 bg-slate-200/60 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Quan trọng
                </span>
              </div>
              <h3 className="text-slate-850 font-black text-xl mb-3">Nhận biết lừa đảo</h3>
              <p className="text-slate-400 text-sm font-semibold leading-relaxed mb-6">
                Trang bị &apos;kính lúp&apos; kỹ thuật số để soi rõ những trò lừa đảo tinh vi, link độc hại và người lạ đáng ngờ.
              </p>
            </div>
            {/* Visual element: fishing hook */}
            <div className="w-full bg-white/70 border border-slate-100 rounded-2xl py-6 flex items-center justify-center text-slate-300">
              <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063 1.063L12 12.75M12 12.75l-.625.625M12 12.75l.625.625M12 3v13.5A3.75 3.75 0 118.25 12.75a.75.75 0 010 1.5A2.25 2.25 0 0010.5 16.5m0 0V3m0 0h1.5m-1.5 0h-1.5"></path>
              </svg>
            </div>
          </div>

          {/* Card 3: Behavior (Full width) */}
          <div
            onClick={() => handleLessonClick("behavior")}
            className="md:col-span-2 bg-[#ecf3fe]/80 border border-slate-100/50 rounded-[28px] p-6 flex items-center justify-between hover:scale-[1.01] hover:shadow-lg transition-all cursor-pointer mt-2"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-850 flex items-center justify-center text-xl text-white">
                💬
              </div>
              <div className="text-left">
                <h3 className="text-slate-850 font-black text-lg leading-tight">Ứng xử văn minh</h3>
                <p className="text-slate-400 text-xs font-semibold mt-1">
                  Trở thành công dân số lịch sự, biết cách giao tiếp và tôn trọng người khác online.
                </p>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 shadow-sm flex items-center justify-center text-slate-700 text-lg border border-slate-100 transition-all cursor-pointer">
              →
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. Stats Pill ── */}
      <section className="w-full max-w-4xl mx-auto px-6 mb-20">
        <div className="bg-[#4ECDC4] rounded-[36px] py-8 px-10 grid grid-cols-2 divide-x divide-white/20 text-white shadow-xl shadow-teal-200/30">
          {/* Stat 1 */}
          <div className="flex flex-col items-center justify-center">
            <svg className="w-7 h-7 text-white/90 mb-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 0112 19.5c-1.21 0-2.386-.175-3.5-.502V18c0-1.105.895-2 2-2h2a2 2 0 012 2v1.128zm0-11.37a3.375 3.375 0 100-6.75 3.375 3.375 0 000 6.75fcM12 12.75a3.375 3.375 0 100-6.75 3.375 3.375 0 000 6.75zm0 0a3 3 0 01-3 3H8.25m3-3a3 3 0 00-3-3H7.5"></path>
            </svg>
            <span className="text-3xl md:text-4xl font-black tracking-tight leading-none mb-1">
              2,500+
            </span>
            <span className="text-xs md:text-sm font-black text-white/90">
              Học sinh tham gia
            </span>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-center justify-center">
            <svg className="w-7 h-7 text-white/90 mb-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path>
            </svg>
            <span className="text-3xl md:text-4xl font-black tracking-tight leading-none mb-1">
              50+
            </span>
            <span className="text-xs md:text-sm font-black text-white/90">
              Bài học tương tác
            </span>
          </div>
        </div>
      </section>

      {/* ── 7. Footer ── */}
      <footer className="w-full bg-[#f4f7fe]/70 py-10 border-t border-slate-100 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="font-black text-slate-800 text-base mb-1">Bé An Toàn Số</h4>
            <p className="text-xs text-slate-400 font-extrabold">
              © 2024 Bé An Toàn Số - Học tập an toàn cùng Trương Chí Kiên
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-slate-400 font-extrabold">
            <a href="#" className="hover:text-slate-600 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Liên hệ quảng cáo</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Hỗ trợ phụ huynh</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal overlay */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
        initialTab={authTab}
      />
    </div>
  );
}
