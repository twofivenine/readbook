/** TRD v1.1 §5.3, §6.1, §6.2 체크 투표 엔진 (책·장소 공통) */
import { randomInt } from "node:crypto";
import { Prisma, type PollKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { nextMonthLabel } from "@/lib/time";
import { coverStorage } from "@/lib/storage";
import { findHomeRound, findNextRound, getCurrentRound, getOrCreateHomeRound, getOrCreateNextRound } from "./rounds";
import { CANDIDATE_LIMIT, pollInclude, pollView } from "./views";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * 조회 대상 투표.
 * - book: 다음 회차의 투표. 아직 없으면(방금 확정된 직후) 현재 회차의 마감된 투표 (F-2.13, 2.14)
 * - place: 현재(홈) 회차의 투표
 */
export async function findPoll(kind: PollKind, db: Db = prisma) {
  if (kind === "book") {
    const next = await findNextRound(db);
    const nextPoll = next ? await db.poll.findUnique({ where: { roundId_kind: { roundId: next.id, kind } }, include: pollInclude }) : null;
    if (nextPoll) return nextPoll;
    const current = await getCurrentRound(db);
    return current ? db.poll.findUnique({ where: { roundId_kind: { roundId: current.id, kind } }, include: pollInclude }) : null;
  }
  const home = await findHomeRound(db);
  return home ? db.poll.findUnique({ where: { roundId_kind: { roundId: home.id, kind } }, include: pollInclude }) : null;
}

async function getOrCreatePoll(kind: PollKind, db: Prisma.TransactionClient) {
  const round = kind === "book" ? await getOrCreateNextRound(db) : await getOrCreateHomeRound(db);
  return (await db.poll.findUnique({ where: { roundId_kind: { roundId: round.id, kind } } })) ?? db.poll.create({ data: { roundId: round.id, kind } });
}

export async function getPoll(kind: PollKind, clientId: string | null) {
  const p = await findPoll(kind);
  return p ? pollView(p, clientId) : null;
}

export type BookInput = { title: string; author: string; totalPages: number; coverKey?: string | null };
export type PlaceInput = { name: string; address: string; memo?: string | null };

export async function addCandidate(kind: PollKind, input: BookInput | PlaceInput) {
  return prisma.$transaction(async (db) => {
    const poll = await getOrCreatePoll(kind, db);
    if (poll.status === "closed") throw errors.conflict("POLL_CLOSED", "마감된 투표입니다. 재투표를 열어 주세요.");
    await db.$queryRaw`SELECT id FROM polls WHERE id = ${poll.id}::uuid FOR UPDATE`;
    const count = await db.pollCandidate.count({ where: { pollId: poll.id } });
    if (count >= CANDIDATE_LIMIT) throw errors.conflict("CANDIDATE_LIMIT", `후보는 최대 ${CANDIDATE_LIMIT}개입니다. 기존 후보 1개를 삭제해야 합니다.`);
    if (kind === "book") {
      const b = input as BookInput;
      const book = await db.book.create({ data: { title: b.title, author: b.author, totalPages: b.totalPages, coverKey: b.coverKey ?? null } });
      return db.pollCandidate.create({ data: { pollId: poll.id, bookId: book.id } });
    }
    const p = input as PlaceInput;
    const place = await db.place.create({ data: { name: p.name, address: p.address, memo: p.memo ?? null } });
    return db.pollCandidate.create({ data: { pollId: poll.id, placeId: place.id } });
  });
}

/** F-2.4 후보 삭제 (체크 CASCADE). 미참조 책의 표지는 삭제 (§8) */
export async function deleteCandidate(kind: PollKind, candidateId: string) {
  const coverToDelete = await prisma.$transaction(async (db) => {
    const cand = await db.pollCandidate.findFirst({ where: { id: candidateId, poll: { kind } }, include: { poll: true, book: true } });
    if (!cand) throw errors.notFound("후보");
    if (cand.poll.status === "closed") throw errors.conflict("POLL_CLOSED", "마감된 투표의 후보는 삭제할 수 없습니다.");
    await db.pollCandidate.delete({ where: { id: cand.id } });
    if (cand.book && !(await db.round.count({ where: { bookId: cand.book.id } }))) {
      await db.book.delete({ where: { id: cand.book.id } });
      return cand.book.coverKey;
    }
    return null;
  });
  if (coverToDelete) await coverStorage().remove(coverToDelete).catch(() => undefined);
}

async function openCandidate(kind: PollKind, candidateId: string) {
  const cand = await prisma.pollCandidate.findFirst({ where: { id: candidateId, poll: { kind } }, include: { poll: true } });
  if (!cand) throw errors.notFound("후보");
  if (cand.poll.status !== "open") throw errors.conflict("POLL_CLOSED", "마감된 투표입니다.");
  return cand;
}

/** §6.1 체크: 브라우저당 후보별 1회 */
export async function check(kind: PollKind, candidateId: string, clientId: string) {
  await openCandidate(kind, candidateId);
  try {
    await prisma.voteCheck.create({ data: { candidateId, clientId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw errors.conflict("ALREADY_CHECKED", "이미 체크한 후보예요.");
    throw e;
  }
}

/** §6.1 체크 취소 (없어도 성공) */
export async function uncheck(kind: PollKind, candidateId: string, clientId: string) {
  await openCandidate(kind, candidateId);
  await prisma.voteCheck.deleteMany({ where: { candidateId, clientId } });
}

/** §6.2 마감·확정 (마감자 기록 없음) */
export async function closePoll(kind: PollKind) {
  await prisma.$transaction(async (db) => {
    const poll = await findPoll(kind, db);
    if (!poll) throw errors.notFound("투표");
    await db.$queryRaw`SELECT id FROM polls WHERE id = ${poll.id}::uuid FOR UPDATE`;
    const fresh = await db.poll.findUniqueOrThrow({ where: { id: poll.id }, include: pollInclude });
    if (fresh.status !== "open") throw errors.conflict("POLL_CLOSED", "이미 마감된 투표입니다.");
    if (fresh.candidates.length === 0) throw errors.conflict("NO_CANDIDATES", "후보가 없어 마감할 수 없습니다.");
    const max = Math.max(...fresh.candidates.map((c) => c.checks.length));
    const top = fresh.candidates.filter((c) => c.checks.length === max);
    const result = top.length === 1 ? top[0] : top[randomInt(top.length)];
    const now = new Date();
    await db.poll.update({
      where: { id: fresh.id },
      data: { status: "closed", closedAt: now, resultCandidateId: result.id, tieCandidateIds: top.length > 1 ? top.map((c) => c.id) : [] },
    });
    if (kind === "book") {
      const round = await db.round.findUniqueOrThrow({ where: { id: fresh.roundId } });
      await db.round.update({ where: { id: round.id }, data: { bookId: result.bookId, label: round.label ?? nextMonthLabel(now) } });
    } else {
      await db.round.update({ where: { id: fresh.roundId }, data: { placeId: result.placeId } });
    }
  });
}

/** §6.2 마감 취소·재투표: 체크는 보존, 회차 확정값만 되돌림 */
export async function reopenPoll(kind: PollKind) {
  await prisma.$transaction(async (db) => {
    const poll = await findPoll(kind, db);
    if (!poll || poll.status !== "closed") throw errors.notFound("마감된 투표");
    await db.poll.update({ where: { id: poll.id }, data: { status: "open", closedAt: null, resultCandidateId: null, tieCandidateIds: [] } });
    await db.round.update({ where: { id: poll.roundId }, data: kind === "book" ? { bookId: null } : { placeId: null } });
  });
}
