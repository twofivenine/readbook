import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { pollKindSchema } from "@/lib/schemas";
import { deleteCandidate } from "@/server/polls";

type Ctx = { params: Promise<{ token: string; kind: string; id: string }> };

export const DELETE = route<Ctx>(async (req, { params }) => {
  const { token, kind: k, id } = await params;
  const kind = pollKindSchema.parse(k);
  const group = await resolveGroup(token);
  await requireMember(req, group.id);
  await deleteCandidate(group.id, kind, id);
  return json({ ok: true });
});
