import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { commentSchema } from "@/lib/schemas";
import { createComment } from "@/server/books";

type Ctx = { params: Promise<{ token: string; id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const { token, id } = await params;
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  const { body, spoiler } = commentSchema.parse(await req.json());
  const c = await createComment(group.id, id, me.id, body, spoiler);
  return json({ id: c.id }, { status: 201 });
});
