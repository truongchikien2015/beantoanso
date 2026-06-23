"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StudentChatbot } from "@/components/student/StudentChatbot";
import { StudentDailyQuizPanel } from "@/components/student/StudentDailyQuizPanel";
import { getStudentToken } from "@/lib/studentApi";

export default function StudentDailyPage() {
  const router = useRouter();
  const [isTeacherStudent, setIsTeacherStudent] = useState<boolean | null>(null);

  useEffect(() => {
    const hasToken = !!getStudentToken();
    setIsTeacherStudent(hasToken);
    // Guest users (no token) should use the public /daily page
    if (!hasToken) {
      router.replace("/daily");
    }
  }, [router]);

  const backHref = "/student/dashboard?view=1";

  // Null while we're checking the token (redirect in progress)
  if (isTeacherStudent === null) return null;

  return (
    <div className="sd-page">
      {/* ── 2. Main Container ── */}
      <main className="sd-main">
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-6 px-4">
          <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">🔥 Thử thách hôm nay</h1>
          <button
            onClick={() => router.push(backHref)}
            className="sd-nav-btn-outline"
          >
            ← Quay lại
          </button>
        </div>
        <StudentDailyQuizPanel
          onUnauthorized={() => router.replace("/student/login")}
          onBack={() => router.push(backHref)}
        />
        <StudentChatbot />
      </main>

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
      `}</style>
    </div>
  );
}
