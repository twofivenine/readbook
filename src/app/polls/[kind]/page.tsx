"use client";
/** 투표 상세 — 책·장소 공통. 후보 등록·삭제·체크·마감·재투표 (F-2, F-3) */
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";
import { api } from "@/lib/api";
import { usePoll, useWrite } from "@/lib/hooks";
import type { CandidateView, PollKind, PollView } from "@/lib/types";
import { formatDateTime } from "@/lib/time";
import { Button, Card, Cover, Divider, ErrorText, Input, Label } from "@/components/ui";
import { CheckButton } from "@/components/CheckButton";
import { clsx } from "@/lib/clsx";

export default function PollPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind: k } = use(params);
  if (k !== "book" && k !== "place") notFound();
  const kind = k as PollKind;
  const poll = usePoll(kind);
  if (poll.isLoading) return <div className="text-muted text-[14px]">불러오는 중…</div>;
  const p = poll.data ?? null;
  const unit = kind === "book" ? "권" : "곳";
  const limit = p?.candidateLimit ?? 10;

  return (
    <div className="flex flex-col gap-4 max-w-[640px] mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-[15px] text-muted hover:text-ink" aria-label="홈으로">←</Link>
        <Label>/polls/{kind}{p?.status === "closed" && " · 마감됨"}</Label>
      </div>
      {p?.status === "closed" ? (
        <ResultCard kind={kind} poll={p} />
      ) : (
        <>
          <div className="flex justify-between items-baseline">
            <h1 className="text-[22px] font-bold">{kind === "book" ? "다음 책 투표" : "모임 장소 투표"}</h1>
            <span className="label-mono text-accent!">진행 중</span>
          </div>
          <div className="text-[13px] text-muted">
            후보 {p?.candidates.length ?? 0}{unit} / 최대 {limit}{unit} · 후보마다 체크 1회(취소 가능) · 여러 후보 체크 가능 · 누가 눌렀는지는 기록하지 않음
          </div>
          <VotingCard kind={kind} poll={p} />
          {kind === "book" ? <BookCandidateEntry poll={p} /> : <PlaceCandidateForm poll={p} />}
        </>
      )}
    </div>
  );
}

function CandidateBody({ c }: { c: CandidateView }) {
  if (c.book) {
    return (
      <div className="flex gap-3 min-w-0 flex-1">
        <Cover url={c.book.coverUrl} title={c.book.title} className="w-[44px]" />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-bold leading-tight">{c.book.title}</div>
          <div className="text-[13px] text-muted">{c.book.author} · {c.book.totalPages}쪽</div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-0 flex-1">
      <div className="text-[16px] font-bold leading-tight">{c.place?.name}</div>
      <div className="text-[13px] text-muted">{c.place?.address}</div>
      {c.place?.memo && <div className="text-[13px] text-muted">“{c.place.memo}”</div>}
    </div>
  );
}

function VotingCard({ kind, poll }: { kind: PollKind; poll: PollView | null }) {
  const del = useWrite((id: string) => api(`/polls/${kind}/candidates/${id}`, { method: "DELETE" }));
  const close = useWrite(() => api(`/polls/${kind}/close`, { method: "POST" }));
  return (
    <Card>
      {!poll || poll.candidates.length === 0 ? (
        <div className="text-[14px] text-muted">아직 후보가 없어요. 아래에서 첫 후보를 등록해 주세요.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {poll.candidates.map((c) => {
            const on = poll.myChecks.includes(c.id);
            return (
              <li key={c.id} className={clsx("rounded-lg border-[1.5px] p-3 flex items-center gap-3", on ? "border-accent border-2 bg-accent-soft" : "border-line")}>
                <CheckButton kind={kind} candidateId={c.id} checked={on} size="lg" />
                <CandidateBody c={c} />
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[17px] font-bold tabular-nums">{c.checkCount}</span>
                  <button type="button" className="text-[12px] text-muted hover:text-danger" onClick={() => window.confirm("이 후보를 삭제할까요? 체크 수도 함께 사라져요.") && del.mutate(c.id)} aria-label="후보 삭제">삭제</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Label>후보 삭제는 누구나. 삭제하면 그 후보의 체크 수도 사라집니다 (F-2.4)</Label>
      <ErrorText>{del.error?.message ?? close.error?.message}</ErrorText>
      {poll && poll.candidates.length > 0 && (
        <>
          <Button variant="primary" disabled={close.isPending} onClick={() => window.confirm("투표를 마감하고 결과를 확정할까요? 동점이면 무작위로 1개를 뽑아요.") && close.mutate(undefined)}>마감하고 확정</Button>
          <Label>마감·마감 취소는 누구나 · 자동 마감 없음</Label>
        </>
      )}
    </Card>
  );
}

function ResultCard({ kind, poll }: { kind: PollKind; poll: PollView }) {
  const reopen = useWrite(() => api(`/polls/${kind}/reopen`, { method: "POST" }));
  const r = poll.result;
  const name = (c: CandidateView) => c.book?.title ?? c.place?.name ?? "";
  const sorted = [...poll.candidates].sort((a, b) => b.checkCount - a.checkCount);
  const month = poll.roundLabel ? `${Number(poll.roundLabel.split("-")[1])}월의 ` : "다음 ";
  return (
    <Card>
      <Label>{kind === "book" ? `${month}책으로 확정` : "모임 장소로 확정"}</Label>
      {r && (
        <div className="flex gap-3">
          {r.book && <Cover url={r.book.coverUrl} title={r.book.title} className="w-[64px]" />}
          <div>
            <div className="text-[22px] font-bold leading-tight">{name(r)}</div>
            <div className="text-[14px] text-muted">{r.book ? `${r.book.author} · ${r.book.totalPages}쪽` : r.place?.address} · 체크 {r.checkCount}</div>
          </div>
        </div>
      )}
      {poll.tieCandidates.length > 1 && (
        <div className="rounded-lg border-2 border-accent bg-accent-soft p-3 text-[14px]">
          <div className="font-bold text-accent">동점이어서 무작위로 뽑혔어요</div>
          <div className="text-ink-2 mt-0.5">동점 후보 · {poll.tieCandidates.map(name).join(", ")} (각 {poll.tieCandidates[0].checkCount})</div>
        </div>
      )}
      {poll.closedAt && <div className="text-[13px] text-muted">{formatDateTime(poll.closedAt)} 마감</div>}
      <Divider />
      <Label>최종 집계 (체크는 그대로 보관)</Label>
      <ul className="flex flex-col gap-1.5">
        {sorted.map((c) => (
          <li key={c.id} className="flex justify-between gap-3 text-[14px]">
            <span className={clsx("truncate", c.id === r?.id && "font-bold")}>{name(c)}</span>
            <span className="text-muted shrink-0 tabular-nums">{c.checkCount}</span>
          </li>
        ))}
      </ul>
      <ErrorText>{reopen.error?.message}</ErrorText>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={reopen.isPending} onClick={() => window.confirm("마감을 취소하고 투표를 다시 열까요? 확정 결과가 취소돼요.") && reopen.mutate(undefined)}>마감 취소</Button>
        <Button variant="primary" className="flex-1" disabled={reopen.isPending} onClick={() => window.confirm("재투표를 열까요? 체크는 유지되고 결과만 취소돼요.") && reopen.mutate(undefined)}>재투표 열기</Button>
      </div>
      <Label>결과에 이의가 있으면 누구나 재투표를 열 수 있어요 (F-2.14)</Label>
    </Card>
  );
}

function BookCandidateEntry({ poll }: { poll: PollView | null }) {
  const remaining = Math.max(0, (poll?.candidateLimit ?? 10) - (poll?.candidates.length ?? 0));
  return (
    <Link href="/polls/book/new" className="inline-flex items-center justify-center rounded-full border-[1.5px] border-line bg-white px-4 py-2.5 text-[15px] hover:border-ink">
      + 후보 등록 (남은 자리 {remaining})
    </Link>
  );
}

function PlaceCandidateForm({ poll }: { poll: PollView | null }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const add = useWrite(() => api("/polls/place/candidates", { method: "POST", json: { name, address, memo: memo || null } }));
  const full = (poll?.candidates.length ?? 0) >= (poll?.candidateLimit ?? 10);
  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <Button onClick={() => setOpen(true)}>+ 장소 후보 등록</Button>
        <Label>지도는 임베드하지 않고 카카오맵 링크로 이동 (F-3.6)</Label>
      </div>
    );
  }
  return (
    <Card>
      <div className="text-[16px] font-bold">장소 후보 등록</div>
      {full && <div className="text-[14px] text-danger">후보가 {poll?.candidateLimit}곳으로 찼어요. 기존 후보 1곳을 삭제해야 합니다.</div>}
      <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); add.mutate(undefined, { onSuccess: () => { setName(""); setAddress(""); setMemo(""); setOpen(false); } }); }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="장소명" maxLength={50} required aria-label="장소명" />
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소 (텍스트)" maxLength={200} required aria-label="주소" />
        <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="한 줄 메모 (선택)" maxLength={100} aria-label="메모" />
        <ErrorText>{add.error?.message}</ErrorText>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" className="flex-1" disabled={add.isPending || full}>등록</Button>
          <Button type="button" className="flex-1" onClick={() => setOpen(false)}>취소</Button>
        </div>
      </form>
    </Card>
  );
}
