// GET /api/admin/students — list ALL self-registered student accounts (admin only)
// Self-registered members live in `profiles` (linked to Supabase Auth users).
// Teacher accounts are excluded so only learners/students are returned.
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Collect every auth user's email (paginated) → map by id.
async function getEmailMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin!.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) map.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
  }
  return map;
}

// GET /api/admin/students
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const authError = checkAdmin(req);
  if (authError) return authError;

  // 1. Fetch every self-registered profile.
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, gender, birth_year, avatar_url, xp, level, total_score, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // 2. Exclude teacher accounts (teachers also have auth users / may have profiles).
  const { data: teachers, error: teachersError } = await supabaseAdmin
    .from("teachers")
    .select("auth_uid");

  if (teachersError) {
    return NextResponse.json({ error: teachersError.message }, { status: 500 });
  }
  const teacherUids = new Set((teachers ?? []).map((t) => t.auth_uid));

  // 3. Resolve emails from Supabase Auth.
  const emailMap = await getEmailMap();

  const result = (profiles ?? [])
    .filter((p) => !teacherUids.has(p.id))
    .map((p) => ({
      id: p.id,
      fullName: p.full_name || "Chưa đặt tên",
      email: emailMap.get(p.id) ?? null,
      gender: p.gender ?? null,
      birthYear: p.birth_year ?? null,
      avatarUrl: p.avatar_url ?? null,
      xp: p.xp ?? 0,
      level: p.level ?? 1,
      totalScore: p.total_score ?? 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

  return NextResponse.json({ data: result });
}
