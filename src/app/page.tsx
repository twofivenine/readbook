"use client";
/** 홈 탭 — 모바일 단일 컬럼 / 데스크톱 2열 */
import { useState } from "react";
import { useHome } from "@/lib/hooks";
import { Todos } from "@/components/home/Todos";
import { NextMeeting } from "@/components/home/NextMeeting";
import { BookOfMonth } from "@/components/home/BookOfMonth";
import { Reviews } from "@/components/home/Reviews";
import { BookPollSummary } from "@/components/home/BookPollSummary";
import { ErrorText } from "@/components/ui";

export default function HomePage() {
  const home = useHome();
  const [editingMeeting, setEditingMeeting] = useState(false);
  const [attendanceHl, setAttendanceHl] = useState(false);
  if (home.isError) return <ErrorText>{home.error.message}</ErrorText>;
  if (!home.data) return null;
  const d = home.data;
  const round = d.currentRound;
  const scrollTo = () => document.getElementById("next-meeting")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex flex-col gap-4">
      <Todos
        todos={d.todos}
        onSchedule={() => { setEditingMeeting(true); scrollTo(); }}
        onAttendance={() => { setAttendanceHl(true); setTimeout(() => setAttendanceHl(false), 2000); scrollTo(); }}
      />
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-4">
          <NextMeeting round={round} editing={editingMeeting} setEditing={setEditingMeeting} highlight={attendanceHl} />
          <BookOfMonth round={round} />
        </div>
        <div className="flex flex-col gap-4">
          {round?.book && <Reviews bookId={round.book.id} reviews={round.reviews} />}
          <BookPollSummary poll={d.bookPoll} />
        </div>
      </div>
    </div>
  );
}
