"use client";
/** 홈의 다음 책 투표 요약 (S11 우측 하단) — 빠른 투표 + 상세 링크 */
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import type { PollView } from "@/lib/types";
import { Button, Card, ErrorText, Label } from "@/components/ui";
import { clsx } from "@/lib/clsx";

export function BookPollSummary({ token, poll }: { token: string; poll: PollView | null }) {
  return <BookPollSummaryBody key={poll?.myCandidateIds.join(",") ?? ""} token={token} poll={poll} />;
}

function BookPollSummaryBody({ token, poll }: { token: string; poll: PollView | null }) {
  const [sel, setSel] = useState<string[]>(poll?.myCandidateIds ?? []);
  const save = useWrite((ids: string[]) => api(`/g/${token}/polls/book/votes`, { method: "PUT", json: { candidateIds: ids } }));
  const dirty = poll ? JSON.stringify([...sel].sort()) !== JSON.stringify([...poll.myCandidateIds].sort()) : false;

  return (
    <Card>
      <div className="flex justify-between items-baseline">
        <div className="text-[17px] font-bold">다음 책 투표</div>
        {poll && (
          <span className={clsx("label-mono", poll.status === "open" && "text-accent!")}>
            {poll.status === "open" ? `진행 중 · 최대 ${poll.voteLimit}표` : "마감됨"}
          </span>
        )}
      </div>
      {!poll || poll.candidates.length === 0 ? (
        <div className="text-[14px] text-muted">아직 후보가 없어요. 첫 후보를 등록해 보세요.</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {poll.candidates.map((c) => {
            const on = sel.includes(c.id);
            const isResult = poll.result?.id === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={poll.status !== "open"}
                  onClick={() => setSel((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                  className={clsx(
                    "w-full flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-2 text-left transition-colors disabled:cursor-default",
                    on ? "border-accent border-2 bg-accent-soft" : isResult ? "border-ink" : "border-line",
                  )}
                  aria-pressed={on}
                >
                  <span className={clsx("w-5 text-center", on ? "text-accent font-bold" : "text-line")}>✓</span>
                  <span className="flex-1 truncate text-[15px]">{c.book?.title}{isResult && <span className="ml-1 text-[12px] text-accent">확정</span>}</span>
                  <span className="text-[13px] text-muted tabular-nums">{c.voteCount}표</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Label>투표자 닉네임은 상세에서 · 집계는 항상 공개</Label>
      <ErrorText>{save.error?.message}</ErrorText>
      <div className="flex gap-2">
        {poll?.status === "open" && poll.candidates.length > 0 && (
          <Button variant="primary" className="flex-1" disabled={!dirty || save.isPending} onClick={() => save.mutate(sel)}>
            내 표 저장{sel.length > 0 && ` (${sel.length}표)`}
          </Button>
        )}
        <Link href={`/g/${token}/polls/book`} className="flex-1 inline-flex items-center justify-center rounded-full border-[1.5px] border-line bg-white px-4 py-2.5 text-[15px] hover:border-ink">
          투표 상세
        </Link>
      </div>
    </Card>
  );
}
