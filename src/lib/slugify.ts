// Vietnamese-aware slug generator.
//   "Báo động: Đỏ trên không gian mạng!" → "bao-dong-do-tren-khong-gian-mang"
//
// Steps:
//   1. Normalize Unicode combining marks (NFD) and strip them via ̀-ͯ.
//   2. Handle 'đ' / 'Đ' separately — they are NOT decomposed by NFD.
//   3. Lowercase, replace non-alphanumeric with '-', collapse dashes, trim.
export function slugify(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
