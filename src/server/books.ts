/** TRD §5.4, §6.3 책 활동: 진도·별점·한줄평·댓글·책 상세 */
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { BookDetailView } from "@/lib/types";
import { bookView, progressViews, ratingsSummary, reviewInclude, reviewView } from "./views";

export async function requireBook(groupId: string, bookId: string) {
  const book = await prisma.book.findFirst({ where: { id: bookId, groupId } });
  if (!book) throw errors.notFound("책");
  return book;
}

/** §6.3 진도 갱신 */
export async function setProgress(groupId: string, bookId: string, memberId: string, input: { currentPage?: number; completed?: true }) {
  const book = await requireBook(groupId, bookId);
  const existing = await prisma.progress.findUnique({ where: { memberId_bookId: { memberId, bookId } } });
  const now = new Date();
  let currentPage: number;
  if (input.completed) currentPage = book.totalPages;
  else {
    if (input.currentPage === undefined) throw errors.invalid("쪽수를 입력해 주세요.");
    if (input.currentPage < 0 || input.currentPage > book.totalPages) {
      throw errors.invalid(`쪽수는 0~${book.totalPages} 사이여야 합니다.`);
    }
    currentPage = input.currentPage;
  }
  const completed = currentPage === book.totalPages;
  const completedAt = completed ? (existing?.completedAt ?? now) : null;
  return prisma.progress.upsert({
    where: { memberId_bookId: { memberId, bookId } },
    create: { memberId, bookId, currentPage, completed, completedAt },
    update: { currentPage, completed, completedAt },
  });
}

export async function setRating(groupId: string, bookId: string, memberId: string, score: number) {
  await requireBook(groupId, bookId);
  return prisma.rating.upsert({
    where: { memberId_bookId: { memberId, bookId } },
    create: { memberId, bookId, score },
    update: { score },
  });
}

export async function deleteRating(groupId: string, bookId: string, memberId: string) {
  await requireBook(groupId, bookId);
  await prisma.rating.deleteMany({ where: { memberId, bookId } });
}

export async function getBookDetail(groupId: string, bookId: string, memberId: string | null): Promise<BookDetailView> {
  const book = await requireBook(groupId, bookId);
  const [members, progresses, ratings, reviews, round] = await Promise.all([
    prisma.member.findMany({ where: { groupId }, orderBy: { createdAt: "asc" } }),
    prisma.progress.findMany({ where: { bookId } }),
    prisma.rating.findMany({ where: { bookId } }),
    prisma.review.findMany({ where: { bookId }, orderBy: { createdAt: "desc" }, include: reviewInclude }),
    prisma.round.findFirst({ where: { bookId, groupId }, orderBy: { seq: "desc" } }),
  ]);
  const pv = progressViews(members, progresses, ratings, book.totalPages);
  return {
    round: round ? { id: round.id, label: round.label, seq: round.seq } : null,
    book: bookView(book),
    ratings: ratingsSummary(ratings, memberId),
    progresses: pv,
    completedCount: pv.filter((p) => p.completed).length,
    memberCount: members.length,
    reviews: reviews.map(reviewView),
  };
}

export async function createReview(groupId: string, bookId: string, memberId: string, body: string, spoiler: boolean) {
  await requireBook(groupId, bookId);
  return prisma.review.create({ data: { bookId, authorId: memberId, body, spoiler } });
}

/** F-6.7 본인만 */
async function ownReview(groupId: string, reviewId: string, memberId: string) {
  const r = await prisma.review.findFirst({ where: { id: reviewId, book: { groupId } } });
  if (!r) throw errors.notFound("한줄평");
  if (r.authorId !== memberId) throw errors.forbidden();
  return r;
}

export async function updateReview(groupId: string, reviewId: string, memberId: string, data: { body?: string; spoiler?: boolean }) {
  await ownReview(groupId, reviewId, memberId);
  return prisma.review.update({ where: { id: reviewId }, data });
}

export async function deleteReview(groupId: string, reviewId: string, memberId: string) {
  await ownReview(groupId, reviewId, memberId);
  await prisma.review.delete({ where: { id: reviewId } });
}

export async function createComment(groupId: string, reviewId: string, memberId: string, body: string, spoiler: boolean) {
  const r = await prisma.review.findFirst({ where: { id: reviewId, book: { groupId } } });
  if (!r) throw errors.notFound("한줄평");
  return prisma.comment.create({ data: { reviewId, authorId: memberId, body, spoiler } });
}

async function ownComment(groupId: string, commentId: string, memberId: string) {
  const c = await prisma.comment.findFirst({ where: { id: commentId, review: { book: { groupId } } } });
  if (!c) throw errors.notFound("댓글");
  if (c.authorId !== memberId) throw errors.forbidden();
  return c;
}

export async function updateComment(groupId: string, commentId: string, memberId: string, data: { body?: string; spoiler?: boolean }) {
  await ownComment(groupId, commentId, memberId);
  return prisma.comment.update({ where: { id: commentId }, data });
}

export async function deleteComment(groupId: string, commentId: string, memberId: string) {
  await ownComment(groupId, commentId, memberId);
  await prisma.comment.delete({ where: { id: commentId } });
}

/** 한줄평·댓글 뷰 재조회 (응답용) */
export async function getReviewView(reviewId: string) {
  const r = await prisma.review.findUniqueOrThrow({ where: { id: reviewId }, include: reviewInclude });
  return reviewView(r);
}
