"use client";
/** 이달의 책 — 시안: 표지 + 제목 + 별점 행 + (한줄평은 같은 카드 하단 섹션) */
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import { rememberName, useClientStore } from "@/lib/clientStore";
import type { BookView, RatingsSummary, RoundView, UpcomingRound } from "@/lib/types";
import { monthWord } from "@/lib/time";
import { Button, Card, Cover, Divider, ErrorText, Input, Label, NameInput, StarPicker, Title } from "@/components/ui";
import { ReviewsSection } from "./Reviews";

function Upcoming({ upcoming }: { upcoming: UpcomingRound[] }) {
  if (upcoming.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <Label>미리 정해진 책</Label>
      <ul className="flex flex-col gap-2">
        {upcoming.map((u) => (
          <li key={u.id} className="flex items-center gap-3 text-[13.5px]">
            <Cover url={u.book.coverUrl} title={u.book.title} className="w-[28px]" />
            <span className="label-mono tracking-normal! w-[36px]">{monthWord(u.label)}</span>
            <span className="truncate">{u.book.title}</span>
            <span className="text-mono truncate hidden sm:inline">· {u.book.author}</span>
          </li>
        ))}
      </ul>
      <div className="text-[12px] text-mono">그 달이 되면 이달의 책으로 올라와요</div>
    </div>
  );
}

export function BookOfMonth({ round, upcoming, thisMonth }: { round: RoundView | null; upcoming: UpcomingRound[]; thisMonth: string }) {
  const book = round?.book ?? null;
  const [editing, setEditing] = useState(false);
  if (!book) {
    return (
      <Card className="gap-4">
        <Title>{monthWord(thisMonth)}의 책</Title>
        <div className="text-[15px] text-muted">
          {upcoming.length > 0 ? "이번 달 책은 아직 없어요." : "아직 확정된 책이 없어요. 다음 책 투표를 마감하면 여기에 표시돼요."}
        </div>
        <Link href="/polls/book" className="text-[14px] text-accent">다음 책 투표로 →</Link>
        {upcoming.length > 0 && <Divider />}
        <Upcoming upcoming={upcoming} />
      </Card>
    );
  }
  const r = round!.ratings;
  return (
    <Card id="book-of-month" className="gap-5">
      <div className="flex justify-between items-baseline gap-3">
        <Title>{monthWord(round!.label)}의 책</Title>
        <span className="text-[13px] text-mono">{r.count}명 별점 · 평균 {r.avg === null ? "–" : r.avg.toFixed(1)}</span>
      </div>
      {editing ? (
        <BookEditForm book={book} roundId={round!.id} label={round!.label} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex gap-4 md:gap-5">
          <Cover url={book.coverUrl} title={book.title} className="w-[84px] md:w-[104px]" />
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="display font-medium text-[17px] md:text-[19px] leading-snug">{book.title}</div>
              <div className="text-[13px] text-mono">{book.author} · {book.totalPages}쪽</div>
            </div>
            <RatingSection bookId={book.id} ratings={r} />
            <button type="button" className="self-start text-[12px] text-mono hover:text-ink" onClick={() => setEditing(true)}>책 정보 수정</button>
          </div>
        </div>
      )}
      {r.list.length > 0 && (
        <>
          <Divider />
          <div className="flex flex-col gap-2.5">
            <Label>별점</Label>
            <ul className="flex flex-col gap-2">
              {r.list.map((x, i) => (
                <li key={i} className="flex items-center gap-3 text-[14px]">
                  <span className={x.mine ? "w-[52px] font-medium" : "w-[52px]"}>{x.mine ? "나" : x.name}</span>
                  <span className="flex-1 h-1.5 rounded-full bg-line-soft overflow-hidden"><span className="block h-full rounded-full bg-accent" style={{ width: `${x.score * 20}%` }} /></span>
                  <span className="w-[52px] text-right text-[13px] text-ink-2">★ {x.score}.0</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <Divider />
      <ReviewsSection bookId={book.id} reviews={round!.reviews} />
      {upcoming.length > 0 && (
        <>
          <Divider />
          <Upcoming upcoming={upcoming} />
        </>
      )}
    </Card>
  );
}

export function RatingSection({ bookId, ratings }: { bookId: string; ratings: RatingsSummary }) {
  const store = useClientStore();
  const mineRow = ratings.list.find((r) => r.mine) ?? null;
  const [name, setName] = useState(mineRow?.name ?? store?.lastName ?? "");
  const rate = useWrite(async (score: number) => {
    await api(`/books/${bookId}/rating`, { method: "PUT", json: { name, score } });
    rememberName(name);
  });
  const remove = useWrite(() => api(`/books/${bookId}/rating`, { method: "DELETE" }));
  return (
    <div className="flex flex-col gap-2">
      <Label>내 별점 · 이름을 적고 별을 누르세요</Label>
      <div className="flex flex-wrap items-center gap-3">
        <NameInput value={name} onChange={setName} className="max-w-[180px]" />
        <StarPicker value={ratings.mine} onChange={(s) => rate.mutate(s)} disabled={rate.isPending || remove.isPending} />
        {ratings.mine !== null && <button type="button" className="text-[12px] text-mono hover:text-danger" onClick={() => remove.mutate(undefined)}>내 별점 삭제</button>}
      </div>
      <ErrorText>{rate.error?.message ?? remove.error?.message}</ErrorText>
    </div>
  );
}

function BookEditForm({ book, roundId, label, onDone }: { book: BookView; roundId: string; label: string; onDone: () => void }) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [pages, setPages] = useState(String(book.totalPages));
  const [month, setMonth] = useState(label);
  const save = useWrite(async () => {
    await api(`/books/${book.id}`, { method: "PATCH", json: { title, author, totalPages: Number(pages) } });
    if (month !== label) await api(`/rounds/${roundId}/label`, { method: "PATCH", json: { label: month } });
  });
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); save.mutate(undefined, { onSuccess: onDone }); }}>
      <Label>책 정보 수정 · 누구나</Label>
      <label className="flex items-center gap-3 text-[13px] text-muted">
        <span className="w-[52px] shrink-0">읽는 달</span>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required aria-label="읽는 달" className="max-w-[180px]" />
      </label>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="제목" required aria-label="제목" />
      <Input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={50} placeholder="지은이" required aria-label="지은이" />
      <Input type="number" inputMode="numeric" min={1} max={9999} value={pages} onChange={(e) => setPages(e.target.value)} placeholder="총 쪽수" required aria-label="총 쪽수" />
      <ErrorText>{save.error?.message}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" className="flex-1" disabled={save.isPending}>저장</Button>
        <Button type="button" className="flex-1" onClick={onDone}>취소</Button>
      </div>
    </form>
  );
}
