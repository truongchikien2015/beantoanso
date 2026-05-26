"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Teacher } from "@/lib/store";
import TeacherDashboard from "@/components/admin/TeacherDashboard";

// ─── Shared helper ──────────────────────────────────────────────────────────────
async function checkTeacherActive(email: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase
    .from("teachers")
    .select("is_active")
    .eq("email", email.toLowerCase())
    .single();
  return data?.is_active === true;
}

// ─── Login Form ─────────────────────────────────────────────────────────────────
function TeacherLoginForm({ onLogin }: { onLogin: (success: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Vui lòng nhập email."); return; }
    if (!password) { setError("Vui lòng nhập mật khẩu."); return; }
    if (!supabase) { setError("Dịch vụ xác thực không khả dụng."); return; }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !data.user) {
        setError(authError?.message ?? "Email hoặc mật khẩu không đúng.");
        return;
      }

      // Verify teacher is still active
      const isActive = await checkTeacherActive(data.user.email ?? "");
      if (!isActive) {
        await supabase.auth.signOut();
        setError("Tài khoản đã bị khóa. Liên hệ quản trị viên.");
        return;
      }

      onLogin(true);
    } finally {
      setLoading(false);
    }
  }, [email, password, onLogin]);

  return (
    <div className="app-page flex items-center justify-center px-4">
      <div className="Card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-sky-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-sky-800">Cổng giáo viên</h1>
          <p className="text-slate-500 mt-2">
            Đăng nhập bằng email và mật khẩu được quản trị cấp phát
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="teacher-email" className="block text-sm font-bold text-slate-700 mb-1">
              Email
            </label>
            <input
              id="teacher-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="giaovien@truong.edu.vn"
              className="Input"
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="teacher-password" className="block text-sm font-bold text-slate-700 mb-1">
              Mật khẩu
            </label>
            <input
              id="teacher-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="Input"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="Badge BadgeError w-full justify-center py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="Btn BtnPrimary w-full justify-center py-3"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <p className="text-center text-xs text-slate-400">
            Quên mật khẩu? Liên hệ quản trị viên để được đặt lại.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────────
export default function TeacherPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");

  // Listen for Supabase Auth state changes
  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    // Check if there's an active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Verify teacher is still active
        checkTeacherActive(session.user.email ?? "").then((isActive) => {
          if (isActive) {
            setLoggedIn(true);
          } else {
            supabase.auth.signOut().then(() => {
              setError("Tài khoản đã bị khóa.");
            });
          }
        });
      }
      setReady(true);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const isActive = await checkTeacherActive(session.user.email ?? "");
          if (isActive) {
            setLoggedIn(true);
          } else {
            await supabase.auth.signOut();
            setError("Tài khoản đã bị khóa. Liên hệ quản trị viên.");
          }
        } else if (event === "SIGNED_OUT") {
          setLoggedIn(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    // Fallback to localStorage clear (for legacy state)
    Teacher.logout();
    router.push("/");
  }, [router]);

  if (!ready) return null;

  if (!loggedIn) {
    return (
      <>
        <TeacherLoginForm onLogin={(ok) => { if (ok) setLoggedIn(true); }} />
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 shadow-lg">
            {error}
          </div>
        )}
      </>
    );
  }

  return <TeacherDashboard onLogout={handleLogout} />;
}
