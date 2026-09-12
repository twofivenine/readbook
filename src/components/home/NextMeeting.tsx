"use client";
/** S2 다음 모임 카드 (F-3.5, F-4) */
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import type { AttendanceStatus, HomeView } from "@/lib/types";
import { formatMeetingAt, isoToKstLocal, kstLocalToIso } from "@/lib/time";
import { useNowMinute } from "@/lib/useNow";
import { Button, Card, Divider, ErrorText, Input, Label, LinkButton } from "@/components/ui";
import { clsx } from "@/lib/clsx";

type Round = NonNullable<HomeView["currentRound"]>;

export function NextMeeting({
  token, round, meId, editing, setEditing, attendanceHighlight,
}: { token: string; round: Round | null; meId: string | null; editing: boolean; setEditing: (v: boolean) => void; attendanceHighlight: boolean }) {
  const meeting = round?.meetingAt ? formatMeetingAt(round.meetingAt) : null;
  const place = round?.place ?? null;
  const nowMinute = useNowMinute();
  const passed = round?.meetingAt && nowMinute > 0 ? new Date(round.meetingAt).getTime() <= nowMinute * 60_000 : false;

  const attend = useWrite((status: AttendanceStatus) => api(`/g/${token}/rounds/current/attendance`, { method: "PUT", json: { status } }));
  const mine = round?.attendances.find((a) => a.memberId === meId)?.status ?? null;
  const yes = round?.attendances.filter((a) => a.status === "yes") ?? [];
  const no = round?.attendances.filter((a) => a.status === "no").length ?? 0;
  const undecided = round?.attendances.filter((a) => a.status === "undecided").length ?? 0;
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!place) return;
    try {
      await navigator.clipboard.writeText(place.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("주소를 복사하세요", place.address);
    }
  }
  const mapUrl = place ? `https://map.kakao.com/link/search/${encodeURIComponent(`${place.name} ${place.address}`)}` : null;

  return (
    <Card>
      <div className="flex justify-between items-center">
        <Label>다음 모임</Label>
        {round?.label && <Label>{round.label}</Label>}
      </div>

      {editing ? (
        <MeetingForm token={token} current={round?.meetingAt ?? null} onDone={() => setEditing(false)} />
      ) : meeting ? (
        <div className="text-[24px] font-bold leading-[1.15]">{meeting.date}<br />{meeting.time}</div>
      ) : (
        <div className="text-[18px] font-bold text-muted">일정이 아직 없어요</div>
      )}

      {place ? (
        <>
          <div>
            <div className="text-[16px] text-ink-2">{place.name}</div>
            <div className="text-[14px] text-muted">{place.address}</div>
            {place.memo && <div className="text-[14px] text-muted">“{place.memo}”</div>}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={copyAddress}>{copied ? "복사됨" : "주소 복사"}</Button>
            <a href={mapUrl!} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center rounded-full border-[1.5px] border-line bg-white px-4 py-2.5 text-[15px] whitespace-nowrap hover:border-ink">
              카카오맵 열기
            </a>
          </div>
        </>
      ) : (
        <div className="text-[14px] text-muted">장소 미정 · 장소 투표로 정해요</div>
      )}

      <Divider />
      <div className={clsx("flex flex-col gap-2 rounded-md -m-1 p-1", attendanceHighlight && "ring-2 ring-accent")}>
        <Label>내 참석 여부 (F-4.3)</Label>
        <div className="flex gap-1.5">
          {(["yes", "no", "undecided"] as const).map((s) => (
            <button
              key={s}
              type="button"
              disabled={attend.isPending || passed}
              onClick={() => attend.mutate(s)}
              className={clsx(
                "flex-1 py-2 rounded-full border-[1.5px] text-[15px] transition-colors disabled:opacity-50",
                mine === s ? "border-2 border-accent text-accent bg-accent-soft font-semibold" : "border-line bg-white hover:border-ink",
              )}
              aria-pressed={mine === s}
            >
              {s === "yes" ? "참석" : s === "no" ? "불참" : "미정"}
            </button>
          ))}
        </div>
        {passed && <div className="text-[13px] text-muted">모임일이 지나 참석 여부를 바꿀 수 없어요.</div>}
        <ErrorText>{attend.error?.message}</ErrorText>
        <div className="text-[14px] text-ink-2">
          참석 {yes.length}명{yes.length > 0 && ` · ${yes.map((a) => a.nickname).join(", ")}`}
        </div>
        <div className="text-[13px] text-muted">불참 {no} · 미정 {undecided}</div>
      </div>

      <div className="flex gap-2">
        {!editing && <Button className="flex-1" onClick={() => setEditing(true)}>{meeting ? "일정 수정" : "일정 등록"}</Button>}
        <LinkButton href={`/g/${token}/polls/place`} className="flex-1">장소 투표 보기</LinkButton>
      </div>
      <Label>일정·장소는 멤버 누구나 수정 가능 · 알림은 없음</Label>
      {round?.placePoll?.status === "open" && (
        <Link href={`/g/${token}/polls/place`} className="text-[13px] text-accent">장소 투표 진행 중 · 후보 {round.placePoll.candidates.length}곳 →</Link>
      )}
    </Card>
  );
}

function MeetingForm({ token, current, onDone }: { token: string; current: string | null; onDone: () => void }) {
  const [value, setValue] = useState(current ? isoToKstLocal(current) : "");
  const save = useWrite((v: string | null) => api(`/g/${token}/rounds/current/meeting`, { method: "PUT", json: { meetingAt: v ? kstLocalToIso(v) : null } }));
  useEffect(() => {
    if (save.isSuccess) onDone();
  }, [save.isSuccess, onDone]);
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value) save.mutate(value);
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-[14px] font-semibold">모임 날짜·시간 (KST)</span>
        <Input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} required />
      </label>
      <ErrorText>{save.error?.message}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" className="flex-1" disabled={save.isPending || !value}>저장</Button>
        <Button type="button" className="flex-1" onClick={onDone}>취소</Button>
      </div>
    </form>
  );
}
