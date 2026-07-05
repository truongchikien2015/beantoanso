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

type GeneratePayload = {
  provider?: AiProviderId;
  topicSlug?: string;
  topicLabel?: string;
  minAge?: number;
  maxAge?: number;
  targetGender?: string;
  teacherPrompt?: string;
};

type GeneratedQuestion = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string;
  min_age: number;
  max_age: number;
  target_gender: "all" | "male" | "female";
};

const TARGET_GENDERS = ["all", "male", "female"] as const;
const UNSAFE_TERMS = [
  "tự tử",
  "khiêu dâm",
  "ma túy",
  "đánh bạc",
  "bạo lực máu me",
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAge(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(5, Math.min(99, Math.round(value)));
}

function normalizeGender(value: unknown): "all" | "male" | "female" {
  return TARGET_GENDERS.includes(value as (typeof TARGET_GENDERS)[number])
    ? (value as "all" | "male" | "female")
    : "all";
}

function isValidPayload(payload: GeneratePayload) {
  return (
    typeof payload.topicSlug === "string" &&
    payload.topicSlug.trim().length > 0 &&
    typeof payload.topicLabel === "string" &&
    payload.topicLabel.trim().length > 0
  );
}

function extractJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return cleaned.slice(start, end + 1);
}

function toGeneratedQuestion(value: unknown, defaults: GeneratedQuestion) {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<GeneratedQuestion>;
  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  const optionA = typeof raw.option_a === "string" ? raw.option_a.trim() : "";
  const optionB = typeof raw.option_b === "string" ? raw.option_b.trim() : "";
  const optionC = typeof raw.option_c === "string" ? raw.option_c.trim() : "";
  const explanation =
    typeof raw.explanation === "string" ? raw.explanation.trim() : "";
  const correctOption = raw.correct_option;

  if (
    !question ||
    !optionA ||
    !optionB ||
    !optionC ||
    !explanation ||
    !["A", "B", "C"].includes(correctOption || "")
  ) {
    return null;
  }

  const normalizedOptions = [optionA, optionB, optionC].map(normalizeText);
  if (new Set(normalizedOptions).size !== 3) return null;

  const combined = normalizeText([question, optionA, optionB, optionC, explanation].join(" "));
  if (UNSAFE_TERMS.some((term) => combined.includes(normalizeText(term)))) {
    return null;
  }

  const minAge = normalizeAge(raw.min_age, defaults.min_age);
  const maxAge = normalizeAge(raw.max_age, defaults.max_age);

  return {
    question,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    correct_option: correctOption as "A" | "B" | "C",
    explanation,
    min_age: Math.min(minAge, maxAge),
    max_age: Math.max(minAge, maxAge),
    target_gender: normalizeGender(raw.target_gender ?? defaults.target_gender),
  };
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
  let payload: GeneratePayload;
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
      { error: "Invalid generator payload" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const requestedMinAge = normalizeAge(payload.minAge, 6);
  const requestedMaxAge = normalizeAge(payload.maxAge, 99);
  const defaults: GeneratedQuestion = {
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    correct_option: "A",
    explanation: "",
    min_age: Math.min(requestedMinAge, requestedMaxAge),
    max_age: Math.max(requestedMinAge, requestedMaxAge),
    target_gender: normalizeGender(payload.targetGender),
  };

  let content: string;
  try {
    const result = await createChatCompletion({
      provider: payload.provider,
      maxTokens: 1200,
      temperature: 0.65,
      responseFormat: "json_object",
      messages: [
        {
          role: "system",
          content:
            "Bạn là chuyên gia giáo dục an toàn Internet cho trẻ em Việt Nam. Chỉ tạo nội dung an toàn, tích cực, phù hợp học sinh tiểu học. Trả về JSON hợp lệ, không markdown.",
        },
        {
          role: "user",
          content: [
            "Tạo 1 câu hỏi trắc nghiệm 3 đáp án về an toàn số.",
            `Chủ đề slug: ${payload.topicSlug}`,
            `Tên chủ đề: ${payload.topicLabel}`,
            `Độ tuổi: ${defaults.min_age}-${defaults.max_age}`,
            `Giới tính mục tiêu: ${defaults.target_gender}`,
            payload.teacherPrompt?.trim()
              ? `Yêu cầu thêm của giáo viên: ${payload.teacherPrompt.trim()}`
              : "",
            "JSON schema bắt buộc:",
            '{"question":"...","option_a":"...","option_b":"...","option_c":"...","correct_option":"A","explanation":"...","min_age":6,"max_age":99,"target_gender":"all"}',
            "Quy tắc: đáp án sai phải hợp lý nhưng rõ ràng kém an toàn hơn, explanation 1-2 câu tiếng Việt, không dùng A/B/C trong nội dung đáp án.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });
    content = result.text;
  } catch (err) {
    const status = err instanceof AiProviderError ? err.status : 500;
    const message =
      err instanceof Error ? err.message : "AI chưa tạo được câu hỏi";
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const json = extractJson(content);
  if (!json) {
    return NextResponse.json(
      { error: "AI returned invalid question JSON" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return NextResponse.json(
      { error: "AI returned invalid question JSON" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  const generated = toGeneratedQuestion(parsed, defaults);
  if (!generated) {
    return NextResponse.json(
      { error: "AI question did not pass validation" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(generated, {
    headers: { "Cache-Control": "no-store" },
  });
}
