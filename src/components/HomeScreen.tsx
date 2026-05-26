"use client";

import { useState } from "react";
import { sfx } from "../lib/sound";
import { getDailyState } from "../lib/daily";
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

  const daily = getDailyState();
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

  return (
    <div className="kid-paper-page min-h-screen overflow-x-hidden">
      {/* ── Top Bar ── */}
      <div className="flex justify-between items-center px-4 pt-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl inline-block">🛡️</span>
          <span className="font-black text-[var(--kid-ink)] text-lg tracking-tight">Bé An Toàn Số</span>
        </div>
        <button
          onClick={() => setShowAuth(true)}
          className="btn-kid btn-kid-teal text-sm px-4 py-2"
        >
          🔑 Đăng nhập
        </button>
      </div>

      {/* ── Hero Section ── */}
      <div className="flex flex-col items-center text-center pt-8 pb-4 px-4">
        {/* Mascots */}
        <div className="mb-5 flex items-center justify-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border-[3px] border-white bg-gradient-to-br from-[var(--kid-coral-new)] to-rose-300 text-5xl shadow-[var(--kid-sticker-shadow)] -rotate-3">
            👦🏻
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border-[3px] border-white bg-gradient-to-br from-[var(--kid-teal-new)] to-cyan-300 text-5xl shadow-[var(--kid-sticker-shadow)] rotate-3">
              🤖
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black text-[var(--kid-ink)] mb-3 leading-tight">
          Học Internet<br />
          <span className="text-[var(--kid-coral-new)]">an toàn</span> cùng em
        </h1>
        <p className="kid-readable text-[var(--kid-muted)] max-w-sm font-bold">
          Nhập tên, chọn lộ trình, rồi bắt đầu bài học đầu tiên.
        </p>
      </div>

      {/* ── Main Card ── */}
      <div className="max-w-md mx-auto px-4 pb-8">
        <div className="card-kid p-5 sm:p-6 animate-bounce-in">
          {/* Quick Play Section */}
          <div className="rounded-[24px] border-[3px] border-[var(--kid-teal-new)]/30 bg-white p-4 mb-4">
            <h2 className="text-center font-black text-[var(--kid-ink)] text-xl mb-4">
              Bắt đầu nhanh
            </h2>

            {/* Name field */}
            <div className="mb-4">
              <label className="block text-base font-black text-[var(--kid-ink)] mb-2">
                Tên của em
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                maxLength={30}
                placeholder="Ví dụ: Bé Minh"
                className="input-kid"
                autoComplete="given-name"
              />
            </div>

            <div className="mb-5">
              <label className="block text-base font-black text-[var(--kid-ink)] mb-2">
                Năm sinh
              </label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                className="input-kid"
                placeholder="2014"
                min={1990}
                max={new Date().getFullYear()}
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!canStart}
              className="btn-kid btn-kid-coral w-full text-xl py-4"
            >
              Bắt đầu học
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Hoặc</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={() => setShowAuth(true)}
            className="btn-kid btn-kid-teal w-full text-base py-3"
          >
            Đăng nhập để lưu điểm
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={onLessons} className="btn-kid bg-white text-[var(--kid-ink)] border-slate-200 justify-center">
            📚 Học bài
          </button>
          <button onClick={onDaily} className="btn-kid bg-white text-[var(--kid-ink)] border-slate-200 justify-center relative">
            ⚡ Hôm nay
            {daily.streak > 0 && (
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--kid-coral-new)] text-white text-xs font-black flex items-center justify-center border-2 border-white">
                {daily.streak}
              </span>
            )}
          </button>
          <button onClick={onClassify} className="btn-kid bg-white text-[var(--kid-ink)] border-slate-200 justify-center">
            🧩 Phân loại
          </button>
          <button onClick={onLeaderboard} className="btn-kid bg-white text-[var(--kid-ink)] border-slate-200 justify-center">
            🏆 Xếp hạng
          </button>
        </div>

        <div className="mt-5 rounded-[24px] border-2 border-dashed border-[var(--kid-yellow-dark)]/25 bg-[var(--kid-yellow-new)]/20 p-4 text-center">
          <p className="text-base font-black text-[var(--kid-ink)]">Mỗi bài học chỉ vài phút.</p>
          <p className="text-sm font-bold text-[var(--kid-muted)]">Đúng hay sai đều có giải thích dễ hiểu.</p>
          </div>

        {/* Footer tagline */}
        <p className="text-center text-xs text-slate-400 font-semibold mt-4">
          Học mà chơi - chơi mà học
        </p>
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
