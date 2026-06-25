"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getStudentToken, clearStudentToken } from "@/lib/studentApi";
import type { StudentDashboardData } from "@/types/teacher-content";
import StudentDashboard from "@/components/student/StudentDashboard";



export default function StudentDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [shouldStayOnDashboard, setShouldStayOnDashboard] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    setShouldStayOnDashboard(new URLSearchParams(window.location.search).get("view") === "1");
  }, []);

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
      setData(json);
    } catch {
      setError("Không thể kết nối");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-redirect logic: nếu có assigned_path thì chuyển đến nội dung học tập
  useEffect(() => {
    if (!data || hasRedirected.current || shouldStayOnDashboard) return;

    const { assigned_paths, progress } = data;

    if (assigned_paths && assigned_paths.length === 1) {
      hasRedirected.current = true;

      const assigned_path = assigned_paths[0];

      // Tạo map các step đã hoàn thành
      const completedStepIds = new Set(progress.map((p) => p.step_id));

      // Tìm bước tiếp theo chưa hoàn thành
      const nextStep = assigned_path.steps.find((s) => !completedStepIds.has(s.id));

      if (nextStep) {
        // Có bước tiếp theo → chuyển đến quiz
        router.replace(`/student/quiz/${nextStep.id}`);
      } else {
        // Hoàn thành tất cả → chuyển đến trang tiến độ
        router.replace("/student/progress");
      }
    }
    // Nếu không có assigned_path → hiển thị dashboard bình thường
  }, [data, router, shouldStayOnDashboard]);

  const handleLogout = useCallback(() => {
    clearStudentToken();
    router.replace("/student/login");
  }, [router]);

  if (loading) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🎓</div>
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-page flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error || "Lỗi tải dữ liệu"}</p>
          <button
            onClick={fetchDashboard}
            className="Btn BtnPrimary"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return <StudentDashboard data={data} onLogout={handleLogout} />;
}
