// POST /api/teacher/students/bulk-delete — teacher removes many students at once.
// Body: { items: Array<{ id: string, source: "teacher" | "self" }> }
//   source="teacher" → soft-delete TeacherStudent (is_active=false)
//   source="self"    → unassign Profile.teacher_id (does NOT delete the account)
// Both operations are scoped so a teacher can only touch students in their class.
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { Profile } from "@/lib/db/models/Profile";
import { getTeacherUid } from "@/lib/auth-helpers";
import mongoose from "mongoose";

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(id.toString()).digest("hex");
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

type Item = { id: string; source: "teacher" | "self" };

export async function POST(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  let body: { items?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = Array.isArray(body.items) ? (body.items as unknown[]) : [];
  const items: Item[] = raw
    .map((x): Item | null => {
      if (!x || typeof x !== "object") return null;
      const id = (x as { id?: unknown }).id;
      const source = (x as { source?: unknown }).source;
      if (typeof id !== "string" || !id) return null;
      if (source !== "teacher" && source !== "self") return null;
      return { id, source };
    })
    .filter((v): v is Item => v !== null);

  if (items.length === 0) {
    return NextResponse.json({ error: "Danh sách rỗng" }, { status: 400 });
  }

  await connectDB();

  const teacherIds = items.filter((x) => x.source === "teacher").map((x) => toObjectId(x.id));
  const selfIds = items.filter((x) => x.source === "self").map((x) => x.id);

  const [teacherResult, selfResult] = await Promise.all([
    teacherIds.length > 0
      ? TeacherStudent.updateMany(
          { _id: { $in: teacherIds }, created_by: uid } as any,
          { $set: { is_active: false } },
        )
      : Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
    selfIds.length > 0
      ? Profile.updateMany(
          { _id: { $in: selfIds }, teacher_id: uid } as any,
          { $set: { teacher_id: null } },
        )
      : Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
  ]);

  return NextResponse.json({
    success: true,
    teacherStudents: {
      matched: teacherResult.matchedCount ?? 0,
      modified: teacherResult.modifiedCount ?? 0,
    },
    selfRegistered: {
      matched: selfResult.matchedCount ?? 0,
      modified: selfResult.modifiedCount ?? 0,
    },
  });
}
