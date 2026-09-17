import { localStorageDriver } from "@/lib/storage";

type Ctx = { params: Promise<{ key: string[] }> };

/** 로컬 저장소 드라이버용 표지 서빙 */
export async function GET(_req: Request, { params }: Ctx) {
  const { key } = await params;
  if (key[0] !== "covers" || !key.every((s) => /^[A-Za-z0-9._-]+$/.test(s) && s !== "..")) return new Response(null, { status: 404 });
  const body = await localStorageDriver.read(key.join("/"));
  if (!body) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(body), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
}
