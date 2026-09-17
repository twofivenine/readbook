import { route, json, noContent } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { ratingSchema } from "@/lib/schemas";
import { deleteRating, setRating } from "@/server/books";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  const clientId = requireClientId(req);
  const { name, score } = ratingSchema.parse(await req.json());
  const r = await setRating((await params).id, clientId, name, score);
  return json({ name: r.name, score: r.score });
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  await deleteRating((await params).id, requireClientId(req));
  return noContent();
});
