/** TRD v1.1 §2 브라우저 식별값. 서버는 UUID 형식만 검사하고 등록·조회하지 않는다. */
import { errors } from "./errors";
import { rateLimit } from "./ratelimit";

export const CLIENT_HEADER = "x-client-id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** 읽기 요청: 있으면 `mine`·`myChecks` 계산에 쓴다 */
export function optionalClientId(req: Request): string | null {
  const id = req.headers.get(CLIENT_HEADER);
  return id && UUID_RE.test(id) ? id.toLowerCase() : null;
}

/** 쓰기 요청: X-Client-Id 필수 (형식 아니면 400) + 레이트 리밋 */
export function requireClientId(req: Request): string {
  rateLimit(req, "write");
  const id = optionalClientId(req);
  if (!id) throw errors.badRequest("브라우저 식별값(X-Client-Id)이 없거나 형식이 잘못되었습니다.");
  return id;
}
