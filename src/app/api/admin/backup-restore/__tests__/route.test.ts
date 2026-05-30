import { afterEach, describe, expect, it, vi } from "vitest";

const tableData = new Map<string, unknown[]>();
const upsertErrors = new Map<string, { message: string }>();
const selectedTables: string[] = [];
const upsertedTables: string[] = [];

function jwtWithRole(role: string) {
  const payload = Buffer.from(JSON.stringify({ role, ref: "test-project", iss: "supabase" })).toString("base64url");
  return `header.${payload}.signature`;
}

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from(table: string) {
      return {
        select() {
          selectedTables.push(table);
          return Promise.resolve({ data: tableData.get(table) ?? [], error: null });
        },
        upsert(rows: unknown[]) {
          upsertedTables.push(table);
          return Promise.resolve({ error: upsertErrors.get(table) ?? null, data: rows });
        },
      };
    },
  },
}));

async function loadRoute() {
  vi.resetModules();
  process.env.ADMIN_API_SECRET = "secret";
  process.env.SUPABASE_SERVICE_ROLE_KEY = jwtWithRole("service_role");
  return import("../route");
}

function request(method: "GET" | "POST", body?: unknown) {
  return new Request("http://localhost/api/admin/backup-restore", {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": "secret",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("/api/admin/backup-restore", () => {
  afterEach(() => {
    tableData.clear();
    upsertErrors.clear();
    selectedTables.length = 0;
    upsertedTables.length = 0;
    vi.unstubAllGlobals();
  });

  it("exports current teacher content tables for data restore", async () => {
    tableData.set("teacher_students", [{ id: "student-1" }]);
    tableData.set("teacher_question_sets", [{ id: "set-1" }]);
    const { GET } = await loadRoute();

    const res = await GET(request("GET") as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(selectedTables).toContain("teacher_students");
    expect(selectedTables).toContain("teacher_question_sets");
    expect(selectedTables).toContain("teacher_questions");
    expect(selectedTables).toContain("teacher_learning_paths");
    expect(body.data.teacher_students).toEqual([{ id: "student-1" }]);
    expect(body.data.teacher_question_sets).toEqual([{ id: "set-1" }]);
  });

  it("imports teacher content tables before their dependent rows", async () => {
    const { POST } = await loadRoute();

    const res = await POST(request("POST", {
      data: {
        teacher_question_sets: [{ id: "set-1" }],
        teacher_questions: [{ id: "question-1", set_id: "set-1" }],
        teacher_learning_paths: [{ id: "path-1" }],
        teacher_learning_path_steps: [{ id: "step-1", path_id: "path-1" }],
        teacher_students: [{ id: "student-1" }],
        teacher_student_progress: [{ id: "progress-1", student_id: "student-1" }],
      },
    }) as never);

    expect(res.status).toBe(200);
    expect(upsertedTables).toEqual(expect.arrayContaining([
      "teacher_question_sets",
      "teacher_questions",
      "teacher_learning_paths",
      "teacher_learning_path_steps",
      "teacher_students",
      "teacher_student_progress",
    ]));
    expect(upsertedTables.indexOf("teacher_question_sets")).toBeLessThan(upsertedTables.indexOf("teacher_questions"));
    expect(upsertedTables.indexOf("teacher_learning_paths")).toBeLessThan(upsertedTables.indexOf("teacher_learning_path_steps"));
    expect(upsertedTables.indexOf("teacher_students")).toBeLessThan(upsertedTables.indexOf("teacher_student_progress"));
  });

  it("returns an error status when any table fails to import", async () => {
    upsertErrors.set("teacher_questions", { message: "foreign key failure" });
    const { POST } = await loadRoute();

    const res = await POST(request("POST", {
      data: {
        teacher_question_sets: [{ id: "set-1" }],
        teacher_questions: [{ id: "question-1", set_id: "missing" }],
      },
    }) as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("teacher_questions");
    expect(body.results.teacher_questions).toMatchObject({
      status: "failed",
      error: "foreign key failure",
    });
  });

  it("completes restore with warnings when only legacy tables fail", async () => {
    for (const table of ["profiles", "teachers", "topics", "learning_paths", "questions", "results"]) {
      upsertErrors.set(table, { message: `${table} constraint failure` });
    }
    const { POST } = await loadRoute();

    const res = await POST(request("POST", {
      data: {
        profiles: [{ id: "profile-1" }],
        teachers: [{ id: "teacher-1" }],
        topics: [{ id: "topic-1" }],
        learning_paths: [{ id: "path-1" }],
        questions: [{ id: "question-1" }],
        results: [{ id: "result-1" }],
        teacher_question_sets: [{ id: "set-1" }],
        teacher_questions: [{ id: "teacher-question-1", set_id: "set-1" }],
      },
    }) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.warning).toContain("Restore skipped legacy table(s)");
    expect(body.results.profiles.status).toBe("failed");
    expect(body.results.teacher_question_sets.status).toBe("success");
    expect(body.results.teacher_questions.status).toBe("success");
  });

  it("does not report success when the backup has no current data tables to restore", async () => {
    for (const table of ["profiles", "teachers", "topics", "learning_paths", "questions", "results"]) {
      upsertErrors.set(table, { message: `${table} constraint failure` });
    }
    const { POST } = await loadRoute();

    const res = await POST(request("POST", {
      data: {
        profiles: [{ id: "profile-1" }],
        teachers: [{ id: "teacher-1" }],
        topics: [{ id: "topic-1" }],
        learning_paths: [{ id: "path-1" }],
        questions: [{ id: "question-1" }],
        results: [{ id: "result-1" }],
      },
    }) as never);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toContain("không có dữ liệu hiện tại");
    expect(body.results.teacher_question_sets.status).toBe("skipped");
  });

  it("returns a clear configuration error when the service key is an anon key", async () => {
    vi.resetModules();
    process.env.ADMIN_API_SECRET = "secret";
    process.env.SUPABASE_SERVICE_ROLE_KEY = jwtWithRole("anon");
    const { POST } = await import("../route");

    const res = await POST(request("POST", { data: { teacher_question_sets: [{ id: "set-1" }] } }) as never);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(body.error).toContain("service_role");
    expect(upsertedTables).toEqual([]);
  });
});
