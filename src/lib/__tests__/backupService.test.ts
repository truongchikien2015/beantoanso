import { afterEach, describe, expect, it, vi } from "vitest";

async function loadService() {
  vi.resetModules();
  return import("../backupService");
}

describe("downloadBackup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("includes current local storage keys used by the app", async () => {
    const store = new Map<string, string>([
      ["teacher-content-v1", "teacher-state"],
      ["bats:daily:v1", "daily-state"],
      ["be-an-toan-so:v2", "player-state"],
      ["be-an-toan-so-storage", "zustand-state"],
    ]);
    const clicked: string[] = [];
    let downloadedBlob: Blob | null = null;

    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn((blob: Blob) => {
        downloadedBlob = blob;
        return "blob:backup";
      }),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        setAttribute: vi.fn(),
        click: vi.fn(() => clicked.push("clicked")),
        href: "",
      })),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });

    const { downloadBackup } = await loadService();
    await downloadBackup("secret");
    const downloadedPayload = await downloadedBlob!.text();
    const backup = JSON.parse(downloadedPayload);

    expect(clicked).toEqual(["clicked"]);
    expect(backup.localStorage).toMatchObject({
      "teacher-content-v1": "teacher-state",
      "bats:daily:v1": "daily-state",
      "be-an-toan-so:v2": "player-state",
      "be-an-toan-so-storage": "zustand-state",
    });
  });
});

describe("restoreBackup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not report success when the server accepted the request but restored no current data", async () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: "File backup không có dữ liệu hiện tại để khôi phục.",
      results: { teacher_question_sets: { count: 0, status: "skipped" } },
    }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    })));

    const { restoreBackup } = await loadService();
    const result = await restoreBackup(JSON.stringify({
      version: "1.0",
      timestamp: new Date().toISOString(),
      localStorage: {},
      supabase: { profiles: [{ id: "profile-1" }] },
    }), "secret");

    expect(result.success).toBe(false);
    expect(result.message).toContain("không có dữ liệu hiện tại");
  });
});
