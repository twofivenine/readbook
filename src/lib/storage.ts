/**
 * TRD v1.1 §8 표지 저장소.
 * - db (기본): 리사이즈된 WebP(수십 KB)를 Postgres `cover_files`에 저장. 추가 설정 없이 Vercel에서 동작.
 * - s3: COVER_STORAGE_DRIVER=s3 + S3_* 환경 변수로 S3 호환 오브젝트 스토리지 사용.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "./prisma";

export interface CoverStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  publicUrl(key: string): string;
}

class DbStorage implements CoverStorage {
  async put(key: string, body: Buffer, contentType: string) {
    const data = new Uint8Array(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer);
    await prisma.coverFile.upsert({ where: { key }, create: { key, data, contentType }, update: { data, contentType } });
  }
  async remove(key: string) {
    await prisma.coverFile.deleteMany({ where: { key } });
  }
  publicUrl(key: string) {
    return `/api/covers/${key}`;
  }
  async read(key: string) {
    const f = await prisma.coverFile.findUnique({ where: { key } });
    return f ? { data: Buffer.from(f.data), contentType: f.contentType } : null;
  }
}

class S3Storage implements CoverStorage {
  private client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "auto",
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
  });
  private bucket = process.env.S3_BUCKET ?? "covers";
  private base = (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }
  async remove(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
  publicUrl(key: string) {
    return `${this.base}/${key}`;
  }
}

export const dbStorage = new DbStorage();
export const coverStorage = (): CoverStorage => (process.env.COVER_STORAGE_DRIVER === "s3" ? new S3Storage() : dbStorage);
export const coverUrl = (key: string | null | undefined): string | null => (key ? coverStorage().publicUrl(key) : null);
