"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { BookDetailView, HomeView, LibraryItem, MemberStat, PollKind, PollView, StatsView } from "./types";
import { useIdentity } from "./identity";

export const keys = {
  home: (token: string, memberId: string | null) => ["home", token, memberId] as const,
  poll: (token: string, kind: PollKind, memberId: string | null) => ["poll", token, kind, memberId] as const,
  library: (token: string) => ["library", token] as const,
  round: (token: string, roundId: string, memberId: string | null) => ["round", token, roundId, memberId] as const,
  stats: (token: string, memberId: string | null) => ["stats", token, memberId] as const,
  members: (token: string) => ["members", token] as const,
};

/** §7.2 홈 통합 데이터 단일 쿼리 */
export function useHome(token: string) {
  const { identity, ready } = useIdentity();
  return useQuery({
    queryKey: keys.home(token, identity?.memberId ?? null),
    queryFn: () => api<HomeView>(`/g/${token}`),
    enabled: ready,
  });
}

export function usePoll(token: string, kind: PollKind) {
  const { identity, ready } = useIdentity();
  return useQuery({
    queryKey: keys.poll(token, kind, identity?.memberId ?? null),
    queryFn: () => api<PollView | null>(`/g/${token}/polls/${kind}`),
    enabled: ready,
  });
}

export function useLibrary(token: string) {
  return useQuery({ queryKey: keys.library(token), queryFn: () => api<LibraryItem[]>(`/g/${token}/library`) });
}

export function useRoundDetail(token: string, roundId: string) {
  const { identity, ready } = useIdentity();
  return useQuery({
    queryKey: keys.round(token, roundId, identity?.memberId ?? null),
    queryFn: () => api<BookDetailView>(`/g/${token}/library/${roundId}`),
    enabled: ready,
  });
}

export function useStats(token: string) {
  const { identity, ready } = useIdentity();
  return useQuery({
    queryKey: keys.stats(token, identity?.memberId ?? null),
    queryFn: () => api<StatsView>(`/g/${token}/stats`),
    enabled: ready,
  });
}

export function useMembers(token: string) {
  return useQuery({ queryKey: keys.members(token), queryFn: () => api<MemberStat[]>(`/g/${token}/members`) });
}

/** 모든 쓰기 성공 시 모임 관련 쿼리 전체 무효화 (§7.2) */
export function useWrite<TArgs, TResult = unknown>(fn: (args: TArgs) => Promise<TResult>) {
  const qc = useQueryClient();
  const { withMember } = useIdentity();
  return useMutation({
    mutationFn: (args: TArgs) => withMember(() => fn(args)),
    onSuccess: () => qc.invalidateQueries(),
  });
}
