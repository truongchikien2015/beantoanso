import { NextRequest, NextResponse } from "next/server";

const EVENLAB_API_KEY = process.env.EVENLAB_API_KEY ?? process.env.ELEVENLABS_API_KEY;
const EVENLAB_VOICE_ID = process.env.EVENLAB_VOICE_ID;
const EVENLAB_MODEL_ID = normalizeModelId(process.env.EVENLAB_MODEL_ID);

function normalizeModelId(modelId: string | undefined): string {
  if (!modelId) return "eleven_multilingual_v2";
  if (modelId === "evenlab-v1-flash") return "eleven_flash_v2_5";
  return modelId;
}

async function getVoiceId(apiKey: string, ignoreConfigured = false): Promise<string> {
  if (EVENLAB_VOICE_ID && !ignoreConfigured) return EVENLAB_VOICE_ID;

  const voicesResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!voicesResponse.ok) return "JBFqnCBsd6RMkjVDRZzb";

  const body = await voicesResponse.json().catch(() => null);
  const voices = Array.isArray(body?.voices) ? body.voices : [];
  const usableVoice = voices.find((voice) => voice?.voice_id && voice?.category !== "library");
  return usableVoice?.voice_id ?? "JBFqnCBsd6RMkjVDRZzb";
}

async function requestSpeech(apiKey: string, voiceId: string, text: string): Promise<Response> {
  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: EVENLAB_MODEL_ID,
      }),
    }
  );
}

function isPaidPlanVoiceError(errorBody: string): boolean {
  return errorBody.includes("paid_plan_required") || errorBody.includes("library voices");
}

export async function POST(req: NextRequest) {
  if (!EVENLAB_API_KEY) {
    return NextResponse.json({ error: "EVENLAB_API_KEY not configured" }, { status: 503 });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const voiceId = await getVoiceId(EVENLAB_API_KEY);
  let elevenLabsResponse = await requestSpeech(EVENLAB_API_KEY, voiceId, text);

  if (!elevenLabsResponse.ok) {
    const error = await elevenLabsResponse.text().catch(() => "ElevenLabs request failed");
    if (isPaidPlanVoiceError(error)) {
      const fallbackVoiceId = await getVoiceId(EVENLAB_API_KEY, true);
      if (fallbackVoiceId !== voiceId) {
        elevenLabsResponse = await requestSpeech(EVENLAB_API_KEY, fallbackVoiceId, text);
        if (elevenLabsResponse.ok) {
          return new NextResponse(elevenLabsResponse.body, {
            headers: {
              "Content-Type": elevenLabsResponse.headers.get("content-type") ?? "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        }
      }
    }
    return NextResponse.json({ error }, { status: elevenLabsResponse.status });
  }

  return new NextResponse(elevenLabsResponse.body, {
    headers: {
      "Content-Type": elevenLabsResponse.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
