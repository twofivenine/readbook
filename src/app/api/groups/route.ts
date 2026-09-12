import { route, json } from "@/lib/errors";
import { rateLimit } from "@/lib/ratelimit";
import { groupCreateSchema } from "@/lib/schemas";
import { createGroup } from "@/server/members";

export const POST = route(async (req) => {
  rateLimit(req, "group");
  const input = groupCreateSchema.parse(await req.json());
  return json(await createGroup(input), { status: 201 });
});
