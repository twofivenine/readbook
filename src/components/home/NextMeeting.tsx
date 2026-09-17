"use client";
/** 다음 모임 — 시안의 검은 카드: 큰 날짜, 장소, 주소 복사/길찾기, 참석 명단(이름) */
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useWrite } from "@/lib/hooks";
import { rememberName, useClientStore } from "@/lib/clientStore";
import type { AttendanceStatus, RoundView } from "@/lib/types";
import { formatMeetingAt, isoToKstLocal, kstDayDiff, kstLocalToIso } from "@/lib/time";
import { useNowMinute } from "@/lib/useNow";
import { Button, Card, ErrorText, Label } from "@/components/ui";
import { clsx } from "@/lib/clsx";

const STATUS_LABEL: Record<AttendanceStatus, string> = { yes: "참석", no: "불참", undecided: "미정" };

export function NextMeeting({ round, editing, setEditing, highlight }: { round: RoundView | null; editing: boolean; setEditing: (v: boolean) => void; highlight: boolean }) {
  const meeting = round?.meetingAt ? formatMeetingAt(round.meetingAt) : null;
  const place = round?.place ?? null;
  const nowMinute = useNowMinute();
  const passed = !!round?.meetingAt && nowMinute > 0 && new Date(round.meetingAt).getTime() <= nowMinute * 60_000;
  const dday = round?.meetingAt && nowMinute > 0 ? kstDayDiff(new Date(round.meetingAt)) : null;
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
  const ddayText = dday === null ? "" : dday === 0 ? " · D-Day" : dday > 0 ? ` · D-${dday}` : ` · D+${-dday}`;

  return (
    <Card id="next-meeting" tone="dark" className="gap-4">
      <div className="flex justify-between items-center">
        <Label dark>다음 모임{ddayText}</Label>
        {round?.label && <Label dark>{round.label}</Label>}
      </div>
      {editing ? (
        <MeetingForm current={round?.meetingAt ?? null} onDone={() => setEditing(false)} />
      ) : meeting ? (
        <div className="display font-bold text-[24px] md:text-[30px] leading-[1.15]">{meeting.date}<br />{meeting.time}</div>
      ) : (
        <div className="display font-bold text-[20px] text-dark-muted">일정이 아직 없어요</div>
      )}
      {place ? (
        <div className="text-[14px] text-dark-muted">
          <span className="text-dark-text">{place.name}</span> · {place.address}
          {place.memo && <div className="text-[13px] mt-0.5">“{place.memo}”</div>}
        </div>
      ) : (
        <div className="text-[14px] text-dark-muted">장소 미정 · <Link href="/polls/place" className="text-dark-text underline underline-offset-4">장소 투표로 정해요</Link></div>
      )}
      {place && (
        <div className="flex gap-2">
          <button type="button" onClick={copyAddress} className="flex-1 rounded-full border border-dark-line px-3 py-2.5 text-[13.5px] text-center hover:border-dark-text transition-colors">{copied ? "복사됨" : "주소 복사"}</button>
          <a href={mapUrl!} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full bg-dark-text text-dark px-3 py-2.5 text-[13.5px] font-medium text-center hover:bg-white">길찾기</a>
        </div>
      )}

      <div className={clsx("rounded-lg bg-dark-2 p-4 flex flex-col gap-3 transition-shadow", highlight && "ring-2 ring-accent-line")}>
        <Label dark>내 참석 여부 · 이름을 적고 선택</Label>
        <AttendanceForm round={round} passed={passed} />
        <div className="text-[14px]">참석 {yes.length}명{yes.length > 0 && <span className="text-dark-muted"> · {yes.map((a) => a.name).join(", ")}</span>}</div>
        <div className="text-[12.5px] text-dark-muted">
          불참 {no.length}{no.length > 0 && ` (${no.map((a) => a.name).join(", ")})`} · 미정 {undecided.length}{undecided.length > 0 && ` (${undecided.map((a) => a.name).join(", ")})`}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {!editing && <button type="button" onClick={() => setEditing(true)} className="rounded-full border border-dark-line px-4 py-2 text-[13px] hover:border-dark-text transition-colors">{meeting ? "일정 수정" : "일정 등록"}</button>}
        <Link href="/polls/place" className="rounded-full border border-dark-line px-4 py-2 text-[13px] hover:border-dark-text transition-colors">
          장소 투표{round?.placePoll?.status === "open" && round.placePoll.candidates.length > 0 ? ` · 진행 중 (${round.placePoll.candidates.length}곳)` : ""}
        </Link>
      </div>
    </Card>
  );
}

const darkInput = "w-full rounded-lg border border-dark-line bg-dark px-3.5 py-2.5 text-[14px] text-dark-text placeholder:text-[#8f8d85] focus:border-dark-label";

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
    <div className="flex flex-col gap-2.5">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (비우면 익명)" maxLength={12} aria-label="이름" className={darkInput} />
      <div className="flex gap-1.5">
        {(["yes", "no", "undecided"] as const).map((s) => (
          <button key={s} type="button" disabled={busy || passed} onClick={() => save.mutate(s)} aria-pressed={mine?.status === s}
            className={clsx("flex-1 py-2 rounded-full border text-[13.5px] transition-colors disabled:opacity-50",
              mine?.status === s ? "bg-dark-text text-dark border-dark-text font-medium" : "border-dark-line hover:border-dark-text")}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {mine && !passed && <button type="button" className="self-start text-[12px] text-dark-muted hover:text-dark-text" disabled={busy} onClick={() => remove.mutate(undefined)}>내 응답 삭제</button>}
      {passed && <div className="text-[12.5px] text-dark-muted">모임일이 지나 참석 여부를 바꿀 수 없어요.</div>}
      <ErrorText>{save.error?.message ?? remove.error?.message}</ErrorText>
    </div>
  );
}

function MeetingForm({ current, onDone }: { current: string | null; onDone: () => void }) {
  const [value, setValue] = useState(current ? isoToKstLocal(current) : "");
  const save = useWrite((v: string) => api("/rounds/current/meeting", { method: "PUT", json: { meetingAt: kstLocalToIso(v) } }));
  return (
    <form className="flex flex-col gap-2.5" onSubmit={(e) => { e.preventDefault(); if (value) save.mutate(value, { onSuccess: onDone }); }}>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-dark-muted">모임 날짜·시간 (KST)</span>
        <input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} required className={clsx(darkInput, "[color-scheme:dark]")} />
      </label>
      <ErrorText>{save.error?.message}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" variant="light" className="flex-1" disabled={save.isPending || !value}>저장</Button>
        <button type="button" onClick={onDone} className="flex-1 rounded-full border border-dark-line px-4 py-2.5 text-[14px] hover:border-dark-text">취소</button>
      </div>
    </form>
  );
}
