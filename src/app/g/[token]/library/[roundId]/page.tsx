"use client";
/** S10 지난 책 상세 (F-8.2): 당시 멤버 진도 + 한줄평·댓글 (읽기 전용) */
import Link from "next/link";
import { use } from "react";
import { useRoundDetail } from "@/lib/hooks";
import { useIdentity } from "@/lib/identity";
import { Card, Cover, Label } from "@/components/ui";
import { Reviews } from "@/components/home/Reviews";
import { clsx } from "@/lib/clsx";

export default function RoundDetailPage({ params }: { params: Promise<{ token: string; roundId: string }> }) {
  const { token, roundId } = use(params);
  const q = useRoundDetail(token, roundId);
  const { identity } = useIdentity();
  if (q.isError) return <div className="text-[14px] text-muted">지난 책을 찾을 수 없어요. <Link href={`/g/${token}/library`} className="text-accent">서재로</Link></div>;
  if (!q.data) return <div className="text-[14px] text-muted">불러오는 중…</div>;
  const d = q.data;
  const meId = identity?.memberId ?? null;

  return (
    <div className="flex flex-col gap-4 max-w-[640px] mx-auto">
      <div className="flex items-center gap-2">
        <Link href={`/g/${token}/library`} className="text-[15px] text-muted hover:text-ink" aria-label="서재로">←</Link>
        <Label>/library/… · {d.round?.label ?? `${d.round?.seq}회차`}</Label>
      </div>
      <Card>
        <div className="flex gap-3">
          <Cover url={d.book.coverUrl} title={d.book.title} className="w-[72px]" />
          <div>
            <Label>{d.round?.label}</Label>
            <div className="text-[20px] font-bold leading-tight">{d.book.title}</div>
            <div className="text-[14px] text-muted">{d.book.author} · {d.book.totalPages}쪽</div>
            <div className="text-[14px] text-ink-2 mt-1">
              평균 {d.ratings.avg === null ? "–" : <span className="text-star font-semibold">★{d.ratings.avg}</span>} · {d.completedCount}/{d.memberCount} 완독
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <Label>당시 멤버 진도</Label>
        <ul className="flex flex-col gap-1.5">
          {d.progresses.map((p) => (
            <li key={p.memberId} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-[14px]">
              <span className="truncate">{p.memberId === meId ? "나" : p.nickname}</span>
              <span className="flex items-center gap-2 w-[120px]">
                <span className="h-1.5 flex-1 rounded-full bg-bg overflow-hidden">
                  <span className={clsx("block h-full rounded-full", p.completed ? "bg-accent" : "bg-ink")} style={{ width: `${p.percent}%` }} />
                </span>
                <span className="w-9 text-right tabular-nums">{p.percent}%</span>
              </span>
              <span className="w-8 text-right text-star font-semibold">{p.rating === null ? <span className="text-muted">–</span> : `★${p.rating}`}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Reviews token={token} bookId={d.book.id} reviews={d.reviews} meId={meId} readOnly />
      <Label>당시 한줄평 {d.reviews.length} · 댓글 포함</Label>
    </div>
  );
}
