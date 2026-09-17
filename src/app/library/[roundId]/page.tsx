"use client";
/** 지난 책 상세 (F-8.2): 별점 목록 + 한줄평 (읽기 전용) */
import Link from "next/link";
import { use } from "react";
import { useRoundDetail } from "@/lib/hooks";
import { Card, Cover, Label } from "@/components/ui";
import { Reviews } from "@/components/home/Reviews";

export default function RoundDetailPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = use(params);
  const q = useRoundDetail(roundId);
  if (q.isError) return <div className="text-[14px] text-muted">지난 책을 찾을 수 없어요. <Link href="/library" className="text-accent">서재로</Link></div>;
  if (!q.data) return <div className="text-[14px] text-muted">불러오는 중…</div>;
  const d = q.data;
  return (
    <div className="flex flex-col gap-4 max-w-[640px] mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/library" className="text-[15px] text-muted hover:text-ink" aria-label="서재로">←</Link>
        <Label>/library/… · {d.round?.label ?? `${d.round?.seq}회차`}</Label>
      </div>
      <Card>
        <div className="flex gap-3">
          <Cover url={d.book.coverUrl} title={d.book.title} className="w-[72px]" />
          <div>
            <Label>{d.round?.label}</Label>
            <div className="text-[20px] font-bold leading-tight">{d.book.title}</div>
            <div className="text-[14px] text-muted">{d.book.author} · {d.book.totalPages}쪽</div>
            <div className="text-[14px] text-ink-2 mt-1">평균 {d.ratings.avg === null ? "–" : <span className="text-star font-semibold">★{d.ratings.avg}</span>} · {d.ratings.count}명</div>
          </div>
        </div>
      </Card>
      <Card>
        <Label>당시 별점</Label>
        {d.ratings.list.length === 0 ? (
          <div className="text-[14px] text-muted">별점이 없어요.</div>
        ) : (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
            {d.ratings.list.map((r, i) => <li key={i} className={r.mine ? "font-semibold" : ""}>{r.name} <span className="text-star">★{r.score}</span></li>)}
          </ul>
        )}
      </Card>
      <Reviews bookId={d.book.id} reviews={d.reviews} readOnly />
    </div>
  );
}
