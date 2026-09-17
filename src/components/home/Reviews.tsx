"use client";
/** 한줄평 (F-6): 이름 + 100자 + 스포일러. 같은 브라우저에서만 수정·삭제. 댓글 없음 */
import { useState } from "react";
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import { rememberName, useClientStore } from "@/lib/clientStore";
import type { ReviewView } from "@/lib/types";
import { relativeTime } from "@/lib/time";
import { Button, Card, Divider, ErrorText, Label, NameInput, Textarea } from "@/components/ui";
import { Spoiler } from "@/components/Spoiler";

export function Reviews({ bookId, reviews, readOnly }: { bookId: string; reviews: ReviewView[]; readOnly?: boolean }) {
  return (
    <Card>
      <div className="flex justify-between items-baseline">
        <div className="text-[17px] font-bold">한줄평 {reviews.length}</div>
        <span className="text-[12px] text-muted">여러 개 가능 · 100자</span>
      </div>
      {reviews.length === 0 && <div className="text-[14px] text-muted">아직 한줄평이 없어요.{!readOnly && " 첫 한줄평을 남겨 보세요."}</div>}
      <ul className="flex flex-col gap-3">
        {reviews.map((r) => <ReviewItem key={r.id} review={r} readOnly={readOnly} />)}
      </ul>
      {!readOnly && (
        <>
          <Divider />
          <ReviewForm bookId={bookId} />
        </>
      )}
    </Card>
  );
}

function ReviewItem({ review, readOnly }: { review: ReviewView; readOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const del = useWrite(() => api(`/reviews/${review.id}`, { method: "DELETE" }));
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-bold">{review.name}</span>
        <span className="text-[12px] text-muted">{relativeTime(review.createdAt)}</span>
        {review.mine && <span className="label-mono">내 글</span>}
      </div>
      {editing ? (
        <EditReview review={review} onDone={() => setEditing(false)} />
      ) : (
        <Spoiler hidden={review.spoiler} className="text-[15px] leading-relaxed">{review.body}</Spoiler>
      )}
      {review.mine && !readOnly && !editing && (
        <div className="flex gap-3 text-[13px] text-muted">
          <button type="button" className="hover:text-ink" onClick={() => setEditing(true)}>수정</button>
          <button type="button" className="hover:text-danger" onClick={() => window.confirm("한줄평을 삭제할까요?") && del.mutate(undefined)}>삭제</button>
        </div>
      )}
      <ErrorText>{del.error?.message}</ErrorText>
    </li>
  );
}

function ReviewForm({ bookId }: { bookId: string }) {
  const store = useClientStore();
  const [name, setName] = useState(store?.lastName ?? "");
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const create = useWrite(async () => {
    await api(`/books/${bookId}/reviews`, { method: "POST", json: { name, body, spoiler } });
    rememberName(name);
  });
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); create.mutate(undefined, { onSuccess: () => { setBody(""); setSpoiler(false); } }); }}>
      <Label>한줄평 쓰기 (100자)</Label>
      <NameInput value={name} onChange={setName} />
      <Textarea rows={2} maxLength={100} value={body} onChange={(e) => setBody(e.target.value)} placeholder="이 책, 한 줄로 말하면?" aria-label="한줄평" />
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} /> 스포일러 포함</label>
        <span className="text-[12px] text-muted tabular-nums">{Array.from(body).length}/100</span>
      </div>
      <ErrorText>{create.error?.message}</ErrorText>
      <Button type="submit" variant="primary" disabled={create.isPending || !body.trim()}>등록</Button>
    </form>
  );
}

function EditReview({ review, onDone }: { review: ReviewView; onDone: () => void }) {
  const [name, setName] = useState(review.name);
  const [body, setBody] = useState(review.body);
  const [spoiler, setSpoiler] = useState(review.spoiler);
  const save = useWrite(() => api(`/reviews/${review.id}`, { method: "PATCH", json: { name, body, spoiler } }));
  return (
    <form className="flex flex-col gap-1.5" onSubmit={(e) => { e.preventDefault(); save.mutate(undefined, { onSuccess: onDone }); }}>
      <NameInput value={name} onChange={setName} />
      <Textarea rows={2} maxLength={100} value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
      <div className="flex items-center gap-3 text-[13px]">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} /> 스포일러</label>
        <span className="text-muted tabular-nums">{Array.from(body).length}/100</span>
        <span className="flex-1" />
        <Button type="button" size="sm" onClick={onDone}>취소</Button>
        <Button type="submit" size="sm" variant="primary" disabled={save.isPending || !body.trim()}>저장</Button>
      </div>
      <ErrorText>{save.error?.message}</ErrorText>
    </form>
  );
}
