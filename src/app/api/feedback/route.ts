import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Feedback } from "@/lib/db/models";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { content, user_info, feature_request } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Nội dung góp ý không được để trống" },
        { status: 400 }
      );
    }

    const feedback = new Feedback({
      content: content.trim(),
      user_info: user_info?.trim(),
      feature_request: !!feature_request,
    });

    await feedback.save();

    return NextResponse.json({ success: true, data: feedback });
  } catch (error: any) {
    console.error("Lỗi gửi góp ý:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi lưu góp ý" },
      { status: 500 }
    );
  }
}
