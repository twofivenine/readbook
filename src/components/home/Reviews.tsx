"use client";
/** 한줄평 (F-6) — 시안: 아바타 원 + "이름 본문" 한 줄. 같은 브라우저에서만 수정·삭제 */
import { useState } from "react";
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import { rememberName, useClientStore } from "@/lib/clientStore";
import type { ReviewView } from "@/lib/types";
import { relativeTime } from "@/lib/time";
import { Button, Card, ErrorText, Label, NameInput, Textarea } from "@/components/ui";
import { Spoiler } from "@/components/Spoiler";
import { clsx } from "@/lib/clsx";

/** 카드 안에 넣는 섹션 형태 */
export function ReviewsSection({ bookId, reviews, readOnly }: { bookId: string; reviews: ReviewView[]; readOnly?: boolean }) {
  const [writing, setWriting] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-baseline">
        <Label>한줄평 {reviews.length}</Label>
        {!readOnly && !writing && <button type="button" className="text-[13px] text-accent" onClick={() => setWriting(true)}>+ 한줄평 쓰기</button>}
      </div>
      {reviews.length === 0 && !writing && <div className="text-[14px] text-muted">아직 한줄평이 없어요.{!readOnly && " 첫 한줄평을 남겨 보세요."}</div>}
      <ul className="flex flex-col gap-3">
        {reviews.map((r) => <ReviewItem key={r.id} review={r} readOnly={readOnly} />)}
      </ul>
      {writing && <ReviewForm bookId={bookId} onDone={() => setWriting(false)} />}
    </div>
  );
}

/** 독립 카드 형태 (지난 책 상세) */
export function Reviews({ bookId, reviews, readOnly }: { bookId: string; reviews: ReviewView[]; readOnly?: boolean }) {
  return (
    <Card>
      <ReviewsSection bookId={bookId} reviews={reviews} readOnly={readOnly} />
    </Card>
  );
}

function Avatar({ name, mine }: { name: string; mine: boolean }) {
  return (
    <div className={clsx("w-[26px] h-[26px] shrink-0 rounded-full flex items-center justify-center text-[11px]", mine ? "border-[1.5px] border-accent bg-accent-soft text-accent" : "bg-[#e6e2d9] border border-[#ded9cf] text-ink-2")} aria-hidden>
      {Array.from(name)[0]}
    </div>
  );
}

function ReviewItem({ review, readOnly }: { review: ReviewView; readOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const del = useWrite(() => api(`/reviews/${review.id}`, { method: "DELETE" }));
  return (
    <li className="flex gap-3">
      <Avatar name={review.name} mine={review.mine} />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {editing ? (
          <EditReview review={review} onDone={() => setEditing(false)} />
        ) : (
          <div className="text-[14px] leading-[1.55] text-[#3d3b35]">
            <span className="font-medium text-ink mr-1.5">{review.name}</span>
            <Spoiler hidden={review.spoiler}>{review.body}</Spoiler>
          </div>
        )}
        <div className="flex gap-3 text-[12px] text-mono">
          <span>{relativeTime(review.createdAt)}</span>
          {review.mine && !readOnly && !editing && (
            <>
              <button type="button" className="hover:text-ink" onClick={() => setEditing(true)}>수정</button>
              <button type="button" className="hover:text-danger" onClick={() => window.confirm("한줄평을 삭제할까요?") && del.mutate(undefined)}>삭제</button>
            </>
          )}
        </div>
        <ErrorText>{del.error?.message}</ErrorText>
      </div>
    </li>
  );
}

function ReviewForm({ bookId, onDone }: { bookId: string; onDone: () => void }) {
  const store = useClientStore();
  const [name, setName] = useState(store?.lastName ?? "");
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const create = useWrite(async () => {
    await api(`/books/${bookId}/reviews`, { method: "POST", json: { name, body, spoiler } });
    rememberName(name);
  });
  return (
    <form className="flex flex-col gap-2 rounded-lg bg-card-soft border border-line p-3.5" onSubmit={(e) => { e.preventDefault(); create.mutate(undefined, { onSuccess: onDone }); }}>
      <NameInput value={name} onChange={setName} className="max-w-[180px]" />
      <Textarea rows={2} maxLength={100} value={body} onChange={(e) => setBody(e.target.value)} placeholder="이 책, 한 줄로 말하면? (100자)" aria-label="한줄평" autoFocus />
      <div className="flex items-center gap-3 text-[13px]">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} /> 스포일러 포함</label>
        <span className="text-mono tabular-nums">{Array.from(body).length}/100</span>
        <span className="flex-1" />
        <Button type="button" size="sm" onClick={onDone}>취소</Button>
        <Button type="submit" size="sm" variant="primary" disabled={create.isPending || !body.trim()}>등록</Button>
      </div>
      <ErrorText>{create.error?.message}</ErrorText>
    </form>
  );
}

function EditReview({ review, onDone }: { review: ReviewView; onDone: () => void }) {
  const [name, setName] = useState(review.name);
  const [body, setBody] = useState(review.body);
  const [spoiler, setSpoiler] = useState(review.spoiler);
  const save = useWrite(() => api(`/reviews/${review.id}`, { method: "PATCH", json: { name, body, spoiler } }));
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); save.mutate(undefined, { onSuccess: onDone }); }}>
      <NameInput value={name} onChange={setName} className="max-w-[180px]" />
      <Textarea rows={2} maxLength={100} value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
      <div className="flex items-center gap-3 text-[13px]">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} /> 스포일러</label>
        <span className="text-mono tabular-nums">{Array.from(body).length}/100</span>
        <span className="flex-1" />
        <Button type="button" size="sm" onClick={onDone}>취소</Button>
        <Button type="submit" size="sm" variant="primary" disabled={save.isPending || !body.trim()}>저장</Button>
      </div>
      <ErrorText>{save.error?.message}</ErrorText>
    </form>
  );
}
