// GET /api/teacher/students — list all students belonging to this teacher.
// Includes both:
//   - Teacher-created students (TeacherStudent.created_by = uid)
//   - Self-registered students assigned by admin (Profile.teacher_id = uid)
// Returned in a unified shape with a `source` discriminator.
// POST /api/teacher/students — import students (bulk)
import { NextRequest, NextResponse } from "next/server";
import { connectDB, mongoose } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { Profile } from "@/lib/db/models/Profile";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { ImportStudentInput, ImportResult } from "@/types/teacher-content";

// Legacy DB may still have the sparse+unique index on parent_access_code from
// before the schema switched to partialFilterExpression. That old index treats
// explicit null as a value → every import row after the first fails E11000.
// Drop it (and unset null values) at most once per process lifetime.
let indexCleanupDone = false;
async function ensureParentAccessCodeIndexClean(): Promise<void> {
  if (indexCleanupDone) return;
  const db = mongoose.connection.db;
  if (!db) return;
  const coll = db.collection("teacher_students");
  try {
    const idx = await coll.indexes();
    const legacy = idx.find(
      (x) => x.name === "parent_access_code_1" && !("partialFilterExpression" in x),
    );
    if (legacy) {
      await coll.dropIndex("parent_access_code_1");
      console.log("[teacher/students] dropped legacy parent_access_code_1 index");
    }
    const unset = await coll.updateMany(
      { parent_access_code: null } as any,
      { $unset: { parent_access_code: "" } } as any,
    );
    if (unset.modifiedCount) {
      console.log(`[teacher/students] unset parent_access_code=null on ${unset.modifiedCount} docs`);
    }
    await TeacherStudent.syncIndexes();
  } catch (err) {
    console.warn("[teacher/students] index cleanup failed (non-fatal):", err instanceof Error ? err.message : String(err));
  } finally {
    indexCleanupDone = true;
  }
}

// GET /api/teacher/students
export async function GET(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  await connectDB();

  const [teacherStudents, selfProfiles] = await Promise.all([
    TeacherStudent.find({ created_by: uid, is_active: true })
      .sort({ created_at: -1 })
      .select("-password_hash")
      .lean(),
    Profile.find({ teacher_id: uid } as any)
      .sort({ created_at: -1 })
      .select("-password_hash")
      .lean(),
  ]);

  const teacherRows = teacherStudents.map((s) => ({
    id: s._id.toString(),
    created_by: s.created_by,
    nickname: s.nickname,
    email: s.email,
    class_name: s.class_name,
    student_code: s.student_code,
    parent_access_code: s.parent_access_code ?? null,
    assigned_path_ids: (s.assigned_path_ids || []).map(id => id.toString()),
    assigned_at: s.assigned_at,
    is_active: s.is_active,
    created_at: s.created_at,
    updated_at: s.updated_at,
    source: "teacher" as const,
  }));

  // Self-registered students → map to same shape. Fields that don't apply
  // (student_code, parent_access_code, class_name) stay empty; the UI hides
  // teacher-only actions for source="self".
  const selfRows = selfProfiles.map((p: any) => ({
    id: String(p._id),
    created_by: uid,
    nickname: p.full_name || p.email?.split("@")[0] || "Học sinh",
    email: p.email ?? null,
    class_name: null,
    student_code: "",
    parent_access_code: null,
    assigned_path_ids: [] as string[],
    assigned_at: null,
    is_active: true,
    created_at: p.created_at,
    updated_at: p.updated_at,
    source: "self" as const,
    xp: p.xp ?? 0,
    level: p.level ?? 1,
    total_score: p.total_score ?? 0,
  }));

  return NextResponse.json([...teacherRows, ...selfRows]);
}

// POST /api/teacher/students — bulk import
export async function POST(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  let body: { students: ImportStudentInput[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { students } = body;
  if (!Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: "students array required" }, { status: 400 });
  }

  await connectDB();
  await ensureParentAccessCodeIndexClean();

  // Hash passwords with bcryptjs
  const bcrypt = await import("bcryptjs");
  const results: Array<{ nickname: string; student_code: string; password: string }> = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const row = i + 1;

    if (!s.nickname || !s.student_code || !s.password) {
      errors.push({ row, message: "Thiếu nickname, student_code hoặc password" });
      continue;
    }

    // Check for duplicate student_code BEFORE hashing (cheap early-exit)
    const existing = await TeacherStudent.findOne({ student_code: s.student_code }).lean();
    if (existing) {
      errors.push({ row, message: `Mã học sinh "${s.student_code}" đã tồn tại` });
      continue;
    }

    let hash: string;
    try {
      hash = await bcrypt.hash(s.password, 10);
    } catch (hashErr) {
      const msg = hashErr instanceof Error ? hashErr.message : String(hashErr);
      console.error(`[teacher/students] bcrypt.hash failed row=${row}:`, msg);
      errors.push({ row, message: `Lỗi băm mật khẩu: ${msg}` });
      continue;
    }

    try {
      // Do NOT set parent_access_code — the field's unique+sparse index
      // treats explicit-null as a value in some Mongo versions, causing every
      // insert after the first to duplicate-key-conflict. Leaving it undefined
      // makes sparse work correctly (null becomes default only on read).
      const doc = await TeacherStudent.create({
        created_by: uid,
        nickname: s.nickname,
        email: s.email ?? null,
        class_name: s.class_name ?? null,
        student_code: s.student_code,
        password_hash: hash,
        is_active: true,
      });

      results.push({ nickname: doc.nickname, student_code: doc.student_code, password: s.password });
    } catch (createErr) {
      const msg = createErr instanceof Error ? createErr.message : String(createErr);
      const code = (createErr as { code?: number })?.code;
      console.error(`[teacher/students] TeacherStudent.create failed row=${row} code=${code}:`, msg);
      // Surface the real DB error so import failures are debuggable.
      let userMsg = msg;
      if (code === 11000) {
        userMsg = `Trùng khoá trong DB: ${msg}`;
      }
      errors.push({ row, message: userMsg });
    }
  }

  const importResult: ImportResult = {
    total: students.length,
    success: results.length,
    failed: errors.length,
    errors,
  };

  return NextResponse.json({
    result: importResult,
    created: results,
  }, { status: results.length > 0 ? 201 : 200 });
}
