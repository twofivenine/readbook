import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { reviewPatchSchema } from "@/lib/schemas";
import { deleteReview, getReviewView, updateReview } from "@/server/books";

type Ctx = { params: Promise<{ token: string; id: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const { token, id } = await params;
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  const data = reviewPatchSchema.parse(await req.json());
  await updateReview(group.id, id, me.id, data);
  return json(await getReviewView(id));
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  const { token, id } = await params;
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  await deleteReview(group.id, id, me.id);
  return json({ ok: true });
});
