-- 회차를 월(label) 기준으로: label NOT NULL + UNIQUE, seq 는 자동 증가로만 유지
-- 1) label 이 비어 있는 회차는 생성 시각(KST)의 달로 채우고, 같은 달이 겹치면 다음 달로 민다
DO $$
DECLARE r RECORD; l TEXT; y INT; m INT;
BEGIN
  FOR r IN SELECT id, created_at FROM rounds WHERE label IS NULL ORDER BY seq LOOP
    l := to_char(r.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM');
    WHILE EXISTS (SELECT 1 FROM rounds WHERE label = l) LOOP
      y := split_part(l, '-', 1)::int; m := split_part(l, '-', 2)::int + 1;
      IF m > 12 THEN m := 1; y := y + 1; END IF;
      l := y::text || '-' || lpad(m::text, 2, '0');
    END LOOP;
    UPDATE rounds SET label = l WHERE id = r.id;
  END LOOP;
END $$;

-- 2) 제약 변경
ALTER TABLE "rounds" ALTER COLUMN "label" SET NOT NULL;
CREATE UNIQUE INDEX "rounds_label_key" ON "rounds"("label");
DROP INDEX IF EXISTS "rounds_seq_idx";
CREATE INDEX "rounds_label_idx" ON "rounds"("label" DESC);

-- 3) seq 자동 증가 (기존 최대값 이후부터)
CREATE SEQUENCE IF NOT EXISTS rounds_seq_seq;
SELECT setval('rounds_seq_seq', COALESCE((SELECT MAX(seq) FROM rounds), 0) + 1, false);
ALTER TABLE "rounds" ALTER COLUMN "seq" SET DEFAULT nextval('rounds_seq_seq');
ALTER SEQUENCE rounds_seq_seq OWNED BY "rounds"."seq";
