"use client";

import { useState, useRef } from "react";
import { sfx } from "../lib/sound";
import { AuthModal } from "./AuthModal";
import { AiSafetyScanner } from "./AiSafetyScanner";
import { NewsFeed } from "./NewsFeed";

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
  const [showQuickStart, setShowQuickStart] = useState(false);

  const canStart = name.trim().length > 0;

  const handleStart = () => {
    if (!canStart) return;
    sfx.start();
    onStart(name.trim(), "other", parseInt(birthYear || "2014", 10));
    setShowQuickStart(false);
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

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col font-sans">

      {/* ── 2. Hero Section ── */}
      <section className="relative min-h-[calc(80vh-72px)] flex items-center py-10 px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center w-full">
          {/* Left Column: Heading, description, and action buttons */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
<<<<<<< HEAD
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-wider">
=======
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-wider">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
              🛡️ Dành cho học sinh Tiểu học & THCS
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight font-nunito">
<<<<<<< HEAD
              Học Internet <span className="text-emerald-500">an toàn</span> <br /> cùng Bé An Toàn Số
=======
              Học Internet <span className="text-teal-400">an toàn</span> <br /> cùng Bé An Toàn Số
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
            </h1>

            <p className="text-slate-500 text-base md:text-lg font-bold max-w-xl leading-relaxed">
              Biến hành trình khám phá không gian mạng của con thành một cuộc phiêu lưu thú vị, an toàn và bổ ích cùng người bạn đồng hành Cú Cú.
            </p>

            {/* CTA Actions */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => { sfx.click(); setShowQuickStart(true); }}
<<<<<<< HEAD
                className="bg-emerald-600 text-white rounded-full px-6 py-3 font-bold flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-200/40"
=======
                className="bg-blue-600 text-white rounded-full px-6 py-3 font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-md shadow-blue-200/40"
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
              >
                🚀 Bắt đầu hành trình ngay
              </button>
              <button
                onClick={() => { sfx.click(); onLessons(); }}
                className="bg-white border border-slate-200 text-slate-700 rounded-full px-6 py-3 font-bold flex items-center gap-2 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7z"></path>
                </svg>
                Xem giới thiệu
              </button>
            </div>
          </div>

          {/* Right Column: AI Safety Scanner & Mascot */}
          <div className="lg:col-span-5 flex flex-col justify-center items-stretch gap-6 relative mt-6 lg:mt-0 w-full">
<<<<<<< HEAD
            <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-[24px] p-4 shadow-sm">
              <div className="w-14 h-14 shrink-0 bg-white rounded-2xl overflow-hidden border border-emerald-200 p-1 flex items-center justify-center">
=======
            <div className="flex items-center gap-4 bg-sky-50 border border-sky-100 rounded-[24px] p-4 shadow-sm">
              <div className="w-14 h-14 shrink-0 bg-white rounded-2xl overflow-hidden border border-sky-200 p-1 flex items-center justify-center">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
                <img
                  src="/images/owl_mascot.png"
                  alt="Cú Cú - Mascot Bé An Toàn Số"
                  className="w-full h-full object-contain animate-float"
                />
              </div>
              <div className="text-left">
<<<<<<< HEAD
                <h4 className="font-extrabold text-emerald-950 text-sm">🤖 Bạn Cú Cú AI khuyên:</h4>
                <p className="text-[11px] text-emerald-800 font-bold leading-normal mt-0.5">Dán tin nhắn nghi vấn hoặc link lạ xuống máy quét bên dưới để Cú bảo vệ con nhé!</p>
=======
                <h4 className="font-extrabold text-sky-950 text-sm">🤖 Bạn Cú Cú AI khuyên:</h4>
                <p className="text-[11px] text-sky-800 font-bold leading-normal mt-0.5">Dán tin nhắn nghi vấn hoặc link lạ xuống máy quét bên dưới để Cú bảo vệ con nhé!</p>
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
              </div>
            </div>
            <AiSafetyScanner />
          </div>
        </div>
      </section>

      {/* ── 3. Mobile App Section ── */}
<<<<<<< HEAD
      <section className="w-full bg-gradient-to-br from-[#d1fae5]/80 to-[#a7f3d0]/20 py-20 border-t border-b border-slate-100">
=======
      <section className="w-full bg-gradient-to-br from-[#e0f2fe]/80 to-[#bae6fd]/20 py-20 border-t border-b border-slate-100">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Mockup & QR scan */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative p-6 bg-white card-kid rounded-[40px] shadow-xl max-w-sm w-full border border-slate-100/50 transition-all hover:scale-102">
              <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden shadow-inner border border-slate-100">
                <img
                  src="/images/mobile_mockup.png"
                  alt="Bé An Toàn Số Mobile App Mockup"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* QR scanner tag */}
              <div className="absolute -bottom-6 -right-6 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-lg flex flex-col items-center max-w-[120px] z-10">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://github.com/truongchikien2015/beantoanso"
                  alt="QR Code"
                  className="w-14 h-14"
                />
                <span className="text-[9px] font-black text-slate-500 uppercase mt-1 leading-none">Quét để tải app</span>
              </div>
            </div>

            {/* Download tags */}
            <div className="flex gap-4 mt-12">
              <div className="bg-slate-900 text-white rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer shadow-md">
                <span className="text-xl">🍎</span>
                <div className="text-left leading-none">
                  <p className="text-[8px] uppercase font-bold text-slate-400">Download on the</p>
                  <p className="text-xs font-bold font-nunito mt-0.5">App Store</p>
                </div>
              </div>
              <div className="bg-slate-900 text-white rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer shadow-md">
                <span className="text-xl">🤖</span>
                <div className="text-left leading-none">
                  <p className="text-[8px] uppercase font-bold text-slate-400">Get it on</p>
                  <p className="text-xs font-bold font-nunito mt-0.5">Google Play</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Features List */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
<<<<<<< HEAD
            <h2 className="text-3xl md:text-4xl font-black text-emerald-900 tracking-tight leading-tight mb-4 font-nunito">
=======
            <h2 className="text-3xl md:text-4xl font-black text-blue-900 tracking-tight leading-tight mb-4 font-nunito">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
              Mang cả thế giới an toàn vào túi <br /> của con
            </h2>
            <p className="text-slate-500 text-base font-bold mb-8 max-w-xl leading-relaxed">
              Ứng dụng di động giúp trẻ học mọi lúc, mọi nơi thông qua các công cụ bảo vệ thông minh nhất.
            </p>

            {/* Features layout list */}
            <div className="space-y-6 w-full max-w-xl">
              {/* Feature 1 */}
              <div className="flex gap-4 items-start">
<<<<<<< HEAD
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-sm shadow-emerald-200">
=======
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-sm shadow-blue-200">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
                  🎮
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-slate-800 text-base mb-1 font-nunito">Học qua trò chơi</h4>
                  <p className="text-sm text-slate-500 font-semibold leading-relaxed">Biến kiến thức bảo mật khô khan thành những thử thách game hấp dẫn.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 items-start">
<<<<<<< HEAD
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-sm shadow-emerald-200">
=======
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-sm shadow-teal-200">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
                  🔍
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-slate-800 text-base mb-1 font-nunito">Quét mối nguy hiểm</h4>
                  <p className="text-sm text-slate-500 font-semibold leading-relaxed">Công cụ tự động phát hiện các liên kết và trang web độc hại dành riêng cho trẻ.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-sm shadow-amber-200">
                  🦉
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-slate-800 text-base mb-1 font-nunito">Hỏi đáp cùng AI</h4>
                  <p className="text-sm text-slate-500 font-semibold leading-relaxed">Người bạn AI Cú Cú luôn sẵn sàng giải đáp mọi thắc mắc về an toàn mạng 24/7.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Lessons Cards ── */}
      <section id="lessons" className="w-full py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
<<<<<<< HEAD
          <h2 className="text-center text-3xl font-black text-emerald-900 tracking-tight mb-2 font-nunito">
=======
          <h2 className="text-center text-3xl font-black text-blue-900 tracking-tight mb-2 font-nunito">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
            Khám phá lộ trình học thú vị
          </h2>
          <p className="text-center text-slate-500 text-base font-bold max-w-lg mx-auto leading-relaxed mb-12">
            Nội dung được thiết kế bởi các chuyên gia giáo dục hàng đầu, phù hợp với từng độ tuổi của trẻ.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Password */}
            <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6 flex flex-col justify-between transition-transform hover:-translate-y-1">
              <div>
<<<<<<< HEAD
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl text-emerald-600 mb-6">
=======
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl text-blue-600 mb-6">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
                  🔐
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-3 font-nunito">An toàn bảo mật</h3>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
                  Học cách tạo mật khẩu siêu mạnh và bảo vệ thông tin cá nhân như một hiệp sĩ số thực thụ.
                </p>
              </div>
              <button 
                onClick={() => { sfx.click(); onLessons(); }}
                className="bg-white border border-slate-200 text-slate-600 rounded-full py-2 px-5 font-bold hover:bg-slate-50 active:scale-95 transition-all text-xs self-start"
              >
                Tìm hiểu thêm
              </button>
            </div>

            {/* Card 2: Phishing */}
            <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6 flex flex-col justify-between transition-transform hover:-translate-y-1">
              <div>
<<<<<<< HEAD
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl text-emerald-600 mb-6">
=======
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-2xl text-teal-600 mb-6">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
                  🔍
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-3 font-nunito">Nhận diện lừa đảo</h3>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
                  Trang bị kính lúp kỹ thuật số để soi rõ những chiêu trò lừa đảo tinh vi trên mạng xã hội.
                </p>
              </div>
              <button 
                onClick={() => { sfx.click(); onLessons(); }}
                className="bg-white border border-slate-200 text-slate-600 rounded-full py-2 px-5 font-bold hover:bg-slate-50 active:scale-95 transition-all text-xs self-start"
              >
                Tìm hiểu thêm
              </button>
            </div>

            {/* Card 3: Behavior */}
            <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6 flex flex-col justify-between transition-transform hover:-translate-y-1">
              <div>
<<<<<<< HEAD
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl text-green-600 mb-6">
=======
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-2xl text-rose-600 mb-6">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
                  👥
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-3 font-nunito">Ứng xử văn minh</h3>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
                  Trở thành công dân số lịch sự, biết cách giao tiếp và tôn trọng người khác trên không gian mạng.
                </p>
              </div>
              <button 
                onClick={() => { sfx.click(); onLessons(); }}
                className="bg-white border border-slate-200 text-slate-600 rounded-full py-2 px-5 font-bold hover:bg-slate-50 active:scale-95 transition-all text-xs self-start"
              >
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Royal Blue Stats Section ── */}
      <section className="w-full max-w-5xl mx-auto px-6 py-10">
<<<<<<< HEAD
        <div className="bg-[#065f46] rounded-[36px] py-12 px-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-white shadow-xl shadow-emerald-900/10">
=======
        <div className="bg-[#004aad] rounded-[36px] py-12 px-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-white shadow-xl shadow-blue-900/10">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
          <div className="md:col-span-7 text-left space-y-2">
            <h3 className="text-2xl md:text-3xl font-black font-nunito">
              Mạng lưới học tập an toàn ngày <br /> càng lớn mạnh
            </h3>
<<<<<<< HEAD
            <p className="text-emerald-100 text-sm font-semibold leading-relaxed max-w-md">
=======
            <p className="text-blue-100 text-sm font-semibold leading-relaxed max-w-md">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
              Tham gia cùng hàng nghìn bạn nhỏ khác trong hành trình trở thành Hiệp sĩ An toàn số.
            </p>
          </div>
          
          <div className="md:col-span-5 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
              <span className="text-3xl font-black font-nunito block">2,500+</span>
<<<<<<< HEAD
              <span className="text-[10px] uppercase font-bold text-emerald-200 mt-1 block">Học sinh tham gia</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
              <span className="text-3xl font-black font-nunito block">50+</span>
              <span className="text-[10px] uppercase font-bold text-emerald-200 mt-1 block">Bài học tương tác</span>
=======
              <span className="text-[10px] uppercase font-bold text-blue-200 mt-1 block">Học sinh tham gia</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
              <span className="text-3xl font-black font-nunito block">50+</span>
              <span className="text-[10px] uppercase font-bold text-blue-200 mt-1 block">Bài học tương tác</span>
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Overlapping Avatars & Final CTA ── */}
      <section className="w-full py-20 bg-gradient-to-t from-slate-50 to-white flex flex-col items-center text-center px-6">
        {/* Kid avatars overlap */}
        <div className="flex items-center justify-center -space-x-4 mb-6">
          <div className="w-14 h-14 bg-sky-100 border-4 border-white rounded-full flex items-center justify-center text-2xl shadow-md z-10">👦</div>
          <div className="w-14 h-14 bg-pink-100 border-4 border-white rounded-full flex items-center justify-center text-2xl shadow-md z-25">👧</div>
          <div className="w-14 h-14 bg-amber-100 border-4 border-white rounded-full flex items-center justify-center text-2xl shadow-md z-20">👦</div>
        </div>

<<<<<<< HEAD
        <h2 className="text-3xl md:text-4xl font-black text-emerald-900 font-nunito leading-tight mb-3">
=======
        <h2 className="text-3xl md:text-4xl font-black text-blue-900 font-nunito leading-tight mb-3">
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
          Sẵn sàng để bắt đầu cuộc phiêu lưu số?
        </h2>
        <p className="text-slate-500 text-sm font-bold max-w-xl leading-relaxed mb-8">
          Hoàn toàn miễn phí và luôn luôn như vậy. Đăng ký tài khoản ngay hôm nay để nhận huy hiệu &apos;Người mới bắt đầu&apos;.
        </p>

        <button
          onClick={() => { sfx.click(); setShowQuickStart(true); }}
<<<<<<< HEAD
          className="bg-[#047857] text-white rounded-full px-8 py-4 font-black text-base hover:bg-emerald-800 active:scale-95 transition-all shadow-md shadow-emerald-200/40 cursor-pointer"
=======
          className="bg-[#005fb8] text-white rounded-full px-8 py-4 font-black text-base hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200/40 cursor-pointer"
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
        >
          Bắt đầu hành trình ngay
        </button>
        <span className="text-[10px] text-slate-400 font-extrabold mt-4 block">
          * Không cần thẻ tín dụng • Đăng ký trong 30 giây
        </span>
      </section>


      {/* Auth Modal overlay */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
        initialTab={authTab}
      />

      {/* ── 8. News Feed (Articles & Categories) ── */}
      <NewsFeed />


      {/* Guest Play Quick Start Modal overlay */}
      {showQuickStart && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-up">
          <div className="bg-white card-kid rounded-[36px] p-6 max-w-sm w-full relative shadow-2xl border-4 border-slate-800 animate-bounce-in">
            {/* Close button */}
            <button 
              onClick={() => { sfx.click(); setShowQuickStart(false); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-bold"
            >
              ✕
            </button>

            <h2 className="font-black text-slate-800 text-xl mb-1 flex items-center gap-2 font-nunito mt-2 text-left">
              🎮 Bắt đầu hành trình
            </h2>
            <p className="text-xs font-bold text-slate-400 mb-6 text-left">Nhập thông tin của con để cùng Cú Cú khám phá!</p>

            <div className="space-y-4 text-left">
              {/* Tên của em */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  Tên của em
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                  maxLength={30}
                  placeholder="Ví dụ: Bé Minh"
<<<<<<< HEAD
                  className="input-kid padding-left-4 text-base py-3 focus:border-emerald-600"
=======
                  className="input-kid padding-left-4 text-base py-3 focus:border-blue-600"
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
                  autoComplete="given-name"
                />
              </div>

              {/* Năm sinh */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  Năm sinh
                </label>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
<<<<<<< HEAD
                  className="input-kid padding-left-4 text-base py-3 focus:border-emerald-600"
=======
                  className="input-kid padding-left-4 text-base py-3 focus:border-blue-600"
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
                  placeholder="2014"
                  min={1990}
                  max={new Date().getFullYear()}
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col gap-3">
                <button
                  onClick={handleStart}
                  disabled={!canStart}
<<<<<<< HEAD
                  className="btn-kid bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700 w-full justify-center text-base"
=======
                  className="btn-kid bg-blue-600 text-white border-blue-800 hover:bg-blue-700 w-full justify-center text-base"
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
                >
                  🚀 Bắt đầu học ngay
                </button>
                <button
                  onClick={() => { setShowQuickStart(false); openAuth("login"); }}
                  className="btn-kid bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 w-full justify-center text-sm"
                >
                  🔑 Hoặc Đăng nhập lưu điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
