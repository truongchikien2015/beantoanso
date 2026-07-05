import React, { useState } from "react";
import Link from "next/link";
import { setStudentToken, clearStudentToken } from "@/lib/studentApi";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, profile: any) => void;
  initialTab?: "login" | "register";
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

export function AuthModal({ isOpen, onClose, onSuccess, initialTab = "login" }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialTab === "login");
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsLogin(initialTab === "login");
      setShowPassword(false);
    }
  }, [isOpen, initialTab]);

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

  // Shared handler: set the student token then notify parent.
  const applyMemberSession = async (data: any) => {
    clearStudentToken();

    if (data.access_token) {
      setStudentToken(data.access_token);
    }

    onSuccess(
      { id: data.user?.id, email: data.user?.email },
      data.profile
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-up">
      <div className="bg-white card-kid rounded-[32px] w-full max-w-md overflow-hidden relative shadow-2xl border-4 border-slate-800 animate-bounce-in max-h-[95vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4.5 right-4.5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-bold"
        >
          ✕
        </button>

        {/* Mascot & Heading */}
        <div className="p-6 pt-8 pb-3 flex flex-col items-center text-center">
          <div className="flex flex-col items-center bg-blue-50 border border-blue-100 rounded-2xl p-2 w-18 h-18 shadow-sm">
            <img
              src="/images/owl_mascot.png"
              alt="Cú Cú"
              className="w-10 h-10 object-contain"
            />
            <span className="text-[9px] font-black text-blue-900 uppercase tracking-wide leading-none mt-1">Cú Cú</span>
          </div>

          <h2 className="text-2xl font-black text-blue-900 font-nunito mt-4">
            {isLogin ? "Chào mừng quay lại!" : "Đăng ký thành viên"}
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1 leading-relaxed max-w-xs">
            {isLogin 
              ? "Sẵn sàng cùng Cú Cú bắt đầu thử thách mới hôm nay chưa?" 
              : "Lưu lại tiến trình học tập và thăng hạng cùng bạn bè nhé!"}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs text-center border-2 border-rose-200 font-bold">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 text-left">
          
          {isLogin ? (
            // LOGIN FORM
            <>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Mã số học sinh hoặc Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-kid py-3 pl-12 pr-4 focus:border-blue-600 text-sm bg-slate-50 border-slate-100 rounded-2xl"
                    placeholder="Nhập mã số hoặc email của bạn"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Mật khẩu
                  </label>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); alert("Vui lòng liên hệ Giáo viên hoặc Admin để cấp lại mật khẩu của con nhé!"); }}
                    className="text-xs font-extrabold text-blue-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-kid py-3 pl-12 pr-12 focus:border-blue-600 text-sm bg-slate-50 border-slate-100 rounded-2xl"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.386 4.17 5.32 7.178 9.957 7.178.966 0 1.9-.133 2.784-.384m2.195-2.195A10.516 10.516 0 0 0 21.933 12c-1.386-4.17-5.32-7.178-9.957-7.178a9.928 9.928 0 0 0-2.784.384m-4.57 2.227L21 21M9.88 9.88a3 3 0 1 0 4.24 4.24M10.8 10.8l2.4 2.4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            // REGISTER FORM
            <>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Họ và tên
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-kid py-3 pl-12 pr-4 focus:border-blue-600 text-sm bg-slate-50 border-slate-100 rounded-2xl"
                    placeholder="Ví dụ: Bé Minh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    Giới tính
                  </label>
                  <select
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="input-kid py-3 px-4 focus:border-blue-600 text-sm bg-slate-50 border-slate-100 rounded-2xl bg-white"
                  >
                    <option value="" disabled>Chọn...</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    Năm sinh
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                    </span>
                    <input
                      type="number"
                      required
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="input-kid py-3 pl-12 pr-4 focus:border-blue-600 text-sm bg-slate-50 border-slate-100 rounded-2xl"
                      placeholder="2012"
                      min={1990}
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Email học tập
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-kid py-3 pl-12 pr-4 focus:border-blue-600 text-sm bg-slate-50 border-slate-100 rounded-2xl"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Mật khẩu đăng ký
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-kid py-3 pl-12 pr-12 focus:border-blue-600 text-sm bg-slate-50 border-slate-100 rounded-2xl"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.386 4.17 5.32 7.178 9.957 7.178.966 0 1.9-.133 2.784-.384m2.195-2.195A10.516 10.516 0 0 0 21.933 12c-1.386-4.17-5.32-7.178-9.957-7.178a9.928 9.928 0 0 0-2.784.384m-4.57 2.227L21 21M9.88 9.88a3 3 0 1 0 4.24 4.24M10.8 10.8l2.4 2.4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-kid bg-blue-600 text-white border-blue-800 hover:bg-blue-700 w-full justify-center text-lg mt-4 cursor-pointer"
          >
            {loading ? "Đang xử lý..." : (isLogin ? "Vào lớp ngay" : "Tạo tài khoản")}
          </button>
        </form>

        {/* Form Footer */}
        <div className="px-6 pb-6 text-center text-sm text-slate-500 border-t border-slate-100 pt-4 flex flex-col gap-3 font-semibold">
          <div>
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-blue-600 font-black hover:underline cursor-pointer"
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <span>🔑 Cần trợ giúp?</span>
            <Link href="/admin" className="text-slate-500 font-bold hover:underline">
              Admin
            </Link>
            <span className="text-slate-350">|</span>
            <Link href="/teacher" className="text-slate-500 font-bold hover:underline">
              Giáo viên
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
