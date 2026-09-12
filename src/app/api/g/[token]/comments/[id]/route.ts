import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { commentPatchSchema } from "@/lib/schemas";
import { deleteComment, updateComment } from "@/server/books";

type Ctx = { params: Promise<{ token: string; id: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const { token, id } = await params;
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  const data = commentPatchSchema.parse(await req.json());
  const c = await updateComment(group.id, id, me.id, data);
  return json({ id: c.id, body: c.body, spoiler: c.spoiler });
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  const { token, id } = await params;
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  await deleteComment(group.id, id, me.id);
  return json({ ok: true });
});
