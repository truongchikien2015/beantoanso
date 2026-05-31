import React, { useState } from "react";
import Link from "next/link";
import { setStudentToken, clearStudentToken } from "@/lib/studentApi";
import { supabase } from "@/lib/supabase";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, profile: any) => void;
};

// Map common Supabase/auth errors to friendly Vietnamese messages.
function translateAuthError(message?: string): string {
  const m = (message ?? "").toLowerCase();
  if (!m) return "Đã có lỗi xảy ra";
  if (m.includes("invalid login credentials")) return "Email hoặc mật khẩu không đúng";
  if (m.includes("email not confirmed")) return "Tài khoản chưa được kích hoạt. Vui lòng liên hệ giáo viên hoặc quản trị viên.";
  if (m.includes("email already") || m.includes("already registered") || m.includes("đã được sử dụng")) return "Email đã được sử dụng";
  if (m.includes("password")) return "Mật khẩu phải có ít nhất 6 ký tự";
  if (m.includes("failed to fetch") || m.includes("networkerror")) return "Không kết nối được máy chủ. Vui lòng thử lại.";
  return message ?? "Đã có lỗi xảy ra";
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registration extra fields
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [birthYear, setBirthYear] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const loginId = email.trim();
        const looksLikeEmail = loginId.includes("@");

        if (!looksLikeEmail) {
          // Student code → teacher-created account in teacher_students.
          const studentRes = await fetch("/api/student/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_code: loginId, password }),
          });
          const studentData = await studentRes.json();

          if (!studentRes.ok) {
            throw new Error(studentData.error ?? "Mã học sinh hoặc mật khẩu không đúng");
          }

          setStudentToken(studentData.token);
          onSuccess(
            {
              id: studentData.student.id,
              email: studentData.student.email ?? loginId,
            },
            {
              full_name: studentData.student.nickname,
              gender: "other",
              birth_year: undefined,
            }
          );
          return;
        }

        // Email → self-registered student account in Supabase Auth.
        const memberRes = await fetch("/api/auth/student/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginId, password, isLogin: true }),
        });
        const memberData = await memberRes.json();

        if (!memberRes.ok) {
          throw new Error(memberData.error ?? "Email hoặc mật khẩu không đúng");
        }

        await applyMemberSession(memberData);
        return;
      }

      // Registration (self-registered student).
      const res = await fetch("/api/auth/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          isLogin,
          fullName,
          gender,
          birthYear: birthYear ? parseInt(birthYear, 10) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Đã có lỗi xảy ra");
      }

      await applyMemberSession(data);
    } catch (err: any) {
      setError(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // Shared handler: set the Supabase session then notify parent.
  const applyMemberSession = async (data: any) => {
    // Self-registered students authenticate via Supabase Auth, not the student
    // token. Clear any stale teacher-student token so we don't load another
    // student's assigned learning path on the path-select screen.
    clearStudentToken();

    if (data.access_token && data.refresh_token) {
      const { error: sessionError } = await supabase?.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      }) ?? {};

      if (sessionError) {
        throw new Error(sessionError.message);
      }
    }

    onSuccess(
      { id: data.user?.id, email: data.user?.email },
      data.profile
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border-4 border-indigo-100 relative">
        <div className="p-6 bg-gradient-to-r from-indigo-500 to-sky-500 text-white text-center">
          <div className="text-4xl mb-2">🛡️</div>
          <h2 className="text-2xl font-bold">{isLogin ? "Đăng nhập" : "Đăng ký thành viên"}</h2>
          <p className="opacity-90 text-sm mt-1">
            {isLogin ? "Tiếp tục hành trình học tập của bạn" : "Lưu lại tiến trình và tham gia bảng xếp hạng"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm text-center border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-600 mb-1">Mã học sinh hoặc email</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              placeholder="HS002 hoặc email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="Ví dụ: Bé Minh"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Giới tính</label>
                  <select
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="" disabled>Chọn...</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Năm sinh</label>
                  <input
                    type="number"
                    required
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="2012"
                    min={1990}
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : (isLogin ? "Đăng nhập" : "Tạo tài khoản")}
          </button>
        </form>

        <div className="px-6 pb-6 text-center text-sm text-slate-500 border-t border-slate-100 pt-4 flex flex-col gap-3">
          <div>
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-indigo-600 font-bold hover:underline"
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs">
            Bạn là Quản trị viên hoặc Giáo viên?{" "}
            <Link href="/admin" className="text-indigo-600 font-semibold hover:underline">
              Admin
            </Link>
            <span className="mx-2 text-slate-300">|</span>
            <Link href="/teacher" className="text-indigo-600 font-semibold hover:underline">
              Giáo viên
            </Link>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
