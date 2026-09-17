/**
 * TRD v1.1 §3 회차.
 * - current: 책이 확정된 가장 최근 회차
 * - next: current 다음 순번 (책 후보가 처음 등록될 때 생성)
 * - 아직 책이 없는 신규 상태에서는 seq 1 회차가 일정·장소의 그릇이 된다.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = PrismaClient | Prisma.TransactionClient;

export const getCurrentRound = (db: Db = prisma) => db.round.findFirst({ where: { bookId: { not: null } }, orderBy: { seq: "desc" } });

export async function getOrCreateNextRound(db: Db = prisma) {
  const current = await getCurrentRound(db);
  const seq = (current?.seq ?? 0) + 1;
  return (await db.round.findUnique({ where: { seq } })) ?? db.round.create({ data: { seq } });
}

export async function findNextRound(db: Db = prisma) {
  const current = await getCurrentRound(db);
  return db.round.findUnique({ where: { seq: (current?.seq ?? 0) + 1 } });
}

/** 일정·장소·참석의 대상: current, 없으면 seq 1 (생성) */
export async function getOrCreateHomeRound(db: Db = prisma) {
  return (await getCurrentRound(db)) ?? getOrCreateNextRound(db);
}

export async function findHomeRound(db: Db = prisma) {
  return (await getCurrentRound(db)) ?? db.round.findFirst({ orderBy: { seq: "asc" } });
}

export async function getPastRounds(db: Db = prisma) {
  const current = await getCurrentRound(db);
  if (!current) return [];
  return db.round.findMany({ where: { seq: { lt: current.seq }, bookId: { not: null } }, orderBy: { seq: "desc" }, include: { book: true } });
}
