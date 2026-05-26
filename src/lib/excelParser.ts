// ============================================================
// Feature 023: Excel/CSV Student Import Parser
// Client-side parsing using SheetJS (xlsx)
// ============================================================

import * as XLSX from "xlsx";
import type { ExcelStudentRow, ImportResult, ImportStudentInput, ExcelQuestionRow, ImportQuestionInput } from "@/types/teacher-content";

/**
 * Parse an Excel/CSV file and extract student rows.
 * Expected columns: nickname, email (optional), class_name (optional),
 *                  student_code (optional), password (optional)
 */
export function parseStudentFile(file: File): Promise<ExcelStudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

        const parsed: ExcelStudentRow[] = rows
          .map((row, index) => {
            const raw = row as Record<string, unknown>;

            // Normalize column names (case-insensitive, trim spaces)
            const get = (keys: string[]): string => {
              for (const key of keys) {
                const match = Object.keys(raw).find(
                  (k) => k.trim().toLowerCase() === key.toLowerCase()
                );
                if (match && raw[match] !== undefined && raw[match] !== null) {
                  const val = String(raw[match]).trim();
                  if (val) return val;
                }
              }
              return "";
            };

            const nickname = get(["nickname", "tên", "name", "họ tên", "ho_ten"]);
            const email = get(["email", "e-mail", "mail"]);
            const class_name = get(["class_name", "class", "lớp", "lop", "grade", "khối", "khoi"]);
            const student_code = get(["student_code", "code", "mã", "ma", "mã học sinh", "ma_hoc_sinh"]);
            const password = get(["password", "mat_khau", "matkhau", "pw", "pass"]);

            return { nickname, email: email || undefined, class_name: class_name || undefined, student_code: student_code || undefined, password: password || undefined };
          })
          .filter((row) => row.nickname && row.nickname.length > 0);

        resolve(parsed);
      } catch (err) {
        reject(new Error(`Không thể đọc file Excel: ${err instanceof Error ? err.message : "Lỗi không xác định"}`));
      }
    };

    reader.onerror = () => reject(new Error("Không thể đọc file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate parsed rows and return importable records with generated codes/passwords
 */
export function validateAndPrepareImport(
  rows: ExcelStudentRow[],
  existingCodes: Set<string>
): { valid: ImportStudentInput[]; errors: Array<{ row: number; message: string }> } {
  const valid: ImportStudentInput[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Excel row (1 = header, data starts at 2)

    if (!row.nickname || row.nickname.length === 0) {
      errors.push({ row: rowNum, message: "Thiếu tên học sinh" });
      return;
    }

    if (row.nickname.length > 100) {
      errors.push({ row: rowNum, message: "Tên quá dài (tối đa 100 ký tự)" });
      return;
    }

    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ row: rowNum, message: "Email không hợp lệ" });
      return;
    }

    // Generate student code if not provided
    let student_code = row.student_code || generateStudentCode(row.nickname, rowNum);
    // Ensure unique
    let attempt = 0;
    while (existingCodes.has(student_code)) {
      student_code = generateStudentCode(row.nickname, rowNum + attempt);
      attempt++;
    }

    // Generate password if not provided
    const password = row.password || generateDefaultPassword(row.nickname);

    valid.push({
      nickname: row.nickname,
      email: row.email || undefined,
      class_name: row.class_name || undefined,
      student_code,
      password,
    });

    existingCodes.add(student_code);
  });

  return { valid, errors };
}

/**
 * Generate a student code from nickname + random suffix
 */
export function generateStudentCode(nickname: string, seed: number): string {
  const base = nickname
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 4);
  const suffix = Math.floor(1000 + (seed * 7919) % 9000);
  return `${base || "hs"}${suffix}`;
}

/**
 * Generate a default password (random 8 chars)
 */
export function generateDefaultPassword(nickname: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const seed = nickname.length + Date.now();
  let pw = "";
  for (let i = 0; i < 8; i++) {
    pw += chars[(seed * (i + 1) * 31) % chars.length];
  }
  return pw;
}

/**
 * Build a result summary for display
 */
export function buildImportSummary(result: ImportResult): string {
  if (result.failed === 0) {
    return `Thành công! Đã nhập ${result.success} học sinh.`;
  }
  return `Nhập được ${result.success}/${result.total}. ${result.failed} dòng lỗi.`;
}

// ============================================================
// Feature 024: Excel/CSV Question Import
// ============================================================

const MAX_QUESTIONS_PER_IMPORT = 500;

/**
 * Parse an Excel/CSV file and extract question rows.
 * Expected columns: question, option_a, option_b, option_c, correct_option, explanation (optional)
 */
export function parseQuestionFile(file: File): Promise<ExcelQuestionRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

        const parsed: ExcelQuestionRow[] = rows
          .slice(0, MAX_QUESTIONS_PER_IMPORT)
          .map((row, index) => {
            const raw = row as Record<string, unknown>;

            // Normalize column names (case-insensitive, trim spaces)
            const get = (keys: string[]): string => {
              for (const key of keys) {
                const match = Object.keys(raw).find(
                  (k) => k.trim().toLowerCase() === key.toLowerCase()
                );
                if (match && raw[match] !== undefined && raw[match] !== null) {
                  const val = String(raw[match]).trim();
                  if (val) return val;
                }
              }
              return "";
            };

            const question = get(["question", "câu hỏi", "cau_hoi", "noi_dung", "noidung"]);
            const option_a = get(["option_a", "a", "dap_an_a", "dap_an_1", "đáp án a"]);
            const option_b = get(["option_b", "b", "dap_an_b", "dap_an_2", "đáp án b"]);
            const option_c = get(["option_c", "c", "dap_an_c", "dap_an_3", "đáp án c"]);
            const correct_option = get(["correct_option", "correct", "dap_an", "đáp án", "answer", "ans"]).toUpperCase();
            const explanation = get(["explanation", "giai_thich", "giải thích", "explain", "explaination"]);

            return { question, option_a, option_b, option_c, correct_option, explanation: explanation || undefined };
          })
          .filter((row) => row.question && row.question.length > 0);

        resolve(parsed);
      } catch (err) {
        reject(new Error(`Không thể đọc file Excel: ${err instanceof Error ? err.message : "Lỗi không xác định"}`));
      }
    };

    reader.onerror = () => reject(new Error("Không thể đọc file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate parsed rows and return importable question records
 */
export function validateAndPrepareQuestionImport(
  rows: ExcelQuestionRow[]
): { valid: ImportQuestionInput[]; errors: Array<{ row: number; message: string }> } {
  const valid: ImportQuestionInput[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Excel row (1 = header, data starts at 2)

    // Check required fields
    if (!row.question || row.question.trim().length === 0) {
      errors.push({ row: rowNum, message: "Thiếu nội dung câu hỏi" });
      return;
    }

    if (!row.option_a || row.option_a.trim().length === 0) {
      errors.push({ row: rowNum, message: "Thiếu đáp án A" });
      return;
    }

    if (!row.option_b || row.option_b.trim().length === 0) {
      errors.push({ row: rowNum, message: "Thiếu đáp án B" });
      return;
    }

    if (!row.option_c || row.option_c.trim().length === 0) {
      errors.push({ row: rowNum, message: "Thiếu đáp án C" });
      return;
    }

    // Normalize correct option
    const correct = row.correct_option?.toUpperCase().trim();
    if (correct !== "A" && correct !== "B" && correct !== "C") {
      errors.push({ row: rowNum, message: `Đáp án đúng phải là A, B hoặc C (hiện tại: "${row.correct_option || ""}")` });
      return;
    }

    // Check for duplicate options
    const options = [row.option_a.trim(), row.option_b.trim(), row.option_c.trim()];
    const uniqueOptions = new Set(options.map(o => o.toLowerCase()));
    if (uniqueOptions.size < 3) {
      errors.push({ row: rowNum, message: "Các đáp án không được trùng nhau" });
      return;
    }

    valid.push({
      question: row.question.trim(),
      option_a: row.option_a.trim(),
      option_b: row.option_b.trim(),
      option_c: row.option_c.trim(),
      correct_option: correct as "A" | "B" | "C",
      explanation: row.explanation?.trim() || undefined,
    });
  });

  return { valid, errors };
}

/**
 * Build question import summary for display
 */
export function buildQuestionImportSummary(total: number, created: number, failed: number): string {
  if (failed === 0) {
    return `Thành công! Đã nhập ${created} câu hỏi.`;
  }
  return `Nhập được ${created}/${total} câu hỏi. ${failed} dòng lỗi.`;
}

/**
 * Generate CSV template for question import
 */
export function generateQuestionTemplate(): string {
  const headers = ["question", "option_a", "option_b", "option_c", "correct_option", "explanation"];
  const example1 = [" Bé Kiên nhận được tin nhắn từ số lạ. Em nên làm gì?", "Trả lời tin nhắn", "Xóa tin nhắn và không chia sẻ thông tin", "Chia sẻ cho bạn bè", "C", "Không nên tương tác với người lạ trên mạng"];
  const example2 = ["Mật khẩu mạnh cần có đặc điểm gì?", "Ít nhất 8 ký tự", "Có chữ hoa, chữ thường, số và ký tự đặc biệt", "Chỉ cần tên của mình", "B", "Mật khẩu mạnh nên kết hợp nhiều loại ký tự"];

  return [headers.join(","), example1.map(v => `"${v}"`).join(","), example2.map(v => `"${v}"`).join(",")].join("\n");
}
