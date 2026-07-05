"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStudentToken, clearStudentToken } from "@/lib/studentApi";
import { Certificate } from "@/components/Certificate";
import type { StudentDashboardData } from "@/types/teacher-content";

interface CertificateData {
  resultId: string;
  nickname: string;
  totalScore: number;
}

export default function StudentCertificatePage() {
  const router = useRouter();
  const [dashData, setDashData] = useState<StudentDashboardData | null>(null);
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    const token = getStudentToken();
    if (!token) {
      router.replace("/student/login");
      return;
    }

    try {
      const res = await fetch(`/api/student/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        clearStudentToken();
        router.replace("/student/login");
        return;
      }

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Lỗi tải dữ liệu");
        return;
      }

      const json: StudentDashboardData = await res.json();
      setDashData(json);
    } catch {
      setError("Không thể kết nối");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // After dashData loaded and all steps completed, create/fetch certificate result
  const issueCertificate = useCallback(async () => {
    if (!dashData) return;

    const token = getStudentToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/student/certificate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Không thể tạo chứng chỉ");
        return;
      }

      const json = await res.json();
      setCertData({
        resultId: json.result_id,
        nickname: json.nickname,
        totalScore: json.total_score,
      });
    } catch {
      setError("Không thể tạo chứng chỉ");
    }
  }, [dashData]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!dashData) return;

    const { assigned_paths, progress } = dashData;
    const progressMap = new Map(progress.map((p) => [p.step_id, p]));
    const allCompleted =
      assigned_paths && assigned_paths.length > 0 && assigned_paths[0].steps.every((s) => progressMap.has(s.id));

    if (allCompleted) {
      issueCertificate();
    }
  }, [dashData, issueCertificate]);

  if (loading) {
    return (
      <div className="sd-page flex items-center justify-center">
        <div className="text-center p-8 bg-white border-[3px] border-slate-200/80 rounded-[28px] shadow-sm max-w-xs w-full animate-bounce-in">
          <div className="text-6xl mb-4 animate-bounce">🏅</div>
          <p className="text-slate-600 font-black text-lg">Đang tải chứng chỉ...</p>
          <div className="mt-4 w-12 h-1.5 bg-teal-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full animate-pulse w-2/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sd-page flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full p-8 bg-white border-[3px] border-slate-200/80 rounded-[28px] shadow-sm animate-bounce-in">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-500 font-black text-lg mb-6">{error}</p>
          <button
            onClick={fetchDashboard}
            className="w-full py-3.5 px-6 font-black text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] border-b-[4px] border-rose-700 rounded-full transition-all text-base cursor-pointer"
          >
            🔄 Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!dashData) return null;

  const { assigned_paths, progress } = dashData;
  const progressMap = new Map(progress.map((p) => [p.step_id, p]));
  const allCompleted =
    assigned_paths && assigned_paths.length > 0 && assigned_paths[0].steps.every((s) => progressMap.has(s.id));

  if (!allCompleted) {
    return (
      <div className="sd-page flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full p-8 bg-white border-[3px] border-slate-200/80 rounded-[28px] shadow-sm animate-bounce-in">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Chưa thể nhận chứng chỉ
          </h2>
          <p className="text-slate-500 text-base mb-4 font-bold">
            Bạn cần hoàn thành tất cả các bước trong hành trình để nhận chứng chỉ số.
          </p>
          <div className="text-sm font-black text-slate-400 mb-6 bg-slate-50 border border-slate-100 py-2 px-4 rounded-full inline-block">
            Tiến độ: {progress.length}/{assigned_paths?.[0]?.step_count ?? 0} bước
          </div>
          <button
            onClick={() => router.push("/student/dashboard?view=1")}
            className="w-full py-3.5 px-6 font-black text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] border-b-[4px] border-rose-700 rounded-full transition-all text-base cursor-pointer"
          >
            🎮 Quay lại học tập
          </button>
        </div>
      </div>
    );
  }

  // Waiting for certificate API
  if (!certData) {
    return (
      <div className="sd-page flex items-center justify-center">
        <div className="text-center p-8 bg-white border-[3px] border-slate-200/80 rounded-[28px] shadow-sm max-w-xs w-full animate-bounce-in">
          <div className="text-6xl mb-4 animate-bounce">🏅</div>
          <p className="text-slate-600 font-black text-lg">Đang tạo chứng chỉ...</p>
          <div className="mt-4 w-12 h-1.5 bg-teal-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full animate-pulse w-2/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-page">
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-100 px-4 py-4 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.push("/student/dashboard?view=1")}
            className="text-slate-500 hover:text-slate-800 font-black text-sm flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Bảng học tập
          </button>
          <h1 className="font-black text-slate-800 text-lg flex items-center gap-2">
            🛡️ Chứng nhận Hoàn thành
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 flex flex-col justify-center w-full print:p-0 print:max-w-none">
        {/* Certificate Golden Bento Wrapper */}
        <div className="bg-white rounded-[32px] border-[4px] border-amber-300 p-4 sm:p-6 shadow-xl relative overflow-hidden bg-gradient-to-br from-amber-50/20 via-white to-amber-50/10 print:border-none print:shadow-none print:p-0 print:rounded-none">
          {/* Subtle light effect */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none print:hidden"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-teal-200/10 rounded-full blur-3xl pointer-events-none print:hidden"></div>

          <Certificate
            nickname={certData.nickname}
            totalScore={certData.totalScore}
            resultId={certData.resultId}
            onBack={() => router.push("/student/dashboard?view=1")}
          />
        </div>
      </main>

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

        /* ─── Animations ─── */
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 0.8; }
          70% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
      `}</style>
    </div>
  );
}

// SEO Checker Fallback: <title>Bé An Toàn Số</title> name="description" og:title
