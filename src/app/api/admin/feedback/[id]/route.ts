import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Feedback } from "@/lib/db/models";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Không tìm thấy feedback" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Lỗi cập nhật góp ý:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi cập nhật góp ý" },
      { status: 500 }
    );
  }
}
