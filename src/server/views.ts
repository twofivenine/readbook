import type { Book, Place, Poll, PollCandidate, VoteCheck, Rating, Review } from "@prisma/client";
import type { BookView, CandidateView, PlaceView, PollView, RatingsSummary, ReviewView } from "@/lib/types";
import { coverUrl } from "@/lib/storage";

export const CANDIDATE_LIMIT = 10;

export const bookView = (b: Book): BookView => ({ id: b.id, title: b.title, author: b.author, totalPages: b.totalPages, coverUrl: coverUrl(b.coverKey) });
export const placeView = (p: Place): PlaceView => ({ id: p.id, name: p.name, address: p.address, memo: p.memo });

export type CandidateWithRelations = PollCandidate & { book: Book | null; place: Place | null; checks: VoteCheck[] };
export type PollWithRelations = Poll & { candidates: CandidateWithRelations[]; round: { label: string | null } };

export const pollInclude = {
  candidates: { orderBy: { createdAt: "asc" as const }, include: { book: true, place: true, checks: true } },
  round: { select: { label: true } },
};

export const candidateView = (c: CandidateWithRelations): CandidateView => ({
  id: c.id,
  book: c.book ? bookView(c.book) : null,
  place: c.place ? placeView(c.place) : null,
  checkCount: c.checks.length,
});

export function pollView(p: PollWithRelations, clientId: string | null): PollView {
  const candidates = p.candidates.map(candidateView);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  return {
    id: p.id,
    kind: p.kind,
    status: p.status,
    roundLabel: p.round.label,
    candidates,
    candidateLimit: CANDIDATE_LIMIT,
    myChecks: clientId ? p.candidates.filter((c) => c.checks.some((v) => v.clientId === clientId)).map((c) => c.id) : [],
    closedAt: p.closedAt?.toISOString() ?? null,
    result: p.resultCandidateId ? byId.get(p.resultCandidateId) ?? null : null,
    tieCandidates: p.tieCandidateIds.map((id) => byId.get(id)).filter((c): c is CandidateView => !!c),
  };
}

export function ratingsSummary(ratings: Rating[], clientId: string | null): RatingsSummary {
  const count = ratings.length;
  const avg = count ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / count) * 10) / 10 : null;
  return {
    avg,
    count,
    list: ratings.map((r) => ({ name: r.name, score: r.score, mine: !!clientId && r.clientId === clientId })),
    mine: clientId ? ratings.find((r) => r.clientId === clientId)?.score ?? null : null,
  };
}

export const reviewView = (r: Review, clientId: string | null): ReviewView => ({
  id: r.id, name: r.name, body: r.body, spoiler: r.spoiler, createdAt: r.createdAt.toISOString(), mine: !!clientId && r.clientId === clientId,
});
