"use client";
/** 홈 — 시안 레이아웃: 지금 할 일(강조) → [이달의 책 + 한줄평 | 다음 모임(검정) · 지난 책] + 다음 책 투표 */
import { useState } from "react";
import { useHome } from "@/lib/hooks";
import { Todos } from "@/components/home/Todos";
import { NextMeeting } from "@/components/home/NextMeeting";
import { BookOfMonth } from "@/components/home/BookOfMonth";
import { BookPollSummary } from "@/components/home/BookPollSummary";
import { PastBooks } from "@/components/home/PastBooks";
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
    <div className="flex flex-col gap-5 md:gap-6">
      <Todos
        todos={d.todos}
        bookPoll={d.bookPoll}
        onSchedule={() => { setEditingMeeting(true); scrollTo(); }}
        onAttendance={() => { setAttendanceHl(true); setTimeout(() => setAttendanceHl(false), 2000); scrollTo(); }}
      />
      {/* 모바일: 다음 모임 → 이달의 책 → 투표 → 지난 책 / 데스크톱: 좌 이달의 책, 우 나머지 */}
      <div className="grid gap-5 md:gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-start">
        <div className="contents md:flex md:flex-col md:gap-6">
          <div className="order-2 md:order-none"><BookOfMonth round={round} /></div>
        </div>
        <div className="contents md:flex md:flex-col md:gap-6">
          <div className="order-1 md:order-none"><NextMeeting round={round} editing={editingMeeting} setEditing={setEditingMeeting} highlight={attendanceHl} /></div>
          <div className="order-3 md:order-none"><BookPollSummary poll={d.bookPoll} /></div>
          <div className="order-4 md:order-none"><PastBooks /></div>
        </div>
      </div>
    </div>
  );
}
