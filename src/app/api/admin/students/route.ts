// GET /api/admin/students — list ALL self-registered student accounts (admin only)
// MongoDB-only. Legacy Supabase-backed accounts must be migrated via
// POST /api/admin/migrate-from-supabase before their emails will show up here.
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";
import { Teacher } from "@/lib/db/models/Teacher";

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  await connectDB();

  const profiles = await Profile.find({} as any).sort({ created_at: -1 } as any).lean();

  // Exclude teacher accounts (their _id equals Teacher.auth_uid).
  const teachers = await Teacher.find({} as any).select("auth_uid").lean();
  const teacherUids = new Set(teachers.map((t) => t.auth_uid));

  const result = profiles
    .filter((p) => !teacherUids.has(p._id))
    .map((p) => ({
      id: p._id,
      fullName: p.full_name || "Chưa đặt tên",
      email: p.email ?? null,
      gender: p.gender ?? null,
      birthYear: p.birth_year ?? null,
      avatarUrl: p.avatar_url ?? null,
      xp: p.xp ?? 0,
      level: p.level ?? 1,
      totalScore: p.total_score ?? 0,
      hasPassword: !!p.password_hash,
      teacherId: p.teacher_id ?? null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

  return NextResponse.json({ data: result });
}
