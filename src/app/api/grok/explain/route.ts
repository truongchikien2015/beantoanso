import { NextResponse } from "next/server";
import {
  AiProviderError,
  createChatCompletion,
  getAvailableAiProviders,
  getDefaultAiProvider,
  type AiProviderId,
} from "../../../../lib/server/aiProvider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ExplainPayload = {
  provider?: AiProviderId;
  question?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  correct_option?: string;
  explanation?: string;
};

function isValidPayload(payload: ExplainPayload) {
  return (
    typeof payload.question === "string" &&
    typeof payload.option_a === "string" &&
    typeof payload.option_b === "string" &&
    typeof payload.option_c === "string" &&
    typeof payload.correct_option === "string" &&
    ["A", "B", "C"].includes(payload.correct_option) &&
    typeof payload.explanation === "string"
  );
}

function getCorrectAnswer(payload: ExplainPayload) {
  if (payload.correct_option === "A") return payload.option_a;
  if (payload.correct_option === "B") return payload.option_b;
  return payload.option_c;
}

export async function GET() {
  const providers = getAvailableAiProviders();
  return NextResponse.json(
    {
      available: providers.some((provider) => provider.available),
      providers,
      defaultProvider: getDefaultAiProvider(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let payload: ExplainPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!isValidPayload(payload)) {
    return NextResponse.json(
      { error: "Invalid question payload" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const correctAnswer = getCorrectAnswer(payload);
  try {
    const result = await createChatCompletion({
      provider: payload.provider,
      maxTokens: 240,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Bạn là trợ lý giáo dục an toàn Internet cho trẻ em Việt Nam. Giải thích ngắn gọn, ấm áp, dễ hiểu, không hù dọa.",
        },
        {
          role: "user",
          content: [
            `Câu hỏi: ${payload.question}`,
            `A: ${payload.option_a}`,
            `B: ${payload.option_b}`,
            `C: ${payload.option_c}`,
            `Đáp án đúng: ${payload.correct_option} - ${correctAnswer}`,
            `Giải thích có sẵn: ${payload.explanation}`,
            "Hãy viết 2-3 câu tiếng Việt giải thích vì sao đáp án đúng an toàn hơn, phù hợp với học sinh tiểu học.",
          ].join("\n"),
        },
      ],
    });

    return NextResponse.json(
      { text: result.text, imageUrl: null, videoUrl: null, provider: result.provider },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const status = err instanceof AiProviderError ? err.status : 500;
    const message =
      err instanceof Error ? err.message : "AI chưa sẵn sàng, vui lòng thử lại sau.";
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
