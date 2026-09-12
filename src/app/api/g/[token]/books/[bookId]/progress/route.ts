import { route, json } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { progressSchema } from "@/lib/schemas";
import { setProgress } from "@/server/books";
import { percentOf } from "@/server/views";
import { requireBook } from "@/server/books";

type Ctx = { params: Promise<{ token: string; bookId: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  const { token, bookId } = await params;
  const group = await resolveGroup(token);
  const me = await requireMember(req, group.id);
  const input = progressSchema.parse(await req.json());
  const p = await setProgress(group.id, bookId, me.id, input);
  const book = await requireBook(group.id, bookId);
  return json({ currentPage: p.currentPage, completed: p.completed, percent: percentOf(p.currentPage, book.totalPages) });
});
