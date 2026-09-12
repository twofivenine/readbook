import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { attendanceSchema } from "@/lib/schemas";
import { setAttendance } from "@/server/schedule";

type Ctx = { params: Promise<{ token: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  const group = await resolveGroup((await params).token);
  const me = await requireMember(req, group.id);
  const { status } = attendanceSchema.parse(await req.json());
  const a = await setAttendance(group.id, me.id, status);
  return json({ status: a.status });
});
