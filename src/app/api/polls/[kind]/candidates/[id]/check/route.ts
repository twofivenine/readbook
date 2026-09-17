import { route, json, noContent } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { pollKindSchema } from "@/lib/schemas";
import { check, uncheck } from "@/server/polls";

type Ctx = { params: Promise<{ kind: string; id: string }> };

/** F-2.5 체크 (브라우저당 후보별 1회) */
export const POST = route<Ctx>(async (req, { params }) => {
  const clientId = requireClientId(req);
  const { kind, id } = await params;
  await check(pollKindSchema.parse(kind), id, clientId);
  return json({ ok: true }, { status: 201 });
});

/** F-2.6 체크 취소 */
export const DELETE = route<Ctx>(async (req, { params }) => {
  const clientId = requireClientId(req);
  const { kind, id } = await params;
  await uncheck(pollKindSchema.parse(kind), id, clientId);
  return noContent();
});
