import { route, json, errors } from "@/lib/errors";
import { optionalClientId } from "@/lib/client";
import { prisma } from "@/lib/prisma";
import { getBookDetail } from "@/server/books";

type Ctx = { params: Promise<{ roundId: string }> };

/** F-8.2 지난 책 상세 */
export const GET = route<Ctx>(async (req, { params }) => {
  const round = await prisma.round.findUnique({ where: { id: (await params).roundId } });
  if (!round?.bookId) throw errors.notFound("지난 책");
  const detail = await getBookDetail(round.bookId, optionalClientId(req));
  return json({ ...detail, round: { id: round.id, label: round.label, seq: round.seq } }, { headers: { "Cache-Control": "no-store" } });
});
