"use client";
/** 다음 모임 카드 (F-3.5, F-4): 일정·장소·참석 명단(이름) */
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import { rememberName, useClientStore } from "@/lib/clientStore";
import type { AttendanceStatus, RoundView } from "@/lib/types";
import { formatMeetingAt, isoToKstLocal, kstLocalToIso } from "@/lib/time";
import { useNowMinute } from "@/lib/useNow";
import { Button, Card, Divider, ErrorText, Input, Label, LinkButton, NameInput } from "@/components/ui";
import { clsx } from "@/lib/clsx";

const STATUS_LABEL: Record<AttendanceStatus, string> = { yes: "참석", no: "불참", undecided: "미정" };

export function NextMeeting({ round, editing, setEditing, highlight }: { round: RoundView | null; editing: boolean; setEditing: (v: boolean) => void; highlight: boolean }) {
  const meeting = round?.meetingAt ? formatMeetingAt(round.meetingAt) : null;
  const place = round?.place ?? null;
  const nowMinute = useNowMinute();
  const passed = !!round?.meetingAt && nowMinute > 0 && new Date(round.meetingAt).getTime() <= nowMinute * 60_000;
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
  const yes = round?.attendances.filter((a) => a.status === "yes") ?? [];
  const no = round?.attendances.filter((a) => a.status === "no") ?? [];
  const undecided = round?.attendances.filter((a) => a.status === "undecided") ?? [];

  return (
    <Card id="next-meeting">
      <div className="flex justify-between items-center">
        <Label>다음 모임</Label>
        {round?.label && <Label>{round.label}</Label>}
      </div>
      {editing ? (
        <MeetingForm current={round?.meetingAt ?? null} onDone={() => setEditing(false)} />
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
            <a href={mapUrl!} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center rounded-full border-[1.5px] border-line bg-white px-4 py-2.5 text-[15px] whitespace-nowrap hover:border-ink">카카오맵 열기</a>
          </div>
        </>
      ) : (
        <div className="text-[14px] text-muted">장소 미정 · 장소 투표로 정해요</div>
      )}

      <Divider />
      <div className={clsx("flex flex-col gap-2 rounded-md -m-1 p-1", highlight && "ring-2 ring-accent")}>
        <Label>내 참석 여부 (이름을 적고 선택)</Label>
        <AttendanceForm round={round} passed={passed} />
        <div className="text-[14px] text-ink-2">참석 {yes.length}명{yes.length > 0 && ` · ${yes.map((a) => a.name).join(", ")}`}</div>
        <div className="text-[13px] text-muted">
          불참 {no.length}{no.length > 0 && ` (${no.map((a) => a.name).join(", ")})`} · 미정 {undecided.length}{undecided.length > 0 && ` (${undecided.map((a) => a.name).join(", ")})`}
        </div>
      </div>

      <div className="flex gap-2">
        {!editing && <Button className="flex-1" onClick={() => setEditing(true)}>{meeting ? "일정 수정" : "일정 등록"}</Button>}
        <LinkButton href="/polls/place" className="flex-1">장소 투표 보기</LinkButton>
      </div>
      <Label>일정·장소는 누구나 수정 가능 · 알림은 없음</Label>
      {round?.placePoll?.status === "open" && round.placePoll.candidates.length > 0 && (
        <Link href="/polls/place" className="text-[13px] text-accent">장소 투표 진행 중 · 후보 {round.placePoll.candidates.length}곳 →</Link>
      )}
    </Card>
  );
}

function AttendanceForm({ round, passed }: { round: RoundView | null; passed: boolean }) {
  const store = useClientStore();
  const mine = round?.attendances.find((a) => a.mine) ?? null;
  const [name, setName] = useState(mine?.name ?? store?.lastName ?? "");
  const save = useWrite(async (status: AttendanceStatus) => {
    await api("/rounds/current/attendance", { method: "PUT", json: { name, status } });
    rememberName(name);
  });
  const remove = useWrite(() => api("/rounds/current/attendance", { method: "DELETE" }));
  const busy = save.isPending || remove.isPending;
  return (
    <div className="flex flex-col gap-2">
      <NameInput value={name} onChange={setName} />
      <div className="flex gap-1.5">
        {(["yes", "no", "undecided"] as const).map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy || passed}
            onClick={() => save.mutate(s)}
            aria-pressed={mine?.status === s}
            className={clsx("flex-1 py-2 rounded-full border-[1.5px] text-[15px] transition-colors disabled:opacity-50", mine?.status === s ? "border-2 border-accent text-accent bg-accent-soft font-semibold" : "border-line bg-white hover:border-ink")}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {mine && !passed && (
        <button type="button" className="self-start text-[12px] text-muted hover:text-danger" disabled={busy} onClick={() => remove.mutate(undefined)}>내 응답 삭제</button>
      )}
      {passed && <div className="text-[13px] text-muted">모임일이 지나 참석 여부를 바꿀 수 없어요.</div>}
      <ErrorText>{save.error?.message ?? remove.error?.message}</ErrorText>
    </div>
  );
}

function MeetingForm({ current, onDone }: { current: string | null; onDone: () => void }) {
  const [value, setValue] = useState(current ? isoToKstLocal(current) : "");
  const save = useWrite((v: string) => api("/rounds/current/meeting", { method: "PUT", json: { meetingAt: kstLocalToIso(v) } }));
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (value) save.mutate(value, { onSuccess: onDone }); }}>
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
