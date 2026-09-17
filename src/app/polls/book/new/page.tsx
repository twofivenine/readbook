"use client";
/** 책 후보 등록 · 수기 입력 (F-9) + 후보 10권 초과 시 삭제 선택 (F-2.3) */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { usePoll, useWrite } from "@/lib/hooks";
import { Button, Card, Divider, ErrorText, Input, Label } from "@/components/ui";

export default function NewBookCandidatePage() {
  const router = useRouter();
  const poll = usePoll("book");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const limit = poll.data?.candidateLimit ?? 10;
  const full = (poll.data?.candidates.length ?? 0) >= limit;
  const closed = poll.data?.status === "closed";

  const submit = useWrite(async () => {
    let coverKey: string | null = null;
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      coverKey = (await api<{ coverKey: string }>("/covers", { method: "POST", body: fd })).coverKey;
    }
    await api("/polls/book/candidates", { method: "POST", json: { title, author, totalPages: Number(pages), coverKey } });
  });
  const del = useWrite((id: string) => api(`/polls/book/candidates/${id}`, { method: "DELETE" }));

  function pickFile(f: File | null) {
    setFileError(null);
    if (!f) { setFile(null); setPreview(null); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setFileError("JPEG, PNG, WebP 이미지만 올릴 수 있어요."); return; }
    if (f.size > 5 * 1024 * 1024) { setFileError("이미지는 5MB 이하여야 해요."); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  return (
    <div className="flex flex-col gap-4 max-w-[480px] mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/polls/book" className="text-[15px] text-muted hover:text-ink" aria-label="투표로">←</Link>
        <Label>후보 등록</Label>
      </div>
      {full ? (
        <Card>
          <div className="text-[18px] font-bold">기존 후보 1권을 삭제해야 합니다</div>
          <div className="text-[14px] text-muted">후보가 {limit}권으로 찼어요. 삭제할 후보를 고르세요. 그 후보의 체크 수도 함께 사라집니다.</div>
          <ul className="flex flex-col gap-1.5">
            {poll.data?.candidates.map((c) => (
              <li key={c.id}>
                <button type="button" disabled={del.isPending || closed} onClick={() => window.confirm(`"${c.book?.title}" 후보를 삭제할까요? 체크 ${c.checkCount}개가 함께 사라져요.`) && del.mutate(c.id)} className="w-full flex justify-between gap-3 rounded-lg border-[1.5px] border-line px-3 py-2.5 text-left hover:border-danger">
                  <span className="truncate text-[15px]">{c.book?.title}</span>
                  <span className="text-[13px] text-muted shrink-0">체크 {c.checkCount} · 삭제</span>
                </button>
              </li>
            ))}
          </ul>
          <ErrorText>{del.error?.message}</ErrorText>
          <Label>삭제하고 등록 계속 — 삭제 후 아래 폼이 열려요</Label>
        </Card>
      ) : (
        <Card>
          <h1 className="text-[20px] font-bold">책 후보 등록</h1>
          {closed && <div className="text-[14px] text-danger">투표가 마감되어 있어요. 재투표를 열면 등록할 수 있어요.</div>}
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); submit.mutate(undefined, { onSuccess: () => router.push("/polls/book") }); }}>
            <div className="flex gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="w-[96px] shrink-0 rounded-md border-[1.5px] border-dashed border-line bg-bg flex flex-col items-center justify-center gap-1 overflow-hidden hover:border-ink" style={{ aspectRatio: "2 / 3" }} aria-label="표지 업로드">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="표지 미리보기" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="label-mono">표지</span>
                    <span className="text-[12px] text-muted">업로드</span>
                    <span className="label-mono">(선택)</span>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
              <div className="flex-1 flex flex-col gap-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 *" maxLength={100} required aria-label="제목" />
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="지은이 *" maxLength={50} required aria-label="지은이" />
                <Input type="number" inputMode="numeric" min={1} max={9999} value={pages} onChange={(e) => setPages(e.target.value)} placeholder="총 쪽수 *" required aria-label="총 쪽수" />
              </div>
            </div>
            {preview && <button type="button" className="self-start text-[13px] text-muted hover:text-ink" onClick={() => { pickFile(null); if (fileRef.current) fileRef.current.value = ""; }}>표지 제거</button>}
            <ErrorText>{fileError}</ErrorText>
            <Divider />
            <div className="text-[12px] text-muted leading-relaxed">
              업로드한 표지의 저작권 책임은 업로더에게 있습니다. (F-9.4)<br />
              외부 도서 API 연동 없음 — 직접 입력합니다. JPEG/PNG/WebP · 5MB 이하 · 자동 리사이즈
            </div>
            <ErrorText>{submit.error?.message}</ErrorText>
            <Button type="submit" variant="primary" full disabled={submit.isPending || closed || !title.trim() || !author.trim() || !pages}>{submit.isPending ? "등록 중…" : "후보로 등록"}</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
