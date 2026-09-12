"use client";
/** S9 서재 — 지난 책 목록 + 통계 (F-8) */
import Link from "next/link";
import { use } from "react";
import { useLibrary, useStats } from "@/lib/hooks";
import { useIdentity } from "@/lib/identity";
import { Card, Cover, Label, StarValue } from "@/components/ui";

export default function LibraryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const lib = useLibrary(token);
  const stats = useStats(token);
  const { identity } = useIdentity();

  return (
    <div className="flex flex-col gap-4 max-w-[640px] mx-auto">
      <Label>/library · 서재 탭</Label>
      <Card>
        <div className="text-[17px] font-bold">지난 책</div>
        {lib.data?.length === 0 && <div className="text-[14px] text-muted">아직 지난 책이 없어요. 다음 책이 확정되면 이달의 책이 여기로 옮겨와요.</div>}
        <ul className="flex flex-col">
          {lib.data?.map((it) => (
            <li key={it.roundId} className="border-b-[1.5px] border-dashed border-line last:border-b-0">
              <Link href={`/g/${token}/library/${it.roundId}`} className="flex items-center gap-3 py-2.5 hover:bg-bg -mx-2 px-2 rounded-md">
                <span className="label-mono w-[62px] shrink-0">{it.label ?? `${it.seq}회차`}</span>
                <Cover url={it.book.coverUrl} title={it.book.title} className="w-[36px]" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold truncate">{it.book.title}</span>
                  <span className="block text-[12px] text-muted truncate">{it.book.author}</span>
                </span>
                <StarValue value={it.avgRating} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <Label>모임 전체</Label>
          <Stat label="지금까지 읽은 책" value={stats.data ? `${stats.data.group.booksRead}권` : "–"} />
          <Stat label="전체 평균 별점" value={stats.data?.group.avgRating != null ? `★${stats.data.group.avgRating}` : "–"} star />
          <Stat label="평균 완독률" value={stats.data?.group.avgCompletionRate != null ? `${stats.data.group.avgCompletionRate}%` : "–"} />
        </Card>
        <Card>
          <Label>내 기록</Label>
          {identity && stats.data?.mine ? (
            <>
              <Stat label="내가 완독한 책" value={`${stats.data.mine.completedCount}권`} />
              <Stat label="내 평균 별점" value={stats.data.mine.avgRating != null ? `★${stats.data.mine.avgRating}` : "–"} star />
              <Stat label="내가 쓴 한줄평" value={`${stats.data.mine.reviewCount}개`} />
            </>
          ) : (
            <div className="text-[14px] text-muted">참여하거나 이어받으면 내 기록이 보여요.</div>
          )}
        </Card>
      </div>
      <Label>참석률·개근 지표는 만들지 않습니다 (D-6)</Label>
    </div>
  );
}

function Stat({ label, value, star }: { label: string; value: string; star?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[14px] text-ink-2">{label}</span>
      <span className={star && value !== "–" ? "text-[18px] font-bold text-star" : "text-[18px] font-bold"}>{value}</span>
    </div>
  );
}
