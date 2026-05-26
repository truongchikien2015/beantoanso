/**
 * Backup and Restore service for local state and database data
 */

export interface BackupData {
  version: string;
  timestamp: string;
  localStorage: Record<string, string>;
  supabase: Record<string, any[]>;
}

const LOCAL_STORAGE_KEYS = [
  "bats:questions:v1",
  "bats:final_results:v1",
  "bats:topics:v1",
  "bats:paths:v1",
  "bats:student_answers:v1",
  "bats:avatar",
  "bats:daily",
  "bats:xp",
  "bats:badge",
  "be-an-toan-so-storage"
];

/**
 * Downloads a backup of the entire application state (LocalStorage + Supabase)
 */
export async function downloadBackup(adminPassword: string): Promise<void> {
  // 1. Gather LocalStorage keys
  const localData: Record<string, string> = {};
  for (const key of LOCAL_STORAGE_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      localData[key] = val;
    }
  }

  // 2. Fetch Supabase tables via API
  const res = await fetch("/api/admin/backup-restore", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": adminPassword,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Không thể tải dữ liệu từ database");
  }

  const { data: dbData } = await res.json();

  // 3. Construct backup payload
  const backup: BackupData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    localStorage: localData,
    supabase: dbData || {},
  };

  // 4. Download file in browser
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 5).replace(":", "h");
  const filename = `bats-backup-${dateStr}-${timeStr}.json`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Restores a backup from a JSON string payload
 */
export async function restoreBackup(
  jsonContent: string,
  adminPassword: string
): Promise<{ success: boolean; message: string; results?: any }> {
  let backup: BackupData;

  // 1. Parse and validate JSON structure
  try {
    backup = JSON.parse(jsonContent);
  } catch {
    return { success: false, message: "File không đúng định dạng JSON hợp lệ" };
  }

  if (!backup.version || !backup.localStorage || !backup.supabase) {
    return {
      success: false,
      message: "File backup thiếu cấu trúc bắt buộc (version, localStorage, supabase)",
    };
  }

  // 2. Restore LocalStorage keys
  try {
    for (const [key, value] of Object.entries(backup.localStorage)) {
      if (LOCAL_STORAGE_KEYS.includes(key)) {
        localStorage.setItem(key, value);
      }
    }
  } catch (err: any) {
    return { success: false, message: `Lỗi khôi phục LocalStorage: ${err.message}` };
  }

  // 3. Upload Supabase tables data
  try {
    const res = await fetch("/api/admin/backup-restore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({ data: backup.supabase }),
    });

    const result = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: result.error || "Không thể khôi phục dữ liệu lên database",
      };
    }

    return {
      success: true,
      message: "Khôi phục dữ liệu thành công!",
      results: result.results,
    };
  } catch (err: any) {
    return { success: false, message: `Lỗi khôi phục Database: ${err.message}` };
  }
}
