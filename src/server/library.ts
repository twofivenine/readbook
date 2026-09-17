/** 서재: 지난 책 목록 + 지난 책 직접 추가 */
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { LibraryItem } from "@/lib/types";
import { getPastRounds } from "./rounds";
import { bookView } from "./views";

export async function getLibrary(): Promise<LibraryItem[]> {
  const rounds = await getPastRounds();
  const bookIds = rounds.map((r) => r.bookId!).filter(Boolean);
  const ratings = await prisma.rating.findMany({ where: { bookId: { in: bookIds } } });
  return rounds.map((r) => {
    const rs = ratings.filter((x) => x.bookId === r.bookId);
    return {
      roundId: r.id,
      label: r.label,
      seq: r.seq,
      book: bookView(r.book!),
      avgRating: rs.length ? Math.round((rs.reduce((s, x) => s + x.score, 0) / rs.length) * 10) / 10 : null,
      ratingCount: rs.length,
    };
  });
}

/** 지난 책(또는 임의의 달의 책) 직접 등록. 그 달에 이미 책이 있으면 409 */
export async function addBookToMonth(label: string, input: { title: string; author: string; totalPages: number; coverKey?: string | null }) {
  return prisma.$transaction(async (db) => {
    const existing = await db.round.findUnique({ where: { label }, include: { polls: { where: { kind: "book", status: "open" } } } });
    if (existing?.bookId) throw errors.conflict("MONTH_TAKEN", `${label}에는 이미 책이 있어요.`);
    if (existing?.polls.length) throw errors.conflict("POLL_OPEN", `${label}에는 책 투표가 진행 중이에요. 투표를 마감하거나 후보를 비운 뒤 추가해 주세요.`);
    const book = await db.book.create({ data: { title: input.title, author: input.author, totalPages: input.totalPages, coverKey: input.coverKey ?? null } });
    const round = existing
      ? await db.round.update({ where: { id: existing.id }, data: { bookId: book.id } })
      : await db.round.create({ data: { label, bookId: book.id } });
    return { roundId: round.id, label: round.label, bookId: book.id };
  });
}
