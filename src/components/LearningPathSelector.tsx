"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { sfx } from "../lib/sound";
import type { StudentLearningPathWithSteps, StudentSession } from "../types/teacher-content";
import { LinkDetector } from "./LinkDetector";
import { useAppStore } from "../lib/globalStore";
import { getAvatars, getSelectedAvatar, setSelectedAvatar } from "../lib/xp";

type LearningPath = {
  id: string;
  title: string;
  description: string;
  topic_ids: string[];
  is_active: boolean;
};

type Props = {
  nickname: string;
  assignedPath?: StudentLearningPathWithSteps | null;
  assignedPaths?: StudentLearningPathWithSteps[];
  assignedStudent?: StudentSession | null;
  assignedLoading?: boolean;
  showDailyQuiz?: boolean;
  onOpenDailyQuiz?: () => void;
  onSelect: (path: LearningPath) => void;
  onSelectAssigned?: (path?: StudentLearningPathWithSteps) => void;
  onBack: () => void;
  onSelectChatSim?: () => void;
  onSelectEmailSim?: () => void;
  onSelectClassify?: () => void;
  // Stats & Log out props
  playerLevel?: number;
  playerXp?: number;
  currentStreak?: number;
  longestStreak?: number;
  onLogout?: () => void;
};

const PATH_ICONS: Record<string, string> = {
  "Cơ bản": "🌱",
  "Nâng cao": "🚀",
  "Toàn diện": "🎓",
};

const PATH_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  "Cơ bản": {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    gradient: "from-emerald-400 to-teal-500",
  },
  "Nâng cao": {
    bg: "bg-cyan-50",
    border: "border-cyan-300",
    text: "text-cyan-800",
    gradient: "from-cyan-300 to-teal-400",
  },
  "Toàn diện": {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    gradient: "from-amber-400 to-orange-500",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-orange-50",
  border: "border-orange-300",
  text: "text-orange-800",
  gradient: "from-orange-300 to-amber-400",
};

export function LearningPathSelector({
  nickname,
  assignedPath,
  assignedPaths = [],
  assignedStudent,
  assignedLoading = false,
  showDailyQuiz = false,
  onOpenDailyQuiz,
  onSelect,
  onSelectAssigned,
  onBack,
  onSelectChatSim,
  onSelectEmailSim,
  onSelectClassify,
  playerLevel = 4,
  playerXp = 375,
  currentStreak = 0,
  longestStreak = 0,
  onLogout,
}: Props) {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // Profile settings inline states
  const [isEditing, setIsEditing] = useState(false);
  const [customNickname, setCustomNickname] = useState(nickname);
  const [customSlogan, setCustomSlogan] = useState("Internet net binh con ono!");
  const [selectedAvatarId, setSelectedAvatarId] = useState("kid");

  // Temp draft states while editing
  const [editName, setEditName] = useState("");
  const [editSlogan, setEditSlogan] = useState("");
  const [editAvatarId, setEditAvatarId] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const studentId = assignedStudent?.id || "guest";
      const savedNickname = localStorage.getItem(`bats:student:nickname_${studentId}`) || nickname;
      const savedSlogan = localStorage.getItem(`bats:slogan_${studentId}`) || "Internet net binh con ono!";
      const savedAvatar = getSelectedAvatar(studentId);

      setCustomNickname(savedNickname);
      setCustomSlogan(savedSlogan);
      setSelectedAvatarId(savedAvatar);
    }
  }, [nickname, assignedStudent?.id]);

  const handleSave = () => {
    sfx.click();
    if (!editName.trim()) {
      alert("Tên hiển thị không được để trống!");
      return;
    }

    const studentId = assignedStudent?.id || "guest";
    // Save locally
    localStorage.setItem(`bats:student:nickname_${studentId}`, editName.trim());
    localStorage.setItem(`bats:slogan_${studentId}`, editSlogan.trim());
    setSelectedAvatar(editAvatarId, studentId);

    // Update local state
    setCustomNickname(editName.trim());
    setCustomSlogan(editSlogan.trim());
    setSelectedAvatarId(editAvatarId);

    // Sync to useAppStore (for global nickname changes)
    useAppStore.getState().setNickname(editName.trim());

    // Exit edit mode
    setIsEditing(false);
    setShowAvatarPicker(false);
  };

  const handleCancel = () => {
    sfx.click();
    setIsEditing(false);
    setShowAvatarPicker(false);
  };
  const teacherAssignedPaths = assignedPaths.length > 0
    ? assignedPaths
    : assignedPath
      ? [assignedPath]
      : [];

  useEffect(() => {
    async function loadPaths() {
      try {
        const res = await fetch("/api/student/learning-paths");
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.data) {
          setPaths(body.data);
        }
      } catch (err) {
        console.error("Error loading learning paths:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPaths();
  }, []);

  const handleSelect = (path: LearningPath) => {
    sfx.click();
    setSelected(path.id);
    setTimeout(() => {
      onSelect(path);
    }, 300);
  };

  if (loading) {
    return (
      <div className="sd-page flex items-center justify-center min-h-[100dvh]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">📚</div>
          <p className="text-slate-500 text-lg font-extrabold">Đang tải lộ trình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-page">
      {/* ── 2. Main Container ── */}
      <main className="sd-main">
        
        {/* Student Profile Card */}
        <section className="sd-profile-card animate-fade-up">
          <div className="sd-profile-left">
            {isEditing ? (
              <div className="flex flex-col items-center gap-1.5 relative">
                <button
                  onClick={() => { sfx.click(); setShowAvatarPicker(!showAvatarPicker); }}
                  className="sd-profile-avatar-circle text-2xl flex items-center justify-center relative cursor-pointer border-2 border-dashed border-teal-400 bg-teal-50 hover:bg-teal-100 transition-colors w-12 h-12 rounded-full"
                  title="Chọn ảnh đại diện"
                  aria-label="Chọn ảnh đại diện"
                >
                  {getAvatars().find((a) => a.id === editAvatarId)?.emoji ?? "👦"}
                  <span className="absolute -bottom-1 -right-1 bg-teal-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">✏️</span>
                </button>
              </div>
            ) : (
              <div className="sd-profile-avatar-circle text-2xl flex items-center justify-center w-12 h-12 rounded-full bg-sky-100 text-sky-700">
                {getAvatars().find((a) => a.id === selectedAvatarId)?.emoji ?? "👦"}
              </div>
            )}
            
            <div className="flex-1 min-w-[150px]">
              {isEditing ? (
                <div className="flex flex-col gap-1.5 w-full">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 20))}
                    className="w-full px-3 py-1 rounded-xl border-2 border-slate-200 focus:border-teal-400 outline-none font-bold text-slate-800 text-sm"
                    placeholder="Tên của bé..."
                    aria-label="Tên của bé"
                  />
                  <input
                    type="text"
                    value={editSlogan}
                    onChange={(e) => setEditSlogan(e.target.value.slice(0, 50))}
                    className="w-full px-3 py-1 rounded-xl border-2 border-slate-200 focus:border-teal-400 outline-none font-bold text-slate-500 text-xs"
                    placeholder="Slogan của bé..."
                    aria-label="Slogan của bé"
                  />
                </div>
              ) : (
                <>
                  <h2 className="sd-profile-name">{customNickname}</h2>
                  <p className="sd-profile-tagline">{customSlogan}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="sd-profile-right">
            <div className="sd-profile-badge badge-blue">
              <span>⚡ Lv.{playerLevel}</span>
            </div>
            <div className="sd-profile-badge badge-yellow">
              <span>⭐ {playerXp} XP</span>
            </div>
            
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer border-none transition-colors"
                  title="Lưu"
                  aria-label="Lưu"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancel}
                  className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer border-none transition-colors"
                  title="Hủy"
                  aria-label="Hủy"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  sfx.click();
                  setEditName(customNickname);
                  setEditSlogan(customSlogan);
                  setEditAvatarId(selectedAvatarId);
                  setIsEditing(true);
                }} 
                className="sd-settings-btn border-none bg-transparent cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors flex items-center justify-center"
                title="Cài đặt tài khoản"
                aria-label="Cài đặt tài khoản"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.004.831a1.125 1.125 0 0 1 .26 1.43l-1.297 2.247a1.125 1.125 0 0 1-1.37.491l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.552 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.83c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              </button>
            )}
          </div>

          {/* Inline Avatar Picker List */}
          {isEditing && showAvatarPicker && (
            <div className="w-full mt-2.5 p-3 bg-slate-50 border-2 border-slate-200/60 rounded-2xl animate-fade-up">
              <p className="text-[11px] font-black text-slate-500 mb-2 text-left">Chọn ảnh đại diện của bạn:</p>
              <div className="flex gap-2.5 overflow-x-auto py-1">
                {getAvatars().map((av) => {
                  const isUnlocked = playerLevel >= av.unlockLevel;
                  return (
                    <button
                      key={av.id}
                      onClick={() => { sfx.click(); if (isUnlocked) setEditAvatarId(av.id); }}
                      disabled={!isUnlocked}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xl border-2 transition-all shrink-0 relative cursor-pointer
                        ${!isUnlocked ? "opacity-30 bg-slate-200 cursor-not-allowed border-slate-300" :
                          editAvatarId === av.id ? "border-teal-400 bg-teal-50 shadow-sm" :
                          "border-slate-100 bg-white hover:border-teal-300"
                        }`}
                      title={isUnlocked ? av.name : `Mở khóa ở Cấp ${av.unlockLevel}`}
                      aria-label={isUnlocked ? av.name : `Khóa: Mở ở Cấp ${av.unlockLevel}`}
                    >
                      <span>{av.emoji}</span>
                      {!isUnlocked && (
                        <span className="absolute -top-1 -right-1 text-[9px] bg-slate-400 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center scale-90 font-bold">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Mascot Message Chat Bubble */}
        <section className="sd-chat-bubble animate-fade-up delay-100">
          <div className="sd-chat-avatar">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <div className="sd-chat-content">
            <p>
              {teacherAssignedPaths.length > 0
                ? "Giáo viên đã chuẩn bị sẵn lộ trình riêng cho em. Em có thể bắt đầu ngay nhé!"
                : "Mỗi lộ trình có các chủ đề khác nhau. Em hãy chọn lộ trình muốn học nhé!"}
            </p>
          </div>
        </section>

        {assignedLoading && (
          <div className="sd-path-card animate-fade-up delay-200 p-6 text-center text-slate-500 font-bold">
            Đang kiểm tra lộ trình cá nhân...
          </div>
        )}

        {/* Journey Cards (Assigned Paths) */}
        {teacherAssignedPaths.map((path, index) => (
          <section key={path.id} className="sd-path-card animate-fade-up delay-200">
            <div className="sd-path-top-bar" />
            <div className="sd-path-inner">
                <div className="sd-path-details">
                  <span className="sd-path-badge">
                    {teacherAssignedPaths.length > 1
                      ? `LỘ TRÌNH GIÁO VIÊN ĐÃ GẮN ${index + 1}/${teacherAssignedPaths.length}`
                      : "LỘ TRÌNH GIÁO VIÊN ĐÃ GẮN"}
                  </span>
                  <h3 className="sd-path-title">{path.title}</h3>
                  <p className="sd-path-desc">
                    {path.description || "Xây dựng nền tảng vững chắc cho tương lai số."}
                  </p>
                  <div className="sd-path-meta">
                    <span className="meta-badge badge-blue">
                      {(assignedStudent?.class_name ?? "").startsWith("Lớp")
                        ? assignedStudent?.class_name
                        : `Lớp ${assignedStudent?.class_name || "5A"}`}
                    </span>
                    <span className="meta-badge badge-red">{path.step_count} bước học</span>
                    <Link href={`/map?path=${path.id}`} className="meta-map-link">
                      🗺️ Xem bản đồ
                    </Link>
                  </div>
                </div>
                <div className="sd-path-action">
                  <button
                    onClick={() => { sfx.click(); onSelectAssigned?.(path); }}
                    className="sd-path-btn"
                  >
                    Bắt đầu lộ trình này
                  </button>
                </div>
              </div>
            </section>
        ))}

        {/* Daily Streak Card */}
        {showDailyQuiz && (
          <section className="sd-streak-card-new animate-fade-up delay-250">
            <div className="sd-streak-inner">
              <div className="sd-streak-details">
                <span className="sd-streak-badge">STREAK MỖI NGÀY</span>
                <h3 className="sd-streak-title">Làm 5 câu hôm nay</h3>
                <p className="sd-streak-desc">
                  Trả lời 5 câu ngẫu nhiên để giữ chuỗi học và cộng XP tích lũy.
                </p>
                {currentStreak > 0 && (
                  <p className="sd-streak-meta-text">
                    🔥 Chuỗi học hiện tại: <strong className="text-orange-600 font-extrabold">{currentStreak} ngày</strong> (Kỷ lục: {longestStreak} ngày)
                  </p>
                )}
              </div>
              <div className="sd-streak-action">
                <button
                  onClick={() => { sfx.click(); onOpenDailyQuiz?.(); }}
                  className="sd-streak-btn"
                >
                  🎯 Vào thử thách
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Scenarios Section */}
        <section className="sd-scenarios-section animate-fade-up delay-300">
          <div className="sd-scenarios-header">
            <div className="sd-scenarios-header-icon">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h3 className="sd-scenarios-title">Thực hành tình huống thực tế</h3>
          </div>

          <div className="sd-scenarios-grid">
            {/* Card 1: Chat với người lạ */}
            <div className="sd-scenario-card border-blue">
              <div className="scenario-icon bg-blue">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <h4 className="scenario-title">Chat với người lạ</h4>
              <p className="scenario-desc">
                Tập xử lý khi người lạ nhắn tin xin số điện thoại, rủ rê hoặc tặng quà game.
              </p>
              <button 
                onClick={() => { sfx.click(); onSelectChatSim?.(); }}
                className="scenario-link text-blue"
              >
                Bắt đầu ngay →
              </button>
            </div>

            {/* Card 2: Vạch trần Email lừa đảo */}
            <div className="sd-scenario-card border-pink">
              <div className="scenario-icon bg-pink">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h4 className="scenario-title">Vạch trần Email lừa đảo</h4>
              <p className="scenario-desc">
                Nhận biết thư rác, tìm và hiểu các dấu hiệu lừa đảo qua link, tệp đính kèm giả.
              </p>
              <button 
                onClick={() => { sfx.click(); onSelectEmailSim?.(); }}
                className="scenario-link text-pink"
              >
                Bắt đầu ngay →
              </button>
            </div>

            {/* Card 3: Phân loại thông tin */}
            <div className="sd-scenario-card border-orange">
              <div className="scenario-icon bg-orange">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="20" height="12" rx="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h4m-2-2v4M15 11h.01M18 13h.01" />
                </svg>
              </div>
              <h4 className="scenario-title">Phân loại thông tin</h4>
              <p className="scenario-desc">
                Trò chơi thẻ bài phân loại thông tin nào có thể chia sẻ và thông tin nào cần giữ bí mật.
              </p>
              <button 
                onClick={() => { sfx.click(); onSelectClassify?.(); }}
                className="scenario-link text-orange"
              >
                Chơi game →
              </button>
            </div>
          </div>
        </section>

        {/* Path cards */}
        {paths.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 text-center text-base font-black text-slate-500">
              {teacherAssignedPaths.length > 0 ? "Hoặc khám phá thêm lộ trình khác" : "Các lộ trình học tập có sẵn"}
            </div>
            
            <div className="grid gap-5 sm:grid-cols-2">
              {paths.map((path, index) => {
                const style = PATH_COLORS[path.title] || DEFAULT_STYLE;
                const icon = PATH_ICONS[path.title] || "📘";
                const isSelected = selected === path.id;
                const tiltClass = index % 2 === 0 ? "sm:-rotate-1" : "sm:rotate-1";

                return (
                  <button
                    key={path.id}
                    onClick={() => handleSelect(path)}
                    disabled={selected !== null}
                    className={`group relative min-h-[210px] text-left rounded-[28px] p-6 border-[3px] shadow-sm transition-all duration-300 ${tiltClass} ${
                      isSelected
                        ? `${style.bg} ${style.border} scale-[1.03] ring-4 ring-offset-2 ring-teal-400`
                        : "bg-white border-slate-200 hover:border-blue-500 hover:shadow-lg hover:scale-[1.02]"
                    } ${selected !== null && !isSelected ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-3xl shadow-md mb-4 group-hover:scale-110 transition`}>
                      {icon}
                    </div>

                    <h3 className={`text-xl font-black ${style.text} mb-2`}>
                      {path.title}
                    </h3>

                    <p className="text-sm font-semibold text-slate-500 mb-4 line-clamp-3 leading-relaxed">
                      {path.description}
                    </p>

                    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-400">
                      <span>📚</span>
                      <span>{path.topic_ids.length} chủ đề</span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg shadow-md animate-bounce">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Link & Message Scam Detector */}
        <div className="mt-8 mb-4 border-t-4 border-dashed border-slate-200 pt-8">
          <LinkDetector />
        </div>

        {/* Back button */}
        <div className="sd-back-nav animate-fade-up delay-400">
          <button
            onClick={() => {
              sfx.click();
              onBack();
            }}
            className="sd-back-link bg-white border-2 border-slate-200 rounded-full px-6 py-2.5 font-bold hover:border-blue-600 hover:text-blue-600 transition"
          >
            ← Quay lại trang chủ
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="sd-footer">
        <div className="sd-footer-inner">
          <p className="sd-footer-copy">© 2026 Bé An Toàn Số. Đồng hành cùng trẻ em Việt Nam trên không gian mạng.</p>
          <div className="sd-footer-links">
            <Link href="/terms" className="sd-footer-link">Điều khoản</Link>
            <Link href="/privacy" className="sd-footer-link">Bảo mật</Link>
            <Link href="/contact" className="sd-footer-link">Liên hệ</Link>
            <Link href="/help" className="sd-footer-link">Trợ giúp</Link>
          </div>
        </div>
      </footer>

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
          padding: 0.375rem 0;
          position: relative;
          transition: color 0.2s;
          text-decoration: none;
        }
        .sd-nav-link:hover {
          color: #2563eb;
        }
        .sd-nav-link.active {
          color: #2563eb;
        }
        .sd-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 2.5px;
          background-color: #2563eb;
          border-radius: 9999px;
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
        .sd-settings-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #f8fafc;
          border: 1.5px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sd-settings-btn:hover {
          background-color: #f1f5f9;
          transform: rotate(45deg);
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
        .sd-path-details {
          flex: 1;
          min-width: 250px;
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
        .sd-path-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        .meta-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 0.75rem;
        }
        .meta-badge.badge-blue {
          background-color: #f0f9ff;
          color: #0284c7;
        }
        .meta-badge.badge-red {
          background-color: #fff1f2;
          color: #e11d48;
        }
        .meta-map-link {
          font-size: 0.75rem;
          font-weight: 800;
          color: #4ecdc4;
          text-decoration: underline;
          margin-left: 0.5rem;
          transition: color 0.2s;
        }
        .meta-map-link:hover {
          color: #0d9488;
        }
        .sd-path-action {
          flex-shrink: 0;
        }
        .sd-path-btn {
          background-color: #4ecdc4;
          color: #ffffff;
          border-radius: 9999px;
          padding: 0.875rem 1.75rem;
          font-weight: 900;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(78,205,196,0.3);
          transition: all 0.2s;
        }
        .sd-path-btn:hover {
          background-color: #0d9488;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(78,205,196,0.4);
        }
        .sd-path-btn:active {
          transform: translateY(0);
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
        .sd-streak-meta-text {
          font-size: 0.813rem;
          color: #64748b;
          font-weight: 700;
          margin-top: 0.5rem;
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

        /* ─── Scenarios ─── */
        .sd-scenarios-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .sd-scenarios-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding-left: 0.5rem;
        }
        .sd-scenarios-header-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sd-scenarios-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: #0f172a;
        }
        .sd-scenarios-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .sd-scenarios-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .sd-scenario-card {
          background: #ffffff;
          border-radius: 24px;
          border: 2px solid;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01);
          transition: all 0.2s;
        }
        .sd-scenario-card:hover {
          transform: translateY(-4px);
        }
        .sd-scenario-card.border-blue { border-color: #93c5fd; }
        .sd-scenario-card.border-pink { border-color: #fbcfe8; }
        .sd-scenario-card.border-orange { border-color: #fed7aa; }
        
        .sd-scenario-card:hover.border-blue { box-shadow: 0 10px 15px -3px rgba(147,197,253,0.3); }
        .sd-scenario-card:hover.border-pink { box-shadow: 0 10px 15px -3px rgba(251,207,232,0.3); }
        .sd-scenario-card:hover.border-orange { box-shadow: 0 10px 15px -3px rgba(254,215,170,0.3); }

        .scenario-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .scenario-icon.bg-blue { background-color: #eff6ff; }
        .scenario-icon.bg-pink { background-color: #fdf2f8; }
        .scenario-icon.bg-orange { background-color: #fff7ed; }

        .scenario-title {
          font-size: 1.063rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.3;
        }
        .scenario-desc {
          font-size: 0.813rem;
          color: #475569;
          font-weight: 700;
          margin-top: 0.5rem;
          flex: 1;
          line-height: 1.4;
        }
        .scenario-link {
          font-size: 0.875rem;
          font-weight: 900;
          background: transparent;
          border: none;
          cursor: pointer;
          margin-top: 1rem;
          padding: 0;
          transition: transform 0.2s;
          text-decoration: none;
        }
        .scenario-link:hover {
          transform: translateX(4px);
        }
        .scenario-link.text-blue { color: #2563eb; }
        .scenario-link.text-pink { color: #db2777; }
        .scenario-link.text-orange { color: #ea580c; }

        /* ─── Link Detector Section ─── */
        .sd-detector-section .card-kid {
          border-radius: 32px !important;
          border: 2px solid #e2e8f0 !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02) !important;
          max-width: 100% !important;
          padding: 1.75rem 2rem !important;
        }
        .sd-detector-section .btn-kid-coral {
          background: #db2777 !important;
          border-color: #be185d !important;
          border-radius: 9999px !important;
          font-weight: 900 !important;
          font-size: 0.938rem !important;
          box-shadow: 0 4px 12px rgba(219,39,119,0.25) !important;
          transition: all 0.2s !important;
        }
        .sd-detector-section .btn-kid-coral:hover {
          background: #be185d !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 16px rgba(219,39,119,0.35) !important;
        }
        .sd-detector-section .btn-kid-coral:active {
          transform: translateY(0) !important;
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
          .sd-path-inner {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
            padding: 1.25rem;
          }
          .sd-path-details {
            min-width: 100%;
          }
          .sd-path-meta {
            justify-content: center;
          }
          .sd-path-action {
            width: 100%;
            display: flex;
            justify-content: center;
          }
          .sd-path-btn {
            width: 100%;
            justify-content: center;
          }
          .sd-detector-section .card-kid {
            padding: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}

// UX Audit Label Fallback: aria-label
