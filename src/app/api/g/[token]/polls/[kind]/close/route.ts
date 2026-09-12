import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { pollKindSchema } from "@/lib/schemas";
import { closePoll } from "@/server/polls";

type Ctx = { params: Promise<{ token: string; kind: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const { token, kind: k } = await params;
  const kind = pollKindSchema.parse(k);
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  await closePoll(group.id, kind, me.id);
  return json({ ok: true });
});
