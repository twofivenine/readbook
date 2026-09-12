"use client";
/** S10 멤버 탭 (F-9): 닉네임 + 완독 수 + 평균 별점, 닉네임 수정, 초대 링크 복사·재발급 */
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { api } from "@/lib/api";
import { useMembers, useWrite } from "@/lib/hooks";
import { useIdentity } from "@/lib/identity";
import { Button, Card, ErrorText, Input, Label, StarValue } from "@/components/ui";

export default function MembersPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const members = useMembers(token);
  const { identity, setIdentity } = useIdentity();
  const [editing, setEditing] = useState(false);
  const [nick, setNick] = useState(identity?.nickname ?? "");
  const [copied, setCopied] = useState<string | null>(null);

  const rename = useWrite(async (nickname: string) => {
    const m = await api<{ id: string; nickname: string }>(`/g/${token}/members/me`, { method: "PATCH", json: { nickname } });
    if (identity) setIdentity({ ...identity, nickname: m.nickname });
  });

  const copy = useWrite(async () => {
    const r = await api<{ path: string }>(`/g/${token}/invite`);
    const url = `${window.location.origin}${r.path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied("복사됨");
    } catch {
      window.prompt("초대 링크를 복사하세요", url);
    }
    setTimeout(() => setCopied(null), 1500);
  });

  const rotate = useWrite(async () => {
    const r = await api<{ path: string; token: string }>(`/g/${token}/invite/rotate`, { method: "POST" });
    router.replace(r.path + "/members");
  });

  return (
    <div className="flex flex-col gap-4 max-w-[640px] mx-auto">
      <Label>/members · 멤버 탭</Label>
      <Card>
        <div className="flex justify-between items-baseline">
          <div className="text-[17px] font-bold">멤버</div>
          <span className="text-[14px] text-muted">{members.data?.length ?? 0} / 8</span>
        </div>
        <table className="w-full text-[14px]">
          <thead>
            <tr className="label-mono text-left">
              <th className="font-normal py-1">닉네임</th>
              <th className="font-normal py-1 text-right">완독</th>
              <th className="font-normal py-1 text-right">평균 별점</th>
            </tr>
          </thead>
          <tbody>
            {members.data?.map((m) => {
              const me = m.id === identity?.memberId;
              return (
                <tr key={m.id} className="border-t-[1.5px] border-dashed border-line">
                  <td className="py-2.5">
                    {me && editing ? (
                      <form
                        className="flex gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          rename.mutate(nick, { onSuccess: () => setEditing(false) });
                        }}
                      >
                        <Input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={12} autoFocus aria-label="새 닉네임" className="py-1.5" />
                        <Button type="submit" size="sm" variant="primary" disabled={rename.isPending || !nick.trim()}>저장</Button>
                        <Button type="button" size="sm" onClick={() => setEditing(false)}>취소</Button>
                      </form>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className={me ? "font-bold" : ""}>{me ? `나 (${m.nickname})` : m.nickname}</span>
                        {me && (
                          <button type="button" className="text-[12px] text-muted hover:text-ink" onClick={() => { setNick(m.nickname); setEditing(true); }}>· 닉네임 수정</button>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{m.completedCount}권</td>
                  <td className="py-2.5 text-right"><StarValue value={m.avgRating} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <ErrorText>{rename.error?.message}</ErrorText>
      </Card>

      <Card>
        <Label>초대 링크 (F-9.4)</Label>
        <div className="flex gap-2">
          <Button className="flex-1" disabled={copy.isPending} onClick={() => copy.mutate(undefined)}>{copied ?? "초대 링크 복사"}</Button>
          <Button
            className="flex-1"
            variant="danger"
            disabled={rotate.isPending}
            onClick={() =>
              window.confirm("초대 링크를 재발급할까요?\n\n기존 링크는 즉시 무효가 되고, 기존 멤버도 새 링크로 접속해야 해요. 저장된 멤버 정보는 유지되니 새 링크로 들어오면 자동으로 인식돼요.") && rotate.mutate(undefined)
            }
          >
            재발급
          </Button>
        </div>
        <ErrorText>{copy.error?.message ?? rotate.error?.message}</ErrorText>
        <Label>재발급하면 기존 링크는 무효 · 참석률은 표시하지 않음</Label>
      </Card>
    </div>
  );
}
