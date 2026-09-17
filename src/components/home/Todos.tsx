"use client";
/** F-7 지금 할 일 — 시안: 첫 항목은 큰 강조 카드(녹색 테두리), 둘째는 한 줄 카드. 없으면 영역 숨김 */
import Link from "next/link";
import type { PollView, Todo } from "@/lib/types";
import { Card, Cover, DdayPill, Label, LinkButton, Title } from "@/components/ui";
import { clsx } from "@/lib/clsx";
import { monthWord } from "@/lib/time";

const TITLE: Record<Todo["kind"], string> = {
  place_vote: "모임 장소, 아직 안 고르셨어요",
  book_vote: "다음에 읽을 책, 아직 안 고르셨어요",
  attendance: "이번 모임, 오시나요?",
  schedule: "다음 모임 일정을 잡아 주세요",
};
const CTA: Record<Todo["kind"], string> = {
  place_vote: "장소 고르기",
  book_vote: "책 고르기",
  attendance: "참석 여부 알리기",
  schedule: "일정 등록하기",
};

const monthPrefix = (label: string | null | undefined) => (label ? `${monthWord(label)}에 읽을 책, 아직 안 고르셨어요` : TITLE.book_vote);

export function Todos({ todos, bookPoll, onSchedule, onAttendance }: { todos: Todo[]; bookPoll: PollView | null; onSchedule: () => void; onAttendance: () => void }) {
  if (todos.length === 0) return null;
  const [first, second] = todos;
  const href = (t: Todo) => (t.kind === "place_vote" ? "/polls/place" : t.kind === "book_vote" ? "/polls/book" : null);
  const onClick = (t: Todo) => (t.kind === "schedule" ? onSchedule : onAttendance);
  const covers = first.kind === "book_vote" ? bookPoll?.candidates.slice(0, 4) ?? [] : [];

  return (
    <div className="flex flex-col gap-3">
      <Card tone="accent" className="gap-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2"><span className="w-[7px] h-[7px] rounded-full bg-accent" /><Label accent>지금 할 일</Label></div>
            <Title size="lg">{first.kind === "book_vote" ? monthPrefix(bookPoll?.roundLabel) : TITLE[first.kind]}</Title>
            <div className="text-[14px] text-muted">{first.detail}</div>
          </div>
          <DdayPill dday={first.dday} />
        </div>
        {covers.length > 0 && (
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {covers.map((c) => (
              <div key={c.id} className="bg-white border border-line rounded-[10px] p-2 md:p-3.5 flex flex-col gap-2">
                <Cover url={c.book?.coverUrl ?? null} title={c.book?.title ?? ""} className="w-full" />
                <div className="hidden md:flex flex-col gap-0.5 min-w-0">
                  <div className="display font-medium text-[14px] truncate">{c.book?.title}</div>
                  <div className="text-[12px] text-mono truncate">{c.book?.author}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-[13px] text-muted">체크 수는 항상 공개 · 누가 눌렀는지는 기록하지 않아요</div>
          {href(first) ? (
            <LinkButton href={href(first)!} variant="primary" className="w-full sm:w-auto">{CTA[first.kind]}</LinkButton>
          ) : (
            <button type="button" onClick={onClick(first)} className="inline-flex items-center justify-center rounded-full bg-accent text-white px-5 py-2.5 text-[14px] font-medium display hover:bg-accent-deep w-full sm:w-auto">{CTA[first.kind]}</button>
          )}
        </div>
      </Card>
      {second && (
        (() => {
          const inner = (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 w-full">
              <div className="flex flex-col gap-0.5 text-left min-w-0">
                <div className="display font-bold text-[15px]">{TITLE[second.kind]}</div>
                <div className="text-[13px] text-muted">{second.detail}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0"><DdayPill dday={second.dday} /><span className="text-[13px] text-accent">{CTA[second.kind]} →</span></div>
            </div>
          );
          const cls = clsx("rounded-xl bg-card border border-line px-5 py-4 hover:border-accent transition-colors");
          return href(second) ? <Link href={href(second)!} className={cls}>{inner}</Link> : <button type="button" onClick={onClick(second)} className={cls}>{inner}</button>;
        })()
      )}
    </div>
  );
}
