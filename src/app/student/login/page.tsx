"use client";

import StudentLoginForm from "@/components/student/StudentLoginForm";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStudentToken } from "@/lib/studentApi";

export default function StudentLoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (getStudentToken()) {
      router.replace("/student/dashboard");
    }
  }, [router]);

  return (
    <div className="sd-page">
      {/* Header - Game Start Style */}
      <header className="pt-12 pb-6 text-center animate-bounce-in">
        {/* Mascot */}
        <div className="text-7xl mb-4 animate-float">🎓</div>
        
        {/* Title */}
        <h1 className="text-3xl font-black text-slate-800">
          Cổng học sinh
        </h1>
        <p className="text-slate-500 mt-2 font-bold text-base max-w-xs mx-auto">
          🛡️ Bé An Toàn Số - Học cách sử dụng Internet an toàn!
        </p>
      </header>

      {/* Decorative elements */}
      <div className="flex justify-center gap-8 mb-4 text-4xl opacity-40">
        <span className="animate-wiggle">🛡️</span>
        <span className="animate-bounce">🤖</span>
        <span className="animate-wiggle" style={{ animationDelay: "0.3s" }}>⭐</span>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <StudentLoginForm />
        </div>
      </div>

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
