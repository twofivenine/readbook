import { route, json } from "@/lib/errors";
import { optionalMember, resolveGroup } from "@/lib/auth";
import { getStats } from "@/server/stats";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  const group = await resolveGroup((await params).token);
  const url = new URL(req.url);
  const me = await optionalMember(req, group.id);
  // ?memberId= 로도 조회 가능 (TRD §5.5). 모임 소속인지 확인한다.
  const q = url.searchParams.get("memberId");
  const queried = !me && q ? await prisma.member.findFirst({ where: { id: q, groupId: group.id }, select: { id: true } }) : null;
  const memberId = me?.id ?? queried?.id ?? null;
  return json(await getStats(group.id, memberId), { headers: { "Cache-Control": "no-store" } });
});
