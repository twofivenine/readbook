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
  roundLabel: string;
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
  label: string;
  book: BookView | null;
  meetingAt: string | null;
  place: PlaceView | null;
  attendances: AttendanceView[];
  placePoll: PollView | null;
  ratings: RatingsSummary;
  reviews: ReviewView[];
}

export interface UpcomingRound { id: string; label: string; book: BookView }

export interface HomeView {
  /** 접속한 달 (KST) `YYYY-MM` */
  thisMonth: string;
  /** 이달의 책 회차: label ≤ 이번 달인 확정 회차 중 가장 최근. 일정·참석·장소 투표도 여기(또는 모임이 끝난 뒤 다음 확정 회차)에 붙는다 */
  currentRound: RoundView | null;
  /** 이미 확정됐지만 아직 달이 오지 않은 회차 (예: 9월에 보는 10월의 책) */
  upcoming: UpcomingRound[];
  bookPoll: PollView | null;
  todos: Todo[];
}

export interface BookDetailView {
  round: { id: string; label: string; seq: number } | null;
  book: BookView;
  ratings: RatingsSummary;
  reviews: ReviewView[];
}

export interface LibraryItem {
  roundId: string;
  label: string;
  seq: number;
  book: BookView;
  avgRating: number | null;
  ratingCount: number;
}
