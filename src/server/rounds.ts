/**
 * 회차(Round) — 월(label) 기준.
 * - 이번 달(thisMonth, KST)을 기준으로:
 *   current  = label ≤ thisMonth 이고 책이 확정된 회차 중 가장 최근  → "이달의 책" (10월의 책은 10월에)
 *   upcoming = label > thisMonth 이고 책이 확정된 회차                → 미리 정해 둔 다음 달 책
 *   past     = label < thisMonth 이고 책이 확정된 회차                → 서재
 * - 일정·장소·참석(home round) = current. 단, current 의 모임일이 지났고 upcoming 이 있으면 그 첫 회차.
 *   확정된 회차가 하나도 없으면 이번 달 회차를 만들어 그릇으로 쓴다.
 * - 책 투표(next round) = 마지막으로 확정된 회차의 다음 달. 확정 회차가 없으면 이번 달.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addMonths, thisMonthLabel } from "@/lib/time";

type Db = PrismaClient | Prisma.TransactionClient;

export async function getOrCreateRoundByLabel(label: string, db: Db = prisma) {
  return (await db.round.findUnique({ where: { label } })) ?? db.round.create({ data: { label } });
}

export const getCurrentRound = (db: Db = prisma, now = new Date()) =>
  db.round.findFirst({ where: { bookId: { not: null }, label: { lte: thisMonthLabel(now) } }, orderBy: { label: "desc" } });

export const getUpcomingRounds = (db: Db = prisma, now = new Date()) =>
  db.round.findMany({ where: { bookId: { not: null }, label: { gt: thisMonthLabel(now) } }, orderBy: { label: "asc" }, include: { book: true } });

/** 마지막으로 확정된 회차 (달 무관) */
export const getLatestConfirmedRound = (db: Db = prisma) => db.round.findFirst({ where: { bookId: { not: null } }, orderBy: { label: "desc" } });

/** 책 투표 회차의 label */
export async function nextPollLabel(db: Db = prisma, now = new Date()) {
  const latest = await getLatestConfirmedRound(db);
  return latest ? addMonths(latest.label, 1) : thisMonthLabel(now);
}

export async function getOrCreateNextRound(db: Db = prisma, now = new Date()) {
  return getOrCreateRoundByLabel(await nextPollLabel(db, now), db);
}

/** 일정·장소·참석의 대상 회차 (읽기: 없으면 null) */
export async function findHomeRound(db: Db = prisma, now = new Date()) {
  const current = await getCurrentRound(db, now);
  if (current) {
    if (current.meetingAt && current.meetingAt.getTime() <= now.getTime()) {
      const upcoming = await getUpcomingRounds(db, now);
      if (upcoming[0]) return upcoming[0];
    }
    return current;
  }
  const upcoming = await getUpcomingRounds(db, now);
  if (upcoming[0]) return upcoming[0];
  return db.round.findUnique({ where: { label: thisMonthLabel(now) } });
}

export async function getOrCreateHomeRound(db: Db = prisma, now = new Date()) {
  return (await findHomeRound(db, now)) ?? getOrCreateRoundByLabel(thisMonthLabel(now), db);
}

export async function getPastRounds(db: Db = prisma, now = new Date()) {
  return db.round.findMany({ where: { bookId: { not: null }, label: { lt: thisMonthLabel(now) } }, orderBy: { label: "desc" }, include: { book: true } });
}
