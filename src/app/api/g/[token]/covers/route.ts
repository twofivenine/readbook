import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { route, json, errors } from "@/lib/errors";
import { requireMember, resolveGroup } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { coverStorage } from "@/lib/storage";

type Ctx = { params: Promise<{ token: string }> };

/** TRD §8: JPEG/PNG/WebP, 5MB, 최대 600×900 WebP q80 */
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export const POST = route<Ctx>(async (req, { params }) => {
  rateLimit(req, "cover");
  const group = await resolveGroup((await params).token);
  await requireMember(req, group.id);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw errors.invalid("이미지 파일을 선택해 주세요.");
  if (!ALLOWED.has(file.type)) throw errors.invalid("JPEG, PNG, WebP 이미지만 업로드할 수 있어요.");
  if (file.size > MAX_BYTES) throw errors.invalid("이미지는 5MB 이하여야 해요.");

  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    output = await sharp(input).rotate().resize({ width: 600, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  } catch {
    throw errors.invalid("이미지를 읽을 수 없어요.");
  }
  const key = `covers/${group.id}/${randomUUID()}.webp`;
  await coverStorage().put(key, output, "image/webp");
  return json({ coverKey: key, coverUrl: coverStorage().publicUrl(key) }, { status: 201 });
});
