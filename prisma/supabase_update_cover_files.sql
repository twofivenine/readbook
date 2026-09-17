-- 표지 이미지를 DB에 저장하기 위한 테이블 추가 (v1.1.1). Supabase SQL Editor 에 붙여 넣고 Run.
-- CreateTable
CREATE TABLE "cover_files" (
    "key" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "content_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cover_files_pkey" PRIMARY KEY ("key")
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
VALUES (gen_random_uuid()::text, '006525128f97c7496e78cdeccb34585fbdd2ebf7ca3998769beb744e86a6cfec', now(), '20260917024113_cover_files', 1)
ON CONFLICT DO NOTHING;
