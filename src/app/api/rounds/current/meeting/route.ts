import { route, json } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { meetingSchema } from "@/lib/schemas";
import { setMeeting } from "@/server/schedule";

export const PUT = route(async (req) => {
  requireClientId(req);
  const { meetingAt } = meetingSchema.parse(await req.json());
  const r = await setMeeting(meetingAt ? new Date(meetingAt) : null);
  return json({ roundId: r.id, meetingAt: r.meetingAt?.toISOString() ?? null });
});
