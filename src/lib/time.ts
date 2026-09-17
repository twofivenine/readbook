/** 표시 시간대 Asia/Seoul 고정 */
export const TZ = "Asia/Seoul";

const ymdFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export function kstDateString(d: Date): string {
  return ymdFmt.format(d);
}

/** KST 날짜 차이(일) = target − base */
export function kstDayDiff(target: Date, base: Date = new Date()): number {
  const a = Date.UTC(...splitYmd(kstDateString(target)));
  const b = Date.UTC(...splitYmd(kstDateString(base)));
  return Math.round((a - b) / 86_400_000);
}

function splitYmd(s: string): [number, number, number] {
  const [y, m, d] = s.split("-").map(Number);
  return [y, m - 1, d];
}

/** 이번 달 label (KST) `YYYY-MM` */
export function thisMonthLabel(base: Date = new Date()): string {
  return kstDateString(base).slice(0, 7);
}

/** label 에 n개월 더하기 */
export function addMonths(label: string, n: number): string {
  const [y, m] = label.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** 회차 label 기본값: 기준 시각의 다음 달 (KST) */
export const nextMonthLabel = (base: Date = new Date()): string => addMonths(thisMonthLabel(base), 1);

/** "2026-10" → "10월" */
export function monthWord(label: string | null | undefined): string {
  const m = label ? Number(label.split("-")[1]) : NaN;
  return Number.isFinite(m) ? `${m}월` : "이달";
}

export function formatMeetingAt(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, month: "long", day: "numeric", weekday: "short" }).format(d),
    time: new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(d),
  };
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const m = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return kstDateString(new Date(iso));
}

/** datetime-local(KST) → ISO UTC */
export function kstLocalToIso(local: string): string {
  return new Date(`${local}:00+09:00`).toISOString();
}

/** ISO → datetime-local(KST) */
export function isoToKstLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}
