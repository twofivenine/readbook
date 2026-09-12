"use client";
/** 홈 탭 — 모바일 단일 컬럼 / 데스크톱 2열 (S2~S4, S11) */
import { use, useState } from "react";
import { useHome } from "@/lib/hooks";
import { useIdentity } from "@/lib/identity";
import { Todos } from "@/components/home/Todos";
import { NextMeeting } from "@/components/home/NextMeeting";
import { BookOfMonth } from "@/components/home/BookOfMonth";
import { Reviews } from "@/components/home/Reviews";
import { BookPollSummary } from "@/components/home/BookPollSummary";

export default function HomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const home = useHome(token);
  const { identity } = useIdentity();
  const [editingMeeting, setEditingMeeting] = useState(false);
  const [attendanceHl, setAttendanceHl] = useState(false);
  if (!home.data) return null;
  const d = home.data;
  const meId = identity?.memberId ?? null;
  const round = d.currentRound;

  return (
    <div className="flex flex-col gap-4">
      <Todos
        todos={d.todos}
        token={token}
        onSchedule={() => { setEditingMeeting(true); document.getElementById("next-meeting")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
        onAttendance={() => { setAttendanceHl(true); setTimeout(() => setAttendanceHl(false), 2000); document.getElementById("next-meeting")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
      />
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-4">
          <div id="next-meeting" className="scroll-mt-16">
            <NextMeeting token={token} round={round} meId={meId} editing={editingMeeting} setEditing={setEditingMeeting} attendanceHighlight={attendanceHl} />
          </div>
          <BookOfMonth token={token} round={round} meId={meId} memberCount={d.group.memberCount} />
        </div>
        <div className="flex flex-col gap-4">
          {round?.book && <Reviews token={token} bookId={round.book.id} reviews={round.reviews} meId={meId} />}
          <BookPollSummary token={token} poll={d.nextRound.bookPoll} />
        </div>
      </div>
    </div>
  );
}
