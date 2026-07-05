import { NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/server/aiProvider";
import { slugify } from "@/lib/slugify";

// LLMs (esp. DeepSeek) sometimes ignore response_format and wrap JSON in a
// ```json ... ``` fence or prefix it with "Đây là kết quả:". This helper is
// forgiving: strip fences, then find the first `{...}` balanced block.
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Direct parse first — happy path.
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }

  // Strip markdown fence: ```json\n...\n``` or ```\n...\n```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      /* fall through */
    }
  }

  // Last resort: locate the first `{` and its matching `}` via depth counter.
  const start = trimmed.indexOf("{");
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, i + 1));
          } catch {
            break;
          }
        }
      }
    }
  }

  throw new Error("No JSON object found in response");
}

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
Bạn là một chuyên gia SEO nội dung. Hãy tạo Meta Title, Meta Description, Keywords (Tags) và Slug URL dựa trên thông tin sau:
Chủ đề / Tiêu đề nháp: ${topic || "Không có"}
Nội dung bài viết: ${content || "Chưa có nội dung chi tiết, hãy dựa vào chủ đề để gợi ý."}

Yêu cầu định dạng đầu ra (JSON hợp lệ):
{
  "meta_title": "Tiêu đề SEO (khoảng 50-60 ký tự)",
  "meta_description": "Mô tả SEO hấp dẫn, chứa từ khóa chính (khoảng 150-160 ký tự)",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"],
  "slug": "duong-dan-url-thuan-viet-khong-dau-cach-nhau-bang-dau-gach-ngang",
  "suggested_outline": "Nếu nội dung chưa có, hãy gợi ý một dàn ý bài viết chuẩn SEO ở dạng văn bản thuần."
}
Chỉ trả về JSON, không kèm giải thích hay markdown code block.`;

    const response = await createChatCompletion({
      provider: "deepseek",
      maxTokens: 1200,
      temperature: 0.7,
      responseFormat: "json_object",
      messages: [{ role: "user", content: prompt }]
    });

    const resultText = response.text || "{}";
    let result: any;
    try {
      result = extractJson(resultText);
    } catch (parseError: any) {
      console.error("[news/ai-seo] JSON parse failed:", parseError, "raw:", resultText.slice(0, 300));
      return NextResponse.json(
        {
          error: "AI trả về nội dung không phải JSON hợp lệ. Thử lại lần nữa.",
          diagnostic: { stage: "parse", raw: resultText.slice(0, 300) },
        },
        { status: 502 },
      );
    }

    if (!result || typeof result !== "object") {
      return NextResponse.json(
        {
          error: "AI trả về cấu trúc không hợp lệ. Thử lại lần nữa.",
          diagnostic: { stage: "shape", raw: resultText.slice(0, 300) },
        },
        { status: 502 },
      );
    }

    // Always run the slug through our slugify — even if the AI produced one,
    // we normalize diacritics and enforce format. Falls back to meta_title
    // then the original topic when the AI omitted the slug.
    const rawSlugCandidate: string =
      typeof result?.slug === "string" && result.slug ? result.slug :
      typeof result?.meta_title === "string" && result.meta_title ? result.meta_title :
      topic || "";
    result.slug = slugify(rawSlugCandidate);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    // Surface the real error name/message so we can diagnose from the Network
    // tab instead of guessing (masked errors are what got us stuck last time).
    const name = error?.name ?? "Error";
    const message = error?.message ?? String(error);
    const status = typeof error?.status === "number" ? error.status : 500;
    console.error("[news/ai-seo] failed:", name, message);
    return NextResponse.json(
      {
        error: message || "Lỗi kết nối với AI để tạo SEO",
        diagnostic: {
          name,
          hasXaiKey: !!process.env.XAI_API_KEY,
          hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
          aiProvider: process.env.AI_PROVIDER ?? null,
        },
      },
      { status },
    );
  }
}
