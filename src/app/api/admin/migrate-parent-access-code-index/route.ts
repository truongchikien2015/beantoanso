// POST /api/admin/migrate-parent-access-code-index — one-shot cleanup for the
// import-fail-on-every-row bug. Drops the legacy sparse+unique index on
// teacher_students.parent_access_code, unsets any null values so the field is
// missing on affected docs, then rebuilds the index using Mongoose's new
// partialFilterExpression definition.
// Admin-only. Safe to re-run.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB, mongoose } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  await connectDB();

  const db = mongoose.connection.db;
  if (!db) {
    return NextResponse.json({ error: "MongoDB connection not ready" }, { status: 500 });
  }
  const coll = db.collection("teacher_students");

  const report: Record<string, unknown> = {};

  // 1. Drop old parent_access_code index if present. Ignore "not found".
  try {
    await coll.dropIndex("parent_access_code_1");
    report.dropped_old_index = true;
  } catch (err: unknown) {
    report.dropped_old_index = false;
    report.drop_note = err instanceof Error ? err.message : String(err);
  }

  // 2. Unset explicit null values so the partial index skips them.
  const unsetResult = await coll.updateMany(
    { parent_access_code: null } as any,
    { $unset: { parent_access_code: "" } } as any,
  );
  report.unset_null_rows = unsetResult.modifiedCount ?? 0;

  // 3. Ensure the new partial index exists.
  await TeacherStudent.syncIndexes();
  report.synced_indexes = true;

  return NextResponse.json({ success: true, ...report });
}
