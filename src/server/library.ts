/** TRD v1.1 §5.5 서재 */
import { prisma } from "@/lib/prisma";
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
