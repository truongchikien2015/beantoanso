<<<<<<< HEAD
=======
// GET /api/teachers — list all teachers (admin only)
// POST /api/teachers — create teacher account (admin only)
// MongoDB-only. auth_uid is a locally generated ObjectId (Supabase removed).
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Teacher } from "@/lib/db/models/Teacher";
<<<<<<< HEAD
import { supabaseAdmin } from "@/lib/supabase-admin";
import mongoose from "mongoose";

// GET /api/teachers — list all teachers (admin only)
=======
import mongoose from "mongoose";

>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
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

<<<<<<< HEAD
// POST /api/teachers — create teacher account (admin only)
=======
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
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

<<<<<<< HEAD
  // Check if email already registered in MongoDB
=======
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
  const existing = await Teacher.findOne({ email }).lean();
  if (existing) {
    return NextResponse.json({ error: "Email đã được đăng ký" }, { status: 409 });
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 10);

<<<<<<< HEAD
  // Try to create in Supabase Auth first for auth fallback, but default to random UUID if not configured
  let authUid = new mongoose.Types.ObjectId().toString();
  let createdSupabaseUser = false;

  if (supabaseAdmin) {
    try {
      const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });

      if (authUser?.user) {
        authUid = authUser.user.id;
        createdSupabaseUser = true;
      } else {
        console.warn("[teachers] Supabase auth user creation skipped:", createUserError?.message);
      }
    } catch (e: any) {
      console.warn("[teachers] Supabase auth error:", e.message);
    }
  }
=======
  const authUid = new mongoose.Types.ObjectId().toString();
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331

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
<<<<<<< HEAD
    // Rollback Supabase user if DB creation fails
    if (createdSupabaseUser && supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUid);
      } catch (err: any) {
        console.error("[teachers-rollback] Failed to delete Supabase user:", err.message);
      }
    }
=======
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
    return NextResponse.json({ error: dbError.message || "Failed to save teacher" }, { status: 500 });
  }
}
