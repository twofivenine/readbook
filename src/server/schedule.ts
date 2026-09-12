/** TRD §5.2 회차·일정·참석 */
import type { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { getOrCreateHomeRound } from "./rounds";

export async function setMeeting(groupId: string, meetingAt: Date | null) {
  const round = await getOrCreateHomeRound(groupId);
  return prisma.round.update({ where: { id: round.id }, data: { meetingAt } });
}

export async function setLabel(groupId: string, label: string | null) {
  const round = await getOrCreateHomeRound(groupId);
  return prisma.round.update({ where: { id: round.id }, data: { label } });
}

/** F-4.5 모임일 전까지만 변경 */
export async function setAttendance(groupId: string, memberId: string, status: AttendanceStatus) {
  const round = await getOrCreateHomeRound(groupId);
  if (round.meetingAt && round.meetingAt.getTime() <= Date.now()) {
    throw errors.conflict("MEETING_PASSED", "이미 지난 모임이라 참석 여부를 바꿀 수 없어요.");
  }
  return prisma.attendance.upsert({
    where: { roundId_memberId: { roundId: round.id, memberId } },
    create: { roundId: round.id, memberId, status },
    update: { status },
  });
}
