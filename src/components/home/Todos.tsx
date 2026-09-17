"use client";
/** F-7 지금 할 일 — 최대 2개, 없으면 영역 숨김 */
import Link from "next/link";
import type { Todo } from "@/lib/types";
import { DdayBadge, Label } from "@/components/ui";
import { clsx } from "@/lib/clsx";

const TITLE: Record<Todo["kind"], string> = {
  place_vote: "모임 장소 투표하기",
  book_vote: "다음 책 후보 투표하기",
  attendance: "모임 참석 여부 알리기",
  schedule: "다음 모임 일정 잡기",
};

export function Todos({ todos, onSchedule, onAttendance }: { todos: Todo[]; onSchedule: () => void; onAttendance: () => void }) {
  if (todos.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <Label accent>● 지금 할 일</Label>
      {todos.map((t, i) => {
        const inner = (
          <div className="flex justify-between items-center gap-3 w-full">
            <div className="flex flex-col gap-0.5 text-left">
              <div className="text-[17px] font-bold">{TITLE[t.kind]}</div>
              <div className="text-[14px] text-muted">{t.detail}</div>
            </div>
            <DdayBadge dday={t.dday} accent={i === 0} />
          </div>
        );
        const cls = clsx("rounded-[9px] p-3 bg-card border-[1.5px] hover:bg-bg transition-colors", i === 0 ? "border-2 border-accent" : "border-ink");
        if (t.kind === "place_vote" || t.kind === "book_vote") {
          return <Link key={t.kind} href={`/polls/${t.kind === "place_vote" ? "place" : "book"}`} className={cls}>{inner}</Link>;
        }
        return <button key={t.kind} type="button" className={cls} onClick={t.kind === "schedule" ? onSchedule : onAttendance}>{inner}</button>;
      })}
    </div>
  );
}
