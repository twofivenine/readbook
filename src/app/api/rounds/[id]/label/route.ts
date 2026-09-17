import { route, json } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { labelSchema } from "@/lib/schemas";
import { setLabel } from "@/server/schedule";

type Ctx = { params: Promise<{ id: string }> };

/** 회차의 표시 월 수정 (id 또는 "current") */
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireClientId(req);
  const { label } = labelSchema.parse(await req.json());
  const r = await setLabel((await params).id, label);
  return json({ roundId: r.id, label: r.label });
});
