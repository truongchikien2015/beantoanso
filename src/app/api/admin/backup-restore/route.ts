import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const EXPORT_TABLES = [
  "profiles",
  "teachers",
  "topics",
  "learning_paths",
  "questions",
  "results",
  "teacher_topics",
  "teacher_question_sets",
  "teacher_questions",
  "teacher_learning_paths",
  "teacher_learning_path_steps",
  "teacher_students",
  "teacher_student_progress",
];

const IMPORT_TABLES = [
  "profiles",
  "teachers",
  "topics",
  "learning_paths",
  "questions",
  "results",
  "teacher_topics",
  "teacher_question_sets",
  "teacher_learning_paths",
  "teacher_questions",
  "teacher_learning_path_steps",
  "teacher_students",
  "teacher_student_progress",
];

const LEGACY_TABLES = new Set([
  "profiles",
  "teachers",
  "topics",
  "learning_paths",
  "questions",
  "results",
]);

const CURRENT_DATA_TABLES = IMPORT_TABLES.filter((table) => !LEGACY_TABLES.has(table));

function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

function checkSupabaseAdminConfig(): NextResponse | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
  }

  const payload = decodeJwtPayload(serviceRoleKey);
  if (payload && payload.role !== "service_role") {
    return NextResponse.json(
      { error: `SUPABASE_SERVICE_ROLE_KEY phải là service_role key, hiện tại đang là ${payload.role ?? "unknown"}.` },
      { status: 503 }
    );
  }

  return null;
}

function checkAdmin(req: NextRequest): NextResponse | null {
  if (!ADMIN_API_SECRET) {
    return NextResponse.json({ error: "Admin secret not configured" }, { status: 503 });
  }
  const adminPw = req.headers.get("x-admin-password");
  if (adminPw !== ADMIN_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// GET /api/admin/backup-restore — Export all Supabase tables
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const authError = checkAdmin(req);
  if (authError) return authError;
  const configError = checkSupabaseAdminConfig();
  if (configError) return configError;

  const dbData: Record<string, any[]> = {};

  try {
    for (const table of EXPORT_TABLES) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select("*");

      if (error) {
        return NextResponse.json(
          { error: `Failed to fetch table ${table}: ${error.message}` },
          { status: 500 }
        );
      }
      dbData[table] = data || [];
    }

    return NextResponse.json({ data: dbData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/backup-restore — Import/Restore Supabase tables
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const authError = checkAdmin(req);
  if (authError) return authError;
  const configError = checkSupabaseAdminConfig();
  if (configError) return configError;

  let body: { data?: Record<string, any[]> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const importData = body.data;
  if (!importData || typeof importData !== "object") {
    return NextResponse.json({ error: "Missing database 'data' object" }, { status: 400 });
  }

  const results: Record<string, { count: number; status: string; error?: string }> = {};

  try {
    for (const table of IMPORT_TABLES) {
      const rows = importData[table];
      if (!Array.isArray(rows) || rows.length === 0) {
        results[table] = { count: 0, status: "skipped" };
        continue;
      }

      // Supabase upsert requires specifying target columns or conflict keys
      const { error } = await supabaseAdmin
        .from(table)
        .upsert(rows, { onConflict: "id" });

      if (error) {
        results[table] = { count: rows.length, status: "failed", error: error.message };
        // We do not stop the entire import, but continue with next tables so partial import can succeed
      } else {
        results[table] = { count: rows.length, status: "success" };
      }
    }

    const failedTables = Object.entries(results)
      .filter(([, result]) => result.status === "failed")
      .map(([table]) => table);
    const blockingFailedTables = failedTables.filter((table) => !LEGACY_TABLES.has(table));

    if (blockingFailedTables.length > 0) {
      return NextResponse.json(
        {
          error: `Restore failed for table(s): ${blockingFailedTables.join(", ")}`,
          results,
        },
        { status: 500 }
      );
    }

    const restoredCurrentRows = CURRENT_DATA_TABLES.reduce((total, table) => {
      const result = results[table];
      return result?.status === "success" ? total + result.count : total;
    }, 0);

    if (restoredCurrentRows === 0) {
      return NextResponse.json(
        {
          error: "File backup không có dữ liệu hiện tại để khôi phục. Hãy tạo lại file sao lưu bằng phiên bản mới rồi thử lại.",
          results,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      message: failedTables.length > 0
        ? "Restore operation completed with warnings"
        : "Restore operation completed",
      ...(failedTables.length > 0
        ? { warning: `Restore skipped legacy table(s): ${failedTables.join(", ")}` }
        : {}),
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
