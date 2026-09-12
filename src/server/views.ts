/** Prisma 레코드 → API 뷰 변환 */
import type { Book, Member, Place, Poll, PollCandidate, Vote, Review, Comment, Progress, Rating } from "@prisma/client";
import type { BookView, CandidateView, MemberRef, PlaceView, PollView, ProgressView, RatingsSummary, ReviewView } from "@/lib/types";
import { coverUrl } from "@/lib/storage";

export const BOOK_CANDIDATE_LIMIT = 10;
export const PLACE_CANDIDATE_LIMIT = 10;

export const memberRef = (m: Pick<Member, "id" | "nickname">): MemberRef => ({ id: m.id, nickname: m.nickname });

export const bookView = (b: Book): BookView => ({
  id: b.id, title: b.title, author: b.author, totalPages: b.totalPages, coverUrl: coverUrl(b.coverKey),
});

export const placeView = (p: Place): PlaceView => ({ id: p.id, name: p.name, address: p.address, memo: p.memo });

export type CandidateWithRelations = PollCandidate & {
  book: Book | null;
  place: Place | null;
  proposer: Member;
  votes: (Vote & { member: Member })[];
};

export type PollWithRelations = Poll & {
  candidates: CandidateWithRelations[];
  closer: Member | null;
  round: { label: string | null };
};

export const pollInclude = {
  candidates: {
    orderBy: { createdAt: "asc" as const },
    include: {
      book: true,
      place: true,
      proposer: true,
      votes: { include: { member: true }, orderBy: { createdAt: "asc" as const } },
    },
  },
  closer: true,
  round: { select: { label: true } },
};

export function candidateView(c: CandidateWithRelations): CandidateView {
  return {
    id: c.id,
    book: c.book ? bookView(c.book) : null,
    place: c.place ? placeView(c.place) : null,
    proposedBy: memberRef(c.proposer),
    voteCount: c.votes.length,
    voters: c.votes.map((v) => memberRef(v.member)),
  };
}

export function pollView(p: PollWithRelations, memberId: string | null): PollView {
  const candidates = p.candidates.map(candidateView);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  return {
    id: p.id,
    kind: p.kind,
    status: p.status,
    roundLabel: p.round.label,
    candidates,
    candidateLimit: p.kind === "book" ? BOOK_CANDIDATE_LIMIT : PLACE_CANDIDATE_LIMIT,
    voteLimit: candidates.length,
    myCandidateIds: memberId
      ? p.candidates.filter((c) => c.votes.some((v) => v.memberId === memberId)).map((c) => c.id)
      : [],
    closedBy: p.closer ? memberRef(p.closer) : null,
    closedAt: p.closedAt?.toISOString() ?? null,
    result: p.resultCandidateId ? byId.get(p.resultCandidateId) ?? null : null,
    tieCandidates: p.tieCandidateIds.map((id) => byId.get(id)).filter((c): c is CandidateView => !!c),
  };
}

export const percentOf = (page: number, total: number) => Math.min(100, Math.floor((page / total) * 100));

export function progressViews(
  members: Member[],
  progresses: Progress[],
  ratings: Rating[],
  totalPages: number,
): ProgressView[] {
  const pByMember = new Map(progresses.map((p) => [p.memberId, p]));
  const rByMember = new Map(ratings.map((r) => [r.memberId, r]));
  return members.map((m) => {
    const p = pByMember.get(m.id);
    return {
      memberId: m.id,
      nickname: m.nickname,
      currentPage: p?.currentPage ?? 0,
      percent: p ? percentOf(p.currentPage, totalPages) : 0,
      completed: p?.completed ?? false,
      rating: rByMember.get(m.id)?.score ?? null,
    };
  });
}

export function ratingsSummary(ratings: Rating[], memberId: string | null): RatingsSummary {
  const count = ratings.length;
  const avg = count ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / count) * 10) / 10 : null;
  return { avg, count, mine: memberId ? ratings.find((r) => r.memberId === memberId)?.score ?? null : null };
}

export type ReviewWithRelations = Review & { author: Member; comments: (Comment & { author: Member })[] };

export const reviewInclude = {
  author: true,
  comments: { include: { author: true }, orderBy: { createdAt: "asc" as const } },
};

export function reviewView(r: ReviewWithRelations): ReviewView {
  return {
    id: r.id,
    authorId: r.authorId,
    nickname: r.author.nickname,
    body: r.body,
    spoiler: r.spoiler,
    createdAt: r.createdAt.toISOString(),
    comments: r.comments.map((c) => ({
      id: c.id, authorId: c.authorId, nickname: c.author.nickname, body: c.body, spoiler: c.spoiler, createdAt: c.createdAt.toISOString(),
    })),
  };
}
