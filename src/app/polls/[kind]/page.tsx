"use client";
/** 투표 상세 — 시안: 후보 행(라디오형 체크 + 표지 + 제목), 점선 "후보 추천" 박스, 녹색 CTA */
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";
import { api } from "@/lib/api";
import { usePoll, useWrite } from "@/lib/hooks";
import type { CandidateView, PollKind, PollView } from "@/lib/types";
import { formatDateTime } from "@/lib/time";
import { Bar, Button, Card, Cover, Divider, ErrorText, Input, Label, Title } from "@/components/ui";
import { CheckButton } from "@/components/CheckButton";
import { clsx } from "@/lib/clsx";

function monthWord(label: string | null | undefined, kind: PollKind) {
  if (kind === "place") return "모임 장소 투표";
  const m = label ? Number(label.split("-")[1]) : NaN;
  return Number.isFinite(m) ? `${m}월 책 투표` : "다음 책 투표";
}

export default function PollPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind: k } = use(params);
  if (k !== "book" && k !== "place") notFound();
  const kind = k as PollKind;
  const poll = usePoll(kind);
  if (poll.isLoading) return <div className="text-muted text-[14px]">불러오는 중…</div>;
  const p = poll.data ?? null;
  const unit = kind === "book" ? "권" : "곳";

  return (
    <div className="flex flex-col gap-4 max-w-[640px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[17px] text-muted hover:text-ink" aria-label="홈으로">←</Link>
        <Title>{monthWord(p?.roundLabel, kind)}</Title>
      </div>
      {p?.status === "closed" ? (
        <ResultCard kind={kind} poll={p} />
      ) : (
        <>
          <div className="flex justify-between items-baseline gap-3">
            <div className="text-[13.5px] text-muted">후보마다 체크 1회 · 여러 {unit} 체크 가능 · 마감 전까지 취소 가능</div>
            <span className="label-mono tracking-normal! text-accent! whitespace-nowrap">{p?.candidates.length ?? 0}/{p?.candidateLimit ?? 10}{unit}</span>
          </div>
          <VotingList kind={kind} poll={p} />
          {kind === "book" ? <BookCandidateEntry poll={p} /> : <PlaceCandidateForm poll={p} />}
          {p && p.candidates.length > 0 && <CloseButton kind={kind} />}
          <div className="text-[12px] text-mono text-center">체크 수는 항상 공개 · 누가 눌렀는지는 기록하지 않음 · 마감·마감 취소는 누구나</div>
        </>
      )}
    </div>
  );
}

function CandidateBody({ c }: { c: CandidateView }) {
  if (c.book) {
    return (
      <>
        <Cover url={c.book.coverUrl} title={c.book.title} className="w-[46px]" />
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <div className="display font-medium text-[14.5px] leading-snug">{c.book.title}</div>
          <div className="text-[12px] text-mono">{c.book.author} · {c.book.totalPages}쪽</div>
        </div>
      </>
    );
  }
  return (
    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
      <div className="display font-medium text-[14.5px] leading-snug">{c.place?.name}</div>
      <div className="text-[12px] text-mono">{c.place?.address}{c.place?.memo && ` · “${c.place.memo}”`}</div>
    </div>
  );
}

function VotingList({ kind, poll }: { kind: PollKind; poll: PollView | null }) {
  const del = useWrite((id: string) => api(`/polls/${kind}/candidates/${id}`, { method: "DELETE" }));
  if (!poll || poll.candidates.length === 0) {
    return <div className="rounded-xl bg-card border border-line p-5 text-[14px] text-muted">아직 후보가 없어요. 아래에서 첫 후보를 추천해 주세요.</div>;
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {poll.candidates.map((c) => {
        const on = poll.myChecks.includes(c.id);
        return (
          <li key={c.id} className={clsx("rounded-[10px] border p-3 flex items-center gap-3", on ? "bg-accent-soft border-accent" : "bg-card border-line")}>
            <CheckButton kind={kind} candidateId={c.id} checked={on} size="lg" />
            <CandidateBody c={c} />
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={clsx("label-mono tracking-normal! text-[13px]", on && "text-accent!")}>{c.checkCount}표</span>
              <button type="button" className="text-[11px] text-mono hover:text-danger" onClick={() => window.confirm("이 후보를 삭제할까요? 체크 수도 함께 사라져요.") && del.mutate(c.id)} aria-label="후보 삭제">삭제</button>
            </div>
          </li>
        );
      })}
      <ErrorText>{del.error?.message}</ErrorText>
    </ul>
  );
}

function CloseButton({ kind }: { kind: PollKind }) {
  const close = useWrite(() => api(`/polls/${kind}/close`, { method: "POST" }));
  return (
    <div className="flex flex-col gap-2">
      <Button variant="primary" full disabled={close.isPending} onClick={() => window.confirm("투표를 마감하고 결과를 확정할까요? 동점이면 무작위로 1개를 뽑아요.") && close.mutate(undefined)}>마감하고 확정</Button>
      <ErrorText>{close.error?.message}</ErrorText>
    </div>
  );
}

function ResultCard({ kind, poll }: { kind: PollKind; poll: PollView }) {
  const reopen = useWrite(() => api(`/polls/${kind}/reopen`, { method: "POST" }));
  const r = poll.result;
  const name = (c: CandidateView) => c.book?.title ?? c.place?.name ?? "";
  const sorted = [...poll.candidates].sort((a, b) => b.checkCount - a.checkCount);
  const max = Math.max(1, ...sorted.map((c) => c.checkCount));
  return (
    <Card tone="accent" className="gap-5">
      <Label accent>{kind === "book" ? "확정된 책" : "확정된 장소"}{poll.closedAt && ` · ${formatDateTime(poll.closedAt)} 마감`}</Label>
      {r && (
        <div className="flex gap-4">
          {r.book && <Cover url={r.book.coverUrl} title={r.book.title} className="w-[72px]" />}
          <div className="flex flex-col gap-1">
            <div className="display font-bold text-[22px] leading-tight">{name(r)}</div>
            <div className="text-[13.5px] text-muted">{r.book ? `${r.book.author} · ${r.book.totalPages}쪽` : r.place?.address} · 체크 {r.checkCount}</div>
          </div>
        </div>
      )}
      {poll.tieCandidates.length > 1 && (
        <div className="rounded-lg bg-white border border-accent-line p-3.5 text-[13.5px]">
          <div className="font-medium text-accent">동점이어서 무작위로 뽑혔어요</div>
          <div className="text-muted mt-0.5">동점 후보 · {poll.tieCandidates.map(name).join(", ")} (각 {poll.tieCandidates[0].checkCount}표)</div>
        </div>
      )}
      <Divider />
      <Label>최종 집계 · 체크는 그대로 보관</Label>
      <ul className="flex flex-col gap-2.5">
        {sorted.map((c) => (
          <li key={c.id} className="flex items-center gap-3 text-[13.5px]">
            <span className={clsx("w-[110px] md:w-[160px] truncate", c.id === r?.id && "font-medium")}>{name(c)}</span>
            <Bar ratio={c.checkCount / max} strong={c.id === r?.id} />
            <span className={clsx("label-mono tracking-normal! w-8 text-right", c.id === r?.id && "text-accent!")}>{c.checkCount}</span>
          </li>
        ))}
      </ul>
      <ErrorText>{reopen.error?.message}</ErrorText>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={reopen.isPending} onClick={() => window.confirm("마감을 취소하고 투표를 다시 열까요? 확정 결과가 취소돼요.") && reopen.mutate(undefined)}>마감 취소</Button>
        <Button variant="primary" className="flex-1" disabled={reopen.isPending} onClick={() => window.confirm("재투표를 열까요? 체크는 유지되고 결과만 취소돼요.") && reopen.mutate(undefined)}>재투표 열기</Button>
      </div>
      <div className="text-[12px] text-mono text-center">결과에 이의가 있으면 누구나 재투표를 열 수 있어요</div>
    </Card>
  );
}

function BookCandidateEntry({ poll }: { poll: PollView | null }) {
  const limit = poll?.candidateLimit ?? 10;
  const remaining = Math.max(0, limit - (poll?.candidates.length ?? 0));
  return (
    <Link href="/polls/book/new" className="rounded-[10px] border border-dashed border-[#d3cec3] p-3.5 text-center text-[13.5px] text-mono hover:border-accent hover:text-accent transition-colors">
      + 후보 추천하기 (최대 {limit}권 · 남은 자리 {remaining})
    </Link>
  );
}

function PlaceCandidateForm({ poll }: { poll: PollView | null }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const add = useWrite(() => api("/polls/place/candidates", { method: "POST", json: { name, address, memo: memo || null } }));
  const limit = poll?.candidateLimit ?? 10;
  const full = (poll?.candidates.length ?? 0) >= limit;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-[10px] border border-dashed border-[#d3cec3] p-3.5 text-center text-[13.5px] text-mono hover:border-accent hover:text-accent transition-colors">
        + 장소 후보 추천하기 (최대 {limit}곳)
      </button>
    );
  }
  return (
    <Card>
      <Title size="sm">장소 후보 추천</Title>
      {full && <div className="text-[13.5px] text-danger">후보가 {limit}곳으로 찼어요. 기존 후보 1곳을 삭제해야 합니다.</div>}
      <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); add.mutate(undefined, { onSuccess: () => { setName(""); setAddress(""); setMemo(""); setOpen(false); } }); }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="장소명" maxLength={50} required aria-label="장소명" />
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소 (텍스트)" maxLength={200} required aria-label="주소" />
        <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="한 줄 메모 (선택)" maxLength={100} aria-label="메모" />
        <ErrorText>{add.error?.message}</ErrorText>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" className="flex-1" disabled={add.isPending || full}>추천</Button>
          <Button type="button" className="flex-1" onClick={() => setOpen(false)}>취소</Button>
        </div>
      </form>
      <div className="text-[12px] text-mono">지도는 임베드하지 않고 카카오맵 링크로 이동해요</div>
    </Card>
  );
}
