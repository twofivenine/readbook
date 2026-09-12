"use client";
/** S3 이달의 책 · 내 기록(진도/완독/별점) · 멤버 진도 (F-5) */
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import type { HomeView } from "@/lib/types";
import { Button, Card, Cover, Divider, ErrorText, Input, Label } from "@/components/ui";
import { clsx } from "@/lib/clsx";

type Round = NonNullable<HomeView["currentRound"]>;

export function BookOfMonth({ token, round, meId, memberCount }: { token: string; round: Round | null; meId: string | null; memberCount: number }) {
  const book = round?.book ?? null;
  if (!book) {
    return (
      <Card>
        <Label>이달의 책</Label>
        <div className="text-[18px] font-bold text-muted">아직 확정된 책이 없어요</div>
        <div className="text-[14px] text-muted">다음 책 투표를 마감하면 이달의 책이 정해져요.</div>
        <Link href={`/g/${token}/polls/book`} className="text-[15px] text-accent">다음 책 투표로 →</Link>
      </Card>
    );
  }
  const mine = round!.progresses.find((p) => p.memberId === meId) ?? null;
  return (
    <Card>
      <div className="flex gap-3">
        <Cover url={book.coverUrl} title={book.title} className="w-[72px]" />
        <div className="flex flex-col gap-1 min-w-0">
          <Label>{round?.label ? `${round.label} 이달의 책` : "이달의 책"}</Label>
          <div className="text-[18px] font-bold leading-tight">{book.title}</div>
          <div className="text-[14px] text-muted">{book.author} · {book.totalPages}쪽</div>
        </div>
      </div>

      <Divider />
      <MyRecord key={mine?.currentPage ?? -1} token={token} bookId={book.id} totalPages={book.totalPages} mine={mine} myRating={round!.ratings.mine} />

      <Divider />
      <div className="flex justify-between items-baseline">
        <Label>멤버 진도 (전원 공개)</Label>
        <span className="text-[13px] text-muted">
          {round!.completedCount}/{memberCount} 완독 · 평균 {round!.ratings.avg === null ? "–" : `★${round!.ratings.avg}`}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {round!.progresses.map((p) => (
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
  );
}

function MyRecord({ token, bookId, totalPages, mine, myRating }: { token: string; bookId: string; totalPages: number; mine: Round["progresses"][number] | null; myRating: number | null }) {
  const [page, setPage] = useState(mine ? String(mine.currentPage) : "");
  const progress = useWrite((body: { currentPage: number } | { completed: true }) => api(`/g/${token}/books/${bookId}/progress`, { method: "PUT", json: body }));
  const rate = useWrite((score: number | null) =>
    score === null ? api(`/g/${token}/books/${bookId}/rating`, { method: "DELETE" }) : api(`/g/${token}/books/${bookId}/rating`, { method: "PUT", json: { score } }),
  );
  const pct = mine?.percent ?? 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <Label>내 기록</Label>
        <span className="text-[12px] text-muted">쪽수로만 입력, %는 자동</span>
      </div>
      <div className="text-[15px]">
        <span className="font-bold tabular-nums">{mine?.currentPage ?? 0}</span> / {totalPages} · <span className="tabular-nums">{pct}%</span>
        {mine?.completed && <span className="ml-2 text-accent text-[13px] font-semibold">완독</span>}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(page);
          if (Number.isInteger(n)) progress.mutate({ currentPage: n });
        }}
      >
        <Input type="number" inputMode="numeric" min={0} max={totalPages} value={page} onChange={(e) => setPage(e.target.value)} placeholder="쪽수 입력" aria-label="현재 쪽수" className="flex-1" />
        <Button type="submit" disabled={progress.isPending || page === ""}>저장</Button>
        <Button type="button" variant="primary" disabled={progress.isPending || mine?.completed} onClick={() => progress.mutate({ completed: true })}>완독했어요</Button>
      </form>
      <ErrorText>{progress.error?.message}</ErrorText>
      <div className="flex items-center gap-2">
        <div className="flex" role="radiogroup" aria-label="별점">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={myRating === s}
              disabled={rate.isPending}
              onClick={() => rate.mutate(myRating === s ? null : s)}
              className={clsx("text-[26px] leading-none px-0.5", myRating !== null && s <= myRating ? "text-star" : "text-line hover:text-star/60")}
              aria-label={`${s}점`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-[12px] text-muted">1~5점 · 완독 전에도 가능{myRating !== null && " · 같은 별을 다시 누르면 삭제"}</span>
      </div>
      <ErrorText>{rate.error?.message}</ErrorText>
    </div>
  );
}
