"use client";
/** 투표 상세 — 책(S5/S6) · 장소(S7). 후보 등록·삭제·투표·마감·재투표 (F-2, F-3) */
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";
import { api } from "@/lib/api";
import { usePoll, useWrite } from "@/lib/hooks";
import { useIdentity } from "@/lib/identity";
import type { CandidateView, PollKind, PollView } from "@/lib/types";
import { formatDateTime } from "@/lib/time";
import { Button, Card, Cover, Divider, ErrorText, Input, Label } from "@/components/ui";
import { clsx } from "@/lib/clsx";

export default function PollPage({ params }: { params: Promise<{ token: string; kind: string }> }) {
  const { token, kind: k } = use(params);
  if (k !== "book" && k !== "place") notFound();
  const kind = k as PollKind;
  const poll = usePoll(token, kind);
  const { identity } = useIdentity();
  if (poll.isLoading) return <div className="text-muted text-[14px]">불러오는 중…</div>;
  const p = poll.data ?? null;
  const title = kind === "book" ? "다음 책 투표" : "모임 장소 투표";
  const unit = kind === "book" ? "권" : "곳";
  const limit = p?.candidateLimit ?? 10;

  return (
    <div className="flex flex-col gap-4 max-w-[640px] mx-auto">
      <div className="flex items-center gap-2">
        <Link href={`/g/${token}`} className="text-[15px] text-muted hover:text-ink" aria-label="홈으로">←</Link>
        <Label>/polls/{kind}{p?.status === "closed" && " · 마감됨"}</Label>
      </div>

      {p?.status === "closed" ? (
        <ResultCard token={token} kind={kind} poll={p} />
      ) : (
        <>
          <div className="flex justify-between items-baseline">
            <h1 className="text-[22px] font-bold">{title}</h1>
            <span className="label-mono text-accent!">진행 중</span>
          </div>
          <div className="text-[13px] text-muted">
            후보 {p?.candidates.length ?? 0}{unit} / 최대 {limit}{unit} · 내가 던질 수 있는 표 최대 {p?.voteLimit ?? 0}표 (= 현재 후보 수) · 같은 {kind === "book" ? "책" : "장소"} 중복 불가
          </div>
          <VotingCard key={p?.myCandidateIds.join(",") ?? ""} token={token} kind={kind} poll={p} meId={identity?.memberId ?? null} />
          {kind === "book" ? <BookCandidateEntry token={token} poll={p} /> : <PlaceCandidateForm token={token} poll={p} />}
        </>
      )}
    </div>
  );
}

/* ---------- 후보 카드 ---------- */
function CandidateBody({ c, meId }: { c: CandidateView; meId: string | null }) {
  const voters = c.voters.map((v) => (v.id === meId ? "나" : v.nickname)).join("·");
  if (c.book) {
    return (
      <div className="flex gap-3 min-w-0 flex-1">
        <Cover url={c.book.coverUrl} title={c.book.title} className="w-[44px]" />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-bold leading-tight">{c.book.title}</div>
          <div className="text-[13px] text-muted">{c.book.author} · {c.book.totalPages}쪽 · {c.proposedBy.nickname} 등록</div>
          <div className="text-[13px] text-ink-2 mt-1"><span className="font-semibold">{c.voteCount}표</span>{voters && <span className="text-muted"> · {voters}</span>}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-0 flex-1">
      <div className="text-[16px] font-bold leading-tight">{c.place?.name}</div>
      <div className="text-[13px] text-muted">{c.place?.address}</div>
      {c.place?.memo && <div className="text-[13px] text-muted">“{c.place.memo}”</div>}
      <div className="text-[13px] text-ink-2 mt-1"><span className="font-semibold">{c.voteCount}표</span>{voters && <span className="text-muted"> · {voters}</span>}</div>
    </div>
  );
}

/* ---------- 투표 (진행 중) ---------- */
function VotingCard({ token, kind, poll, meId }: { token: string; kind: PollKind; poll: PollView | null; meId: string | null }) {
  // 서버의 내 표가 바뀌면 부모가 key 로 리셋한다
  const [sel, setSel] = useState<string[]>(poll?.myCandidateIds ?? []);
  const save = useWrite((ids: string[]) => api(`/g/${token}/polls/${kind}/votes`, { method: "PUT", json: { candidateIds: ids } }));
  const del = useWrite((id: string) => api(`/g/${token}/polls/${kind}/candidates/${id}`, { method: "DELETE" }));
  const close = useWrite(() => api(`/g/${token}/polls/${kind}/close`, { method: "POST" }));
  const dirty = poll ? JSON.stringify([...sel].sort()) !== JSON.stringify([...poll.myCandidateIds].sort()) : false;
  const err = save.error?.message ?? del.error?.message ?? close.error?.message;

  return (
    <Card>
      {!poll || poll.candidates.length === 0 ? (
        <div className="text-[14px] text-muted">아직 후보가 없어요. 아래에서 첫 후보를 등록해 주세요.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {poll.candidates.map((c) => {
            const on = sel.includes(c.id);
            return (
              <li key={c.id} className={clsx("rounded-lg border-[1.5px] p-3 flex gap-2", on ? "border-accent border-2 bg-accent-soft" : "border-line")}>
                <button
                  type="button"
                  onClick={() => setSel((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                  className="flex gap-2 flex-1 text-left min-w-0"
                  aria-pressed={on}
                >
                  <span className={clsx("w-5 shrink-0 text-center text-[18px] leading-none pt-0.5", on ? "text-accent font-bold" : "text-line")}>✓</span>
                  <CandidateBody c={c} meId={meId} />
                </button>
                <button
                  type="button"
                  className="self-start text-[12px] text-muted hover:text-danger shrink-0"
                  onClick={() => window.confirm("이 후보를 삭제할까요? 후보에 들어간 표도 함께 사라져요.") && del.mutate(c.id)}
                  aria-label="후보 삭제"
                >
                  삭제
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Label>후보 삭제는 누구나. 삭제하면 그 후보의 표도 사라집니다 (F-2.4)</Label>
      <ErrorText>{err}</ErrorText>
      {poll && poll.candidates.length > 0 && (
        <>
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" disabled={!dirty || save.isPending} onClick={() => save.mutate(sel)}>
              내 표 저장 ({sel.length}표)
            </Button>
            <Button className="flex-1" disabled={close.isPending} onClick={() => window.confirm("투표를 마감하고 결과를 확정할까요? 동점이면 무작위로 1개를 뽑아요.") && close.mutate(undefined)}>
              마감
            </Button>
          </div>
          <Label>마감·마감 취소는 누구나 · 자동 마감 없음 · 기권 없음</Label>
        </>
      )}
    </Card>
  );
}

/* ---------- 확정 결과 (S6) ---------- */
function ResultCard({ token, kind, poll }: { token: string; kind: PollKind; poll: PollView }) {
  const reopen = useWrite(() => api(`/g/${token}/polls/${kind}/reopen`, { method: "POST" }));
  const r = poll.result;
  const name = (c: CandidateView) => c.book?.title ?? c.place?.name ?? "";
  const sorted = [...poll.candidates].sort((a, b) => b.voteCount - a.voteCount);
  const heading = kind === "book" ? `${poll.roundLabel ? labelMonth(poll.roundLabel) + " " : "다음 "}책으로 확정` : "모임 장소로 확정";
  return (
    <Card>
      <Label>{heading}</Label>
      {r && (
        <div className="flex gap-3">
          {r.book && <Cover url={r.book.coverUrl} title={r.book.title} className="w-[64px]" />}
          <div>
            <div className="text-[22px] font-bold leading-tight">{name(r)}</div>
            <div className="text-[14px] text-muted">
              {r.book ? `${r.book.author} · ${r.book.totalPages}쪽` : r.place?.address} · {r.voteCount}표
            </div>
          </div>
        </div>
      )}
      {poll.tieCandidates.length > 1 && (
        <div className="rounded-lg border-2 border-accent bg-accent-soft p-3 text-[14px]">
          <div className="font-bold text-accent">동점이어서 무작위로 뽑혔어요</div>
          <div className="text-ink-2 mt-0.5">
            동점 후보 · {poll.tieCandidates.map(name).join(", ")} (각 {poll.tieCandidates[0].voteCount}표)
          </div>
        </div>
      )}
      <div className="text-[13px] text-muted">
        {poll.closedBy?.nickname ?? "누군가"}님이 마감했습니다{poll.closedAt && ` · ${formatDateTime(poll.closedAt)}`}
      </div>
      <Divider />
      <Label>최종 집계 (표는 그대로 보관)</Label>
      <ul className="flex flex-col gap-1.5">
        {sorted.map((c) => (
          <li key={c.id} className="flex justify-between gap-3 text-[14px]">
            <span className={clsx("truncate", c.id === r?.id && "font-bold")}>{name(c)}</span>
            <span className="text-muted shrink-0">
              {c.voteCount}표{c.voters.length > 0 && <span className="text-[12px]"> · {c.voters.map((v) => v.nickname).join("·")}</span>}
            </span>
          </li>
        ))}
      </ul>
      <ErrorText>{reopen.error?.message}</ErrorText>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={reopen.isPending} onClick={() => window.confirm("마감을 취소하고 투표를 다시 열까요? 확정 결과가 취소돼요.") && reopen.mutate(undefined)}>마감 취소</Button>
        <Button variant="primary" className="flex-1" disabled={reopen.isPending} onClick={() => window.confirm("재투표를 열까요? 표는 유지되고 결과만 취소돼요.") && reopen.mutate(undefined)}>재투표 열기</Button>
      </div>
      <Label>결과에 이의가 있으면 누구나 재투표를 열 수 있어요 (F-2.16)</Label>
    </Card>
  );
}

function labelMonth(label: string) {
  const m = Number(label.split("-")[1]);
  return Number.isFinite(m) ? `${m}월의` : label;
}

/* ---------- 책 후보 등록 진입 (S8 로 이동) ---------- */
function BookCandidateEntry({ token, poll }: { token: string; poll: PollView | null }) {
  const count = poll?.candidates.length ?? 0;
  const limit = poll?.candidateLimit ?? 10;
  const remaining = Math.max(0, limit - count);
  return (
    <Link href={`/g/${token}/polls/book/new`} className="inline-flex items-center justify-center rounded-full border-[1.5px] border-line bg-white px-4 py-2.5 text-[15px] hover:border-ink">
      + 후보 등록 (남은 자리 {remaining})
    </Link>
  );
}

/* ---------- 장소 후보 등록 (S7 인라인 폼) ---------- */
function PlaceCandidateForm({ token, poll }: { token: string; poll: PollView | null }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [open, setOpen] = useState(false);
  const add = useWrite(() => api(`/g/${token}/polls/place/candidates`, { method: "POST", json: { name, address, memo: memo || null } }));
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
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate(undefined, { onSuccess: () => { setName(""); setAddress(""); setMemo(""); setOpen(false); } });
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="장소명" maxLength={50} required aria-label="장소명" />
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소 (텍스트)" maxLength={200} required aria-label="주소" />
        <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="한 줄 메모 (선택)" maxLength={100} aria-label="메모" />
        <ErrorText>{add.error?.message}</ErrorText>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" className="flex-1" disabled={add.isPending || full}>등록</Button>
          <Button type="button" className="flex-1" onClick={() => setOpen(false)}>취소</Button>
        </div>
      </form>
      <Label>지도는 임베드하지 않고 카카오맵 링크로 이동 (F-3.6)</Label>
    </Card>
  );
}
