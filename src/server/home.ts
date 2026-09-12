/** TRD §5.6 홈 통합 응답 + §6.4 지금 할 일 */
import { prisma } from "@/lib/prisma";
import type { Group, Member } from "@prisma/client";
import type { HomeView, Todo, PollView } from "@/lib/types";
import { kstDayDiff } from "@/lib/time";
import { getCurrentRound } from "./rounds";
import { findPoll } from "./polls";
import { bookView, memberRef, placeView, pollInclude, pollView, progressViews, ratingsSummary, reviewInclude, reviewView } from "./views";

export async function buildHome(group: Group, me: Member | null): Promise<HomeView> {
  const members = await prisma.member.findMany({ where: { groupId: group.id }, orderBy: { createdAt: "asc" } });
  const current = await getCurrentRound(group.id);
  // 홈 회차: 현재 회차, 없으면 seq 1 (신규 모임의 일정·장소 그릇)
  const homeRoundRow = current ?? (await prisma.round.findFirst({ where: { groupId: group.id }, orderBy: { seq: "asc" } }));
  const nextSeq = (current?.seq ?? 0) + 1;
  const nextRoundRow = await prisma.round.findUnique({ where: { groupId_seq: { groupId: group.id, seq: nextSeq } } });

  const [homeRound, bookPollRow] = await Promise.all([
    homeRoundRow
      ? prisma.round.findUnique({
          where: { id: homeRoundRow.id },
          include: {
            book: true,
            place: true,
            attendances: { include: { member: true } },
            polls: { where: { kind: "place" }, include: pollInclude },
          },
        })
      : null,
    findPoll(group.id, "book"),
  ]);

  const memberId = me?.id ?? null;
  let currentRound: HomeView["currentRound"] = null;

  if (homeRound) {
    const book = homeRound.book;
    const [progresses, ratings, reviews] = book
      ? await Promise.all([
          prisma.progress.findMany({ where: { bookId: book.id } }),
          prisma.rating.findMany({ where: { bookId: book.id } }),
          prisma.review.findMany({ where: { bookId: book.id }, orderBy: { createdAt: "desc" }, include: reviewInclude }),
        ])
      : [[], [], []];
    const placePollRow = homeRound.polls[0] ?? null;
    const pv = book ? progressViews(members, progresses, ratings, book.totalPages) : [];
    currentRound = {
      id: homeRound.id,
      label: homeRound.label,
      seq: homeRound.seq,
      book: book ? bookView(book) : null,
      meetingAt: homeRound.meetingAt?.toISOString() ?? null,
      place: homeRound.place ? placeView(homeRound.place) : null,
      attendances: homeRound.attendances.map((a) => ({ memberId: a.memberId, nickname: a.member.nickname, status: a.status })),
      placePoll: placePollRow ? pollView(placePollRow, memberId) : null,
      progresses: pv,
      completedCount: pv.filter((p) => p.completed).length,
      ratings: ratingsSummary(ratings, memberId),
      reviews: reviews.map(reviewView),
    };
  }

  const bookPoll: PollView | null = bookPollRow ? pollView(bookPollRow, memberId) : null;
  const nextRound = { id: nextRoundRow?.id ?? "", label: nextRoundRow?.label ?? null, bookPoll };

  return {
    group: { id: group.id, name: group.name, cycleNote: group.cycleNote, memberCount: members.length, members: members.map(memberRef) },
    me: me ? memberRef(me) : null,
    currentRound,
    nextRound,
    todos: computeTodos(currentRound, bookPoll, memberId),
  };
}

/** §6.4 우선순위대로 평가해 앞의 2개 */
export function computeTodos(
  current: HomeView["currentRound"], bookPoll: PollView | null, memberId: string | null,
): Todo[] {
  const todos: Todo[] = [];
  const meetingAt = current?.meetingAt ? new Date(current.meetingAt) : null;
  const dday = meetingAt ? kstDayDiff(meetingAt) : null;
  const placePoll = current?.placePoll ?? null;

  // 후보가 없는 투표는 "할 일"이 아니다
  if (placePoll?.status === "open" && placePoll.candidates.length > 0 && (!memberId || placePoll.myCandidateIds.length === 0)) {
    todos.push({ kind: "place_vote", dday, detail: `후보 ${placePoll.candidates.length}곳${memberId ? " · 내 표 없음" : ""}` });
  }
  if (bookPoll?.status === "open" && bookPoll.candidates.length > 0 && (!memberId || bookPoll.myCandidateIds.length === 0)) {
    todos.push({ kind: "book_vote", dday, detail: `후보 ${bookPoll.candidates.length}권 · 최대 ${bookPoll.voteLimit}표` });
  }
  if (memberId && current && meetingAt && meetingAt.getTime() > Date.now()) {
    const mine = current.attendances.find((a) => a.memberId === memberId);
    if (!mine) todos.push({ kind: "attendance", dday, detail: "참석 / 불참 / 미정 중 선택" });
  }
  if (!meetingAt) {
    todos.push({ kind: "schedule", dday: null, detail: "날짜·시간을 등록해 주세요" });
  }
  return todos.slice(0, 2);
}
