import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "123456";

export function getAdminPasswordHeader(req: NextRequest): string | null {
  for (const [key, value] of req.headers.entries()) {
    if (key.replace(/\s*;\s*$/, "").toLowerCase() === "x-admin-password") {
      return value;
    }
  }
  return null;
}

export function checkAdmin(req: NextRequest): NextResponse | null {
  const adminPassword = getAdminPasswordHeader(req);
  if (adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
