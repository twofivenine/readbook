"use client";
import { useSyncExternalStore } from "react";

/** 분 단위로 갱신되는 현재 시각 (렌더 중 Date.now() 호출을 피하기 위한 외부 스토어) */
function subscribe(cb: () => void) {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
}
const getMinute = () => Math.floor(Date.now() / 60_000);
const getServer = () => 0;

export function useNowMinute(): number {
  return useSyncExternalStore(subscribe, getMinute, getServer);
}
