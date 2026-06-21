// POST /api/admin/students/[id]/reset-password — reset a self-registered student's password (admin only)
// Self-registered students authenticate via Supabase Auth, so we update the auth user directly.
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await context.params;

  let body: { newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newPassword = body.newPassword?.trim();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
  }

  await connectDB();

  // Ensure the profile exists in MongoDB before touching the auth user.
  const profile = await Profile.findOne({ _id: id } as any).lean();

  if (!profile) {
    return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
  }

  if (supabaseAdmin) {
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword,
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
