// GET /api/admin/students — list ALL self-registered student accounts (admin only)
<<<<<<< HEAD
// Self-registered members live in `profiles` (linked to Supabase Auth users).
// Teacher accounts are excluded so only learners/students are returned.
=======
// MongoDB-only. Legacy Supabase-backed accounts must be migrated via
// POST /api/admin/migrate-from-supabase before their emails will show up here.
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";
import { Teacher } from "@/lib/db/models/Teacher";
<<<<<<< HEAD
import { supabaseAdmin } from "@/lib/supabase-admin";

// Collect every auth user's email (paginated) → map by id.
async function getEmailMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!supabaseAdmin) return map;
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) map.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
  }
  return map;
}

// GET /api/admin/students
=======

>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  await connectDB();

<<<<<<< HEAD
  // 1. Fetch every self-registered profile from MongoDB.
  const profiles = await Profile.find({} as any).sort({ created_at: -1 } as any).lean();

  // 2. Exclude teacher accounts.
  const teachers = await Teacher.find({} as any).select("auth_uid").lean();
  const teacherUids = new Set(teachers.map((t) => t.auth_uid));

  // 3. Resolve emails from Supabase Auth if configured.
  let emailMap = new Map<string, string>();
  if (supabaseAdmin) {
    try {
      emailMap = await getEmailMap();
    } catch (e: any) {
      console.warn("[admin/students] Supabase email resolution failed:", e.message);
    }
  }

=======
  const profiles = await Profile.find({} as any).sort({ created_at: -1 } as any).lean();

  // Exclude teacher accounts (their _id equals Teacher.auth_uid).
  const teachers = await Teacher.find({} as any).select("auth_uid").lean();
  const teacherUids = new Set(teachers.map((t) => t.auth_uid));

>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
  const result = profiles
    .filter((p) => !teacherUids.has(p._id))
    .map((p) => ({
      id: p._id,
      fullName: p.full_name || "Chưa đặt tên",
<<<<<<< HEAD
      email: emailMap.get(p._id) ?? null,
=======
      email: p.email ?? null,
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
      gender: p.gender ?? null,
      birthYear: p.birth_year ?? null,
      avatarUrl: p.avatar_url ?? null,
      xp: p.xp ?? 0,
      level: p.level ?? 1,
      totalScore: p.total_score ?? 0,
<<<<<<< HEAD
=======
      hasPassword: !!p.password_hash,
      teacherId: p.teacher_id ?? null,
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

  return NextResponse.json({ data: result });
}
