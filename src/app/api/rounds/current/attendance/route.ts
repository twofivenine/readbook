import { route, json, noContent } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { attendanceSchema } from "@/lib/schemas";
import { deleteAttendance, setAttendance } from "@/server/schedule";

export const PUT = route(async (req) => {
  const clientId = requireClientId(req);
  const { name, status } = attendanceSchema.parse(await req.json());
  const a = await setAttendance(clientId, name, status);
  return json({ name: a.name, status: a.status });
});

export const DELETE = route(async (req) => {
  await deleteAttendance(requireClientId(req));
  return noContent();
});
