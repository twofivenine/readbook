import { route, json, errors } from "@/lib/errors";
import { optionalClientId } from "@/lib/client";
import { pollKindSchema } from "@/lib/schemas";
import { getPoll } from "@/server/polls";

type Ctx = { params: Promise<{ kind: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  const kind = pollKindSchema.safeParse((await params).kind);
  if (!kind.success) throw errors.notFound("투표");
  return json(await getPoll(kind.data, optionalClientId(req)), { headers: { "Cache-Control": "no-store" } });
});
