import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { rotateInvite } from "@/server/members";

type Ctx = { params: Promise<{ token: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const group = await resolveGroup((await params).token);
  await requireMember(req, group.id);
  const token = await rotateInvite(group.id);
  return json({ token, path: `/g/${token}` });
});
