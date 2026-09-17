import { route, json } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { reviewSchema } from "@/lib/schemas";
import { createReview } from "@/server/books";
import { reviewView } from "@/server/views";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const clientId = requireClientId(req);
  const { name, body, spoiler } = reviewSchema.parse(await req.json());
  const r = await createReview((await params).id, clientId, name, body, spoiler);
  return json(reviewView(r, clientId), { status: 201 });
});
