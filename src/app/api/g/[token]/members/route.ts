import { route, json } from "@/lib/errors";
import { resolveGroup } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { nicknameSchema } from "@/lib/schemas";
import { getMemberStats } from "@/server/stats";
import { joinGroup } from "@/server/members";

type Ctx = { params: Promise<{ token: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const group = await resolveGroup((await params).token);
  return json(await getMemberStats(group.id));
});

export const POST = route<Ctx>(async (req, { params }) => {
  rateLimit(req, "write");
  const group = await resolveGroup((await params).token);
  const { nickname } = nicknameSchema.parse(await req.json());
  const m = await joinGroup(group.id, nickname);
  return json({ id: m.id, nickname: m.nickname, groupId: group.id }, { status: 201 });
});
