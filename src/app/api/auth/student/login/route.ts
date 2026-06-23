// POST /api/auth/student/login — Self-registered student auth (MongoDB + profiles)
// Migrated to MongoDB with custom JWTs
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";
import { createAuthToken } from "@/lib/auth-helpers";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  let body: {
    email: string;
    password: string;
    isLogin: boolean;
    fullName?: string;
    gender?: string;
    birthYear?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password, isLogin, fullName, gender, birthYear } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Thiếu email hoặc mật khẩu" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  await connectDB();

  let access_token = "";
  let userId = "";
  let profile = null;

  const bcrypt = await import("bcryptjs");

  if (isLogin) {
    // 1. Try to login existing student in MongoDB
    profile = await Profile.findOne({ email: normalizedEmail }).lean();
    if (!profile) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    if (!profile.password_hash) {
      return NextResponse.json({ error: "Tài khoản chưa được cấu hình mật khẩu" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, profile.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    userId = profile._id;
    access_token = createAuthToken(userId, normalizedEmail);
  } else {
    // 2. Registration: check if email exists in MongoDB
    const existing = await Profile.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const profileId = new mongoose.Types.ObjectId().toString();

    // Create Profile document
    profile = await Profile.create({
      _id: profileId,
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName ?? null,
      gender: (gender as any) ?? null,
      birth_year: birthYear ?? null ? parseInt(String(birthYear), 10) : null,
      xp: 0,
      level: 1,
      total_score: 0,
    });

    userId = profileId;
    access_token = createAuthToken(userId, normalizedEmail);
  }

  return NextResponse.json({
    access_token,
    refresh_token: "mock-refresh-token",
    user: { id: userId, email: normalizedEmail },
    profile,
  });
}
