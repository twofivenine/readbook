import { route, json, errors } from "@/lib/errors";
import { optionalMember, resolveGroup } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBookDetail } from "@/server/books";

type Ctx = { params: Promise<{ token: string; roundId: string }> };

/** F-8.2 지난 책 상세: 회차 → 책 상세 */
export const GET = route<Ctx>(async (req, { params }) => {
  const { token, roundId } = await params;
  const group = await resolveGroup(token);
  const me = await optionalMember(req, group.id);
  const round = await prisma.round.findFirst({ where: { id: roundId, groupId: group.id } });
  if (!round?.bookId) throw errors.notFound("지난 책");
  const detail = await getBookDetail(group.id, round.bookId, me?.id ?? null);
  return json({ ...detail, round: { id: round.id, label: round.label, seq: round.seq } }, { headers: { "Cache-Control": "no-store" } });
});
