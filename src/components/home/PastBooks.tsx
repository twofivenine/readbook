"use client";
/** 시안의 "지난 모임" 카드: 최근 지난 책 3권 표지 + 월 · 평균 별점 → 서재 */
import Link from "next/link";
import { useLibrary } from "@/lib/hooks";
import { Card, Cover, Title } from "@/components/ui";

export function PastBooks() {
  const lib = useLibrary();
  const items = lib.data?.slice(0, 3) ?? [];
  return (
    <Card className="gap-3.5">
      <div className="flex justify-between items-baseline">
        <Title size="sm">지난 책</Title>
        <Link href="/library" className="text-[13px] text-mono hover:text-ink">서재 전체 보기</Link>
      </div>
      {items.length === 0 ? (
        <div className="text-[13.5px] text-muted">아직 지난 책이 없어요.</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 max-w-[360px]">
          {items.map((it) => (
            <Link key={it.roundId} href={`/library/${it.roundId}`} className="flex flex-col gap-1.5 min-w-0">
              <Cover url={it.book.coverUrl} title={it.book.title} className="w-full" />
              <span className="label-mono tracking-normal! truncate">{it.label ? `${Number(it.label.split("-")[1])}월` : `${it.seq}회`} · {it.avgRating === null ? "–" : `★${it.avgRating}`}</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
