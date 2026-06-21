import { afterEach, describe, expect, it, vi } from "vitest";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

async function loadPost() {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  return import("../route");
}

describe("POST /api/auth/student/login", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to public signup when admin user creation is not allowed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "User not allowed" }, { status: 403 }))
      .mockResolvedValueOnce(jsonResponse({ user: { id: "created-user-id" } }))
      .mockResolvedValueOnce(jsonResponse({
        access_token: "access-token",
        refresh_token: "refresh-token",
        user: { id: "created-user-id" },
      }))
      .mockResolvedValueOnce(jsonResponse([{ id: "created-user-id" }]))
      .mockResolvedValueOnce(jsonResponse([{ id: "created-user-id", full_name: "Hoc Sinh" }]));

    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await loadPost();

    const res = await POST(new Request("http://localhost/api/auth/student/login", {
      method: "POST",
      body: JSON.stringify({
        email: "student@example.com",
        password: "password123",
        isLogin: false,
        fullName: "Hoc Sinh",
        gender: "other",
        birthYear: 2015,
      }),
    }) as never);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://example.supabase.co/auth/v1/signup",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "student@example.com",
          password: "password123",
          data: {
            full_name: "Hoc Sinh",
            gender: "other",
            birth_year: 2015,
          },
        }),
      })
    );
    await expect(res.json()).resolves.toMatchObject({
      access_token: "access-token",
      refresh_token: "refresh-token",
      user: { id: "created-user-id", email: "student@example.com" },
      profile: { id: "created-user-id", full_name: "Hoc Sinh" },
    });
  });

  it("does not try to delete public signup users when profile creation fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "User not allowed" }, { status: 403 }))
      .mockResolvedValueOnce(jsonResponse({ user: { id: "created-user-id" } }))
      .mockResolvedValueOnce(jsonResponse({
        access_token: "access-token",
        refresh_token: "refresh-token",
        user: { id: "created-user-id" },
      }))
      .mockResolvedValueOnce(jsonResponse({ message: "profile insert failed" }, { status: 400 }));

    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await loadPost();

    const res = await POST(new Request("http://localhost/api/auth/student/login", {
      method: "POST",
      body: JSON.stringify({
        email: "student@example.com",
        password: "password123",
        isLogin: false,
      }),
    }) as never);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "profile insert failed" });
    expect(fetchMock).not.toHaveBeenCalledWith(
      "https://example.supabase.co/auth/v1/admin/users/created-user-id",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
