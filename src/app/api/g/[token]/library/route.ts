import { route, json } from "@/lib/errors";
import { resolveGroup } from "@/lib/auth";
import { getLibrary } from "@/server/stats";

type Ctx = { params: Promise<{ token: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const group = await resolveGroup((await params).token);
  return json(await getLibrary(group.id), { headers: { "Cache-Control": "no-store" } });
});
