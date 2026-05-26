import { createClient } from "@supabase/supabase-js";
import {
  getSiteUrl,
  shareResultFromSearchParams,
  type ShareResult,
} from "./shareResultQuery";

export { getSiteUrl, shareResultFromSearchParams };
export type { ShareResult };

export async function getShareResult(
  id: string,
  searchParams: Record<string, string | string[] | undefined> = {},
): Promise<ShareResult> {
  const fallback = shareResultFromSearchParams(id, searchParams);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || id === "preview") {
    return fallback;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("results")
    .select("id,nickname,mission_score,quiz_score,total_score,title,badge,completed_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return fallback;
  }

  return data;
}
