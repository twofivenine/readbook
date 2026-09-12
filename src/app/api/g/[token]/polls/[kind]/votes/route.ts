import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { pollKindSchema, votesSchema } from "@/lib/schemas";
import { setVotes } from "@/server/polls";

type Ctx = { params: Promise<{ token: string; kind: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  const { token, kind: k } = await params;
  const kind = pollKindSchema.parse(k);
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  const { candidateIds } = votesSchema.parse(await req.json());
  await setVotes(group.id, kind, me.id, candidateIds);
  return json({ ok: true });
});
