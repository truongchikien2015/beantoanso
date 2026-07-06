<<<<<<< HEAD
// POST /api/admin/students/[id]/reset-password — reset a self-registered student's password (admin only)
// Self-registered students authenticate via Supabase Auth, so we update the auth user directly.
=======
// POST /api/admin/students/[id]/reset-password — reset a self-registered student's password (admin only).
// MongoDB-only. Login (/api/auth/student/login) verifies bcrypt against Profile.password_hash.
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";
<<<<<<< HEAD
import { supabaseAdmin } from "@/lib/supabase-admin";
=======
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331

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

<<<<<<< HEAD
  // Ensure the profile exists in MongoDB before touching the auth user.
  const profile = await Profile.findOne({ _id: id } as any).lean();

=======
  const profile = await Profile.findOne({ _id: id } as any).lean();
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
  if (!profile) {
    return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
  }

<<<<<<< HEAD
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
=======
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const updateResult = await (Profile as any).updateOne(
    { _id: id },
    { $set: { password_hash: passwordHash } },
  );

  if (updateResult.matchedCount === 0) {
    return NextResponse.json(
      { error: "Không cập nhật được mật khẩu (không khớp hồ sơ)" },
      { status: 500 },
    );
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
  }

  return NextResponse.json({ success: true });
}
