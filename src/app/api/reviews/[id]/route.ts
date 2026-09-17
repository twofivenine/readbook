import { route, json, noContent } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { reviewPatchSchema } from "@/lib/schemas";
import { deleteReview, updateReview } from "@/server/books";
import { reviewView } from "@/server/views";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const clientId = requireClientId(req);
  const data = reviewPatchSchema.parse(await req.json());
  return json(reviewView(await updateReview((await params).id, clientId, data), clientId));
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  await deleteReview((await params).id, requireClientId(req));
  return noContent();
});
