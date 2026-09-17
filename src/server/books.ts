/** TRD v1.1 §5.4 책: 수정·별점·한줄평·상세 */
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { normalizeName } from "@/lib/name";
import type { BookDetailView } from "@/lib/types";
import { bookView, ratingsSummary, reviewView } from "./views";

export async function requireBook(bookId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw errors.notFound("책");
  return book;
}

/** F-9.5 책 정보 수정 (누구나) */
export async function updateBook(bookId: string, data: { title?: string; author?: string; totalPages?: number; coverKey?: string | null }) {
  await requireBook(bookId);
  return prisma.book.update({ where: { id: bookId }, data });
}

export async function setRating(bookId: string, clientId: string, name: string | null | undefined, score: number) {
  await requireBook(bookId);
  const n = normalizeName(name);
  return prisma.rating.upsert({
    where: { bookId_clientId: { bookId, clientId } },
    create: { bookId, clientId, name: n, score },
    update: { name: n, score },
  });
}

export async function deleteRating(bookId: string, clientId: string) {
  await requireBook(bookId);
  await prisma.rating.deleteMany({ where: { bookId, clientId } });
}

export async function getBookDetail(bookId: string, clientId: string | null): Promise<BookDetailView> {
  const book = await requireBook(bookId);
  const [ratings, reviews, round] = await Promise.all([
    prisma.rating.findMany({ where: { bookId }, orderBy: { createdAt: "asc" } }),
    prisma.review.findMany({ where: { bookId }, orderBy: { createdAt: "desc" } }),
    prisma.round.findFirst({ where: { bookId }, orderBy: { seq: "desc" } }),
  ]);
  return {
    round: round ? { id: round.id, label: round.label, seq: round.seq } : null,
    book: bookView(book),
    ratings: ratingsSummary(ratings, clientId),
    reviews: reviews.map((r) => reviewView(r, clientId)),
  };
}

export async function createReview(bookId: string, clientId: string, name: string | null | undefined, body: string, spoiler: boolean) {
  await requireBook(bookId);
  return prisma.review.create({ data: { bookId, clientId, name: normalizeName(name), body, spoiler } });
}

async function ownReview(reviewId: string, clientId: string) {
  const r = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!r) throw errors.notFound("한줄평");
  if (r.clientId !== clientId) throw errors.forbidden();
  return r;
}

export async function updateReview(reviewId: string, clientId: string, data: { name?: string | null; body?: string; spoiler?: boolean }) {
  await ownReview(reviewId, clientId);
  return prisma.review.update({
    where: { id: reviewId },
    data: { ...(data.body !== undefined && { body: data.body }), ...(data.spoiler !== undefined && { spoiler: data.spoiler }), ...(data.name !== undefined && { name: normalizeName(data.name) }) },
  });
}

export async function deleteReview(reviewId: string, clientId: string) {
  await ownReview(reviewId, clientId);
  await prisma.review.delete({ where: { id: reviewId } });
}
