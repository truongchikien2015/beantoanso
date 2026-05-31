// Student API client — shared fetch helper for student-facing pages
// Uses base64 session token stored in localStorage

import { supabase } from "@/lib/supabase";
import type {
  StudentSession,
  StudentDashboardData,
  StudentStepContent,
  StudentQuizSubmission,
  TeacherStudentProgress,
  StudentProgressResponse,
  StudentDailyQuizAnswer,
  StudentDailyQuizResponse,
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

/**
 * Resolve an auth token for student API calls. Teacher-created students use the
 * base64 student_token; self-registered students authenticate via Supabase Auth,
 * so we fall back to their Supabase session access token.
 */
export async function resolveStudentAuthToken(): Promise<string | null> {
  const studentToken = getStudentToken();
  if (studentToken) return studentToken;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
  return null;
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
  const token = await resolveStudentAuthToken();
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

export async function fetchStudentProgress(): Promise<StudentProgressResponse> {
  return studentFetch<StudentProgressResponse>("/api/student/progress");
}

// ─── Daily quiz ───────────────────────────────────────────────────────────────

export async function fetchStudentDailyQuiz(): Promise<StudentDailyQuizResponse> {
  return studentFetch<StudentDailyQuizResponse>("/api/student/daily-quiz");
}

export async function submitStudentDailyQuiz(
  answers: StudentDailyQuizAnswer[],
): Promise<StudentDailyQuizResponse> {
  return studentFetch<StudentDailyQuizResponse>("/api/student/daily-quiz", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

// ─── Session info ─────────────────────────────────────────────────────────────

export async function fetchStudentSession(): Promise<StudentSession> {
  return studentFetch<StudentSession>("/api/student/login");
}

// ─── Student chatbot ──────────────────────────────────────────────────────────

export type StudentChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StudentChatResponse = {
  answer: string;
  refused: boolean;
};

export async function sendStudentChatMessage(
  message: string,
  history: StudentChatMessage[] = []
): Promise<StudentChatResponse> {
  return studentFetch<StudentChatResponse>("/api/student/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}
