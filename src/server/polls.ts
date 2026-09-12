/** TRD §5.3, §6.1, §6.2 투표 엔진 (책·장소 공통) */
import { randomInt } from "node:crypto";
import { Prisma, type PollKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { nextMonthLabel } from "@/lib/time";
import { coverStorage } from "@/lib/storage";
import { getCurrentRound, getOrCreateHomeRound, getOrCreateNextRound } from "./rounds";
import { BOOK_CANDIDATE_LIMIT, PLACE_CANDIDATE_LIMIT, pollInclude, pollView } from "./views";

type Db = Prisma.TransactionClient;

/** 종류별 대상 회차: 책 → 다음 회차, 장소 → 현재(홈) 회차 */
async function targetRound(groupId: string, kind: PollKind, db: Db) {
  return kind === "book" ? getOrCreateNextRound(groupId, db) : getOrCreateHomeRound(groupId, db);
}

/**
 * 조회 대상 투표.
 * - book: 다음 회차의 투표. 아직 없으면(방금 확정된 직후) 현재 회차의 마감된 투표를 보여준다 (F-2.15, F-2.16).
 * - place: 현재(홈) 회차의 투표.
 */
export async function findPoll(groupId: string, kind: PollKind, db: Prisma.TransactionClient | typeof prisma = prisma) {
  const current = await getCurrentRound(groupId, db);
  if (kind === "book") {
    const next = await db.round.findUnique({ where: { groupId_seq: { groupId, seq: (current?.seq ?? 0) + 1 } } });
    const nextPoll = next ? await db.poll.findUnique({ where: { roundId_kind: { roundId: next.id, kind } }, include: pollInclude }) : null;
    if (nextPoll || !current) return nextPoll;
    return db.poll.findUnique({ where: { roundId_kind: { roundId: current.id, kind } }, include: pollInclude });
  }
  const home = current ?? (await db.round.findFirst({ where: { groupId }, orderBy: { seq: "asc" } }));
  if (!home) return null;
  return db.poll.findUnique({ where: { roundId_kind: { roundId: home.id, kind } }, include: pollInclude });
}

/** 투표가 없으면 생성 (T-13: 후보가 처음 등록될 때 자동 생성) */
async function getOrCreatePoll(groupId: string, kind: PollKind, db: Db) {
  const round = await targetRound(groupId, kind, db);
  const existing = await db.poll.findUnique({ where: { roundId_kind: { roundId: round.id, kind } } });
  if (existing) return existing;
  return db.poll.create({ data: { groupId, roundId: round.id, kind } });
}

export async function getPoll(groupId: string, kind: PollKind, memberId: string | null) {
  const p = await findPoll(groupId, kind);
  return p ? pollView(p, memberId) : null;
}

export type BookInput = { title: string; author: string; totalPages: number; coverKey?: string | null };
export type PlaceInput = { name: string; address: string; memo?: string | null };

export async function addCandidate(
  groupId: string, kind: PollKind, memberId: string, input: BookInput | PlaceInput,
) {
  return prisma.$transaction(async (db) => {
    const poll = await getOrCreatePoll(groupId, kind, db);
    if (poll.status === "closed") throw errors.conflict("POLL_CLOSED", "마감된 투표입니다. 재투표를 열어 주세요.");
    // 후보 상한은 poll 행 잠금 후 검사 (§4.7)
    await db.$queryRaw`SELECT id FROM polls WHERE id = ${poll.id}::uuid FOR UPDATE`;
    const count = await db.pollCandidate.count({ where: { pollId: poll.id } });
    const limit = kind === "book" ? BOOK_CANDIDATE_LIMIT : PLACE_CANDIDATE_LIMIT;
    if (count >= limit) throw errors.conflict("CANDIDATE_LIMIT", `후보는 최대 ${limit}개입니다. 기존 후보 1개를 삭제해야 합니다.`);

    if (kind === "book") {
      const b = input as BookInput;
      const book = await db.book.create({
        data: { groupId, title: b.title, author: b.author, totalPages: b.totalPages, coverKey: b.coverKey ?? null, createdBy: memberId },
      });
      return db.pollCandidate.create({ data: { pollId: poll.id, bookId: book.id, proposedBy: memberId } });
    }
    const p = input as PlaceInput;
    const place = await db.place.create({
      data: { groupId, name: p.name, address: p.address, memo: p.memo ?? null, createdBy: memberId },
    });
    return db.pollCandidate.create({ data: { pollId: poll.id, placeId: place.id, proposedBy: memberId } });
  });
}

/** F-2.4 후보 삭제 — 표도 함께 삭제(CASCADE). 참조가 끊긴 책의 표지는 즉시 삭제 (§8) */
export async function deleteCandidate(groupId: string, kind: PollKind, candidateId: string) {
  const coverToDelete = await prisma.$transaction(async (db) => {
    const cand = await db.pollCandidate.findFirst({
      where: { id: candidateId, poll: { groupId, kind } }, include: { poll: true, book: true },
    });
    if (!cand) throw errors.notFound("후보");
    if (cand.poll.status === "closed") throw errors.conflict("POLL_CLOSED", "마감된 투표의 후보는 삭제할 수 없습니다.");
    await db.pollCandidate.delete({ where: { id: cand.id } });
    if (cand.book) {
      const stillReferenced = await db.round.count({ where: { bookId: cand.book.id } });
      if (!stillReferenced) {
        await db.book.delete({ where: { id: cand.book.id } });
        return cand.book.coverKey;
      }
    }
    return null;
  });
  if (coverToDelete) await coverStorage().remove(coverToDelete).catch(() => undefined);
}

/** §6.1 내 표 전체 교체 */
export async function setVotes(groupId: string, kind: PollKind, memberId: string, candidateIds: string[]) {
  const ids = Array.from(new Set(candidateIds));
  await prisma.$transaction(async (db) => {
    const poll = await findPoll(groupId, kind, db);
    if (!poll) throw errors.notFound("투표");
    if (poll.status !== "open") throw errors.conflict("POLL_CLOSED", "마감된 투표입니다.");
    const valid = new Set(poll.candidates.map((c) => c.id));
    if (!ids.every((id) => valid.has(id))) throw errors.invalid("이 투표의 후보가 아닙니다.");
    if (ids.length > poll.candidates.length) {
      throw errors.conflict("VOTE_LIMIT", `표는 최대 ${poll.candidates.length}개까지 던질 수 있습니다.`);
    }
    await db.vote.deleteMany({ where: { pollId: poll.id, memberId } });
    if (ids.length) {
      await db.vote.createMany({ data: ids.map((candidateId) => ({ pollId: poll.id, candidateId, memberId })) });
    }
  });
}

/** §6.2 마감 + 확정 */
export async function closePoll(groupId: string, kind: PollKind, memberId: string) {
  await prisma.$transaction(async (db) => {
    const poll = await findPoll(groupId, kind, db);
    if (!poll) throw errors.notFound("투표");
    await db.$queryRaw`SELECT id FROM polls WHERE id = ${poll.id}::uuid FOR UPDATE`;
    const fresh = await db.poll.findUniqueOrThrow({ where: { id: poll.id }, include: pollInclude });
    if (fresh.status !== "open") throw errors.conflict("POLL_CLOSED", "이미 마감된 투표입니다.");
    if (fresh.candidates.length === 0) throw errors.conflict("NO_CANDIDATES", "후보가 없어 마감할 수 없습니다.");

    const max = Math.max(...fresh.candidates.map((c) => c.votes.length));
    const top = fresh.candidates.filter((c) => c.votes.length === max);
    const result = top.length === 1 ? top[0] : top[randomInt(top.length)];
    const now = new Date();

    await db.poll.update({
      where: { id: fresh.id },
      data: {
        status: "closed", closedBy: memberId, closedAt: now,
        resultCandidateId: result.id, tieCandidateIds: top.length > 1 ? top.map((c) => c.id) : [],
      },
    });

    if (kind === "book") {
      // 회차 전환: 다음 회차에 책 확정 → 다음 회차가 현재가 된다 (§3)
      const round = await db.round.findUniqueOrThrow({ where: { id: fresh.roundId } });
      await db.round.update({
        where: { id: round.id },
        data: { bookId: result.bookId, label: round.label ?? nextMonthLabel(now) },
      });
    } else {
      await db.round.update({ where: { id: fresh.roundId }, data: { placeId: result.placeId } });
    }
  });
}

/** §6.2 마감 취소 / 재투표 — 표는 보존, 회차의 확정값만 되돌림 */
export async function reopenPoll(groupId: string, kind: PollKind) {
  await prisma.$transaction(async (db) => {
    const poll = await findPoll(groupId, kind, db);
    if (!poll || poll.status !== "closed") throw errors.notFound("마감된 투표");
    await db.poll.update({
      where: { id: poll.id },
      data: { status: "open", closedBy: null, closedAt: null, resultCandidateId: null, tieCandidateIds: [] },
    });
    await db.round.update({
      where: { id: poll.roundId },
      data: kind === "book" ? { bookId: null } : { placeId: null },
    });
  });
}
