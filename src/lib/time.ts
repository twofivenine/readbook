/** 표시 시간대는 Asia/Seoul 고정 (TRD §5) */
export const TZ = "Asia/Seoul";

const ymdFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** KST 기준 YYYY-MM-DD */
export function kstDateString(d: Date): string {
  return ymdFmt.format(d);
}

/** KST 날짜 차이(일) = target − base. 시각은 무시한다. */
export function kstDayDiff(target: Date, base: Date = new Date()): number {
  const a = Date.UTC(...splitYmd(kstDateString(target)));
  const b = Date.UTC(...splitYmd(kstDateString(base)));
  return Math.round((a - b) / 86_400_000);
}

function splitYmd(s: string): [number, number, number] {
  const [y, m, d] = s.split("-").map(Number);
  return [y, m - 1, d];
}

/** 회차 label 기본값: 기준 시각의 다음 달 (KST) `YYYY-MM` */
export function nextMonthLabel(base: Date = new Date()): string {
  const [y, m] = kstDateString(base).split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function formatMeetingAt(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, month: "long", day: "numeric", weekday: "short" }).format(d);
  const time = new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return { date, time };
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TZ, month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
}

/** "2일 전" 등 상대 표시 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return kstDateString(new Date(iso));
}

/** datetime-local 입력값(KST) → ISO UTC */
export function kstLocalToIso(local: string): string {
  // local: "2026-10-18T15:00"
  return new Date(`${local}:00+09:00`).toISOString();
}

/** ISO → datetime-local 입력값(KST) */
export function isoToKstLocal(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}
