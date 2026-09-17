import { route, json } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { pollKindSchema } from "@/lib/schemas";
import { reopenPoll } from "@/server/polls";

type Ctx = { params: Promise<{ kind: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  requireClientId(req);
  await reopenPoll(pollKindSchema.parse((await params).kind));
  return json({ ok: true });
});
