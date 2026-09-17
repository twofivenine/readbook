-- CreateTable
CREATE TABLE "cover_files" (
    "key" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "content_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cover_files_pkey" PRIMARY KEY ("key")
);
