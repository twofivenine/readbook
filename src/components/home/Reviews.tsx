"use client";
/** S4 한줄평 + 댓글 + 스포일러 (F-6) */
import { useState } from "react";
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import type { CommentView, ReviewView } from "@/lib/types";
import { relativeTime } from "@/lib/time";
import { Button, Card, Divider, ErrorText, Label, Textarea } from "@/components/ui";
import { Spoiler } from "@/components/Spoiler";

export function Reviews({ token, bookId, reviews, meId, readOnly }: { token: string; bookId: string | null; reviews: ReviewView[]; meId: string | null; readOnly?: boolean }) {
  return (
    <Card>
      <div className="flex justify-between items-baseline">
        <div className="text-[17px] font-bold">한줄평 {reviews.length}</div>
        <span className="text-[12px] text-muted">1인 여러 개 · 100자 · 댓글 200자</span>
      </div>
      {reviews.length === 0 && <div className="text-[14px] text-muted">아직 한줄평이 없어요. 첫 한줄평을 남겨 보세요.</div>}
      <ul className="flex flex-col gap-3">
        {reviews.map((r) => (
          <ReviewItem key={r.id} token={token} review={r} meId={meId} readOnly={readOnly} />
        ))}
      </ul>
      {bookId && !readOnly && (
        <>
          <Divider />
          <ReviewForm token={token} bookId={bookId} />
        </>
      )}
    </Card>
  );
}

function ReviewItem({ token, review, meId, readOnly }: { token: string; review: ReviewView; meId: string | null; readOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const own = review.authorId === meId;
  const del = useWrite(() => api(`/g/${token}/reviews/${review.id}`, { method: "DELETE" }));
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-bold">{own ? "나" : review.nickname}</span>
        <span className="text-[12px] text-muted">{relativeTime(review.createdAt)}</span>
      </div>
      {editing ? (
        <EditBody
          initial={review.body}
          initialSpoiler={review.spoiler}
          max={100}
          onSubmit={(body, spoiler) => api(`/g/${token}/reviews/${review.id}`, { method: "PATCH", json: { body, spoiler } })}
          onDone={() => setEditing(false)}
        />
      ) : (
        <Spoiler hidden={review.spoiler} className="text-[15px] leading-relaxed">{review.body}</Spoiler>
      )}
      <div className="flex gap-3 text-[13px] text-muted">
        <span>댓글 {review.comments.length}</span>
        {!readOnly && <button type="button" className="hover:text-ink" onClick={() => setReplying((v) => !v)}>답글 쓰기</button>}
        {own && !readOnly && !editing && (
          <>
            <button type="button" className="hover:text-ink" onClick={() => setEditing(true)}>수정</button>
            <button type="button" className="hover:text-danger" onClick={() => window.confirm("한줄평을 삭제할까요? 댓글도 함께 삭제돼요.") && del.mutate(undefined)}>삭제</button>
          </>
        )}
      </div>
      <ErrorText>{del.error?.message}</ErrorText>
      {(review.comments.length > 0 || replying) && (
        <div className="ml-3 pl-3 border-l-[1.5px] border-line flex flex-col gap-1.5">
          {review.comments.map((c) => (
            <CommentItem key={c.id} token={token} comment={c} meId={meId} readOnly={readOnly} />
          ))}
          {replying && (
            <EditBody
              initial=""
              initialSpoiler={false}
              max={200}
              placeholder="댓글 (200자, 대댓글 없음)"
              onSubmit={(body, spoiler) => api(`/g/${token}/reviews/${review.id}/comments`, { method: "POST", json: { body, spoiler } })}
              onDone={() => setReplying(false)}
            />
          )}
        </div>
      )}
    </li>
  );
}

function CommentItem({ token, comment, meId, readOnly }: { token: string; comment: CommentView; meId: string | null; readOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const own = comment.authorId === meId;
  const del = useWrite(() => api(`/g/${token}/comments/${comment.id}`, { method: "DELETE" }));
  return (
    <div className="text-[14px] flex flex-col gap-1">
      {editing ? (
        <EditBody
          initial={comment.body}
          initialSpoiler={comment.spoiler}
          max={200}
          onSubmit={(body, spoiler) => api(`/g/${token}/comments/${comment.id}`, { method: "PATCH", json: { body, spoiler } })}
          onDone={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold">{own ? "나" : comment.nickname}</span>
          <Spoiler hidden={comment.spoiler}>{comment.body}</Spoiler>
          {own && !readOnly && (
            <span className="text-[12px] text-muted flex gap-2">
              <span>·</span>
              <button type="button" className="hover:text-ink" onClick={() => setEditing(true)}>수정</button>
              <button type="button" className="hover:text-danger" onClick={() => del.mutate(undefined)}>삭제</button>
            </span>
          )}
        </div>
      )}
      <ErrorText>{del.error?.message}</ErrorText>
    </div>
  );
}

function ReviewForm({ token, bookId }: { token: string; bookId: string }) {
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const create = useWrite(() => api(`/g/${token}/books/${bookId}/reviews`, { method: "POST", json: { body, spoiler } }));
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate(undefined, { onSuccess: () => { setBody(""); setSpoiler(false); } });
      }}
    >
      <Label>한줄평 쓰기 (100자)</Label>
      <Textarea rows={2} maxLength={100} value={body} onChange={(e) => setBody(e.target.value)} placeholder="이 책, 한 줄로 말하면?" aria-label="한줄평" />
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} /> 스포일러 포함
        </label>
        <span className="text-[12px] text-muted tabular-nums">{Array.from(body).length}/100</span>
      </div>
      <ErrorText>{create.error?.message}</ErrorText>
      <Button type="submit" variant="primary" disabled={create.isPending || !body.trim()}>등록</Button>
    </form>
  );
}

function EditBody({ initial, initialSpoiler, max, placeholder, onSubmit, onDone }: {
  initial: string; initialSpoiler: boolean; max: number; placeholder?: string;
  onSubmit: (body: string, spoiler: boolean) => Promise<unknown>; onDone: () => void;
}) {
  const [body, setBody] = useState(initial);
  const [spoiler, setSpoiler] = useState(initialSpoiler);
  const save = useWrite(() => onSubmit(body, spoiler));
  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(undefined, { onSuccess: onDone });
      }}
    >
      <Textarea rows={2} maxLength={max} value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} autoFocus />
      <div className="flex items-center gap-3 text-[13px]">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} /> 스포일러
        </label>
        <span className="text-muted tabular-nums">{Array.from(body).length}/{max}</span>
        <span className="flex-1" />
        <Button type="button" size="sm" onClick={onDone}>취소</Button>
        <Button type="submit" size="sm" variant="primary" disabled={save.isPending || !body.trim()}>저장</Button>
      </div>
      <ErrorText>{save.error?.message}</ErrorText>
    </form>
  );
}
