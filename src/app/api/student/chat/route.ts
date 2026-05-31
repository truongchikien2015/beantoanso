import { NextRequest, NextResponse } from "next/server";
import {
  AiProviderError,
  createChatCompletion,
  type AiChatMessage,
} from "@/lib/server/aiProvider";
import { getAnyStudentId } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StudentChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type StudentChatPayload = {
  message?: string;
  history?: StudentChatMessage[];
};

type StudentChatAiResponse = {
  answer?: string;
  refused?: boolean;
};

const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY_ITEMS = 10;

function sanitizeText(value: unknown, maxLength = MAX_MESSAGE_LENGTH) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeHistory(value: unknown): StudentChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is StudentChatMessage => {
      return (
        item &&
        typeof item === "object" &&
        ((item as StudentChatMessage).role === "user" ||
          (item as StudentChatMessage).role === "assistant") &&
        typeof (item as StudentChatMessage).content === "string"
      );
    })
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item.role,
      content: sanitizeText(item.content, 500),
    }))
    .filter((item) => item.content.length > 0);
}

function parseAiJson(text: string): StudentChatAiResponse | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as StudentChatAiResponse;
    if (typeof parsed.answer !== "string") return null;
    return {
      answer: sanitizeText(parsed.answer, 1200),
      refused: Boolean(parsed.refused),
    };
  } catch {
    return null;
  }
}

function buildMessages(message: string, history: StudentChatMessage[]): AiChatMessage[] {
  return [
    {
      role: "system",
      content: [
        "Bạn là chatbot hỗ trợ học tập cho học sinh Việt Nam.",
        "Chỉ trả lời các câu hỏi phục vụ giáo dục, học tập, kỹ năng học đường, an toàn số, đạo đức số, sức khỏe học đường ở mức phù hợp học sinh.",
        "Không trả lời câu hỏi không liên quan giáo dục như mua bán, giải trí thuần túy, chính trị, nội dung người lớn, bạo lực, cờ bạc, hack tài khoản, né luật, hay xin dữ liệu riêng tư.",
        "Không làm hộ bài kiểm tra; hãy gợi ý cách suy nghĩ từng bước.",
        "Trả lời ngắn gọn bằng tiếng Việt, thân thiện, dễ hiểu.",
        "Bắt buộc trả về JSON hợp lệ, không markdown: {\"answer\":\"...\",\"refused\":false}.",
        "Nếu từ chối, đặt refused=true và answer là lời từ chối nhẹ nhàng kèm gợi ý hỏi lại về học tập/an toàn số.",
      ].join("\n"),
    },
    ...history.map((item) => ({
      role: item.role,
      content: item.content,
    })),
    {
      role: "user",
      content: message,
    },
  ];
}

export async function POST(req: NextRequest) {
  const authResult = getAnyStudentId(req);
  if (authResult instanceof NextResponse) return authResult;
  const { studentId, accountType } = authResult;

  let payload: StudentChatPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const message = sanitizeText(payload.message);
  if (!message) {
    return NextResponse.json({ error: "Vui lòng nhập câu hỏi." }, { status: 400 });
  }
  if (typeof payload.message === "string" && payload.message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Câu hỏi tối đa ${MAX_MESSAGE_LENGTH} ký tự.` },
      { status: 400 },
    );
  }

  // Teacher-created students must exist & be active in teacher_students.
  // Self-registered students authenticate via Supabase Auth (no such row).
  if (accountType === "teacher") {
    const { data: student, error: studentError } = await supabaseAdmin!
      .from("teacher_students")
      .select("id")
      .eq("id", studentId)
      .eq("is_active", true)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
    }
  }

  try {
    const result = await createChatCompletion({
      provider: "deepseek",
      maxTokens: 500,
      temperature: 0.35,
      responseFormat: "json_object",
      messages: buildMessages(message, normalizeHistory(payload.history)),
    });

    const parsed = parseAiJson(result.text);
    if (!parsed?.answer) {
      return NextResponse.json(
        { error: "Trợ lý đang bận, em thử lại sau nhé." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      answer: parsed.answer,
      refused: parsed.refused,
    });
  } catch (err) {
    const status = err instanceof AiProviderError ? err.status : 500;
    return NextResponse.json(
      { error: "Trợ lý đang bận, em thử lại sau nhé." },
      { status },
    );
  }
}
