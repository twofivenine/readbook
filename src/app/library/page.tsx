"use client";
/** 서재 — 지난 책 목록 (F-8.1). 통계 없음 (F-8.3) */
import Link from "next/link";
import { useLibrary } from "@/lib/hooks";
import { Card, Cover, Label, StarValue } from "@/components/ui";

export default function LibraryPage() {
  const lib = useLibrary();
  return (
    <div className="flex flex-col gap-4 max-w-[640px] mx-auto">
      <Label>/library · 서재</Label>
      <Card>
        <div className="text-[17px] font-bold">지난 책</div>
        {lib.data?.length === 0 && <div className="text-[14px] text-muted">아직 지난 책이 없어요. 다음 책이 확정되면 이달의 책이 여기로 옮겨와요.</div>}
        <ul className="flex flex-col">
          {lib.data?.map((it) => (
            <li key={it.roundId} className="border-b-[1.5px] border-dashed border-line last:border-b-0">
              <Link href={`/library/${it.roundId}`} className="flex items-center gap-3 py-2.5 hover:bg-bg -mx-2 px-2 rounded-md">
                <span className="label-mono w-[62px] shrink-0">{it.label ?? `${it.seq}회차`}</span>
                <Cover url={it.book.coverUrl} title={it.book.title} className="w-[36px]" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold truncate">{it.book.title}</span>
                  <span className="block text-[12px] text-muted truncate">{it.book.author}</span>
                </span>
                <span className="text-right">
                  <StarValue value={it.avgRating} />
                  <span className="block text-[11px] text-muted">{it.ratingCount}명</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
