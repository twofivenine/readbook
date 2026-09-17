/** TRD v1.1 §8 표지 저장소: s3 (S3 호환) 또는 local (개발용, ./data → /api/covers/{key}) */
import { promises as fs } from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface CoverStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
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

export const localStorageDriver = new LocalStorage();
export const coverStorage = (): CoverStorage => (process.env.COVER_STORAGE_DRIVER === "s3" ? new S3Storage() : localStorageDriver);
export const coverUrl = (key: string | null | undefined): string | null => (key ? coverStorage().publicUrl(key) : null);
