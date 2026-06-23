"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setStudentToken } from "@/lib/studentApi";



export default function StudentLoginForm() {
  const router = useRouter();
  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!studentCode.trim()) {
      setError("😕 Nhập mã học sinh vào đi bạn ơi!");
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }
    if (!password) {
      setError("🔑 Nhập mật khẩu vào đi bạn ơi!");
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_code: studentCode.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "😟 Đăng nhập không thành công");
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
        return;
      }

      setStudentToken(data.token);
      router.push("/student/dashboard");
    } catch {
      setError("🌐 Không kết nối được. Thử lại sau nhé!");
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setLoading(false);
    }
  }, [studentCode, password, router]);

  return (
    <div className="bg-white rounded-[28px] border-[3px] border-slate-200/80 p-8 shadow-sm animate-fade-up">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student code */}
        <div>
          <label htmlFor="student_code" className="flex items-center gap-2 text-sm font-black text-slate-500 mb-2 uppercase tracking-wider">
            👤 Mã học sinh
          </label>
          <input
            id="student_code"
            type="text"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            placeholder="VD: HS002"
            className="w-full px-5 py-4 border-[3px] border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-base focus:border-teal-400 focus:bg-white transition duration-200 outline-none"
            autoComplete="username"
            autoFocus
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="flex items-center gap-2 text-sm font-black text-slate-500 mb-2 uppercase tracking-wider">
            🔑 Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu..."
            className="w-full px-5 py-4 border-[3px] border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-base focus:border-teal-400 focus:bg-white transition duration-200 outline-none"
            autoComplete="current-password"
          />
        </div>

        {/* Error */}
        {error && (
          <div className={`w-full py-3 px-4 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-2xl text-sm font-bold text-center animate-bounce-in ${shakeError ? "animate-shake" : ""}`}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white text-lg font-black rounded-3xl shadow-md hover:shadow-lg active:scale-98 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-wiggle">🎒</span> Đang vào...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              🚀 Đăng nhập
            </span>
          )}
        </button>
      </form>

      {/* Back link */}
      <div className="mt-5 text-center">
        <Link href="/" className="text-sm font-black text-teal-600 hover:text-teal-700 transition">
          ← Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}
