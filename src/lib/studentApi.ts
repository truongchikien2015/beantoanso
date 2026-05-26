// Student API client — shared fetch helper for student-facing pages
// Uses base64 session token stored in localStorage

import type {
  StudentSession,
  StudentDashboardData,
  StudentStepContent,
  StudentQuizSubmission,
  TeacherStudentProgress,
} from "@/types/teacher-content";

function getAppUrl() {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getStudentHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── In-memory token store (client-side) ─────────────────────────────────────

let _cachedToken: string | null = null;

export function setStudentToken(token: string | null): void {
  _cachedToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("student_token", token);
    } else {
      localStorage.removeItem("student_token");
    }
  }
}

export function getStudentToken(): string | null {
  if (_cachedToken) return _cachedToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("student_token");
  }
  return null;
}

export function clearStudentToken(): void {
  _cachedToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("student_token");
  }
}

// ─── Typed fetch helpers ──────────────────────────────────────────────────────

async function studentFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStudentToken();
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await fetch(`${getAppUrl()}${path}`, {
    ...options,
    headers: {
      ...getStudentHeaders(token),
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Lỗi ${res.status}`);
  }

  return res.json();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  return studentFetch<StudentDashboardData>("/api/student/dashboard");
}

// ─── Step content ──────────────────────────────────────────────────────────────

export async function fetchStepContent(stepId: string): Promise<StudentStepContent> {
  return studentFetch<StudentStepContent>(`/api/student/steps/${stepId}`);
}

// ─── Quiz submission ──────────────────────────────────────────────────────────

export async function submitQuiz(
  data: StudentQuizSubmission
): Promise<TeacherStudentProgress> {
  return studentFetch<TeacherStudentProgress>("/api/student/quiz", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function fetchStudentProgress(): Promise<TeacherStudentProgress[]> {
  return studentFetch<TeacherStudentProgress[]>("/api/student/progress");
}

// ─── Session info ─────────────────────────────────────────────────────────────

export async function fetchStudentSession(): Promise<StudentSession> {
  return studentFetch<StudentSession>("/api/student/login");
}
