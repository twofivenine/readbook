import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { nicknameSchema } from "@/lib/schemas";
import { renameMember } from "@/server/members";

type Ctx = { params: Promise<{ token: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const group = await resolveGroup((await params).token);
  const me = await requireMember(req, group.id);
  const { nickname } = nicknameSchema.parse(await req.json());
  const m = await renameMember(me.id, nickname);
  return json({ id: m.id, nickname: m.nickname });
});
