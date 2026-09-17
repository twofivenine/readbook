/** 클라이언트·서버 공유 API 뷰 타입 (TRD v1.1 §5) */
export type PollKind = "book" | "place";
export type PollStatus = "open" | "closed";
export type AttendanceStatus = "yes" | "no" | "undecided";
export type TodoKind = "place_vote" | "book_vote" | "attendance" | "schedule";

export interface BookView { id: string; title: string; author: string; totalPages: number; coverUrl: string | null }
export interface PlaceView { id: string; name: string; address: string; memo: string | null }

export interface CandidateView {
  id: string;
  book: BookView | null;
  place: PlaceView | null;
  checkCount: number;
}

export interface PollView {
  id: string;
  kind: PollKind;
  status: PollStatus;
  roundLabel: string | null;
  candidates: CandidateView[];
  candidateLimit: number;
  /** 이 브라우저가 체크한 후보 (X-Client-Id 있을 때만) */
  myChecks: string[];
  closedAt: string | null;
  result: CandidateView | null;
  tieCandidates: CandidateView[];
}

export interface AttendanceView { name: string; status: AttendanceStatus; mine: boolean }
export interface RatingView { name: string; score: number; mine: boolean }
export interface RatingsSummary { avg: number | null; count: number; list: RatingView[]; mine: number | null }
export interface ReviewView { id: string; name: string; body: string; spoiler: boolean; createdAt: string; mine: boolean }

export interface Todo { kind: TodoKind; dday: number | null; detail: string }

export interface RoundView {
  id: string;
  seq: number;
  label: string | null;
  book: BookView | null;
  meetingAt: string | null;
  place: PlaceView | null;
  attendances: AttendanceView[];
  placePoll: PollView | null;
  ratings: RatingsSummary;
  reviews: ReviewView[];
}

export interface HomeView {
  currentRound: RoundView | null;
  bookPoll: PollView | null;
  todos: Todo[];
}

export interface BookDetailView {
  round: { id: string; label: string | null; seq: number } | null;
  book: BookView;
  ratings: RatingsSummary;
  reviews: ReviewView[];
}

export interface LibraryItem {
  roundId: string;
  label: string | null;
  seq: number;
  book: BookView;
  avgRating: number | null;
  ratingCount: number;
}
