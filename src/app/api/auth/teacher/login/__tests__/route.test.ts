import { describe, expect, it, vi, afterEach } from "vitest";

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

describe("POST /api/auth/teacher/login", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates the profile with the logged-in auth user id", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({
        access_token: "access-token",
        refresh_token: "refresh-token",
        user: { id: "logged-in-user-id" },
      }))
      .mockResolvedValueOnce(jsonResponse([{ id: "logged-in-user-id" }]))
      .mockResolvedValueOnce(jsonResponse([{ id: "logged-in-user-id", full_name: "Test User" }]));

    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await loadPost();

    const res = await POST(new Request("http://localhost/api/auth/teacher/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        isLogin: false,
        fullName: "Test User",
        gender: "other",
        birthYear: 2012,
      }),
    }) as never);

    expect(res.status).toBe(200);
    const profileCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/rest/v1/profiles?on_conflict=id")
    );
    expect(profileCall).toBeDefined();
    expect(JSON.parse(String(profileCall?.[1]?.body))).toMatchObject({
      id: "logged-in-user-id",
      full_name: "Test User",
      birth_year: 2012,
    });
  });

  it("rolls back the auth user and reports profile insert failures", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "created-user-id" }))
      .mockResolvedValueOnce(jsonResponse({
        access_token: "access-token",
        refresh_token: "refresh-token",
        user: { id: "created-user-id" },
      }))
      .mockResolvedValueOnce(jsonResponse({
        message: "insert or update on table \"profiles\" violates foreign key constraint \"profiles_id_fkey\"",
      }, { status: 409 }))
      .mockResolvedValueOnce(jsonResponse({}));

    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await loadPost();

    const res = await POST(new Request("http://localhost/api/auth/teacher/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        isLogin: false,
        fullName: "Test User",
        gender: "other",
        birthYear: 2012,
      }),
    }) as never);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "insert or update on table \"profiles\" violates foreign key constraint \"profiles_id_fkey\"",
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://example.supabase.co/auth/v1/admin/users/created-user-id",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
