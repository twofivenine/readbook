"use client";
import { useSyncExternalStore } from "react";

/** 분 단위 현재 시각 (렌더 중 Date.now() 호출을 피하기 위한 외부 스토어). 서버에서는 0 */
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
};
const getMinute = () => Math.floor(Date.now() / 60_000);
const getServer = () => 0;
export const useNowMinute = () => useSyncExternalStore(subscribe, getMinute, getServer);
