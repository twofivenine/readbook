import { route, json } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { pastBookSchema } from "@/lib/schemas";
import { addBookToMonth, getLibrary } from "@/server/library";

export const GET = route(async () => json(await getLibrary(), { headers: { "Cache-Control": "no-store" } }));

/** 지난 책 직접 추가: {label, title, author, totalPages, coverKey?} */
export const POST = route(async (req) => {
  requireClientId(req);
  const { label, ...book } = pastBookSchema.parse(await req.json());
  return json(await addBookToMonth(label, book), { status: 201 });
});
