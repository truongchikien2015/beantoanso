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
    <div className="app-page flex flex-col">
      {/* Header - Game Start Style */}
      <header className="pt-12 pb-6 text-center animate-bounce-in">
        {/* Mascot */}
        <div className="text-7xl mb-4 animate-float">🎓</div>
        
        {/* Gradient title */}
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--kid-coral-new)] to-[var(--kid-teal-new)]">
          Cổng học sinh
        </h1>
        <p className="text-slate-500 mt-2 font-semibold text-base max-w-xs mx-auto">
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
      <footer className="text-center pb-8 text-sm text-slate-400">
        <p>Bé An Toàn Số · Internet an toàn cho học sinh tiểu học</p>
        <p className="text-xs mt-1">🎮 Học mà chơi, chơi mà học!</p>
      </footer>
    </div>
  );
}
