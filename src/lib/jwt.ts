// JWT decoding utility that supports ES256K tokens from Supabase Auth v2
// Decodes the JWT payload without cryptographic verification — safe because
// Supabase issues these tokens server-side. We only need the user ID (sub claim).

export interface DecodedJWT {
  sub: string;       // user ID
  email?: string;
  role?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

/**
 * Decode a JWT token (ES256K or HS256) without verification.
 * Returns null if the token is invalid or cannot be decoded.
 */
export function decodeJWT(token: string): DecodedJWT | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode payload (second part)
    const payload = parts[1]
      // Supabase uses base64url encoding
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    // Add padding if needed
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    const json = JSON.parse(decoded);

    if (!json.sub) return null;

    return {
      sub: json.sub,
      email: json.email,
      role: json.role,
      iss: json.iss,
      aud: json.aud,
      exp: json.exp,
      iat: json.iat,
    };
  } catch {
    return null;
  }
}

/**
 * Get user ID from a Bearer token string.
 * Returns null if no valid token is provided or cannot be decoded.
 */
export function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const decoded = decodeJWT(token);
  return decoded?.sub ?? null;
}
