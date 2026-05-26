"use client";

import { useState, useRef, useEffect } from "react";
import { isMuted, setMuted, sfx } from "../lib/sound";
import { levelInfo } from "../lib/xp";

type Props = {
  nickname: string;
  totalScore: number;
  xp: number;
  onHome: () => void;
  onLogout: () => void;
};

export function Header({ nickname, totalScore, xp, onHome, onLogout }: Props) {
  const [mutedState, setMutedState] = useState(isMuted());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lvl = levelInfo(xp + totalScore);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMute = () => {
    const next = !mutedState;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.click();
  };

  return (
    <header className="sticky top-0 z-20">
      {/* Colorful top stripe */}
      <div className="h-1.5 bg-gradient-to-r from-sky-400 via-pink-400 to-amber-400" />
      
      <div className="bg-white/90 backdrop-blur-md border-b-2 border-sky-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          
          {/* Logo */}
          <button
            onClick={() => { sfx.click(); onHome(); }}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <span className="text-2xl animate-wiggle inline-block">🛡️</span>
            <div className="flex flex-col leading-none">
              <span className="font-black text-sky-700 text-base">Bé An Toàn Số</span>
              <span className="text-xs text-slate-400 font-semibold hidden sm:block">Internet an toàn cho em!</span>
            </div>
          </button>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            
            {/* Nickname bubble */}
            {nickname && (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 font-bold text-sm border border-pink-200">
                👧 {nickname}
              </span>
            )}

            {/* Level badge */}
            <span
              title={`${lvl.title} · ${lvl.xpInLevel}/${lvl.xpForNext} XP`}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-black text-sm border border-indigo-200 cursor-default"
            >
              🎖️ Lv.{lvl.level}
            </span>

            {/* Score */}
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-black text-sm border border-amber-200">
              ⭐ {totalScore}
            </span>

            {/* Mute button */}
            <button
              onClick={toggleMute}
              title={mutedState ? "Bật âm thanh" : "Tắt âm thanh"}
              className="w-9 h-9 rounded-full bg-sky-50 border-2 border-sky-200 hover:bg-sky-100 flex items-center justify-center text-base transition-colors"
            >
              {mutedState ? "🔇" : "🔊"}
            </button>

            {/* Account dropdown */}
            {nickname && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => { sfx.click(); setMenuOpen((o) => !o); }}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-indigo-500 border-2 border-white shadow-md flex items-center justify-center text-base transition hover:scale-110"
                  title="Tài khoản"
                >
                  👤
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border-2 border-sky-100 overflow-hidden z-50 animate-bounce-in">
                    <div className="px-4 py-3 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-sky-100">
                      <p className="text-sm font-black text-slate-700 truncate">👋 {nickname}</p>
                      <p className="text-xs text-slate-400 font-semibold">🎖️ {lvl.title} · {lvl.xpInLevel}/{lvl.xpForNext} XP</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); onLogout(); }}
                      className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* XP Progress Bar */}
        {nickname && (
          <div className="px-4 pb-1.5 max-w-5xl mx-auto">
            <div className="xp-bar">
              <div
                className="xp-bar-fill"
                style={{ width: `${Math.min((lvl.xpInLevel / lvl.xpForNext) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
