/** TRD v1.1 §5.2 일정·참석 */
import type { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { normalizeName } from "@/lib/name";
import { getOrCreateHomeRound } from "./rounds";

export async function setMeeting(meetingAt: Date | null) {
  const round = await getOrCreateHomeRound();
  return prisma.round.update({ where: { id: round.id }, data: { meetingAt } });
}

/** 표시 월 수정 — 같은 달 회차가 이미 있으면 409 */
export async function setLabel(roundId: string | "current", label: string) {
  const round = roundId === "current" ? await getOrCreateHomeRound() : await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) throw errors.notFound("회차");
  const clash = await prisma.round.findUnique({ where: { label } });
  if (clash && clash.id !== round.id) throw errors.conflict("LABEL_TAKEN", `${label}에는 이미 다른 회차가 있어요.`);
  return prisma.round.update({ where: { id: round.id }, data: { label } });
}

async function openRound() {
  const round = await getOrCreateHomeRound();
  if (round.meetingAt && round.meetingAt.getTime() <= Date.now()) {
    throw errors.conflict("MEETING_PASSED", "이미 지난 모임이라 참석 여부를 바꿀 수 없어요.");
  }
  return round;
}

/** F-4.3, 4.5 내 응답 생성·수정 */
export async function setAttendance(clientId: string, name: string | null | undefined, status: AttendanceStatus) {
  const round = await openRound();
  const n = normalizeName(name);
  return prisma.attendance.upsert({
    where: { roundId_clientId: { roundId: round.id, clientId } },
    create: { roundId: round.id, clientId, name: n, status },
    update: { name: n, status },
  });
}

export async function deleteAttendance(clientId: string) {
  const round = await openRound();
  await prisma.attendance.deleteMany({ where: { roundId: round.id, clientId } });
}
