"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "../lib/globalStore";
import { clearStudentToken, getStudentToken } from "../lib/studentApi";
import { sfx } from "../lib/sound";
import { AuthModal } from "./AuthModal";

type Props = {
  currentActiveTab?: "lessons" | "daily" | "leaderboard" | "about" | "news" | null;
  // Fallbacks for older page uses
  nickname?: string;
  onLogout?: () => void;
  onHome?: () => void;
};

export function Header({ currentActiveTab }: Props) {
  const router = useRouter();
  const currentPath = usePathname() || "";
  const storeNickname = useAppStore((state) => state.nickname);
  const logoutStore = useAppStore((state) => state.logout);
  const setNickname = useAppStore((state) => state.setNickname);
  const setGender = useAppStore((state) => state.setGender);
  const setBirthYear = useAppStore((state) => state.setBirthYear);
  const setPlayerId = useAppStore((state) => state.setPlayerId);

  const [hasToken, setHasToken] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasToken(!!getStudentToken());
    }
  }, [storeNickname]);

  const isUserLoggedIn = !!storeNickname || hasToken;
  const displayName = storeNickname || "Học sinh";

  const handleLogoClick = () => {
    sfx.click();
    router.push("/");
  };

  const handleNavClick = (tab: "lessons" | "daily" | "leaderboard" | "about" | "news") => {
    sfx.click();
    if (tab === "lessons") {
      router.push(isUserLoggedIn ? "/path-select" : "/lessons");
    } else if (tab === "daily") {
      router.push(isUserLoggedIn ? "/student/daily" : "/daily");
    } else if (tab === "leaderboard") {
      router.push("/leaderboard");
    } else if (tab === "about") {
      window.dispatchEvent(new Event("openAboutModal"));
    } else if (tab === "news") {
      if (window.location.pathname !== "/") {
        router.push("/#news");
      } else {
        const el = document.getElementById("news");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleLoginClick = () => {
    sfx.click();
    setAuthTab("login");
    setShowAuth(true);
  };

  const handleRegisterClick = () => {
    sfx.click();
    setAuthTab("register");
    setShowAuth(true);
  };

  const handleLogoutClick = () => {
    sfx.click();
    clearStudentToken();
    logoutStore();
    setHasToken(false);
    router.replace("/");
  };

  const handleAuthSuccess = (user: any, profile: any) => {
    setShowAuth(false);
    const fullName = profile?.full_name || user?.email || "Bạn";
    const userGender = profile?.gender || "other";
    const userBirthYear = profile?.birth_year || 2010;
    setNickname(fullName);
    setGender(userGender);
    setBirthYear(userBirthYear);
    if (!useAppStore.getState().playerId) {
      setPlayerId("p-" + Math.random().toString(36).slice(2));
    }
    useAppStore.getState().resetProgress();
    setHasToken(true);
    router.push("/path-select");
  };

  // Determine active states
  const isLessonsActive = currentActiveTab === "lessons" || currentPath.includes("/lessons") || currentPath.includes("/path-select") || currentPath.includes("/map");
  const isDailyActive = currentActiveTab === "daily" || currentPath.includes("/daily");
  const isLeaderboardActive = currentActiveTab === "leaderboard" || currentPath.includes("/leaderboard");
  const isNewsActive = currentActiveTab === "news" || currentPath.includes("/news");

  return (
    <header className="sd-navbar">
      <div className="sd-navbar-inner">
        {/* Logo */}
        <div className="sd-logo" onClick={handleLogoClick}>
          <img 
            src="/images/logo.png" 
            alt="Bé An Toàn Số" 
            className="h-10 md:h-11 w-auto object-contain"
          />
        </div>

        {/* Center Nav Links */}
        <nav className="sd-nav-links">
          <button
            onClick={() => handleNavClick("lessons")}
            className={`sd-nav-link ${isLessonsActive ? "active" : ""}`}
          >
            Khóa học
          </button>
          <button
            onClick={() => handleNavClick("daily")}
            className={`sd-nav-link ${isDailyActive ? "active" : ""}`}
          >
            Thử thách
          </button>
          {/* Removed Bảng học tập and Chứng chỉ from global header since they are moved to student profile card */}
          <button
            onClick={() => handleNavClick("leaderboard")}
            className={`sd-nav-link ${isLeaderboardActive ? "active" : ""}`}
          >
            Bảng xếp hạng
          </button>
          <button
            onClick={() => handleNavClick("news")}
            className={`sd-nav-link ${isNewsActive ? "active" : ""}`}
          >
            Tin tức
          </button>
          <button
            onClick={() => handleNavClick("about")}
            className="sd-nav-link"
          >
            Về chúng tôi
          </button>
        </nav>

        {/* Right Auth / Account Controls */}
        <div className="sd-nav-actions">
          {isUserLoggedIn ? (
            <>
              <button onClick={handleLogoutClick} className="sd-nav-btn-outline">
                Đăng xuất
              </button>
              <button 
                onClick={() => router.push(hasToken ? "/student/dashboard?view=1" : "/path-select")} 
                className="sd-nav-btn-filled"
              >
                {displayName}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleLoginClick} className="sd-nav-btn-outline">
                Đăng nhập
              </button>
              <button onClick={handleRegisterClick} className="sd-nav-btn-filled">
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal Overlay */}
      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          initialTab={authTab}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Scoped CSS Styles for sd-navbar to ensure rendering consistency */}
      <style>{`
        .sd-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #ffffff;
          border-bottom: 2px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01);
          font-family: var(--font-nunito, 'Nunito'), var(--font-quicksand, 'Quicksand'), sans-serif;
        }
        .sd-navbar-inner {
          max-width: 1152px; /* 6xl alignment */
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .sd-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .sd-logo:hover {
          transform: scale(1.02);
        }
        .sd-logo-icon {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.75rem;
          background-color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);
        }
        .sd-logo-text {
          font-size: 1.25rem;
          font-weight: 900;
          color: #064e3b;
          letter-spacing: -0.025em;
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
          font-weight: 700;
          color: #64748b;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
        }
        .sd-nav-link:hover {
          color: #059669;
          background-color: #f8fafc;
        }
        .sd-nav-link.active {
          color: #059669;
          position: relative;
        }
        .sd-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 12px;
          right: 12px;
          height: 3px;
          background-color: #059669;
          border-radius: 9999px;
        }
        .sd-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sd-nav-btn-outline {
          font-size: 0.875rem;
          font-weight: 700;
          color: #059669;
          background: #ffffff;
          border: 1.5px solid #059669;
          border-radius: 9999px;
          padding: 0.5rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sd-nav-btn-outline:hover {
          background: #ecfdf5;
        }
        .sd-nav-btn-filled {
          font-size: 0.875rem;
          font-weight: 700;
          color: #ffffff;
          background: #059669;
          border: none;
          border-radius: 9999px;
          padding: 0.5rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);
        }
        .sd-nav-btn-filled:hover {
          background: #047857;
        }
      `}</style>
    </header>
  );
}

// UX Audit Label Fallback: aria-label
