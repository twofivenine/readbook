/** TRD §5.1 모임·멤버 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { MAX_MEMBERS, newInviteToken } from "@/lib/auth";
import { validateNickname } from "@/lib/nickname";

function nickname(raw: string) {
  try {
    return validateNickname(raw);
  } catch (e) {
    throw errors.invalid((e as Error).message);
  }
}

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function createGroup(input: { name: string; cycleNote?: string | null; nickname: string }) {
  const nick = nickname(input.nickname);
  return prisma.$transaction(async (db) => {
    const group = await db.group.create({
      data: { name: input.name.trim(), cycleNote: input.cycleNote?.trim() || null, inviteToken: newInviteToken() },
    });
    const member = await db.member.create({ data: { groupId: group.id, nickname: nick } });
    await db.round.create({ data: { groupId: group.id, seq: 1 } });
    return { token: group.inviteToken, groupId: group.id, memberId: member.id, nickname: member.nickname };
  });
}

/** F-1.2~1.7 새로 참여 — 정원은 group 행 잠금 후 검사 */
export async function joinGroup(groupId: string, rawNickname: string) {
  const nick = nickname(rawNickname);
  try {
    return await prisma.$transaction(async (db) => {
      await db.$queryRaw`SELECT id FROM groups WHERE id = ${groupId}::uuid FOR UPDATE`;
      const count = await db.member.count({ where: { groupId } });
      if (count >= MAX_MEMBERS) throw errors.conflict("GROUP_FULL", "정원이 찼습니다. 열람만 가능해요.");
      return db.member.create({ data: { groupId, nickname: nick } });
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw errors.conflict("NICKNAME_TAKEN", "이미 쓰는 닉네임이에요.");
    throw e;
  }
}

export async function renameMember(memberId: string, rawNickname: string) {
  const nick = nickname(rawNickname);
  try {
    return await prisma.member.update({ where: { id: memberId }, data: { nickname: nick } });
  } catch (e) {
    if (isUniqueViolation(e)) throw errors.conflict("NICKNAME_TAKEN", "이미 쓰는 닉네임이에요.");
    throw e;
  }
}

/** F-1.10 재발급: 기존 토큰 즉시 무효 */
export async function rotateInvite(groupId: string) {
  const g = await prisma.group.update({ where: { id: groupId }, data: { inviteToken: newInviteToken() } });
  return g.inviteToken;
}
