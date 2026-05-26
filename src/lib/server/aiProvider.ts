export type AiProviderId = "grok" | "openrouter" | "deepseek";

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiProviderStatus = {
  id: AiProviderId;
  label: string;
  available: boolean;
};

type ChatCompletionInput = {
  provider?: AiProviderId;
  messages: AiChatMessage[];
  maxTokens: number;
  temperature: number;
  responseFormat?: "json_object";
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: { message?: string } | string;
};

const PROVIDERS: Record<AiProviderId, { label: string }> = {
  grok: { label: "Grok" },
  openrouter: { label: "OpenRouter" },
  deepseek: { label: "DeepSeek" },
};

export class AiProviderError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
  }
}

function isProviderId(value: unknown): value is AiProviderId {
  return value === "grok" || value === "openrouter" || value === "deepseek";
}

function getProviderKey(provider: AiProviderId) {
  if (provider === "grok") return process.env.XAI_API_KEY;
  if (provider === "openrouter") return process.env.OPENROUTER_API_KEY;
  return process.env.DEEPSEEK_API_KEY;
}

function getProviderModel(provider: AiProviderId) {
  if (provider === "grok") return process.env.XAI_MODEL ?? "grok-4.3";
  if (provider === "openrouter") return process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  return process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
}

function configuredDefaultProvider(): AiProviderId {
  return isProviderId(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : "grok";
}

export function getAvailableAiProviders(): AiProviderStatus[] {
  return (Object.keys(PROVIDERS) as AiProviderId[]).map((id) => ({
    id,
    label: PROVIDERS[id].label,
    available: Boolean(getProviderKey(id)),
  }));
}

export function getDefaultAiProvider(): AiProviderId {
  const configured = configuredDefaultProvider();
  if (getProviderKey(configured)) return configured;

  const firstAvailable = getAvailableAiProviders().find((provider) => provider.available);
  return firstAvailable?.id ?? configured;
}

export function resolveAiProvider(requestedProvider?: unknown): AiProviderId {
  if (requestedProvider !== undefined && !isProviderId(requestedProvider)) {
    throw new AiProviderError("Nhà cung cấp AI không hợp lệ.", 400);
  }

  const provider: AiProviderId =
    requestedProvider !== undefined && isProviderId(requestedProvider)
      ? requestedProvider
      : getDefaultAiProvider();
  if (!getProviderKey(provider)) {
    throw new AiProviderError(`${PROVIDERS[provider].label} chưa được cấu hình.`, 503);
  }

  return provider;
}

function getUpstreamErrorMessage(data: ChatCompletionResponse) {
  if (typeof data.error === "string") return data.error;
  return data.error?.message || null;
}

function friendlyProviderError(
  provider: AiProviderId,
  status: number,
  upstreamMessage: string | null,
) {
  const label = PROVIDERS[provider].label;

  if (status === 402 || (upstreamMessage && /credits|billing|payment|licenses/i.test(upstreamMessage))) {
    return `Tài khoản ${label} chưa có credits hoặc billing chưa sẵn sàng.`;
  }

  if (status === 401 || status === 403) {
    return `API key ${label} không hợp lệ hoặc chưa có quyền gọi model.`;
  }

  if (status === 429) {
    return `${label} đang giới hạn lượt gọi, vui lòng thử lại sau.`;
  }

  return upstreamMessage || `${label} request failed`;
}

function getOpenRouterHeaders() {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  };

  if (process.env.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
  }

  if (process.env.OPENROUTER_SITE_NAME) {
    headers["X-Title"] = toHeaderByteString(process.env.OPENROUTER_SITE_NAME);
  }

  return headers;
}

function toHeaderByteString(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

export async function createChatCompletion({
  provider: requestedProvider,
  messages,
  maxTokens,
  temperature,
  responseFormat,
}: ChatCompletionInput) {
  const provider = resolveAiProvider(requestedProvider);
  
  let url = "";
  let headers: Record<string, string> = {};
  
  if (provider === "grok") {
    url = "https://api.x.ai/v1/chat/completions";
    headers = {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    };
  } else if (provider === "openrouter") {
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers = getOpenRouterHeaders();
  } else if (provider === "deepseek") {
    url = "https://api.deepseek.com/chat/completions";
    headers = {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: getProviderModel(provider),
      max_tokens: maxTokens,
      temperature,
      messages,
      ...(responseFormat ? { response_format: { type: responseFormat } } : {}),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as ChatCompletionResponse;
  if (!response.ok) {
    throw new AiProviderError(
      friendlyProviderError(provider, response.status, getUpstreamErrorMessage(data)),
      response.status,
    );
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AiProviderError(`${PROVIDERS[provider].label} trả về nội dung rỗng.`, 502);
  }

  return {
    provider,
    text,
  };
}
