/**
 * TRD §8 표지 이미지 저장소.
 * - s3: S3 호환 오브젝트 스토리지 (Supabase Storage / R2)
 * - local: 개발용 파일 시스템 (./data/covers) → /api/covers/{key} 로 서빙
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export interface CoverStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  removePrefix(prefix: string): Promise<void>;
  publicUrl(key: string): string;
}

const LOCAL_ROOT = path.join(process.cwd(), "data");

class LocalStorage implements CoverStorage {
  async put(key: string, body: Buffer) {
    const file = path.join(LOCAL_ROOT, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body);
  }
  async remove(key: string) {
    await fs.rm(path.join(LOCAL_ROOT, key), { force: true });
  }
  async removePrefix(prefix: string) {
    await fs.rm(path.join(LOCAL_ROOT, prefix), { recursive: true, force: true });
  }
  publicUrl(key: string) {
    return `/api/covers/${key}`;
  }
  async read(key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(path.join(LOCAL_ROOT, key));
    } catch {
      return null;
    }
  }
}

class S3Storage implements CoverStorage {
  private client: S3Client;
  private bucket: string;
  private base: string;
  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "covers";
    this.base = (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? "auto",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }
  async remove(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
  async removePrefix(prefix: string) {
    const list = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }));
    const keys = (list.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
    if (keys.length) await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys } }));
  }
  publicUrl(key: string) {
    return `${this.base}/${key}`;
  }
}

export const localStorageDriver = new LocalStorage();

export function coverStorage(): CoverStorage {
  return process.env.COVER_STORAGE_DRIVER === "s3" ? new S3Storage() : localStorageDriver;
}

export function coverUrl(key: string | null | undefined): string | null {
  return key ? coverStorage().publicUrl(key) : null;
}
