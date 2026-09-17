"use client";
/** 지난 책 상세 (F-8.2): 별점 목록 + 한줄평 (읽기 전용) */
import Link from "next/link";
import { use } from "react";
import { useRoundDetail } from "@/lib/hooks";
import { Card, Cover, Divider, Label, Title } from "@/components/ui";
import { monthWord } from "@/lib/time";
import { ReviewsSection } from "@/components/home/Reviews";

export default function RoundDetailPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = use(params);
  const q = useRoundDetail(roundId);
  if (q.isError) return <div className="text-[14px] text-muted">지난 책을 찾을 수 없어요. <Link href="/library" className="text-accent">서재로</Link></div>;
  if (!q.data) return <div className="text-[14px] text-muted">불러오는 중…</div>;
  const d = q.data;
  return (
    <div className="flex flex-col gap-4 max-w-[640px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/library" className="text-[17px] text-muted hover:text-ink" aria-label="서재로">←</Link>
        <Title>{d.round ? `${monthWord(d.round.label)}의 책` : "지난 책"}</Title>
      </div>
      <Card className="gap-5">
        <div className="flex gap-4 md:gap-5">
          <Cover url={d.book.coverUrl} title={d.book.title} className="w-[84px] md:w-[104px]" />
          <div className="flex flex-col gap-1.5">
            <div className="display font-medium text-[19px] leading-snug">{d.book.title}</div>
            <div className="text-[13px] text-mono">{d.book.author} · {d.book.totalPages}쪽</div>
            <div className="text-[13.5px] text-ink-2 mt-1">평균 {d.ratings.avg === null ? "–" : `★ ${d.ratings.avg.toFixed(1)}`} · {d.ratings.count}명</div>
          </div>
        </div>
        <Divider />
        <div className="flex flex-col gap-2.5">
          <Label>당시 별점</Label>
          {d.ratings.list.length === 0 ? (
            <div className="text-[14px] text-muted">별점이 없어요.</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {d.ratings.list.map((x, i) => (
                <li key={i} className="flex items-center gap-3 text-[14px]">
                  <span className={x.mine ? "w-[52px] font-medium" : "w-[52px]"}>{x.mine ? "나" : x.name}</span>
                  <span className="flex-1 h-1.5 rounded-full bg-line-soft overflow-hidden"><span className="block h-full rounded-full bg-accent" style={{ width: `${x.score * 20}%` }} /></span>
                  <span className="w-[52px] text-right text-[13px] text-ink-2">★ {x.score}.0</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Divider />
        <ReviewsSection bookId={d.book.id} reviews={d.reviews} readOnly />
      </Card>
    </div>
  );
}
