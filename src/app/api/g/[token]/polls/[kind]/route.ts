import { route, json, errors } from "@/lib/errors";
import { optionalMember, resolveGroup } from "@/lib/auth";
import { pollKindSchema } from "@/lib/schemas";
import { getPoll } from "@/server/polls";

type Ctx = { params: Promise<{ token: string; kind: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  const { token, kind: k } = await params;
  const kind = pollKindSchema.safeParse(k);
  if (!kind.success) throw errors.notFound("투표");
  const group = await resolveGroup(token);
  const me = await optionalMember(req, group.id);
  return json(await getPoll(group.id, kind.data, me?.id ?? null), { headers: { "Cache-Control": "no-store" } });
});
