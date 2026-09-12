"use client";
/** `/` 모임 만들기 (F-1.1) */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import { saveIdentity } from "@/lib/identity";
import { Button, ErrorText, Input, Label } from "@/components/ui";

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cycleNote, setCycleNote] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ token: string; groupId: string; memberId: string; nickname: string }>("/groups", {
        method: "POST",
        json: { name, cycleNote: cycleNote || null, nickname },
      });
      saveIdentity({ groupId: r.groupId, memberId: r.memberId, nickname: r.nickname });
      router.push(`/g/${r.token}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "모임을 만들지 못했어요.");
      setBusy(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-card border-[1.5px] border-line rounded-[10px] overflow-hidden">
        <div className="px-4 py-2 border-b-[1.5px] border-line"><Label>/ · 모임 만들기</Label></div>
        <form onSubmit={submit} className="p-4 flex flex-col gap-4">
          <div>
            <h1 className="text-[22px] font-bold leading-tight">책읽는 밤</h1>
            <p className="text-[15px] text-ink-2 mt-1">카톡방에 흩어진 독서모임 운영을 한 곳에. 링크 하나로 시작해요.</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold">모임 이름 *</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="예: 목요 독서모임" required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold">주기 설명 <span className="font-normal text-muted">(선택)</span></span>
            <Input value={cycleNote} onChange={(e) => setCycleNote(e.target.value)} maxLength={100} placeholder="예: 매달 셋째 주 토요일 오후" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold">내 닉네임 *</span>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={12} placeholder="1~12자" required />
          </label>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" variant="primary" full disabled={busy}>모임 만들고 초대 링크 받기</Button>
          <div className="text-[13px] text-muted border-t-[1.5px] border-dashed border-line pt-3">
            로그인 없음 · 최대 8명 · 모임장 없음. 초대 링크만 있으면 누구나 참여해요.
          </div>
        </form>
      </div>
    </main>
  );
}
