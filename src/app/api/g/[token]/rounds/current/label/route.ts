import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { labelSchema } from "@/lib/schemas";
import { setLabel } from "@/server/schedule";

type Ctx = { params: Promise<{ token: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const group = await resolveGroup((await params).token);
  await requireMember(req, group.id);
  const { label } = labelSchema.parse(await req.json());
  const r = await setLabel(group.id, label);
  return json({ roundId: r.id, label: r.label });
});
