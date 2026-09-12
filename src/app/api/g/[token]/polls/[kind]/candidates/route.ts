import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { bookCandidateSchema, placeCandidateSchema, pollKindSchema } from "@/lib/schemas";
import { addCandidate } from "@/server/polls";

type Ctx = { params: Promise<{ token: string; kind: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const { token, kind: k } = await params;
  const kind = pollKindSchema.parse(k);
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  const body = await req.json();
  const input = kind === "book" ? bookCandidateSchema.parse(body) : placeCandidateSchema.parse(body);
  const c = await addCandidate(group.id, kind, me.id, input);
  return json({ id: c.id }, { status: 201 });
});
