export type AiProviderId = "grok" | "openrouter" | "deepseek";

export type AiProviderStatus = {
  id: AiProviderId;
  label: string;
  available: boolean;
};

export type AiAvailability = {
  available: boolean;
  providers: AiProviderStatus[];
  defaultProvider: AiProviderId;
};

export type GrokExplanation = {
  text: string;
  imageUrl: string | null;
  videoUrl: string | null;
  provider?: AiProviderId;
};

export type GeneratedQuestion = {
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

export type GenerateQuestionInput = {
  provider?: AiProviderId;
  topicSlug: string;
  topicLabel: string;
  minAge?: number;
  maxAge?: number;
  targetGender?: "all" | "male" | "female";
  teacherPrompt?: string;
};

const fallbackAvailability: AiAvailability = {
  available: false,
  providers: [
    { id: "grok", label: "Grok", available: false },
    { id: "openrouter", label: "OpenRouter", available: false },
    { id: "deepseek", label: "DeepSeek", available: false },
  ],
  defaultProvider: "grok",
};

async function getAiAvailability(path: string): Promise<AiAvailability> {
  const response = await fetch(path, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) return fallbackAvailability;
  const data = (await response.json().catch(() => null)) as
    | Partial<AiAvailability>
    | null;

  return {
    available: Boolean(data?.available),
    providers:
      data?.providers && data.providers.length > 0
        ? data.providers
        : fallbackAvailability.providers,
    defaultProvider:
      data?.defaultProvider === "openrouter"
        ? "openrouter"
        : data?.defaultProvider === "deepseek"
        ? "deepseek"
        : "grok",
  };
}

export async function getGrokAvailability() {
  const data = await getAiExplanationAvailability();
  return data.available;
}

export async function getGrokQuestionGenerationAvailability() {
  const data = await getAiQuestionGenerationAvailability();
  return data.available;
}

export function getAiExplanationAvailability() {
  return getAiAvailability("/api/grok/explain");
}

export function getAiQuestionGenerationAvailability() {
  return getAiAvailability("/api/grok/generate-question");
}

export async function fetchGrokExplanation(
  question: any,
  provider?: AiProviderId,
): Promise<GrokExplanation> {
  const response = await fetch("/api/grok/explain", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider,
      question: question.question,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      correct_option: question.correct_option,
      explanation: question.explanation,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | (Partial<GrokExplanation> & { error?: string })
    | null;

  if (!response.ok || !data?.text) {
    throw new Error(data?.error || "Grok chưa sẵn sàng");
  }

  return {
    text: data.text,
    imageUrl: data.imageUrl ?? null,
    videoUrl: data.videoUrl ?? null,
    provider: data.provider,
  };
}

export async function generateGrokQuestion(
  input: GenerateQuestionInput,
): Promise<GeneratedQuestion> {
  const response = await fetch("/api/grok/generate-question", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json().catch(() => null)) as
    | (Partial<GeneratedQuestion> & { error?: string })
    | null;

  if (!response.ok || !data?.question) {
    throw new Error(data?.error || "Grok chưa tạo được câu hỏi");
  }

  return {
    question: data.question,
    option_a: data.option_a || "",
    option_b: data.option_b || "",
    option_c: data.option_c || "",
    correct_option: data.correct_option === "B" || data.correct_option === "C"
      ? data.correct_option
      : "A",
    explanation: data.explanation || "",
    min_age: typeof data.min_age === "number" ? data.min_age : 6,
    max_age: typeof data.max_age === "number" ? data.max_age : 99,
    target_gender:
      data.target_gender === "male" || data.target_gender === "female"
        ? data.target_gender
        : "all",
  };
}
