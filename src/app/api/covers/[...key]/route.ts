import { dbStorage } from "@/lib/storage";

type Ctx = { params: Promise<{ key: string[] }> };

/** DB 저장소 드라이버용 표지 서빙 (S3 사용 시 공개 URL로 직접 접근) */
export async function GET(_req: Request, { params }: Ctx) {
  const { key } = await params;
  if (key[0] !== "covers" || !key.every((s) => /^[A-Za-z0-9._-]+$/.test(s) && s !== "..")) return new Response(null, { status: 404 });
  const file = await dbStorage.read(key.join("/"));
  if (!file) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(file.data), { headers: { "Content-Type": file.contentType, "Cache-Control": "public, max-age=31536000, immutable" } });
}
