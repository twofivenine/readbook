import { route, json } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { bookInputSchema, placeInputSchema, pollKindSchema } from "@/lib/schemas";
import { addCandidate } from "@/server/polls";

type Ctx = { params: Promise<{ kind: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  requireClientId(req);
  const kind = pollKindSchema.parse((await params).kind);
  const body = await req.json();
  const c = await addCandidate(kind, kind === "book" ? bookInputSchema.parse(body) : placeInputSchema.parse(body));
  return json({ id: c.id }, { status: 201 });
});
