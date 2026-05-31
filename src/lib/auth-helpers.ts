// Shared authentication helpers for teacher and student API routes

import { NextRequest, NextResponse } from "next/server";
import { decodeJWT } from "./jwt";

// ─── Unified student auth (teacher-created OR self-registered) ───────────────────
// Self-registered students authenticate via Supabase Auth (profiles), while
// teacher-created students use a base64 student session token. This resolver
// accepts either and reports which kind it found.

export type StudentAccountType = "teacher" | "self";

export interface AnyStudentAuthResult {
  studentId: string;
  accountType: StudentAccountType;
}

export function getAnyStudentId(req: NextRequest): NextResponse | AnyStudentAuthResult {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const token = auth.slice(7);

  // 1) Teacher-created student: base64 session token (2 parts).
  const teacherStudent = verifyStudentToken(token);
  if (teacherStudent) {
    return { studentId: teacherStudent.studentId, accountType: "teacher" };
  }

  // 2) Self-registered student: Supabase Auth JWT (3 parts).
  const decoded = decodeJWT(token);
  if (decoded?.sub && decoded.role === "authenticated") {
    return { studentId: decoded.sub, accountType: "self" };
  }

  return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn" }, { status: 401 });
}

// ─── Teacher auth ────────────────────────────────────────────────────────────────

export interface TeacherAuthResult {
  uid: string;
  email?: string;
}

/**
 * Extract and validate the teacher UID from the Authorization header.
 * Supports both ES256K (Supabase v2) and HS256 (legacy) JWTs.
 */
export function getTeacherUid(req: NextRequest): NextResponse | TeacherAuthResult {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = auth.slice(7);
  const decoded = decodeJWT(token);

  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (decoded.role !== "authenticated") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return { uid: decoded.sub, email: decoded.email };
}

// ─── Student auth ───────────────────────────────────────────────────────────────

export interface StudentAuthResult {
  studentId: string;
}

const SESSION_SECRET = process.env.SESSION_SECRET ?? "bats-student-session-2026";

function addPadding(base64: string): string {
  const remainder = base64.length % 4;
  if (remainder === 0) return base64;
  return base64 + "=".repeat(4 - remainder);
}

/**
 * Verify a student session token (base64 format).
 * Returns null if token is invalid or expired.
 */
export function verifyStudentToken(token: string): StudentAuthResult | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, sigB64] = parts;
    const expectedSig = btoa(SESSION_SECRET + payloadB64).slice(0, 12);
    if (sigB64 !== expectedSig) return null;

    const padded = addPadding(payloadB64);
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    const payload = JSON.parse(decoded);

    if (payload.exp < Date.now()) return null;
    if (!payload.sub) return null;

    return { studentId: payload.sub };
  } catch {
    return null;
  }
}

/**
 * Create a student session token (base64 format).
 */
export function createStudentToken(studentId: string, expiresInMs = 7 * 24 * 60 * 60 * 1000): string {
  const payload = {
    sub: studentId,
    exp: Date.now() + expiresInMs,
    iat: Date.now(),
  };
  const payloadB64 = btoa(JSON.stringify(payload));
  const sigB64 = btoa(SESSION_SECRET + payloadB64).slice(0, 12);
  return `${payloadB64}.${sigB64}`;
}

/**
 * Extract student ID from the Authorization header.
 */
export function getStudentId(req: NextRequest): NextResponse | StudentAuthResult {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = auth.slice(7);
  const session = verifyStudentToken(token);

  if (!session) {
    return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn" }, { status: 401 });
  }

  return session;
}
