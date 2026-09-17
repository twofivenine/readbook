/** TRD v1.1 §5.1 홈 통합 응답 + §6.3 지금 할 일 */
import { prisma } from "@/lib/prisma";
import type { HomeView, PollView, RoundView, Todo } from "@/lib/types";
import { kstDayDiff } from "@/lib/time";
import { findHomeRound } from "./rounds";
import { findPoll } from "./polls";
import { bookView, placeView, pollInclude, pollView, ratingsSummary, reviewView } from "./views";

export async function buildHome(clientId: string | null): Promise<HomeView> {
  const homeRow = await findHomeRound();
  const [homeRound, bookPollRow] = await Promise.all([
    homeRow
      ? prisma.round.findUnique({
          where: { id: homeRow.id },
          include: { book: true, place: true, attendances: { orderBy: { createdAt: "asc" } }, polls: { where: { kind: "place" }, include: pollInclude } },
        })
      : null,
    findPoll("book"),
  ]);

  let currentRound: RoundView | null = null;
  if (homeRound) {
    const book = homeRound.book;
    const [ratings, reviews] = book
      ? await Promise.all([
          prisma.rating.findMany({ where: { bookId: book.id }, orderBy: { createdAt: "asc" } }),
          prisma.review.findMany({ where: { bookId: book.id }, orderBy: { createdAt: "desc" } }),
        ])
      : [[], []];
    const placePoll = homeRound.polls[0] ?? null;
    currentRound = {
      id: homeRound.id,
      seq: homeRound.seq,
      label: homeRound.label,
      book: book ? bookView(book) : null,
      meetingAt: homeRound.meetingAt?.toISOString() ?? null,
      place: homeRound.place ? placeView(homeRound.place) : null,
      attendances: homeRound.attendances.map((a) => ({ name: a.name, status: a.status, mine: !!clientId && a.clientId === clientId })),
      placePoll: placePoll ? pollView(placePoll, clientId) : null,
      ratings: ratingsSummary(ratings, clientId),
      reviews: reviews.map((r) => reviewView(r, clientId)),
    };
  }
  const bookPoll = bookPollRow ? pollView(bookPollRow, clientId) : null;
  return { currentRound, bookPoll, todos: computeTodos(currentRound, bookPoll, clientId) };
}

/** §6.3 우선순위대로 평가해 앞의 2개. "내가 했는지"는 clientId 기준 (F-7.6) */
export function computeTodos(current: RoundView | null, bookPoll: PollView | null, clientId: string | null): Todo[] {
  const todos: Todo[] = [];
  const meetingAt = current?.meetingAt ? new Date(current.meetingAt) : null;
  const dday = meetingAt ? kstDayDiff(meetingAt) : null;
  const placePoll = current?.placePoll ?? null;

  if (placePoll?.status === "open" && placePoll.candidates.length > 0 && (!clientId || placePoll.myChecks.length === 0)) {
    todos.push({ kind: "place_vote", dday, detail: `후보 ${placePoll.candidates.length}곳${clientId ? " · 아직 체크 안 함" : ""}` });
  }
  if (bookPoll?.status === "open" && bookPoll.candidates.length > 0 && (!clientId || bookPoll.myChecks.length === 0)) {
    todos.push({ kind: "book_vote", dday, detail: `후보 ${bookPoll.candidates.length}권${clientId ? " · 아직 체크 안 함" : ""}` });
  }
  if (clientId && current && meetingAt && meetingAt.getTime() > Date.now() && !current.attendances.some((a) => a.mine)) {
    todos.push({ kind: "attendance", dday, detail: "이름을 적고 참석 / 불참 / 미정 선택" });
  }
  if (!meetingAt) todos.push({ kind: "schedule", dday: null, detail: "날짜·시간을 등록해 주세요" });
  return todos.slice(0, 2);
}
