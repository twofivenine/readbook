/** TRD §5.5, §6.5 서재·통계·멤버 목록 */
import { prisma } from "@/lib/prisma";
import type { LibraryItem, MemberStat, StatsView } from "@/lib/types";
import { getPastRounds } from "./rounds";
import { bookView } from "./views";

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => (xs.length ? round1(xs.reduce((s, x) => s + x, 0) / xs.length) : null);

export async function getLibrary(groupId: string): Promise<LibraryItem[]> {
  const rounds = await getPastRounds(groupId);
  const bookIds = rounds.map((r) => r.bookId!).filter(Boolean);
  const ratings = await prisma.rating.findMany({ where: { bookId: { in: bookIds } } });
  return rounds.map((r) => ({
    roundId: r.id,
    label: r.label,
    seq: r.seq,
    book: bookView(r.book!),
    avgRating: avg(ratings.filter((x) => x.bookId === r.bookId).map((x) => x.score)),
  }));
}

export async function getStats(groupId: string, memberId: string | null): Promise<StatsView> {
  const rounds = await getPastRounds(groupId);
  const bookIds = rounds.map((r) => r.bookId!).filter(Boolean);
  const memberCount = await prisma.member.count({ where: { groupId } });
  const [ratings, progresses] = await Promise.all([
    prisma.rating.findMany({ where: { bookId: { in: bookIds } } }),
    prisma.progress.findMany({ where: { bookId: { in: bookIds }, completed: true } }),
  ]);
  // 평균 완독률: 지난 회차별 (완독 멤버 수 / 현재 멤버 수)의 평균 (T-6)
  const rates = bookIds.map((id) => (memberCount ? progresses.filter((p) => p.bookId === id).length / memberCount : 0));
  const avgCompletionRate = rates.length ? Math.round((rates.reduce((s, x) => s + x, 0) / rates.length) * 100) : null;

  let mine: StatsView["mine"] = null;
  if (memberId) {
    const [completedCount, myRatings, reviewCount] = await Promise.all([
      prisma.progress.count({ where: { memberId, completed: true, book: { groupId } } }),
      prisma.rating.findMany({ where: { memberId, book: { groupId } } }),
      prisma.review.count({ where: { authorId: memberId, book: { groupId } } }),
    ]);
    mine = { completedCount, avgRating: avg(myRatings.map((r) => r.score)), reviewCount };
  }

  return {
    group: { booksRead: rounds.length, avgRating: avg(ratings.map((r) => r.score)), avgCompletionRate },
    mine,
  };
}

/** F-9.1 멤버 목록: 닉네임 + 누적 완독 수 + 평균 별점 */
export async function getMemberStats(groupId: string): Promise<MemberStat[]> {
  const members = await prisma.member.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
    include: { progresses: { where: { completed: true }, select: { id: true } }, ratings: { select: { score: true } } },
  });
  return members.map((m) => ({
    id: m.id,
    nickname: m.nickname,
    completedCount: m.progresses.length,
    avgRating: avg(m.ratings.map((r) => r.score)),
  }));
}
