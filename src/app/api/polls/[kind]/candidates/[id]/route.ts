import { route, noContent } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { pollKindSchema } from "@/lib/schemas";
import { deleteCandidate } from "@/server/polls";

type Ctx = { params: Promise<{ kind: string; id: string }> };

export const DELETE = route<Ctx>(async (req, { params }) => {
  requireClientId(req);
  const { kind, id } = await params;
  await deleteCandidate(pollKindSchema.parse(kind), id);
  return noContent();
});
