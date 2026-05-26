import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

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

  const tables = ["profiles", "learning_paths", "topics", "questions", "results", "teachers"];
  const dbData: Record<string, any[]> = {};

  try {
    for (const table of tables) {
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

  // To prevent foreign key constraint issues, we import in logical order:
  // 1. profiles & teachers (independent tables or parents)
  // 2. topics & learning_paths
  // 3. questions & results (depend on topics/profiles)
  const orderedTables = ["profiles", "teachers", "topics", "learning_paths", "questions", "results"];
  const results: Record<string, { count: number; status: string; error?: string }> = {};

  try {
    for (const table of orderedTables) {
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

    return NextResponse.json({
      message: "Restore operation completed",
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
