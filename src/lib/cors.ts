import { NextRequest, NextResponse } from "next/server";

const LOCAL_WEB_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function corsHeaders(req: NextRequest): HeadersInit {
  const origin = req.headers.get("origin");
  const configuredOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.MOBILE_APP_ORIGIN,
    ...(process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? []),
  ]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];

  const allowOrigin =
    origin && (LOCAL_WEB_ORIGIN.test(origin) || configuredOrigins.includes(origin))
      ? origin
      : configuredOrigins[0] ?? origin ?? "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, ngrok-skip-browser-warning",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function jsonWithCors(req: NextRequest, body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...corsHeaders(req),
      ...(init?.headers ?? {}),
    },
  });
}

export function withCors(req: NextRequest, response: NextResponse) {
  for (const [key, value] of Object.entries(corsHeaders(req))) {
    response.headers.set(key, String(value));
  }
  return response;
}

export function corsOptions(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}
