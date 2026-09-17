"use client";
/** 다음 책 투표 요약 — 시안: 제목 + "투표함 ✓", 후보별 막대 + 체크 수, 안내 문구 */
import Link from "next/link";
import type { PollView } from "@/lib/types";
import { Bar, Card, Title } from "@/components/ui";
import { monthWord } from "@/lib/time";
import { CheckButton } from "@/components/CheckButton";
import { clsx } from "@/lib/clsx";


export function BookPollSummary({ poll }: { poll: PollView | null }) {
  const open = poll?.status === "open";
  const max = Math.max(1, ...(poll?.candidates.map((c) => c.checkCount) ?? [0]));
  const voted = (poll?.myChecks.length ?? 0) > 0;
  return (
    <Card className="gap-3.5">
      <div className="flex justify-between items-baseline gap-3">
        <Title size="sm">{poll ? `${monthWord(poll.roundLabel)} 책 투표` : "다음 책 투표"}</Title>
        {poll && (
          <span className={clsx("label-mono tracking-normal!", open && voted && "text-accent!")}>
            {!open ? "마감됨" : voted ? "투표함 ✓" : "진행 중"}
          </span>
        )}
      </div>
      {!poll || poll.candidates.length === 0 ? (
        <div className="text-[14px] text-muted">아직 후보가 없어요. 첫 후보를 추천해 보세요.</div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {poll.candidates.map((c) => {
            const on = poll.myChecks.includes(c.id);
            const isResult = poll.result?.id === c.id;
            return (
              <li key={c.id} className="flex items-center gap-3">
                <CheckButton kind="book" candidateId={c.id} checked={on} disabled={!open} />
                <span className={clsx("w-[96px] md:w-[120px] truncate text-[13.5px]", (on || isResult) && "font-medium")}>{c.book?.title}</span>
                <Bar ratio={c.checkCount / max} strong={on || isResult} />
                <span className={clsx("label-mono tracking-normal! w-8 text-right", (on || isResult) && "text-accent!")}>{c.checkCount}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex justify-between items-baseline gap-3 flex-wrap">
        <span className="text-[12.5px] text-mono">
          {!open ? "결과가 확정됐어요" : voted ? "마감 전까지 체크를 바꿀 수 있어요" : "후보마다 체크 1회 · 누가 눌렀는지는 기록하지 않아요"}
        </span>
        <Link href="/polls/book" className="text-[13px] text-accent">{open ? "후보 추천 · 마감 →" : "결과 보기 →"}</Link>
      </div>
    </Card>
  );
}
