import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { reviewSchema } from "@/lib/schemas";
import { createReview, getReviewView } from "@/server/books";

type Ctx = { params: Promise<{ token: string; bookId: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const { token, bookId } = await params;
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  const { body, spoiler } = reviewSchema.parse(await req.json());
  const r = await createReview(group.id, bookId, me.id, body, spoiler);
  return json(await getReviewView(r.id), { status: 201 });
});
