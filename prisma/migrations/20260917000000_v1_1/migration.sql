-- v1.1 (PRD/TRD v1.1): 단일 테넌트, 멤버·댓글·진도 제거.
-- v1.0 스키마가 적용된 DB라면 기존 테이블을 모두 정리하고 새로 만든다 (보존할 운영 데이터 없음).
DROP TABLE IF EXISTS "comments", "reviews", "ratings", "progresses", "attendances", "votes", "vote_checks",
  "poll_candidates", "polls", "places", "books", "rounds", "members", "groups" CASCADE;
DROP TYPE IF EXISTS "PollKind", "PollStatus", "AttendanceStatus" CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PollKind" AS ENUM ('book', 'place');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('yes', 'no', 'undecided');

-- CreateTable
CREATE TABLE "rounds" (
    "id" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "label" TEXT,
    "book_id" UUID,
    "meeting_at" TIMESTAMP(3),
    "place_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "total_pages" INTEGER NOT NULL,
    "cover_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "kind" "PollKind" NOT NULL,
    "status" "PollStatus" NOT NULL DEFAULT 'open',
    "closed_at" TIMESTAMP(3),
    "result_candidate_id" UUID,
    "tie_candidate_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_candidates" (
    "id" UUID NOT NULL,
    "poll_id" UUID NOT NULL,
    "book_id" UUID,
    "place_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poll_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_checks" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "score" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rounds_seq_key" ON "rounds"("seq");

-- CreateIndex
CREATE INDEX "rounds_seq_idx" ON "rounds"("seq" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "polls_round_id_kind_key" ON "polls"("round_id", "kind");

-- CreateIndex
CREATE INDEX "poll_candidates_poll_id_idx" ON "poll_candidates"("poll_id");

-- CreateIndex
CREATE INDEX "vote_checks_candidate_id_idx" ON "vote_checks"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "vote_checks_candidate_id_client_id_key" ON "vote_checks"("candidate_id", "client_id");

-- CreateIndex
CREATE INDEX "attendances_round_id_idx" ON "attendances"("round_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_round_id_client_id_key" ON "attendances"("round_id", "client_id");

-- CreateIndex
CREATE INDEX "ratings_book_id_idx" ON "ratings"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_book_id_client_id_key" ON "ratings"("book_id", "client_id");

-- CreateIndex
CREATE INDEX "reviews_book_id_created_at_idx" ON "reviews"("book_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_candidates" ADD CONSTRAINT "poll_candidates_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_candidates" ADD CONSTRAINT "poll_candidates_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_candidates" ADD CONSTRAINT "poll_candidates_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_checks" ADD CONSTRAINT "vote_checks_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "poll_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- §4.8 별점 범위
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_score_check" CHECK ("score" BETWEEN 1 AND 5);
