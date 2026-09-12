import { route, json } from "@/lib/errors";
import { optionalMember, resolveGroup } from "@/lib/auth";
import { buildHome } from "@/server/home";

type Ctx = { params: Promise<{ token: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  const { token } = await params;
  const group = await resolveGroup(token);
  const me = await optionalMember(req, group.id);
  return json(await buildHome(group, me), { headers: { "Cache-Control": "no-store" } });
});
