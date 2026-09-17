/** TRD v1.1 §2.3 이름 칸: 앞뒤 공백 제거, 비우면 "익명", 1~12자 */
export const NAME_MAX = 12;
export const ANONYMOUS = "익명";

export function normalizeName(raw: string | null | undefined): string {
  const n = (raw ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
  if (!n) return ANONYMOUS;
  return Array.from(n).slice(0, NAME_MAX).join("");
}
