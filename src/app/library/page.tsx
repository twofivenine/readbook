"use client";
/** 서재 — 지난 책 목록 (F-8.1) + 지난 책 직접 추가 */
import Link from "next/link";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useLibrary, useWrite } from "@/lib/hooks";
import { addMonths, thisMonthLabel } from "@/lib/time";
import { Button, Card, Cover, Divider, ErrorText, Input, Label, Title } from "@/components/ui";

export default function LibraryPage() {
  const lib = useLibrary();
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-col gap-4 max-w-[860px] mx-auto">
      <div className="flex justify-between items-center gap-3">
        <Title size="lg">서재</Title>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-mono">{lib.data?.length ?? 0}권</span>
          {!adding && <Button size="sm" onClick={() => setAdding(true)}>+ 지난 책 추가</Button>}
        </div>
      </div>
      {adding && <AddPastBookForm onDone={() => setAdding(false)} />}
      {lib.data?.length === 0 ? (
        <Card><div className="text-[14px] text-muted">아직 지난 책이 없어요. 다음 책이 확정되면 그 달이 지난 뒤 여기로 옮겨와요. 예전에 읽은 책은 ‘지난 책 추가’로 직접 올릴 수 있어요.</div></Card>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {lib.data?.map((it) => (
            <li key={it.roundId}>
              <Link href={`/library/${it.roundId}`} className="flex flex-col gap-2.5 rounded-xl bg-card border border-line p-3.5 hover:border-accent transition-colors h-full">
                <Cover url={it.book.coverUrl} title={it.book.title} className="w-full" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="label-mono tracking-normal!">{it.label} · {it.avgRating === null ? "–" : `★${it.avgRating}`}{it.ratingCount > 0 && ` (${it.ratingCount}명)`}</span>
                  <span className="display font-medium text-[14px] leading-snug line-clamp-2">{it.book.title}</span>
                  <span className="text-[12px] text-mono truncate">{it.book.author}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 지난 책 직접 추가: 읽은 달 + 제목·지은이·쪽수·표지 */
function AddPastBookForm({ onDone }: { onDone: () => void }) {
  const [label, setLabel] = useState(addMonths(thisMonthLabel(), -1));
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = useWrite(async () => {
    let coverKey: string | null = null;
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      coverKey = (await api<{ coverKey: string }>("/covers", { method: "POST", body: fd })).coverKey;
    }
    await api("/library", { method: "POST", json: { label, title, author, totalPages: Number(pages), coverKey } });
  });

  function pickFile(f: File | null) {
    setFileError(null);
    if (!f) { setFile(null); setPreview(null); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setFileError("JPEG, PNG, WebP 이미지만 올릴 수 있어요."); return; }
    if (f.size > 5 * 1024 * 1024) { setFileError("이미지는 5MB 이하여야 해요."); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  return (
    <Card className="gap-4">
      <Title size="sm">지난 책 추가</Title>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit.mutate(undefined, { onSuccess: onDone }); }}>
        <div className="flex gap-4">
          <button type="button" onClick={() => fileRef.current?.click()} className="w-[96px] shrink-0 rounded-md border border-dashed border-[#d3cec3] cover-placeholder flex flex-col items-center justify-center gap-1 overflow-hidden hover:border-accent" style={{ aspectRatio: "3 / 4" }} aria-label="표지 업로드">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="표지 미리보기" className="w-full h-full object-cover" />
            ) : (
              <>
                <span className="text-[13px] text-ink-2">표지</span>
                <span className="label-mono tracking-normal!">업로드 (선택)</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
          <div className="flex-1 flex flex-col gap-2">
            <label className="flex items-center gap-3 text-[13px] text-muted">
              <span className="w-[52px] shrink-0">읽은 달</span>
              <Input type="month" value={label} onChange={(e) => setLabel(e.target.value)} required aria-label="읽은 달" className="max-w-[180px]" />
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 *" maxLength={100} required aria-label="제목" />
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="지은이 *" maxLength={50} required aria-label="지은이" />
            <Input type="number" inputMode="numeric" min={1} max={9999} value={pages} onChange={(e) => setPages(e.target.value)} placeholder="총 쪽수 *" required aria-label="총 쪽수" />
          </div>
        </div>
        {preview && <button type="button" className="self-start text-[12px] text-mono hover:text-ink" onClick={() => { pickFile(null); if (fileRef.current) fileRef.current.value = ""; }}>표지 제거</button>}
        <ErrorText>{fileError}</ErrorText>
        <Divider />
        <Label>같은 달에 이미 책이 있으면 추가할 수 없어요 · 이번 달 이후로 넣으면 그 달에 이달의 책으로 올라와요</Label>
        <ErrorText>{submit.error?.message}</ErrorText>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" className="flex-1" disabled={submit.isPending || !title.trim() || !author.trim() || !pages || !label}>{submit.isPending ? "추가 중…" : "추가"}</Button>
          <Button type="button" className="flex-1" onClick={onDone}>취소</Button>
        </div>
      </form>
    </Card>
  );
}
