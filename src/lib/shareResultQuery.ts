export type ShareResult = {
  id: string;
  nickname: string;
  mission_score: number;
  quiz_score: number;
  total_score: number;
  title: string;
  badge: string;
  completed_at?: string;
};

export const DEFAULT_SHARE_RESULT: ShareResult = {
  id: "preview",
  nickname: "Bạn nhỏ",
  mission_score: 0,
  quiz_score: 0,
  total_score: 0,
  title: "Chiến binh an toàn số",
  badge: "🏆",
};

export function getSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicitSiteUrl) return explicitSiteUrl;

  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

function toNumber(value: string | string[] | undefined, fallback = 0) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value: string | string[] | undefined, fallback: string) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.trim() ? raw : fallback;
}

export function shareResultFromSearchParams(
  id: string,
  searchParams: Record<string, string | string[] | undefined>,
): ShareResult {
  return {
    id,
    nickname: toStringValue(searchParams.n, DEFAULT_SHARE_RESULT.nickname),
    mission_score: toNumber(searchParams.mission),
    quiz_score: toNumber(searchParams.quiz),
    total_score: toNumber(searchParams.score),
    title: toStringValue(searchParams.title, DEFAULT_SHARE_RESULT.title),
    badge: toStringValue(searchParams.badge, DEFAULT_SHARE_RESULT.badge),
  };
}

export function createShareQuery(result: ShareResult) {
  const params = new URLSearchParams({
    n: result.nickname,
    mission: String(result.mission_score),
    quiz: String(result.quiz_score),
    score: String(result.total_score),
    title: result.title,
    badge: result.badge,
  });

  return params.toString();
}
