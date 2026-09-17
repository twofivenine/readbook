/** TRD v1.1 §9 레이트 리밋. 인메모리 슬라이딩 윈도 (서버리스에서는 인스턴스 단위) */
import { errors } from "./errors";

const buckets = new Map<string, number[]>();
export type LimitKind = "write" | "cover";
const LIMITS: Record<LimitKind, { max: number; windowMs: number }> = {
  write: { max: 60, windowMs: 60_000 },
  cover: { max: 10, windowMs: 3_600_000 },
};
const DISABLED = process.env.RATE_LIMIT_DISABLED === "1";

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

export function rateLimit(req: Request, kind: LimitKind): void {
  if (DISABLED) return;
  const { max, windowMs } = LIMITS[kind];
  const key = `${kind}:${clientIp(req)}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) throw errors.tooMany();
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
}
