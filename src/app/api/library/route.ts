import { route, json } from "@/lib/errors";
import { getLibrary } from "@/server/library";

export const GET = route(async () => json(await getLibrary(), { headers: { "Cache-Control": "no-store" } }));
