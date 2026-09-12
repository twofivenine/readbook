/**
 * TRD §3 회차(Round) 모델.
 * - current: 책이 확정된 회차 중 가장 최근
 * - next: current 다음 순번 (없으면 생성)
 * - past: current 보다 앞선 회차
 *
 * 아직 책이 한 번도 확정되지 않은 신규 모임에서는 seq 1 회차가 "다음 모임" 일정·장소의 그릇이 된다.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = PrismaClient | Prisma.TransactionClient;

export async function getCurrentRound(groupId: string, db: Db = prisma) {
  return db.round.findFirst({ where: { groupId, bookId: { not: null } }, orderBy: { seq: "desc" } });
}

/** 다음 회차 (없으면 생성). 트랜잭션 안에서 호출 가능 */
export async function getOrCreateNextRound(groupId: string, db: Db = prisma) {
  const current = await getCurrentRound(groupId, db);
  const seq = (current?.seq ?? 0) + 1;
  const existing = await db.round.findUnique({ where: { groupId_seq: { groupId, seq } } });
  if (existing) return existing;
  return db.round.create({ data: { groupId, seq } });
}

/** 일정·장소·참석의 대상 회차: current, 없으면 next(seq 1) */
export async function getOrCreateHomeRound(groupId: string, db: Db = prisma) {
  return (await getCurrentRound(groupId, db)) ?? getOrCreateNextRound(groupId, db);
}

export async function getPastRounds(groupId: string, db: Db = prisma) {
  const current = await getCurrentRound(groupId, db);
  if (!current) return [];
  return db.round.findMany({
    where: { groupId, seq: { lt: current.seq }, bookId: { not: null } },
    orderBy: { seq: "desc" },
    include: { book: true },
  });
}
