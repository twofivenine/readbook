import { route, json } from "@/lib/errors";
import { optionalMember, resolveGroup } from "@/lib/auth";
import { getBookDetail } from "@/server/books";

type Ctx = { params: Promise<{ token: string; bookId: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  const { token, bookId } = await params;
  const group = await resolveGroup(token);
  const me = await optionalMember(req, group.id);
  return json(await getBookDetail(group.id, bookId, me?.id ?? null), { headers: { "Cache-Control": "no-store" } });
});
