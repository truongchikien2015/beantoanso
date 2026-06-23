import { NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/server/aiProvider";

export async function POST(req: Request) {
  try {
    const pw = req.headers.get("x-admin-password");
    if (pw !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Thiếu chủ đề bài viết" }, { status: 400 });

    const prompt = `Bạn là một biên tập viên xuất sắc chuyên viết bài cho trang web giáo dục "Bé An Toàn Số".
Trang web này hướng đến giáo dục học sinh tiểu học, giáo viên và phụ huynh về an toàn mạng, kỹ năng số.
Hãy viết một bài blog chuẩn SEO (khoảng 800-1200 chữ) với chủ đề: "${topic}".
Bài viết sử dụng văn phong gần gũi, thân thiện, dễ hiểu, có chia thành các đoạn, sử dụng thẻ Heading (<h2>, <h3>) rõ ràng, và có danh sách (bullet points) để dễ đọc.

Chỉ trả về nội dung bài viết dưới dạng HTML (không bao gồm <html>, <head>, <body>). Bắt đầu ngay bằng nội dung HTML.`;

    const contentRes = await createChatCompletion({
      messages: [
        { role: "system", content: "You are an expert Vietnamese copywriter and SEO content creator for an ed-tech platform. Output ONLY pure HTML content, no markdown wrappers, no explanations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      maxTokens: 2000
    });

    let cleanContent = contentRes.text || "";
    // Strip markdown code blocks if AI wrapped the response
    if (cleanContent.startsWith("```html")) {
      cleanContent = cleanContent.replace(/^```html\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({ success: true, data: { content: cleanContent } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
