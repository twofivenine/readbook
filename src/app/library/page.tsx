"use client";
/** 서재 — 지난 책 목록 (F-8.1). 시안 톤의 표지 그리드 */
import Link from "next/link";
import { useLibrary } from "@/lib/hooks";
import { Card, Cover, Title } from "@/components/ui";

export default function LibraryPage() {
  const lib = useLibrary();
  return (
    <div className="flex flex-col gap-4 max-w-[860px] mx-auto">
      <div className="flex justify-between items-baseline">
        <Title size="lg">서재</Title>
        <span className="text-[13px] text-mono">{lib.data?.length ?? 0}권</span>
      </div>
      {lib.data?.length === 0 ? (
        <Card><div className="text-[14px] text-muted">아직 지난 책이 없어요. 다음 책이 확정되면 이달의 책이 여기로 옮겨와요.</div></Card>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {lib.data?.map((it) => (
            <li key={it.roundId}>
              <Link href={`/library/${it.roundId}`} className="flex flex-col gap-2.5 rounded-xl bg-card border border-line p-3.5 hover:border-accent transition-colors h-full">
                <Cover url={it.book.coverUrl} title={it.book.title} className="w-full" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="label-mono tracking-normal!">{it.label ?? `${it.seq}회차`} · {it.avgRating === null ? "–" : `★${it.avgRating}`}{it.ratingCount > 0 && ` (${it.ratingCount}명)`}</span>
                  <span className="display font-medium text-[14px] leading-snug line-clamp-2">{it.book.title}</span>
                  <span className="text-[12px] text-mono truncate">{it.book.author}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
