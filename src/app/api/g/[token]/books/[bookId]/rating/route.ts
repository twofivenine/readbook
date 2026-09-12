import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { ratingSchema } from "@/lib/schemas";
import { deleteRating, setRating } from "@/server/books";

type Ctx = { params: Promise<{ token: string; bookId: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  const { token, bookId } = await params;
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  const { score } = ratingSchema.parse(await req.json());
  const r = await setRating(group.id, bookId, me.id, score);
  return json({ score: r.score });
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  const { token, bookId } = await params;
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  await deleteRating(group.id, bookId, me.id);
  return json({ ok: true });
});
