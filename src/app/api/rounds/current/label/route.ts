import { route, json } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { labelSchema } from "@/lib/schemas";
import { setLabel } from "@/server/schedule";

export const PATCH = route(async (req) => {
  requireClientId(req);
  const { label } = labelSchema.parse(await req.json());
  const r = await setLabel(label);
  return json({ roundId: r.id, label: r.label });
});
