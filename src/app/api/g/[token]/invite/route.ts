import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";

type Ctx = { params: Promise<{ token: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  const group = await resolveGroup((await params).token);
  await requireMember(req, group.id);
  return json({ token: group.inviteToken, path: `/g/${group.inviteToken}` });
});
