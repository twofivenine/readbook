import { route, json } from "@/lib/errors";
import { optionalClientId, requireClientId } from "@/lib/client";
import { bookPatchSchema } from "@/lib/schemas";
import { getBookDetail, updateBook } from "@/server/books";
import { bookView } from "@/server/views";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (req, { params }) => json(await getBookDetail((await params).id, optionalClientId(req)), { headers: { "Cache-Control": "no-store" } }));

/** F-9.5 책 정보 수정 (누구나) */
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireClientId(req);
  const data = bookPatchSchema.parse(await req.json());
  return json(bookView(await updateBook((await params).id, data)));
});
