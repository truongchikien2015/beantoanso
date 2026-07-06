// GET /api/teachers — list all teachers (admin only)
// POST /api/teachers — create teacher account (admin only)
// MongoDB-only. auth_uid is a locally generated ObjectId (Supabase removed).
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Teacher } from "@/lib/db/models/Teacher";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  await connectDB();

  const data = await Teacher.find({} as any).sort({ created_at: -1 } as any).lean();

  const teachers = data.map((t) => ({
    id: t._id.toString(),
    authUid: t.auth_uid,
    name: t.name,
    email: t.email,
    schoolId: t.school_id,
    isActive: t.is_active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  return NextResponse.json({ data: teachers });
}

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  let body: { name: string; email: string; password: string; schoolId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, password, schoolId } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields: name, email, password" }, { status: 400 });
  }

  await connectDB();

  const existing = await Teacher.findOne({ email }).lean();
  if (existing) {
    return NextResponse.json({ error: "Email đã được đăng ký" }, { status: 409 });
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 10);

  const authUid = new mongoose.Types.ObjectId().toString();

  try {
    const teacher = await Teacher.create({
      auth_uid: authUid,
      name,
      email,
      password_hash: passwordHash,
      school_id: schoolId ?? null,
      is_active: true,
    });

    return NextResponse.json({
      data: {
        id: teacher._id.toString(),
        authUid: teacher.auth_uid,
        name: teacher.name,
        email: teacher.email,
        schoolId: teacher.school_id,
        isActive: teacher.is_active,
        createdAt: teacher.created_at,
        updatedAt: teacher.updated_at,
      },
    }, { status: 201 });
  } catch (dbError: any) {
    return NextResponse.json({ error: dbError.message || "Failed to save teacher" }, { status: 500 });
  }
}
