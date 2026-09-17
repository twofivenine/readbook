"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { BookDetailView, HomeView, LibraryItem, PollKind, PollView } from "./types";
import { useClientStore } from "./clientStore";

/** §7.3 홈 통합 데이터 단일 쿼리. clientId 준비 후 조회 */
export function useHome() {
  const store = useClientStore();
  return useQuery({ queryKey: ["home", store?.clientId ?? null], queryFn: () => api<HomeView>("/home"), enabled: !!store });
}

export function usePoll(kind: PollKind) {
  const store = useClientStore();
  return useQuery({ queryKey: ["poll", kind, store?.clientId ?? null], queryFn: () => api<PollView | null>(`/polls/${kind}`), enabled: !!store });
}

export const useLibrary = () => useQuery({ queryKey: ["library"], queryFn: () => api<LibraryItem[]>("/library") });

export function useRoundDetail(roundId: string) {
  const store = useClientStore();
  return useQuery({ queryKey: ["round", roundId, store?.clientId ?? null], queryFn: () => api<BookDetailView>(`/library/${roundId}`), enabled: !!store });
}

/** 모든 쓰기 성공 시 전체 쿼리 무효화 (§7.3) */
export function useWrite<TArgs, TResult = unknown>(fn: (args: TArgs) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries() });
}
