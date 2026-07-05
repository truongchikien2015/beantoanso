import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Feedback } from "@/lib/db/models";

export async function GET(req: Request) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
    }

    await connectDB();
    const feedbacks = await Feedback.find().sort({ created_at: -1 });

    return NextResponse.json({ success: true, data: feedbacks });
  } catch (error: any) {
    console.error("Lỗi lấy danh sách góp ý:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải góp ý" },
      { status: 500 }
    );
  }
}
