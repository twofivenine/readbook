"use client";
/** S1 진입·닉네임 화면 (F-1.3~1.8). 모달로 열리며, 쓰기 액션 게이트에서도 재사용 */
import { useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import { useIdentity } from "@/lib/identity";
import type { HomeView } from "@/lib/types";
import { Button, Chip, Divider, ErrorText, Input, Label } from "./ui";
import { useQueryClient } from "@tanstack/react-query";

const MAX_MEMBERS = 8;

export function JoinGate({ token, home }: { token: string; home: HomeView | undefined }) {
  const { gateOpen } = useIdentity();
  if (!gateOpen || !home) return null;
  return <JoinGateBody token={token} home={home} />;
}

function JoinGateBody({ token, home }: { token: string; home: HomeView }) {
  const { closeGate, setIdentity, gateReason } = useIdentity();
  const qc = useQueryClient();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const full = home.group.memberCount >= MAX_MEMBERS;

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const m = await api<{ id: string; nickname: string; groupId: string }>(`/g/${token}/members`, { method: "POST", json: { nickname } });
      setIdentity({ groupId: m.groupId, memberId: m.id, nickname: m.nickname });
      qc.invalidateQueries();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "참여에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  function takeOver(memberId: string, nick: string) {
    // TRD §2.3: 서버 호출 없이 공개 멤버 목록의 memberId 를 저장
    setIdentity({ groupId: home.group.id, memberId, nickname: nick });
    qc.invalidateQueries();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6" role="dialog" aria-modal="true" aria-labelledby="join-title">
      <div className="w-full md:max-w-[400px] max-h-[92vh] overflow-y-auto bg-card rounded-t-2xl md:rounded-2xl">
        <div className="px-4 py-2 border-b-[1.5px] border-line flex justify-between items-center">
          <Label>/g/… · 초대 링크 진입</Label>
          <button type="button" onClick={closeGate} className="text-[13px] text-muted hover:text-ink px-2 py-1" aria-label="닫기">닫기</button>
        </div>
        <div className="p-4 flex flex-col gap-3.5">
          <h2 id="join-title" className="text-[22px] font-bold leading-tight">
            {home.group.name}에<br />초대받았어요
          </h2>
          <div className="text-[15px] text-ink-2">멤버 {home.group.memberCount} / {MAX_MEMBERS} · 닉네임만 있으면 참여</div>
          {gateReason && <div className="text-[13px] text-danger">{gateReason}</div>}

          <form onSubmit={join} className="border-[1.5px] border-ink rounded-lg p-3 flex flex-col gap-2.5">
            <div className="text-[16px] font-bold">새로 참여</div>
            {full ? (
              <div className="text-[14px] text-danger">정원이 찼습니다. 열람만 가능해요. (F-1.7)</div>
            ) : (
              <>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임 (1~12자)"
                  maxLength={12}
                  autoFocus
                  aria-label="닉네임"
                />
                <Label>이미 쓰는 닉네임이면 오류 (F-1.6)</Label>
                <ErrorText>{error}</ErrorText>
                <Button type="submit" variant="primary" full disabled={busy || !nickname.trim()}>
                  참여하기
                </Button>
              </>
            )}
          </form>

          <div className="border-[1.5px] border-line rounded-lg p-3 flex flex-col gap-2">
            <div className="text-[16px] font-bold">기존 멤버로 이어받기</div>
            <Label>기기를 바꿨거나 저장이 지워진 경우 (F-1.5)</Label>
            {home.group.members.length === 0 ? (
              <div className="text-[14px] text-muted">아직 멤버가 없어요.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {home.group.members.map((m) => (
                  <Chip key={m.id} onClick={() => takeOver(m.id, m.nickname)}>{m.nickname}</Chip>
                ))}
              </div>
            )}
          </div>

          <Divider />
          <div className="text-[14px] text-muted">닉네임 없이도 모든 화면을 볼 수 있어요. 투표·기록을 누르면 이 화면이 뜹니다. (F-1.8)</div>
        </div>
      </div>
    </div>
  );
}
