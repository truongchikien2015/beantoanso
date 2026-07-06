// DELETE /api/admin/students/[id] — permanently delete a self-registered student's Profile (admin only).
// Related documents (StudentAnswer, Result, UserProgress) reference player_id and become orphaned;
// they are intentionally NOT cascaded — historical stats stay retrievable, and admin can prune manually.
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await context.params;

  await connectDB();

  const result = await Profile.deleteOne({ _id: id } as any);

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
  }

  return NextResponse.json({ success: true, deleted: 1 });
}
