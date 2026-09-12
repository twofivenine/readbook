import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { meetingSchema } from "@/lib/schemas";
import { setMeeting } from "@/server/schedule";

type Ctx = { params: Promise<{ token: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  const group = await resolveGroup((await params).token);
  await requireMember(req, group.id);
  const { meetingAt } = meetingSchema.parse(await req.json());
  const r = await setMeeting(group.id, meetingAt ? new Date(meetingAt) : null);
  return json({ roundId: r.id, meetingAt: r.meetingAt?.toISOString() ?? null });
});
