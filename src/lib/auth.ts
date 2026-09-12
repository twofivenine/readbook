import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { errors } from "./errors";
import { rateLimit } from "./ratelimit";

export const MEMBER_HEADER = "x-member-id";
export const MAX_MEMBERS = 8;

/** TRD §2.4 초대 토큰: 32바이트 랜덤 base64url (43자) */
export function newInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** 토큰으로 모임을 찾는다. 무효 시 404 (존재 여부 힌트 없음) */
export async function resolveGroup(token: string) {
  if (!token || token.length > 64) throw errors.notFound("모임");
  const group = await prisma.group.findUnique({ where: { inviteToken: token } });
  if (!group) throw errors.notFound("모임");
  return group;
}

/** 읽기 요청에서 선택적으로 멤버를 식별 (홈 todos 계산용). 불일치 시 null */
export async function optionalMember(req: Request, groupId: string) {
  const id = req.headers.get(MEMBER_HEADER);
  if (!id || !UUID_RE.test(id)) return null;
  const m = await prisma.member.findFirst({ where: { id, groupId } });
  return m;
}

/** 쓰기 요청: X-Member-Id 검증 + 레이트 리밋 (TRD §2.1) */
export async function requireMember(req: Request, groupId: string) {
  rateLimit(req, "write");
  const m = await optionalMember(req, groupId);
  if (!m) throw errors.unauthorized();
  return m;
}
