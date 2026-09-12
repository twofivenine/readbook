/** 클라이언트·서버가 공유하는 API 응답 타입 (TRD §5) */

export type PollKind = "book" | "place";
export type PollStatus = "open" | "closed";
export type AttendanceStatus = "yes" | "no" | "undecided";
export type TodoKind = "place_vote" | "book_vote" | "attendance" | "schedule";

export interface MemberRef {
  id: string;
  nickname: string;
}

export interface BookView {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  coverUrl: string | null;
}

export interface PlaceView {
  id: string;
  name: string;
  address: string;
  memo: string | null;
}

export interface CandidateView {
  id: string;
  book: BookView | null;
  place: PlaceView | null;
  proposedBy: MemberRef;
  voteCount: number;
  voters: MemberRef[];
}

export interface PollView {
  id: string;
  kind: PollKind;
  status: PollStatus;
  roundLabel: string | null;
  candidates: CandidateView[];
  candidateLimit: number;
  /** 1인 상한 = 현재 후보 수 (D-3) */
  voteLimit: number;
  myCandidateIds: string[];
  closedBy: MemberRef | null;
  closedAt: string | null;
  result: CandidateView | null;
  tieCandidates: CandidateView[];
}

export interface AttendanceView {
  memberId: string;
  nickname: string;
  status: AttendanceStatus;
}

export interface ProgressView {
  memberId: string;
  nickname: string;
  currentPage: number;
  percent: number;
  completed: boolean;
  rating: number | null;
}

export interface CommentView {
  id: string;
  authorId: string;
  nickname: string;
  body: string;
  spoiler: boolean;
  createdAt: string;
}

export interface ReviewView {
  id: string;
  authorId: string;
  nickname: string;
  body: string;
  spoiler: boolean;
  createdAt: string;
  comments: CommentView[];
}

export interface RatingsSummary {
  avg: number | null;
  count: number;
  mine: number | null;
}

export interface Todo {
  kind: TodoKind;
  dday: number | null;
  detail: string;
}

export interface HomeView {
  group: { id: string; name: string; cycleNote: string | null; memberCount: number; members: MemberRef[] };
  me: MemberRef | null;
  currentRound: {
    id: string;
    label: string | null;
    seq: number;
    book: BookView | null;
    meetingAt: string | null;
    place: PlaceView | null;
    attendances: AttendanceView[];
    placePoll: PollView | null;
    progresses: ProgressView[];
    completedCount: number;
    ratings: RatingsSummary;
    reviews: ReviewView[];
  } | null;
  nextRound: { id: string; label: string | null; bookPoll: PollView | null };
  todos: Todo[];
}

export interface BookDetailView {
  round: { id: string; label: string | null; seq: number } | null;
  book: BookView;
  ratings: RatingsSummary;
  progresses: ProgressView[];
  completedCount: number;
  memberCount: number;
  reviews: ReviewView[];
}

export interface LibraryItem {
  roundId: string;
  label: string | null;
  seq: number;
  book: BookView;
  avgRating: number | null;
}

export interface StatsView {
  group: { booksRead: number; avgRating: number | null; avgCompletionRate: number | null };
  mine: { completedCount: number; avgRating: number | null; reviewCount: number } | null;
}

export interface MemberStat extends MemberRef {
  completedCount: number;
  avgRating: number | null;
}
