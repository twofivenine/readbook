"use client";
/** 홈의 다음 책 투표 요약 — 체크 버튼 즉시 반영 + 상세 링크 */
import Link from "next/link";
import type { PollView } from "@/lib/types";
import { Card, Label } from "@/components/ui";
import { CheckButton } from "@/components/CheckButton";
import { clsx } from "@/lib/clsx";

export function BookPollSummary({ poll }: { poll: PollView | null }) {
  const open = poll?.status === "open";
  return (
    <Card>
      <div className="flex justify-between items-baseline">
        <div className="text-[17px] font-bold">다음 책 투표</div>
        {poll && <span className={clsx("label-mono", open && "text-accent!")}>{open ? "진행 중" : "마감됨"}</span>}
      </div>
      {!poll || poll.candidates.length === 0 ? (
        <div className="text-[14px] text-muted">아직 후보가 없어요. 첫 후보를 등록해 보세요.</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {poll.candidates.map((c) => {
            const on = poll.myChecks.includes(c.id);
            const isResult = poll.result?.id === c.id;
            return (
              <li key={c.id} className={clsx("flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-2", on ? "border-accent border-2 bg-accent-soft" : isResult ? "border-ink" : "border-line")}>
                <CheckButton kind="book" candidateId={c.id} checked={on} disabled={!open} />
                <span className="flex-1 truncate text-[15px]">{c.book?.title}{isResult && <span className="ml-1 text-[12px] text-accent">확정</span>}</span>
                <span className="text-[13px] text-muted tabular-nums">{c.checkCount}</span>
              </li>
            );
          })}
        </ul>
      )}
      <Label>체크 수는 항상 공개 · 누가 눌렀는지는 기록하지 않음</Label>
      <Link href="/polls/book" className="inline-flex items-center justify-center rounded-full border-[1.5px] border-line bg-white px-4 py-2.5 text-[15px] hover:border-ink">
        {open ? "후보 등록 · 마감하기" : "결과 보기 · 재투표"}
      </Link>
    </Card>
  );
}
