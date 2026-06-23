import { NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/server/aiProvider";

export async function POST(req: Request) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 });
    }

    const { content, topic } = await req.json();

    if (!content && !topic) {
      return NextResponse.json({ error: "Cần cung cấp nội dung hoặc chủ đề" }, { status: 400 });
    }

    const prompt = `
Bạn là một chuyên gia SEO nội dung. Hãy tạo Meta Title, Meta Description và Keywords (Tags) dựa trên thông tin sau:
Chủ đề / Tiêu đề nháp: ${topic || "Không có"}
Nội dung bài viết: ${content || "Chưa có nội dung chi tiết, hãy dựa vào chủ đề để gợi ý."}

Yêu cầu định dạng đầu ra (JSON hợp lệ):
{
  "meta_title": "Tiêu đề SEO (khoảng 50-60 ký tự)",
  "meta_description": "Mô tả SEO hấp dẫn, chứa từ khóa chính (khoảng 150-160 ký tự)",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"],
  "suggested_outline": "Nếu nội dung chưa có, hãy gợi ý một dàn ý bài viết chuẩn SEO ở dạng văn bản thuần."
}
Chỉ trả về JSON, không kèm giải thích hay markdown code block.`;

    const response = await createChatCompletion({
      provider: "grok",
      maxTokens: 1200,
      temperature: 0.7,
      responseFormat: "json_object",
      messages: [{ role: "user", content: prompt }]
    });

    const resultText = response.text || "{}";
    const result = JSON.parse(resultText);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Lỗi AI SEO:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối với AI để tạo SEO" },
      { status: 500 }
    );
  }
}
