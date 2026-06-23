// POST /api/auth/teacher/login — Teacher auth: register if not exists, then login
// Migrated to MongoDB with custom JWTs
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Teacher } from "@/lib/db/models/Teacher";
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
    // If demo credentials, ensure account exists in DB for seamless login
    if (normalizedEmail === "giaovienc@gmail.com" && password === "Admin123@") {
      const demoTeacher = await Teacher.findOne({ email: normalizedEmail }).lean();
      if (!demoTeacher) {
        const passwordHash = await bcrypt.hash("Admin123@", 10);
        const authUid = new mongoose.Types.ObjectId().toString();
        await Teacher.create({
          auth_uid: authUid,
          name: "Giáo viên C (Demo)",
          email: normalizedEmail,
          password_hash: passwordHash,
          is_active: true,
        });
        const prof = await Profile.findOne({ _id: authUid }).lean();
        if (!prof) {
          await Profile.create({
            _id: authUid,
            email: normalizedEmail,
            password_hash: passwordHash,
            full_name: "Giáo viên C (Demo)",
            gender: "other",
            birth_year: 1990,
            xp: 100,
            level: 1,
            total_score: 100,
          });
        }
      }
    }

    // 1. Try to login existing user in MongoDB
    const teacher = await Teacher.findOne({ email: normalizedEmail }).lean();
    if (!teacher) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    if (!teacher.is_active) {
      return NextResponse.json({ error: "Tài khoản đã bị khóa. Liên hệ quản trị viên." }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, teacher.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    userId = teacher.auth_uid;
    access_token = createAuthToken(userId, teacher.email);

    // Get matching profile
    profile = await Profile.findOne({ _id: userId } as any).lean();
  } else {
    // 2. Registration: check if teacher exists
    const existing = await Teacher.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const authUid = new mongoose.Types.ObjectId().toString();

    // Create Teacher document
    const teacher = await Teacher.create({
      auth_uid: authUid,
      name: fullName ?? email.split("@")[0],
      email: normalizedEmail,
      password_hash: passwordHash,
      is_active: true,
    });

    // Create Profile document
    profile = await Profile.create({
      _id: authUid,
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName ?? null,
      gender: (gender as any) ?? null,
      birth_year: birthYear ?? null ? parseInt(String(birthYear), 10) : null,
      xp: 0,
      level: 1,
      total_score: 0,
    });

    userId = authUid;
    access_token = createAuthToken(userId, normalizedEmail);
  }

  return NextResponse.json({
    access_token,
    refresh_token: "mock-refresh-token",
    user: { id: userId, email: normalizedEmail },
    profile,
  });
}
