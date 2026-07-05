// POST /api/admin/students/bulk-delete — delete multiple self-registered Profiles at once (admin only).
// Body: { ids: string[] }
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((v): v is string => typeof v === "string") : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Danh sách rỗng" }, { status: 400 });
  }

  await connectDB();

  const result = await Profile.deleteMany({ _id: { $in: ids } } as any);

  return NextResponse.json({ success: true, deleted: result.deletedCount ?? 0 });
}
