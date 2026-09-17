import { route, json } from "@/lib/errors";
import { optionalClientId } from "@/lib/client";
import { buildHome } from "@/server/home";

export const GET = route(async (req) => json(await buildHome(optionalClientId(req)), { headers: { "Cache-Control": "no-store" } }));
