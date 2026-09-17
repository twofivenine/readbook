import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { route, json, errors } from "@/lib/errors";
import { requireClientId } from "@/lib/client";
import { rateLimit } from "@/lib/ratelimit";
import { coverStorage } from "@/lib/storage";

/** TRD v1.1 §8: JPEG/PNG/WebP, 5MB, 최대 600×900 WebP q80, 키 covers/{uuid}.webp */
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export const POST = route(async (req) => {
  rateLimit(req, "cover");
  requireClientId(req);
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw errors.invalid("이미지 파일을 선택해 주세요.");
  if (!ALLOWED.has(file.type)) throw errors.invalid("JPEG, PNG, WebP 이미지만 업로드할 수 있어요.");
  if (file.size > MAX_BYTES) throw errors.invalid("이미지는 5MB 이하여야 해요.");
  let output: Buffer;
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 600, height: 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  } catch {
    throw errors.invalid("이미지를 읽을 수 없어요.");
  }
  const key = `covers/${randomUUID()}.webp`;
  await coverStorage().put(key, output, "image/webp");
  return json({ coverKey: key, coverUrl: coverStorage().publicUrl(key) }, { status: 201 });
});
