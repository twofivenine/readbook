/** TRD §6.6 닉네임 정규화: 앞뒤 공백 제거, 연속 공백 축약, NFC */
export const NICKNAME_MIN = 1;
export const NICKNAME_MAX = 12;

export function normalizeNickname(raw: string): string {
  return raw.normalize("NFC").trim().replace(/\s+/g, " ");
}

export function validateNickname(raw: string): string {
  const n = normalizeNickname(raw);
  const len = Array.from(n).length;
  if (len < NICKNAME_MIN || len > NICKNAME_MAX) {
    throw new Error(`닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자여야 합니다.`);
  }
  return n;
}
