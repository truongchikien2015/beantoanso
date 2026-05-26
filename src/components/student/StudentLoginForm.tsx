"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
    <div className="Card p-6 mt-4">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student code */}
        <div>
          <label htmlFor="student_code" className="flex items-center gap-2 text-base font-bold text-slate-700 mb-2">
            <span className="text-xl">👤</span> Mã học sinh
          </label>
          <input
            id="student_code"
            type="text"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            placeholder="VD: HS002"
            className="input-kid text-lg py-4"
            autoComplete="username"
            autoFocus
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="flex items-center gap-2 text-base font-bold text-slate-700 mb-2">
            <span className="text-xl">🔑</span> Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu..."
            className="input-kid text-lg py-4"
            autoComplete="current-password"
          />
        </div>

        {/* Error */}
        {error && (
          <div className={`Badge BadgeError w-full justify-center py-3 text-base font-bold animate-bounce-in ${shakeError ? 'animate-shake' : ''}`}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-kid btn-kid-coral w-full justify-center py-4 text-lg"
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
      <div className="mt-4 text-center">
        <a href="/" className="text-sm font-bold text-sky-600 hover:underline">
          ← Quay về trang chủ
        </a>
      </div>
    </div>
  );
}
